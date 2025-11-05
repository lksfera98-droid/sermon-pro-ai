-- Create table for daily devotionals
CREATE TABLE public.devotionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own devotionals" 
ON public.devotionals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own devotionals" 
ON public.devotionals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devotionals" 
ON public.devotionals 
FOR DELETE 
USING (auth.uid() = user_id);