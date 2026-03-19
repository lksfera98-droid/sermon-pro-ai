
CREATE TABLE public.compradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX compradores_email_unique ON public.compradores (lower(trim(email)));

ALTER TABLE public.compradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check own email" ON public.compradores
  FOR SELECT TO authenticated
  USING (lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email',''))));
