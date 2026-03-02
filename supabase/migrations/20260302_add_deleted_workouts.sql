-- Create deleted_workouts table for undo functionality
CREATE TABLE IF NOT EXISTS public.deleted_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_workout_id UUID NOT NULL,
  workout_data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deleted_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deleted workouts" ON public.deleted_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can restore their own deleted workouts" ON public.deleted_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Index for efficient querying by user and deletion time
CREATE INDEX idx_deleted_workouts_user_deleted_at ON public.deleted_workouts(user_id, deleted_at DESC);
