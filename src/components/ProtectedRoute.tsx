import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingProgress } from '@/components/LoadingProgress';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    // Skip if already checked for this user
    if (checkedRef.current === user.id) return;

    const checkAccess = async () => {
      try {
        // Try both user_id and email lookup in parallel for speed
        const userEmail = user.email?.trim().toLowerCase() || '';
        
        const { data, error } = await supabase
          .from('profiles')
          .select('is_paid')
          .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile:', error);
          setIsPaid(false);
        } else {
          setIsPaid(data?.is_paid === true);
        }
        checkedRef.current = user.id;
      } catch (err) {
        console.error('Exception checking profile:', err);
        setIsPaid(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return <LoadingProgress />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPaid) {
    return <Navigate to="/acesso-restrito" replace />;
  }

  return <>{children}</>;
};
