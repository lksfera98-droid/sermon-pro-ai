
-- 1. Create app_users table
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  access_status text NOT NULL DEFAULT 'blocked',
  payment_status text NOT NULL DEFAULT 'pending',
  plan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Users can view own row"
  ON public.app_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON public.app_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Trigger function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, full_name, access_status, payment_status)
  VALUES (
    NEW.id,
    lower(trim(NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'blocked',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Trigger on auth.users
CREATE TRIGGER on_auth_user_created_app_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_app_user();

-- 6. Updated at trigger
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Update can_current_user_access to use app_users
CREATE OR REPLACE FUNCTION public.can_current_user_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.id = auth.uid()
      AND au.access_status = 'allowed'
  );
$$;

-- 8. Backfill existing auth users into app_users
INSERT INTO public.app_users (id, email, full_name, access_status, payment_status)
SELECT 
  u.id,
  lower(trim(u.email)),
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_access ua 
      WHERE lower(trim(ua.email)) = lower(trim(u.email))
        AND (ua.access_granted = true OR lower(coalesce(ua.plan_status,'')) = 'active')
    ) THEN 'allowed'
    ELSE 'blocked'
  END,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_access ua 
      WHERE lower(trim(ua.email)) = lower(trim(u.email))
        AND (ua.access_granted = true OR lower(coalesce(ua.plan_status,'')) = 'active')
    ) THEN 'approved'
    ELSE 'pending'
  END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
