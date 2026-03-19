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

const mapReasonFromStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'approved' || normalized === 'active') return 'approved';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  if (normalized === 'expired') return 'expired';
  if (normalized === 'refunded' || normalized === 'chargeback' || normalized === 'chargedback') return 'refunded';
  return normalized || 'pending';
};

const blockedState: AccessState = {
  allowed: false,
  access_status: 'blocked',
  payment_status: 'pending',
  reason: 'pending',
};

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);

  const applyState = useCallback((state: AccessState | null): AccessCheckResult => {
    const granted = state?.allowed === true;
    setAccessState(state);
    setHasAccess(granted);
    return { granted, state };
  }, []);

  const logDirectRowInsights = (row: DirectAccessRow) => {
    const activePlan = normalizeStatus(row.plan_status) === 'active';

    if (activePlan) {
      console.log('active plan found');
    }

    if (activePlan && !row.access_granted) {
      console.log('reconciling access_granted=true');
    }

    if (!row.user_id) {
      console.log('reconciling user_id');
    }
  };

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
      const directByUser = byUserId as DirectAccessRow;
      logDirectRowInsights(directByUser);
      return directByUser;
    }

    if (!normalizedEmail) {
      console.log('no active access found');
      return null;
    }

    console.log('fallback to email lookup');
    console.log('checking user_access by normalized email');

    const { data: byEmail } = await supabase
      .from('user_access')
      .select('id, user_id, email, plan_status, access_granted')
      .ilike('email', normalizedEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byEmail) {
      console.log('no active access found');
      return null;
    }

    const directByEmail = byEmail as DirectAccessRow;
    logDirectRowInsights(directByEmail);
    return directByEmail;
  }, []);

  const checkAccess = useCallback(async (): Promise<AccessCheckResult> => {
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
      const directAccessRow = await fetchDirectAccess(currentUser.id, normalizedEmail);
      const directValid = directAccessRow ? hasValidPurchase(directAccessRow) : false;

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
            console.log('access released');
            return applyState(state);
          }

          if (directValid) {
            console.log('access released');
            return applyState({
              allowed: true,
              access_status: 'allowed',
              payment_status: 'approved',
              reason: 'approved',
            });
          }

          console.log('no active access found');
          return applyState(state);
        }
      } else {
        console.error('Erro ao verificar acesso (get_current_user_access_state):', error);
      }

      if (directValid) {
        console.log('access released');
        return applyState({
          allowed: true,
          access_status: 'allowed',
          payment_status: 'approved',
          reason: mapReasonFromStatus(directAccessRow?.plan_status),
        });
      }

      console.log('no active access found');
      return applyState(blockedState);
    } catch (err) {
      console.error('Falha na verificação de acesso:', err);
      return applyState(blockedState);
    } finally {
      setLoading(false);
    }
  }, [applyState, fetchDirectAccess, user]);

  const recheckAccess = useCallback(() => checkAccess(), [checkAccess]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  return { hasAccess, accessState, loading, recheckAccess };
};
