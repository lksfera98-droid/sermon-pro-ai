-- Enforce deterministic access_granted based on plan_status and normalize email
CREATE OR REPLACE FUNCTION public.sync_access_granted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.email := lower(trim(NEW.email));

  IF lower(trim(coalesce(NEW.plan_status, ''))) = 'active' THEN
    NEW.access_granted := true;
  ELSE
    NEW.access_granted := false;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Single source of truth for access with user_id + email fallback and auto-reconciliation
CREATE OR REPLACE FUNCTION public.get_current_user_access_state()
RETURNS TABLE(allowed boolean, access_status text, payment_status text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_access_row public.user_access%ROWTYPE;
  v_plan_status text;
  v_has_access boolean := false;
  v_app_access text;
  v_app_payment text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_authenticated'::text;
    RETURN;
  END IF;

  SELECT lower(trim(coalesce(u.email, '')))
    INTO v_auth_email
  FROM auth.users u
  WHERE u.id = v_uid;

  IF coalesce(v_auth_email, '') = '' THEN
    SELECT lower(trim(coalesce(au.email, '')))
      INTO v_auth_email
    FROM public.app_users au
    WHERE au.id = v_uid;
  END IF;

  RAISE LOG 'checking access by user_id';
  SELECT ua.*
    INTO v_access_row
  FROM public.user_access ua
  WHERE ua.user_id = v_uid
  ORDER BY ua.updated_at DESC NULLS LAST, ua.created_at DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND AND coalesce(v_auth_email, '') <> '' THEN
    RAISE LOG 'fallback to email lookup';
    SELECT ua.*
      INTO v_access_row
    FROM public.user_access ua
    WHERE lower(trim(ua.email)) = v_auth_email
    ORDER BY ua.updated_at DESC NULLS LAST, ua.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF FOUND THEN
    IF v_access_row.user_id IS NULL OR v_access_row.email IS DISTINCT FROM lower(trim(v_access_row.email)) THEN
      UPDATE public.user_access
      SET user_id = coalesce(v_access_row.user_id, v_uid),
          email = lower(trim(v_access_row.email)),
          updated_at = now()
      WHERE id = v_access_row.id;
    END IF;

    v_plan_status := lower(trim(coalesce(v_access_row.plan_status, '')));
    v_has_access := (v_plan_status = 'active' OR coalesce(v_access_row.access_granted, false) = true);

    IF v_plan_status = 'active' AND coalesce(v_access_row.access_granted, false) = false THEN
      RAISE LOG 'active plan found';
      RAISE LOG 'reconciling access_granted=true';
      UPDATE public.user_access
      SET access_granted = true,
          user_id = coalesce(user_id, v_uid),
          email = lower(trim(email)),
          updated_at = now()
      WHERE id = v_access_row.id;
      v_has_access := true;
    ELSIF v_plan_status <> 'active' AND coalesce(v_access_row.access_granted, false) = true THEN
      UPDATE public.user_access
      SET access_granted = false,
          user_id = coalesce(user_id, v_uid),
          email = lower(trim(email)),
          updated_at = now()
      WHERE id = v_access_row.id;
    END IF;

    IF v_has_access THEN
      INSERT INTO public.app_users (id, email, full_name, access_status, payment_status, updated_at)
      VALUES (v_uid, coalesce(v_auth_email, lower(trim(v_access_row.email))), null, 'allowed', 'approved', now())
      ON CONFLICT (id)
      DO UPDATE SET
        email = excluded.email,
        access_status = 'allowed',
        payment_status = 'approved',
        updated_at = now();

      RAISE LOG 'user access released';
      RETURN QUERY SELECT true, 'allowed'::text, 'approved'::text, 'approved'::text;
      RETURN;
    END IF;
  END IF;

  SELECT au.access_status, au.payment_status
    INTO v_app_access, v_app_payment
  FROM public.app_users au
  WHERE au.id = v_uid;

  RAISE LOG 'no active access found';

  IF FOUND THEN
    RETURN QUERY
    SELECT
      coalesce(v_app_access, 'blocked') = 'allowed',
      coalesce(v_app_access, 'blocked'),
      coalesce(v_app_payment, 'pending'),
      coalesce(v_app_payment, 'pending');
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_found'::text;
END;
$function$;

-- Delegate boolean check to unified state function
CREATE OR REPLACE FUNCTION public.can_current_user_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- Ensure trigger exists to keep user_access consistent before write
DROP TRIGGER IF EXISTS sync_access_on_status ON public.user_access;
CREATE TRIGGER sync_access_on_status
  BEFORE INSERT OR UPDATE ON public.user_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_access_granted();

-- Ensure trigger exists to sync user_access -> app_users after write
DROP TRIGGER IF EXISTS sync_user_access_to_app_users ON public.user_access;
CREATE TRIGGER sync_user_access_to_app_users
  AFTER INSERT OR UPDATE ON public.user_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_app_users_from_user_access();