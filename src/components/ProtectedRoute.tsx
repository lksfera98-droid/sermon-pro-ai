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
      console.log('[ProtectedRoute] Verificando acesso para:', email);

      if (!email) {
        console.log('[ProtectedRoute] Email vazio, bloqueando acesso');
        setIsPaid(false);
        setChecking(false);
        return;
      }

      // Query profiles by email
      const { data, error } = await supabase
        .from('profiles')
        .select('is_paid')
        .ilike('email', email)
        .maybeSingle();

      if (error) {
        console.error('[ProtectedRoute] Erro ao verificar is_paid:', error);
      }

      console.log('[ProtectedRoute] Resultado da query:', data);
      console.log('[ProtectedRoute] is_paid:', data?.is_paid);

      if (data) {
        setIsPaid(data.is_paid ?? false);
      } else {
        // Profile doesn't exist — auto-create with is_paid=false
        console.log('[ProtectedRoute] Perfil não encontrado, criando perfil mínimo');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: email,
            full_name: user.user_metadata?.full_name || '',
            is_paid: false,
          });

        if (insertError) {
          console.error('[ProtectedRoute] Erro ao criar perfil:', insertError);
        }
        setIsPaid(false);
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
