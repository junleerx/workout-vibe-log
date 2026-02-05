-- Create members table for managing multiple people per user
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS policies for members
CREATE POLICY "Users can view their own members"
ON public.members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own members"
ON public.members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
ON public.members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
ON public.members FOR DELETE
USING (auth.uid() = user_id);

-- Add member_id to workouts table
ALTER TABLE public.workouts ADD COLUMN member_id UUID REFERENCES public.members(id) ON DELETE CASCADE;

-- Create custom_exercises table for user-defined exercises
CREATE TABLE public.custom_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_exercises
CREATE POLICY "Users can view their own custom exercises"
ON public.custom_exercises FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom exercises"
ON public.custom_exercises FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom exercises"
ON public.custom_exercises FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for members updated_at
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();