-- 운동 프로그램(루틴) 테이블
CREATE TABLE public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  days_of_week TEXT[] DEFAULT '{}', -- ['monday', 'wednesday'] 등
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 프로그램에 포함된 운동 테이블
CREATE TABLE public.program_exercises (
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

-- RLS 활성화
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

-- workout_programs RLS 정책
CREATE POLICY "Users can view their own programs" 
ON public.workout_programs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" 
ON public.workout_programs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" 
ON public.workout_programs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" 
ON public.workout_programs 
FOR DELETE 
USING (auth.uid() = user_id);

-- program_exercises RLS 정책
CREATE POLICY "Users can view their program exercises" 
ON public.program_exercises 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workout_programs 
  WHERE workout_programs.id = program_exercises.program_id 
  AND workout_programs.user_id = auth.uid()
));

CREATE POLICY "Users can create their program exercises" 
ON public.program_exercises 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM workout_programs 
  WHERE workout_programs.id = program_exercises.program_id 
  AND workout_programs.user_id = auth.uid()
));

CREATE POLICY "Users can update their program exercises" 
ON public.program_exercises 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM workout_programs 
  WHERE workout_programs.id = program_exercises.program_id 
  AND workout_programs.user_id = auth.uid()
));

CREATE POLICY "Users can delete their program exercises" 
ON public.program_exercises 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM workout_programs 
  WHERE workout_programs.id = program_exercises.program_id 
  AND workout_programs.user_id = auth.uid()
));

-- updated_at 트리거
CREATE TRIGGER update_workout_programs_updated_at
BEFORE UPDATE ON public.workout_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();