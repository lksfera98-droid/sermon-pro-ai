-- Add UPDATE and DELETE policies to public_sermons table
-- This ensures users can only modify or delete their own sermons

CREATE POLICY "Users can update own sermons"
ON public.public_sermons
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sermons"
ON public.public_sermons
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);