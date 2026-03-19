
CREATE TABLE IF NOT EXISTS public.paid_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status_pagamento text NOT NULL DEFAULT 'PENDENTE',
  produto text,
  paid_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.paid_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read paid_users by email"
  ON public.paid_users FOR SELECT
  TO authenticated
  USING (lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));
