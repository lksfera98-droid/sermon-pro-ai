
CREATE OR REPLACE FUNCTION public.handle_new_user_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_access (email, user_id, access_granted, plan_status)
  VALUES (lower(trim(NEW.email)), NEW.id, false, 'inactive')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_access();
