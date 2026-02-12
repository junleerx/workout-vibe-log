export interface ProgramExercise {
    id: string;
    exerciseName: string;
    muscleGroup: string;
    targetSets: number;
    targetReps: number;
    targetWeights: number[]; // 각 세트별 무게를 배열로 저장
  orderIndex: number;
}

export interface WorkoutProgram {
    id: string;
    name: string;
    description?: string;
    daysOfWeek: string[];
    exercises: ProgramExercise[];
    createdAt: string;
    updatedAt: string;
}

export const DAYS_OF_WEEK = [
  { id: 'monday', label: '월' },
  { id: 'tuesday', label: '화' },
  { id: 'wednesday', label: '수' },
  { id: 'thursday', label: '목' },
  { id: 'friday', label: '금' },
  { id: 'saturday', label: '토' },
  { id: 'sunday', label: '일' },
  ] as const;
