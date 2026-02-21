-- Add target_time to program_exercises
ALTER TABLE public.program_exercises
ADD COLUMN IF NOT EXISTS target_time integer;
