import { useState } from 'react';
import { Workout, WorkoutSet, ExerciseCategory } from '@/types/workout';
import { CustomExercise } from '@/types/member';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSelector } from './ExerciseSelector';
import { Button } from '@/components/ui/button';
import { Plus, Play, Square, Timer } from 'lucide-react';
import { RestTimer } from './RestTimer'; // 타이머 컴포넌트 가져오기

interface WorkoutViewProps {
  currentWorkout: Workout | null;
  onStartWorkout: () => void;
  onAddExercise: (name: string, category: ExerciseCategory) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  customExercises?: CustomExercise[];
  onAddCustomExercise?: (name: string, category: string) => Promise<CustomExercise | undefined>;
}

export function WorkoutView({
  currentWorkout,
  onStartWorkout,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onFinishWorkout,
  onCancelWorkout,
  customExercises = [],
  onAddCustomExercise,
}: WorkoutViewProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showTimer, setShowTimer] = useState(false); // 타이머 보임 상태 추가
  const [restTime] = useState(90); // 기본 쉬는 시간 90초 설정

  if (!currentWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
            <Play className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">오늘의 운동</h2>
          <p className="text-muted-foreground">새로운 운동을 시작해보세요!</p>
        </div>
        <Button variant="glow" size="lg" onClick={onStartWorkout}>
          <Play className="w-5 h-5" />
          운동 시작
        </Button>
      </div>
    );
  }

  // 세트 업데이트 시 타이머를 실행하는 중간 함수
  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    onUpdateSet(exerciseId, setId, updates);
    
    // 세트가 완료(completed: true)로 변경될 때만 타이머를 켭니다.
    if (updates.completed === true) {
      setShowTimer(true);
    }
  };

  const totalSets = currentWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolume = currentWorkout.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((setAcc, s) => setAcc + s.weight * s.reps, 0),
    0
  );

  return (
    <div className="pb-32
