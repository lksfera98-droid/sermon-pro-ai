
-- Add missing columns to match external system
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS product text;
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS plan_status text;
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS purchased_at timestamptz;
ALTER TABLE public.user_access ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Trigger to auto-set access_granted = true when plan_status is 'active'
CREATE OR REPLACE FUNCTION public.sync_access_granted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_status = 'active' THEN
    NEW.access_granted := true;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it was partially created before
DROP TRIGGER IF EXISTS trg_sync_access_granted ON public.user_access;

CREATE TRIGGER trg_sync_access_granted
BEFORE INSERT OR UPDATE ON public.user_access
FOR EACH ROW
EXECUTE FUNCTION public.sync_access_granted();

-- Fix any existing rows
UPDATE public.user_access SET access_granted = true WHERE plan_status = 'active' AND access_granted = false;
