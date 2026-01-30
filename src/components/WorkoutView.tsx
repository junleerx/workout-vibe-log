import { useState } from 'react';
import { Workout, Exercise, WorkoutSet, ExerciseCategory } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSelector } from './ExerciseSelector';
import { Button } from '@/components/ui/button';
import { Plus, Play, Square, Timer } from 'lucide-react';

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
}: WorkoutViewProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-medium">완료 세트</span>
          </div>
          <p className="text-2xl font-bold text-gradient">{totalSets}</p>
        </div>
        <div className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs font-medium">총 볼륨</span>
          </div>
          <p className="text-2xl font-bold text-gradient">{totalVolume.toLocaleString()} kg</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {currentWorkout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAddSet={() => onAddSet(exercise.id)}
            onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
            onUpdateSet={(setId, updates) => onUpdateSet(exercise.id, setId, updates)}
            onRemoveExercise={() => onRemoveExercise(exercise.id)}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full mb-4"
        onClick={() => setShowExerciseSelector(true)}
      >
        <Plus className="w-5 h-5" />
        운동 추가
      </Button>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="container flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancelWorkout}>
            취소
          </Button>
          <Button
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
        />
      )}
    </div>
  );
}
