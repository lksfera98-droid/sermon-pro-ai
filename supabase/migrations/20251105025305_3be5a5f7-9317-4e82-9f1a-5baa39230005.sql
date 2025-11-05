-- Create storage bucket for prayer request images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prayer-images', 'prayer-images', true);

-- Create prayer_requests table
CREATE TABLE public.prayer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  language text NOT NULL,
  request_text text NOT NULL,
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  image_url text,
  user_id uuid
);

-- Enable RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can view and create prayer requests
CREATE POLICY "Anyone can view prayer requests"
ON public.prayer_requests
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create prayer requests"
ON public.prayer_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own prayer requests"
ON public.prayer_requests
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer requests"
ON public.prayer_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for prayer images
CREATE POLICY "Anyone can view prayer images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'prayer-images');

CREATE POLICY "Anyone can upload prayer images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'prayer-images');

CREATE POLICY "Users can update own prayer images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'prayer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own prayer images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'prayer-images' AND auth.uid()::text = (storage.foldername(name))[1]);