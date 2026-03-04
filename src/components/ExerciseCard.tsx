import { Exercise, WorkoutSet } from '@/types/workout';
import { categoryColors } from '@/data/exercises';
import { useState } from 'react';
import { Plus, Trash2, Check, MapPin, Clock, Thermometer, Flame, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { PlateCalculator } from './PlateCalculator';

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
  const { unit, toDisplay, toKg } = useWeightUnit();
  return (
    <div className="bg-card rounded-xl p-4 card-shadow slide-up hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{exercise.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${categoryColors[exercise.category]
                }`}
            >
              {exercise.category}
            </span>
            {exercise.targetDistance && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                <MapPin className="w-3 h-3" />
                {exercise.targetDistance}m
              </span>
            )}
            {exercise.targetTime && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Clock className="w-3 h-3" />
                {exercise.targetTime}초
              </span>
            )}
            {exercise.groupId && exercise.roundNumber && exercise.groupRounds && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                R{exercise.roundNumber}/{exercise.groupRounds}
              </span>
            )}
          </div>
          {exercise.aiRecommendation && (
            <div className="mt-2 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5 leading-snug">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{exercise.aiRecommendation}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (window.confirm(`'${exercise.name}' 운동을 삭제하시겠습니까?`)) {
              onRemoveExercise();
            }
          }}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
          <div className="col-span-2">세트</div>
          <div className="col-span-4">무게 ({unit})</div>
          <div className="col-span-4">횟수</div>
          <div className="col-span-2"></div>
        </div>

        {exercise.sets.map((set, index) => (
          <div
            key={set.id}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-primary/10' : 'bg-secondary/50'
              }`}
          >
            <div className="col-span-2 text-sm font-semibold text-muted-foreground">
              {index + 1}
            </div>
            <div className="col-span-4 relative flex items-center">
              <NumberInput
                value={set.weight ? toDisplay(set.weight) : 0}
                onChange={(val) =>
                  onUpdateSet(set.id, { weight: toKg(val) || 0 })
                }
                className="w-full text-xs h-9"
                step={2.5}
                min={0}
              />
              {set.weight > 0 && (
                <div className="absolute right-0 top-10 z-10">
                  <PlateCalculator weight={toDisplay(set.weight)} unit={unit} />
                </div>
              )}
            </div>
            <div className="col-span-4">
              <NumberInput
                value={set.reps || 0}
                onChange={(val) =>
                  onUpdateSet(set.id, { reps: val || 0 })
                }
                className="w-full text-xs h-9"
                step={1}
                min={0}
              />
            </div>
            <div className="col-span-2 flex gap-1 items-center justify-end">
              <button
                type="button"
                onClick={() => onUpdateSet(set.id, {
                  rir: set.rir === undefined ? 2 : undefined, // 임시 토글용
                })}
                className={`p-1.5 rounded-lg transition-all ${set.rir !== undefined || set.isPainful
                  ? 'bg-orange-500/20 text-orange-500'
                  : 'bg-muted/50 text-muted-foreground hover:bg-orange-500/20'
                  }`}
                title="컨디션(RIR/통증) 기록"
              >
                <Thermometer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const newStatus = !set.completed;
                  onUpdateSet(set.id, { completed: newStatus });
                }}
                className={`p-1.5 rounded-lg transition-all ${set.completed
                  ? 'bg-primary text-primary-foreground animate-check'
                  : 'bg-muted/50 text-muted-foreground hover:bg-primary/20'
                  }`}
              >
                <Check className="w-4 h-4" />
              </button>
              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(set.id)}
                  className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 컨디션 기록 확장 영역 */}
            {(set.rir !== undefined || set.isPainful) && (
              <div className="col-span-12 mt-1 bg-black/20 rounded-lg p-2.5 flex flex-col gap-2.5 border border-orange-500/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">RIR</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => onUpdateSet(set.id, { rir: r })}
                          className={`w-6 h-6 rounded-md text-xs font-bold transition-all ${set.rir === r ? 'bg-orange-500 text-white' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateSet(set.id, { isPainful: !set.isPainful })}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all ${set.isPainful ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-secondary/50 text-muted-foreground hover:bg-red-500/10'}`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>통증/자세 무너짐</span>
                  </button>
                </div>

                {/* 세트 메모 */}
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-1.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={set.notes || ''}
                    onChange={(e) => onUpdateSet(set.id, { notes: e.target.value })}
                    placeholder="메모 (예: 폼 무너짐, 허리 불편)"
                    className="flex-1 bg-secondary/40 rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 border border-transparent focus:border-orange-500/30"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
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
