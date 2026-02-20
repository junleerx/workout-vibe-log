// 각 세트의 목표 정보
export interface ExerciseSet {
        setNumber: number; // 세트 번호 (1, 2, 3...)
        targetReps: number; // 목표 횟수
        targetWeight: number; // 목표 무게
        restTime: number; // 세트 후 휴식 시간 (초 단위)
}

export interface ProgramExercise {
        id: string;
        exerciseName: string;
        muscleGroup: string;
        targetSets: number;
        targetReps: number;
        targetWeight: number;
        sets: ExerciseSet[]; // 각 세트별 상세 정보
        workoutStyle?: 'classic' | 'amrap' | 'emom';
        timeLimit?: number; // 분 단위
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
