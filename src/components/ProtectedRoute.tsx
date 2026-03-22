import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    const checkAccess = async () => {
      const email = user.email?.trim().toLowerCase();
      if (!email) {
        setIsPaid(false);
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_paid')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking is_paid:', error);
        setIsPaid(false);
      } else {
        setIsPaid(data?.is_paid ?? false);
      }
      setChecking(false);
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
