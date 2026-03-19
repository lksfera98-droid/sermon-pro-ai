import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccessCheckResult {
  hasAccess: boolean;
  loading: boolean;
  recheck: () => Promise<boolean>;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const blockedPaymentStatuses = new Set([
  'CANCELADA',
  'CANCELED',
  'REEMBOLSADA',
  'REFUNDED',
  'CHARGEBACK',
  'CHARGEDBACK',
  'EXPIRADA',
  'EXPIRED',
]);

export const useAccessCheck = (email: string | null | undefined): AccessCheckResult => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async (): Promise<boolean> => {
    if (!email) {
      setHasAccess(false);
      setLoading(false);
      return false;
    }

    const normalizedEmail = normalizeEmail(email);

    setLoading(true);
    try {
      const [compradoresResult, paidUsersResult] = await Promise.all([
        supabase
          .from('compradores')
          .select('id')
          .ilike('email', normalizedEmail)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('paid_users')
          .select('id, status_pagamento')
          .ilike('email', normalizedEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (compradoresResult.error) {
        console.error('Access check error (compradores):', compradoresResult.error);
      }

      if (paidUsersResult.error) {
        console.error('Access check error (paid_users):', paidUsersResult.error);
      }

      const paymentStatus = (paidUsersResult.data?.status_pagamento ?? '').trim().toUpperCase();
      const hasPaidRecord = !!paidUsersResult.data && !blockedPaymentStatuses.has(paymentStatus);
      const nextAccess = !!compradoresResult.data || hasPaidRecord;

      setHasAccess(nextAccess);
      return nextAccess;
    } catch (err) {
      console.error('Access check exception:', err);
      setHasAccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasAccess, loading, recheck: check };
};
