// 각 세트의 목표 정보
export interface ExerciseSet {
      setNumber: number; // 세트 번호 (1, 2, 3...)
  targetReps: number; // 목표 횟수
  targetWeight: number; // 목표 무게
}

export interface ProgramExercise {
      id: string;
      exerciseName: string;
      muscleGroup: string;
      sets: ExerciseSet[]; // 각 세트별 상세 정보
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
