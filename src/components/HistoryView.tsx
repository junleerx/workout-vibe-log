import { Workout } from '@/types/workout';
import { categoryColors } from '@/data/exercises';
import { Calendar, Trash2, Dumbbell, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HistoryViewProps {
  workouts: Workout[];
  onDeleteWorkout: (workoutId: string) => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

export function HistoryView({ workouts, onDeleteWorkout }: HistoryViewProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">운동 기록이 없습니다</h2>
          <p className="text-muted-foreground">첫 운동을 시작해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {workouts.map((workout) => {
        const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        const totalVolume = workout.exercises.reduce(
          (acc, ex) =>
            acc + ex.sets.reduce((setAcc, s) => setAcc + s.weight * s.reps, 0),
          0
        );

        return (
          <div key={workout.id} className="bg-card rounded-xl p-4 card-shadow slide-up">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(workout.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                </p>
                {workout.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Timer className="w-3 h-3" />
                    {formatDuration(workout.duration)}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteWorkout(workout.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">운동 수</p>
                <p className="text-lg font-bold">{workout.exercises.length}개</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">총 볼륨</p>
                <p className="text-lg font-bold">{totalVolume.toLocaleString()} kg</p>
              </div>
            </div>

            <div className="space-y-2">
              {workout.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{exercise.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                        categoryColors[exercise.category]
                      }`}
                    >
                      {exercise.category}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {exercise.sets.length} 세트
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
