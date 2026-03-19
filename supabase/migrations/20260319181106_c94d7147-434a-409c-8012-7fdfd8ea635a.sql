CREATE OR REPLACE FUNCTION public.sync_access_granted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.email := lower(trim(NEW.email));

  IF lower(trim(coalesce(NEW.plan_status, ''))) = 'active' AND coalesce(NEW.access_granted, false) = false THEN
    RAISE LOG 'active plan found';
    RAISE LOG 'reconciling access_granted=true';
    NEW.access_granted := true;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_access_state()
RETURNS TABLE(allowed boolean, access_status text, payment_status text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_by_user public.user_access%ROWTYPE;
  v_by_email public.user_access%ROWTYPE;
  v_access_row public.user_access%ROWTYPE;
  v_has_row boolean := false;
  v_has_access boolean := false;
  v_plan_status text := '';
  v_app_access text;
  v_app_payment text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_authenticated'::text;
    RETURN;
  END IF;

  IF coalesce(v_auth_email, '') = '' THEN
    SELECT lower(trim(coalesce(au.email, '')))
      INTO v_auth_email
    FROM public.app_users au
    WHERE au.id = v_uid;
  END IF;

  RAISE LOG 'checking access by user_id';
  SELECT ua.*
    INTO v_by_user
  FROM public.user_access ua
  WHERE ua.user_id = v_uid
  ORDER BY
    CASE WHEN lower(trim(coalesce(ua.plan_status, ''))) = 'active' OR coalesce(ua.access_granted, false) = true THEN 1 ELSE 0 END DESC,
    ua.updated_at DESC NULLS LAST,
    ua.created_at DESC NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    v_access_row := v_by_user;
    v_has_row := true;
  END IF;

  IF coalesce(v_auth_email, '') <> '' THEN
    RAISE LOG 'fallback to email lookup';
    SELECT ua.*
      INTO v_by_email
    FROM public.user_access ua
    WHERE lower(trim(ua.email)) = v_auth_email
    ORDER BY
      CASE WHEN lower(trim(coalesce(ua.plan_status, ''))) = 'active' OR coalesce(ua.access_granted, false) = true THEN 1 ELSE 0 END DESC,
      ua.updated_at DESC NULLS LAST,
      ua.created_at DESC NULLS LAST
    LIMIT 1;

    IF FOUND THEN
      IF NOT v_has_row
        OR (
          (lower(trim(coalesce(v_by_email.plan_status, ''))) = 'active' OR coalesce(v_by_email.access_granted, false) = true)
          AND NOT (lower(trim(coalesce(v_access_row.plan_status, ''))) = 'active' OR coalesce(v_access_row.access_granted, false) = true)
        )
        OR (v_access_row.user_id IS NULL AND v_by_email.user_id IS NOT NULL)
      THEN
        v_access_row := v_by_email;
        v_has_row := true;
      END IF;
    END IF;
  END IF;

  IF v_has_row THEN
    v_plan_status := lower(trim(coalesce(v_access_row.plan_status, '')));
    v_has_access := (v_plan_status = 'active' OR coalesce(v_access_row.access_granted, false) = true);

    IF v_plan_status = 'active' AND coalesce(v_access_row.access_granted, false) = false THEN
      RAISE LOG 'active plan found';
      RAISE LOG 'reconciling access_granted=true';
    END IF;

    IF v_access_row.user_id IS NULL THEN
      RAISE LOG 'reconciling user_id';
    END IF;

    UPDATE public.user_access
    SET
      user_id = coalesce(user_id, v_uid),
      email = CASE WHEN coalesce(v_auth_email, '') <> '' THEN v_auth_email ELSE lower(trim(email)) END,
      access_granted = CASE
        WHEN lower(trim(coalesce(plan_status, ''))) = 'active' THEN true
        ELSE access_granted
      END,
      updated_at = now()
    WHERE id = v_access_row.id
      AND (
        user_id IS NULL
        OR email IS DISTINCT FROM CASE WHEN coalesce(v_auth_email, '') <> '' THEN v_auth_email ELSE lower(trim(email)) END
        OR (
          lower(trim(coalesce(plan_status, ''))) = 'active'
          AND coalesce(access_granted, false) = false
        )
      );

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

  IF FOUND AND coalesce(v_app_access, 'blocked') = 'allowed' THEN
    RAISE LOG 'user access released';
    RETURN QUERY SELECT true, 'allowed'::text, coalesce(v_app_payment, 'approved')::text, 'approved'::text;
    RETURN;
  END IF;

  RAISE LOG 'no active access found';

  IF FOUND THEN
    RETURN QUERY
    SELECT
      false,
      coalesce(v_app_access, 'blocked'),
      coalesce(v_app_payment, 'pending'),
      CASE
        WHEN lower(trim(coalesce(v_app_payment, 'pending'))) IN ('cancelled', 'canceled') THEN 'cancelled'
        WHEN lower(trim(coalesce(v_app_payment, 'pending'))) = 'expired' THEN 'expired'
        WHEN lower(trim(coalesce(v_app_payment, 'pending'))) IN ('refunded', 'chargeback', 'chargedback') THEN 'refunded'
        ELSE coalesce(v_app_payment, 'pending')
      END;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'blocked'::text, 'pending'::text, 'not_found'::text;
END;
$function$;

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

DROP TRIGGER IF EXISTS sync_access_on_status ON public.user_access;
CREATE TRIGGER sync_access_on_status
BEFORE INSERT OR UPDATE ON public.user_access
FOR EACH ROW
EXECUTE FUNCTION public.sync_access_granted();

DROP TRIGGER IF EXISTS sync_app_users_after_user_access ON public.user_access;
CREATE TRIGGER sync_app_users_after_user_access
AFTER INSERT OR UPDATE ON public.user_access
FOR EACH ROW
EXECUTE FUNCTION public.sync_app_users_from_user_access();