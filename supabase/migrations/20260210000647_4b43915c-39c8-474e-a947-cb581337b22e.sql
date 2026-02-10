-- Add missing UPDATE policy for custom_exercises
CREATE POLICY "Users can update their own custom exercises"
ON public.custom_exercises
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);