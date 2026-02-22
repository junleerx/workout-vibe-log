import { useState } from 'react';
import { Workout, WorkoutSet } from '@/types/workout';
import { categoryColors } from '@/data/exercises';
import { Calendar, Trash2, Dumbbell, Timer, ChevronDown, ChevronUp, Search, MapPin, Clock, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface HistoryViewProps {
  workouts: Workout[];
  onDeleteWorkout: (workoutId: string) => void;
  onUpdateSavedSet?: (setId: string, updates: { weight?: number; reps?: number }) => Promise<void>;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export function HistoryView({ workouts, onDeleteWorkout, onUpdateSavedSet }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { unit, toDisplay, toKg } = useWeightUnit();

  // editing state: { [setId]: { weight, reps } }
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const filtered = workouts.filter((w) =>
    !search || w.exercises.some((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
  );

  const startEditing = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setEditWeight(String(toDisplay(set.weight)));
    setEditReps(String(set.reps));
  };

  const cancelEditing = () => {
    setEditingSetId(null);
    setEditWeight('');
    setEditReps('');
  };

  const saveEditing = async (setId: string) => {
    if (!onUpdateSavedSet) return;
    const newWeight = toKg(parseFloat(editWeight) || 0);
    const newReps = parseInt(editReps) || 0;
    await onUpdateSavedSet(setId, { weight: newWeight, reps: newReps });
    setEditingSetId(null);
  };

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">운동 기록이 없습니다</h2>
          <p className="text-muted-foreground">첫 운동을 시작해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="운동 이름으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl glass border-border/30 focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      )}

      {filtered.map((workout) => {
        const totalVolume = workout.exercises.reduce(
          (acc, ex) => acc + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
          0
        );
        const isExpanded = expandedId === workout.id;

        return (
          <div key={workout.id} className="bg-card rounded-xl card-shadow slide-up overflow-hidden accent-stripe hover-lift">
            {/* Header — always visible */}
            <div
              className="p-4 cursor-pointer select-none"
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-primary">
                    {format(new Date(workout.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {workout.duration && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatDuration(workout.duration)}
                      </span>
                    )}
                    <span>{workout.exercises.length}개 운동</span>
                    {totalVolume > 0 && <span>{toDisplay(totalVolume).toLocaleString()} {unit}</span>}
                  </div>
                  {/* Exercise name pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workout.exercises.slice(0, 4).map((ex) => (
                      <span key={ex.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[ex.category] || 'bg-secondary text-muted-foreground border-transparent'}`}>
                        {ex.name}
                      </span>
                    ))}
                    {workout.exercises.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        +{workout.exercises.length - 4}개
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('이 운동 기록을 삭제하시겠습니까?')) onDeleteWorkout(workout.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded detail — set-level data with edit capability */}
            {isExpanded && (
              <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-semibold text-sm">{exercise.name}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${categoryColors[exercise.category]}`}>
                        {exercise.category}
                      </span>
                      {exercise.targetDistance && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
                          <MapPin className="w-2.5 h-2.5" />
                          {exercise.targetDistance}m
                        </span>
                      )}
                      {exercise.targetTime && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-accent/10 text-accent">
                          <Clock className="w-2.5 h-2.5" />
                          {exercise.targetTime}초
                        </span>
                      )}
                    </div>
                    {/* Per-set breakdown with edit */}
                    <div className="ml-5 space-y-1">
                      {exercise.sets.map((set, i) => (
                        <div key={set.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-10 text-right font-medium text-foreground/60">Set {i + 1}</span>

                          {editingSetId === set.id ? (
                            /* ─── EDITING MODE ─── */
                            <>
                              <input
                                type="number"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-16 h-6 px-1.5 text-xs bg-secondary rounded border border-primary/30 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                step="0.5"
                              />
                              <span className="text-muted-foreground text-[10px]">{unit}</span>
                              <span className="text-muted-foreground">×</span>
                              <input
                                type="number"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                className="w-12 h-6 px-1.5 text-xs bg-secondary rounded border border-primary/30 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="text-muted-foreground text-[10px]">회</span>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-amber-500 hover:text-amber-500/80"
                                onClick={() => saveEditing(set.id)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={cancelEditing}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            /* ─── DISPLAY MODE ─── */
                            <>
                              {set.weight > 0 && <span className="text-primary font-semibold">{toDisplay(set.weight)}{unit}</span>}
                              {set.reps > 0 && <span>× {set.reps}회</span>}
                              {set.weight === 0 && set.reps === 0 && <span className="italic">기록 없음</span>}
                              {set.completed && <span className="text-amber-500">✓</span>}
                              {onUpdateSavedSet && (
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-5 w-5 ml-1 text-muted-foreground/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ opacity: 1 }}
                                  onClick={() => startEditing(set)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
