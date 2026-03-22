import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingProgress } from '@/components/LoadingProgress';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const normalizeEmail = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsPaid(false);
      setChecking(false);
      return;
    }

    let cancelled = false;

    const checkAccess = async () => {
      setChecking(true);

      try {
        const normalizedEmail = normalizeEmail(user.email);

        const [byEmailResult, byUserResult] = await Promise.all([
          normalizedEmail
            ? supabase
                .from('profiles')
                .select('is_paid')
                .ilike('email', normalizedEmail)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('profiles')
            .select('is_paid')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (byEmailResult.error) {
          console.error('Error checking profile by email:', byEmailResult.error);
        }

        if (byUserResult.error) {
          console.error('Error checking profile by user_id:', byUserResult.error);
        }

        const accessGranted =
          byEmailResult.data?.is_paid === true || byUserResult.data?.is_paid === true;

        if (!cancelled) {
          setIsPaid(accessGranted);
        }
      } catch (error) {
        console.error('Exception checking profile access:', error);
        if (!cancelled) {
          setIsPaid(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, authLoading, user]);

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
