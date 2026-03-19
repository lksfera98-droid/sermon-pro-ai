-- Robust access check function for authenticated users
CREATE OR REPLACE FUNCTION public.can_current_user_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_access ua
    WHERE lower(trim(ua.email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
      AND (
        ua.access_granted = true
        OR lower(coalesce(ua.plan_status, '')) = 'active'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_current_user_access() TO authenticated;

-- Make SELECT policy case-insensitive for direct table reads
DROP POLICY IF EXISTS "Users can view own access" ON public.user_access;
CREATE POLICY "Users can view own access"
ON public.user_access
FOR SELECT
TO authenticated
USING (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
);