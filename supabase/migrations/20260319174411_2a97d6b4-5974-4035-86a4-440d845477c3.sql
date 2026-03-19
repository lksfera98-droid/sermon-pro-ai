
-- 1) Recreate get_current_user_access_state WITH user_access fallback + auto-reconcile
CREATE OR REPLACE FUNCTION public.get_current_user_access_state()
RETURNS TABLE(allowed boolean, access_status text, payment_status text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_access_status text;
  v_payment_status text;
  v_ua_granted boolean;
  v_ua_plan text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_authenticated'::text;
    RETURN;
  END IF;

  -- 1. Check app_users
  SELECT au.access_status, au.payment_status
  INTO v_access_status, v_payment_status
  FROM public.app_users au
  WHERE au.id = v_uid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_found'::text;
    RETURN;
  END IF;

  -- If already allowed, return immediately
  IF v_access_status = 'allowed' THEN
    RETURN QUERY SELECT true, v_access_status, v_payment_status, v_payment_status;
    RETURN;
  END IF;

  -- 2. Fallback: check user_access by email
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;

  IF v_email IS NOT NULL THEN
    SELECT ua.access_granted, ua.plan_status
    INTO v_ua_granted, v_ua_plan
    FROM public.user_access ua
    WHERE lower(trim(ua.email)) = lower(trim(v_email))
    ORDER BY ua.updated_at DESC
    LIMIT 1;

    IF FOUND AND (v_ua_granted = true OR lower(coalesce(v_ua_plan,'')) = 'active') THEN
      -- Auto-reconcile: update app_users
      UPDATE public.app_users
      SET access_status = 'allowed', payment_status = 'approved', updated_at = now()
      WHERE id = v_uid;

      RETURN QUERY SELECT true, 'allowed'::text, 'approved'::text, 'approved'::text;
      RETURN;
    END IF;
  END IF;

  -- 3. Still blocked
  RETURN QUERY SELECT false, v_access_status, v_payment_status, v_payment_status;
END;
$function$;

-- 2) Recreate can_current_user_access to delegate to the unified function
CREATE OR REPLACE FUNCTION public.can_current_user_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed boolean;
BEGIN
  SELECT g.allowed INTO v_allowed
  FROM public.get_current_user_access_state() g
  LIMIT 1;

  RETURN coalesce(v_allowed, false);
END;
$function$;

-- 3) Ensure triggers exist for auth.users -> app_users
DROP TRIGGER IF EXISTS on_auth_user_created_app ON auth.users;
CREATE TRIGGER on_auth_user_created_app
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_app_user();

-- 4) Ensure trigger for auth.users -> profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5) Ensure trigger for user_access sync -> app_users
DROP TRIGGER IF EXISTS sync_user_access_to_app_users ON public.user_access;
CREATE TRIGGER sync_user_access_to_app_users
  AFTER INSERT OR UPDATE ON public.user_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_app_users_from_user_access();

-- 6) Ensure trigger for user_access -> sync_access_granted
DROP TRIGGER IF EXISTS sync_access_on_status ON public.user_access;
CREATE TRIGGER sync_access_on_status
  BEFORE INSERT OR UPDATE ON public.user_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_access_granted();

-- 7) Ensure trigger for handle_new_user_access
DROP TRIGGER IF EXISTS on_auth_user_created_access ON auth.users;
CREATE TRIGGER on_auth_user_created_access
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_access();

-- 8) Backfill: reconcile app_users from user_access for all paid users
UPDATE public.app_users au
SET access_status = 'allowed', payment_status = 'approved', updated_at = now()
FROM public.user_access ua
WHERE lower(trim(au.email)) = lower(trim(ua.email))
  AND (ua.access_granted = true OR lower(coalesce(ua.plan_status,'')) = 'active')
  AND au.access_status != 'allowed';
