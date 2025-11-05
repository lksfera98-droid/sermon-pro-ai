-- Create table for public sermons gallery
CREATE TABLE public.public_sermons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('pt', 'en', 'es')),
  theme TEXT NOT NULL,
  verse TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_sermons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read public sermons
CREATE POLICY "Anyone can view public sermons" 
ON public.public_sermons 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert sermons
CREATE POLICY "Authenticated users can create public sermons" 
ON public.public_sermons 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster filtering by language
CREATE INDEX idx_public_sermons_language ON public.public_sermons(language);
CREATE INDEX idx_public_sermons_created_at ON public.public_sermons(created_at DESC);