import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AccessState {
  allowed: boolean;
  access_status: string;
  payment_status: string;
  reason: string;
}

interface AccessCheckResult {
  granted: boolean;
  state: AccessState | null;
}

interface DirectAccessRow {
  id: string;
  user_id: string | null;
  email: string;
  plan_status: string | null;
  access_granted: boolean;
}

const normalizeEmail = (email?: string | null) => (email ?? '').trim().toLowerCase();
const normalizeStatus = (value?: string | null) => (value ?? '').trim().toLowerCase();

const hasValidPurchase = (row: DirectAccessRow) => {
  const normalizedPlanStatus = normalizeStatus(row.plan_status);
  return normalizedPlanStatus === 'active' || row.access_granted === true;
};

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDirectAccess = useCallback(async (userId: string, normalizedEmail: string) => {
    console.log('checking access by user_id');

    const { data: byUserId } = await supabase
      .from('user_access')
      .select('id, user_id, email, plan_status, access_granted')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byUserId) {
      return byUserId as DirectAccessRow;
    }

    if (!normalizedEmail) {
      return null;
    }

    console.log('fallback to email lookup');
    const { data: byEmail } = await supabase
      .from('user_access')
      .select('id, user_id, email, plan_status, access_granted')
      .ilike('email', normalizedEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return (byEmail as DirectAccessRow | null) ?? null;
  }, []);

  const applyState = useCallback((state: AccessState | null): AccessCheckResult => {
    const granted = state?.allowed === true;
    setAccessState(state);
    setHasAccess(granted);
    return { granted, state };
  }, []);

  const checkAccess = useCallback(async ({ forceDirect = false }: { forceDirect?: boolean } = {}): Promise<AccessCheckResult> => {
    if (!user?.id) {
      setHasAccess(false);
      setAccessState(null);
      setLoading(false);
      return { granted: false, state: null };
    }

    setLoading(true);

    try {
      const {
        data: { user: liveUser },
      } = await supabase.auth.getUser();

      const currentUser = liveUser ?? user;
      if (!currentUser?.id) {
        return applyState(null);
      }

      const normalizedEmail = normalizeEmail(currentUser.email);
      let directAccessRow: DirectAccessRow | null = null;

      if (forceDirect) {
        directAccessRow = await fetchDirectAccess(currentUser.id, normalizedEmail);

        if (directAccessRow && normalizeStatus(directAccessRow.plan_status) === 'active') {
          console.log('active plan found');
          if (!directAccessRow.access_granted) {
            console.log('reconciling access_granted=true');
          }
        }

        if (!directAccessRow) {
          console.log('no active access found');
        }
      }

      const { data, error } = await supabase.rpc('get_current_user_access_state');

      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;

        if (row) {
          const state: AccessState = {
            allowed: row.allowed === true,
            access_status: row.access_status || 'blocked',
            payment_status: row.payment_status || 'pending',
            reason: row.reason || row.payment_status || 'pending',
          };

          if (state.allowed) {
            console.log('user access released');
          } else {
            console.log('no active access found');
          }

          return applyState(state);
        }
      } else {
        console.error('Erro ao verificar acesso (get_current_user_access_state):', error);
      }

      if (directAccessRow && hasValidPurchase(directAccessRow)) {
        const state: AccessState = {
          allowed: true,
          access_status: 'allowed',
          payment_status: normalizeStatus(directAccessRow.plan_status) === 'active' ? 'approved' : 'approved',
          reason: 'approved',
        };
        console.log('user access released');
        return applyState(state);
      }

      const { data: boolData, error: boolError } = await supabase.rpc('can_current_user_access');
      if (!boolError && boolData === true) {
        const state: AccessState = {
          allowed: true,
          access_status: 'allowed',
          payment_status: 'approved',
          reason: 'approved',
        };
        console.log('user access released');
        return applyState(state);
      }

      console.log('no active access found');
      return applyState({
        allowed: false,
        access_status: 'blocked',
        payment_status: 'pending',
        reason: 'pending',
      });
    } catch (err) {
      console.error('Falha na verificação de acesso:', err);
      return applyState({
        allowed: false,
        access_status: 'blocked',
        payment_status: 'pending',
        reason: 'pending',
      });
    } finally {
      setLoading(false);
    }
  }, [applyState, fetchDirectAccess, user]);

  const recheckAccess = useCallback(() => checkAccess({ forceDirect: true }), [checkAccess]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  return { hasAccess, accessState, loading, recheckAccess };
};