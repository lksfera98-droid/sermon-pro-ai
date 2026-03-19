-- Allow anonymous inserts into paid_users (for Make webhook)
CREATE POLICY "Allow anon insert into paid_users"
ON public.paid_users
FOR INSERT
TO anon
WITH CHECK (true);
