
-- 1. Create get_current_user_access_state() returning detailed status
CREATE OR REPLACE FUNCTION public.get_current_user_access_state()
RETURNS TABLE(allowed boolean, access_status text, payment_status text, reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_access_status text;
  v_payment_status text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_authenticated'::text;
    RETURN;
  END IF;

  SELECT au.access_status, au.payment_status
  INTO v_access_status, v_payment_status
  FROM public.app_users au
  WHERE au.id = v_uid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_found'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    (v_access_status = 'allowed'),
    v_access_status,
    v_payment_status,
    v_payment_status;
END;
$$;

-- 2. Update can_current_user_access to also check user_access table as fallback
CREATE OR REPLACE FUNCTION public.can_current_user_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;

  -- Check app_users first
  SELECT (au.access_status = 'allowed') INTO v_allowed
  FROM public.app_users au WHERE au.id = v_uid;

  IF v_allowed = true THEN RETURN true; END IF;

  -- Fallback: check user_access by email
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;
  IF v_email IS NULL THEN RETURN false; END IF;

  SELECT (ua.access_granted = true OR lower(coalesce(ua.plan_status,'')) = 'active')
  INTO v_allowed
  FROM public.user_access ua
  WHERE lower(trim(ua.email)) = lower(trim(v_email))
  ORDER BY ua.updated_at DESC
  LIMIT 1;

  -- If user_access says allowed, sync to app_users
  IF v_allowed = true THEN
    UPDATE public.app_users SET access_status = 'allowed', payment_status = 'approved', updated_at = now()
    WHERE id = v_uid AND access_status != 'allowed';
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3. Sync trigger: when user_access changes, update app_users
CREATE OR REPLACE FUNCTION public.sync_app_users_from_user_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_access text;
  v_new_payment text;
BEGIN
  IF NEW.access_granted = true OR lower(coalesce(NEW.plan_status,'')) = 'active' THEN
    v_new_access := 'allowed';
    v_new_payment := 'approved';
  ELSE
    v_new_access := 'blocked';
    v_new_payment := coalesce(NEW.plan_status, 'pending');
  END IF;

  UPDATE public.app_users
  SET access_status = v_new_access,
      payment_status = v_new_payment,
      updated_at = now()
  WHERE lower(trim(email)) = lower(trim(NEW.email));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_access_to_app_users ON public.user_access;
CREATE TRIGGER sync_user_access_to_app_users
  AFTER INSERT OR UPDATE ON public.user_access
  FOR EACH ROW EXECUTE FUNCTION public.sync_app_users_from_user_access();

-- 4. Backfill: reconcile app_users from user_access for already-paid users
UPDATE public.app_users au
SET access_status = 'allowed',
    payment_status = 'approved',
    updated_at = now()
FROM public.user_access ua
WHERE lower(trim(au.email)) = lower(trim(ua.email))
  AND (ua.access_granted = true OR lower(coalesce(ua.plan_status,'')) = 'active')
  AND au.access_status != 'allowed';
