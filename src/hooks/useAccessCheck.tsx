import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAccessCheck = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkAccess = useCallback(async (emailOverride?: string): Promise<boolean> => {
    setLoading(true);
    setChecked(false);

    try {
      let normalizedEmail = emailOverride?.trim().toLowerCase() ?? '';

      if (!normalizedEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        normalizedEmail = session?.user?.email?.trim().toLowerCase() ?? '';
      }

      if (!normalizedEmail) {
        setHasAccess(false);
        return false;
      }

      console.log('checking paid_users by email:', normalizedEmail);

      const { data, error } = await supabase
        .from('paid_users')
        .select('id')
        .ilike('email', normalizedEmail)
        .eq('status_pagamento', 'COMPRA_APROVADA')
        .limit(1);

      if (error) {
        console.error('error checking paid_users:', error);
        setHasAccess(false);
        return false;
      }

      const granted = (data?.length ?? 0) > 0;
      console.log(granted ? 'access released' : 'no active access found');
      setHasAccess(granted);
      return granted;
    } catch (err) {
      console.error('access check failed:', err);
      setHasAccess(false);
      return false;
    } finally {
      setChecked(true);
      setLoading(false);
    }
  }, []);

  return { hasAccess, loading, checked, checkAccess };
};
