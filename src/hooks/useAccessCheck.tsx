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
      let rawEmail = emailOverride ?? '';

      if (!rawEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        rawEmail = session?.user?.email ?? '';
      }

      const normalizedEmail = rawEmail.trim().toLowerCase();

      console.log('[AccessCheck] raw email:', rawEmail);
      console.log('[AccessCheck] normalized email:', normalizedEmail);

      if (!normalizedEmail) {
        console.log('[AccessCheck] decision: ACCESS DENIED ❌ (no email)');
        setHasAccess(false);
        return false;
      }

      const { data, error } = await supabase
        .from('paid_users')
        .select('status_pagamento')
        .ilike('email', normalizedEmail)
        .eq('status_pagamento', 'COMPRA_APROVADA')
        .limit(1);

      console.log('[AccessCheck] records found:', data?.length ?? 0);
      if (data && data.length > 0) {
        console.log('[AccessCheck] status_pagamento:', data[0].status_pagamento);
      }

      if (error) {
        console.error('[AccessCheck] query error:', error);
        setHasAccess(false);
        return false;
      }

      const granted = (data?.length ?? 0) > 0;
      console.log('[AccessCheck] decision:', granted ? 'ACCESS GRANTED ✅' : 'ACCESS DENIED ❌');
      setHasAccess(granted);
      return granted;
    } catch (err) {
      console.error('[AccessCheck] unexpected error:', err);
      setHasAccess(false);
      return false;
    } finally {
      setChecked(true);
      setLoading(false);
    }
  }, []);

  return { hasAccess, loading, checked, checkAccess };
};
