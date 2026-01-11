-- Make user_id nullable in devotionals table
ALTER TABLE public.devotionals ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can create their own devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can delete their own devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can view their own devotionals" ON public.devotionals;

-- Create new public RLS policies (no authentication required)
CREATE POLICY "Anyone can create devotionals" 
ON public.devotionals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view devotionals" 
ON public.devotionals 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can delete devotionals" 
ON public.devotionals 
FOR DELETE 
USING (true);