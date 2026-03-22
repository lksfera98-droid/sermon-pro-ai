CREATE POLICY "Users can view profile by email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);