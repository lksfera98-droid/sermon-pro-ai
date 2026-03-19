import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccessCheckResult {
  hasAccess: boolean;
  loading: boolean;
  recheck: () => void;
}

export const useAccessCheck = (email: string | null | undefined): AccessCheckResult => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!email) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compradores')
        .select('email')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
      } else {
        setHasAccess(!!data);
      }
    } catch (err) {
      console.error('Access check exception:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasAccess, loading, recheck: check };
};
