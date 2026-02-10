-- Add member_id to workout_programs for multi-profile support
ALTER TABLE public.workout_programs
ADD COLUMN member_id uuid REFERENCES public.members(id) ON DELETE CASCADE;

-- Update RLS policies to also allow filtering by member
-- (existing policies already check user_id = auth.uid(), so member_id filtering is handled in app code)