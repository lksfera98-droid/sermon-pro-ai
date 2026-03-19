import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      setHasAccess(false);
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('can_current_user_access');
      const access = !error && data === true;

      if (error) {
        console.error('Error checking access:', error);
      }

      setHasAccess(access);
      return access;
    } catch (err) {
      console.error('Access check failed:', err);
      setHasAccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, recheckAccess: checkAccess };
};