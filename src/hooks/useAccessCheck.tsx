import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setHasAccess(false);
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      // Use the RPC function which checks app_users.access_status
      const { data, error } = await supabase.rpc('can_current_user_access');
      const access = !error && data === true;

      if (error) {
        console.error('Erro ao verificar acesso:', error);
      }

      console.log(access ? 'Acesso liberado' : 'Usuário bloqueado aguardando pagamento');
      setHasAccess(access);
      return access;
    } catch (err) {
      console.error('Falha na verificação de acesso:', err);
      setHasAccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, recheckAccess: checkAccess };
};
