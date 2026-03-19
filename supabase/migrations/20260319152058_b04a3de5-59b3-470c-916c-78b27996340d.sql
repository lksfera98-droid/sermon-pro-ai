
-- Create user_access table for controlling app access
CREATE TABLE public.user_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  access_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Users can check their own access by email
CREATE POLICY "Users can view own access"
ON public.user_access
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_access_updated_at
BEFORE UPDATE ON public.user_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
