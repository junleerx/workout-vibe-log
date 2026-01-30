export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  category: ExerciseCategory;
}

export interface Workout {
  id: string;
  date: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
}

export type ExerciseCategory = 
  | '가슴' 
  | '등' 
  | '어깨' 
  | '하체' 
  | '팔' 
  | '복근' 
  | '전신';

export interface ExerciseTemplate {
  name: string;
  category: ExerciseCategory;
}
