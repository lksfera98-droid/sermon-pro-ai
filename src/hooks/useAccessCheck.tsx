import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AccessState {
  allowed: boolean;
  access_status: string;
  payment_status: string;
  reason: string;
}

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setHasAccess(false);
      setAccessState(null);
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      // First try the detailed RPC
      const { data, error } = await supabase.rpc('get_current_user_access_state');

      if (error) {
        console.error('Erro ao verificar acesso (get_current_user_access_state):', error);
        // Fallback to boolean check
        const { data: boolData, error: boolError } = await supabase.rpc('can_current_user_access');
        const access = !boolError && boolData === true;
        console.log(access ? 'Acesso liberado (fallback)' : 'Usuário bloqueado (fallback)');
        setHasAccess(access);
        setAccessState(null);
        return access;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        const state: AccessState = {
          allowed: row.allowed === true,
          access_status: row.access_status || 'blocked',
          payment_status: row.payment_status || 'pending',
          reason: row.reason || 'pending',
        };
        console.log('Status de acesso consultado:', JSON.stringify(state));
        setAccessState(state);
        setHasAccess(state.allowed);

        if (state.allowed) {
          console.log('Acesso liberado após confirmação de pagamento');
        } else {
          console.log('Usuário bloqueado aguardando pagamento:', state.reason);
        }
        return state.allowed;
      }

      console.log('Nenhum dado retornado pela verificação de acesso');
      setHasAccess(false);
      return false;
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

  return { hasAccess, accessState, loading, recheckAccess: checkAccess };
};
