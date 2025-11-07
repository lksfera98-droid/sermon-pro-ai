-- Add delete_token to enable deletion for anonymous requests via edge function
ALTER TABLE public.prayer_requests
ADD COLUMN IF NOT EXISTS delete_token text;

-- Index for fast lookup by token
CREATE INDEX IF NOT EXISTS idx_prayer_requests_delete_token ON public.prayer_requests(delete_token);
