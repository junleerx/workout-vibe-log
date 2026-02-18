-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  total_sets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- 3. Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout exercises" ON public.workout_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can create their own workout exercises" ON public.workout_exercises FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can update their own workout exercises" ON public.workout_exercises FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can delete their own workout exercises" ON public.workout_exercises FOR DELETE USING (EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));

-- 4. Create exercise_sets table
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise sets" ON public.exercise_sets FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id WHERE we.id = exercise_sets.workout_exercise_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can create their own exercise sets" ON public.exercise_sets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id WHERE we.id = exercise_sets.workout_exercise_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can update their own exercise sets" ON public.exercise_sets FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id WHERE we.id = exercise_sets.workout_exercise_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can delete their own exercise sets" ON public.exercise_sets FOR DELETE USING (EXISTS (SELECT 1 FROM public.workout_exercises we JOIN public.workouts w ON w.id = we.workout_id WHERE we.id = exercise_sets.workout_exercise_id AND w.user_id = auth.uid()));

-- 5. Create members table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own members" ON public.members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own members" ON public.members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own members" ON public.members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own members" ON public.members FOR DELETE USING (auth.uid() = user_id);

-- Add member_id to workouts table if not exists or handle manually if column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='member_id') THEN
        ALTER TABLE public.workouts ADD COLUMN member_id UUID REFERENCES public.members(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Create custom_exercises table
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom exercises" ON public.custom_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom exercises" ON public.custom_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom exercises" ON public.custom_exercises FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom exercises" ON public.custom_exercises FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Create workout_programs table
CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  days_of_week TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE
);

ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own programs" ON public.workout_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own programs" ON public.workout_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own programs" ON public.workout_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own programs" ON public.workout_programs FOR DELETE USING (auth.uid() = user_id);

-- 8. Create program_exercises table
CREATE TABLE IF NOT EXISTS public.program_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  target_weight NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their program exercises" ON public.program_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM workout_programs WHERE workout_programs.id = program_exercises.program_id AND workout_programs.user_id = auth.uid()));
CREATE POLICY "Users can create their program exercises" ON public.program_exercises FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM workout_programs WHERE workout_programs.id = program_exercises.program_id AND workout_programs.user_id = auth.uid()));
CREATE POLICY "Users can update their program exercises" ON public.program_exercises FOR UPDATE USING (EXISTS (SELECT 1 FROM workout_programs WHERE workout_programs.id = program_exercises.program_id AND workout_programs.user_id = auth.uid()));
CREATE POLICY "Users can delete their program exercises" ON public.program_exercises FOR DELETE USING (EXISTS (SELECT 1 FROM workout_programs WHERE workout_programs.id = program_exercises.program_id AND workout_programs.user_id = auth.uid()));

-- 9. Functions and Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_programs_updated_at ON public.workout_programs;
CREATE TRIGGER update_workout_programs_updated_at BEFORE UPDATE ON public.workout_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
