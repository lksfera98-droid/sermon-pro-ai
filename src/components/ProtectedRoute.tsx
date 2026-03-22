import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingProgress } from '@/components/LoadingProgress';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    const checkAccess = async () => {
      const email = user.email?.toLowerCase().trim();
      if (!email) {
        if (!cancelled) setIsPaid(false);
        return;
      }

      const [byUser, byEmail] = await Promise.all([
        supabase.from('profiles').select('is_paid').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('is_paid').ilike('email', email).maybeSingle(),
      ]);

      if (cancelled) return;

      const paid = byUser.data?.is_paid === true || byEmail.data?.is_paid === true;
      setIsPaid(paid);
    };

    checkAccess();
    return () => { cancelled = true; };
  }, [user, loading]);

  if (loading || (user && isPaid === null)) return <LoadingProgress />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isPaid) return <Navigate to="/acesso-restrito" replace />;

  return <>{children}</>;
};
