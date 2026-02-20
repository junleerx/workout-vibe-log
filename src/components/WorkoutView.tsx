import { useState, useEffect } from 'react';
import { Workout, WorkoutSet, ExerciseCategory } from '@/types/workout';
import { CustomExercise } from '@/types/member';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSelector } from './ExerciseSelector';
import { Button } from '@/components/ui/button';
import { Plus, Play, Square, Timer } from 'lucide-react';
import { RestTimer } from './RestTimer';
import { useWeightUnit } from '@/hooks/useWeightUnit';

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
  const [showTimer, setShowTimer] = useState(false);
  const [restTime] = useState(90);
  const [elapsed, setElapsed] = useState(0);
  const { unit, toDisplay } = useWeightUnit();

  useEffect(() => {
    if (!currentWorkout) { setElapsed(0); return; }
    const start = new Date(currentWorkout.date).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentWorkout?.date]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

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
        <Button type="button" variant="glow" size="lg" onClick={onStartWorkout}>
          <Play className="w-5 h-5" />
          운동 시작
        </Button>
      </div>
    );
  }

  // 세트 완료 시 타이머를 트리거하는 핸들러
  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    onUpdateSet(exerciseId, setId, updates);
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
    <div className="pb-32">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-medium">완료 세트</span>
          </div>
          <p className="text-2xl font-bold text-gradient">{totalSets}</p>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs font-medium">완료 볼륨</span>
          </div>
          <p className="text-xl font-bold text-gradient">{totalVolume > 0 ? `${toDisplay(totalVolume).toLocaleString()}${unit}` : '—'}</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-1 text-primary mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-medium">진행 시간</span>
          </div>
          <p className="text-xl font-bold text-primary tabular-nums">{formatElapsed(elapsed)}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {currentWorkout.exercises.map((exercise, index) => {
          const isFirstInRound = exercise.roundNumber !== undefined && (
            index === 0 ||
            currentWorkout.exercises[index - 1].groupId !== exercise.groupId ||
            currentWorkout.exercises[index - 1].roundNumber !== exercise.roundNumber
          );
          return (
            <div key={exercise.id}>
              {isFirstInRound && (
                <div className="flex items-center gap-2 mb-2 mt-3">
                  <div className="h-px flex-1 bg-primary/20" />
                  <span className="text-xs font-bold text-primary px-2 py-1 rounded-full bg-primary/10">
                    🔥 Round {exercise.roundNumber} / {exercise.groupRounds}
                  </span>
                  <div className="h-px flex-1 bg-primary/20" />
                </div>
              )}
              <ExerciseCard
                exercise={exercise}
                onAddSet={() => onAddSet(exercise.id)}
                onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
                onUpdateSet={(setId, updates) => handleUpdateSet(exercise.id, setId, updates)}
                onRemoveExercise={() => onRemoveExercise(exercise.id)}
              />
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full mb-4"
        onClick={() => setShowExerciseSelector(true)}
      >
        <Plus className="w-5 h-5" />
        운동 추가
      </Button>

      {/* 탭 바(h-16) 위에 배치해 겹치지 않도록 bottom-20 */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-50">
        <div className="container flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancelWorkout}>
            취소
          </Button>
          <Button
            type="button"
            variant="glow"
            className="flex-1"
            onClick={onFinishWorkout}
            disabled={currentWorkout.exercises.length === 0}
          >
            <Square className="w-4 h-4" />
            운동 완료
          </Button>
        </div>
      </div>

      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={onAddExercise}
          onClose={() => setShowExerciseSelector(false)}
          customExercises={customExercises}
          onAddCustomExercise={onAddCustomExercise}
        />
      )}

      {showTimer && (
        <RestTimer
          initialSeconds={restTime}
          onClose={() => setShowTimer(false)}
        />
      )}
    </div>
  );
}
