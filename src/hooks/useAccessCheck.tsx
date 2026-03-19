import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAccessCheck = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user?.email) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = user.email.trim();

      const { data, error } = await supabase
        .from('user_access')
        .select('access_granted')
        .ilike('email', normalizedEmail)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } else {
        setHasAccess(data?.access_granted === true);
      }
    } catch (err) {
      console.error('Access check failed:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, recheckAccess: checkAccess };
};