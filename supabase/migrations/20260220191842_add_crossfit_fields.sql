-- Add CrossFit fields to workout_programs
ALTER TABLE public.workout_programs
ADD COLUMN IF NOT EXISTS workout_style text,
ADD COLUMN IF NOT EXISTS time_limit integer,
ADD COLUMN IF NOT EXISTS target_rounds integer;

-- Add CrossFit fields to program_exercises
ALTER TABLE public.program_exercises
ADD COLUMN IF NOT EXISTS target_distance integer;
