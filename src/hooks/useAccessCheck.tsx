import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAccessCheck = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setHasAccess(false);
        return false;
      }

      const normalizedEmail = user.email.trim().toLowerCase();
      console.log('checking paid_users by email:', normalizedEmail);

      const { data, error } = await supabase
        .from('paid_users')
        .select('id, status_pagamento')
        .ilike('email', normalizedEmail)
        .eq('status_pagamento', 'COMPRA_APROVADA')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('error checking paid_users:', error);
        setHasAccess(false);
        return false;
      }

      const granted = !!data;
      console.log(granted ? 'access released' : 'no active access found');
      setHasAccess(granted);
      return granted;
    } catch (err) {
      console.error('access check failed:', err);
      setHasAccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { hasAccess, loading, checkAccess };
};
