CREATE UNIQUE INDEX IF NOT EXISTS paid_users_email_unique 
ON public.paid_users (lower(trim(email)));