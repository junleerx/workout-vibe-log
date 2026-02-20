-- Add Circuit/Block group fields to program_exercises
ALTER TABLE public.program_exercises
ADD COLUMN IF NOT EXISTS group_id text,
ADD COLUMN IF NOT EXISTS group_rounds integer;