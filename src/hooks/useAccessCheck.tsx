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

      console.log('[AccessCheck] authenticated email:', normalizedEmail);

      const { data, error } = await supabase
        .from('user_access')
        .select('id, email, plan_status, access_granted')
        .ilike('email', normalizedEmail)
        .or('plan_status.eq.active,access_granted.eq.true')
        .limit(1);

      console.log('[AccessCheck] records found:', data?.length ?? 0);
      if (data && data.length > 0) {
        console.log('[AccessCheck] match:', JSON.stringify(data[0]));
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
