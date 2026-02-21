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
    previousSets?: WorkoutSet[]; // 이전 운동 기록 (저번 주차 데이터)
    groupId?: string;      // 서킷 그룹 식별자
    roundNumber?: number;  // 현재 라운드 (1부터 시작)
    groupRounds?: number;  // 해당 그룹의 총 라운드 수
    groupRestTime?: number; // 라운드 간 휴식 시간 (초)
    targetDistance?: number; // 목표 거리 (m)
    targetTime?: number;     // 목표 시간 (초)
}

export interface Workout {
    id: string;
    date: string;
    exercises: Exercise[];
    duration?: number;
    notes?: string;
    memberId?: string;
    programId?: string; // 어떤 프로그램으로 운동했는지 연결
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
