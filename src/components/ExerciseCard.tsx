import { Exercise, WorkoutSet } from '@/types/workout';
import { categoryColors } from '@/data/exercises';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExerciseCardProps {
  exercise: Exercise;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveExercise: () => void;
}

export function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 card-shadow slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{exercise.name}</h3>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
              categoryColors[exercise.category]
            }`}
          >
            {exercise.category}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemoveExercise}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
          <div className="col-span-2">세트</div>
          <div className="col-span-4">무게 (kg)</div>
          <div className="col-span-4">횟수</div>
          <div className="col-span-2"></div>
        </div>

        {exercise.sets.map((set, index) => (
          <div
            key={set.id}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
              set.completed ? 'bg-primary/10' : 'bg-secondary/50'
            }`}
          >
            <div className="col-span-2 text-sm font-semibold text-muted-foreground">
              {index + 1}
            </div>
            <div className="col-span-4">
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) =>
                  onUpdateSet(set.id, { weight: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div className="col-span-4">
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) =>
                  onUpdateSet(set.id, { reps: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div className="col-span-2 flex gap-1">
              <button
                onClick={() => onUpdateSet(set.id, { completed: !set.completed })}
                className={`p-1.5 rounded-lg transition-all ${
                  set.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-primary/20'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
              {exercise.sets.length > 1 && (
                <button
                  onClick={() => onRemoveSet(set.id)}
                  className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onAddSet}
        className="w-full mt-3"
      >
        <Plus className="w-4 h-4" />
        세트 추가
      </Button>
    </div>
  );
}
