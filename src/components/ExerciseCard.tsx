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
        <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-medium text-muted-foreground px-1 pb-1">
          <div className="w-8 text-center shrink-0">세트</div>
          <div className="flex-1 text-center">무게({unit})</div>
          <div className="flex-1 text-center">횟수</div>
          <div className="w-16 sm:w-20 shrink-0 text-center">완료</div>
        </div>

        {exercise.sets.map((set, index) => (
          <div
            key={set.id}
            className={`flex flex-col gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg transition-colors overflow-x-visible ${set.completed ? 'bg-primary/10' : 'bg-secondary/50'
              }`}
          >
            {/* Top Row */}
            <div className="flex items-center gap-1 sm:gap-2 w-full">
              <div className="w-8 shrink-0 flex flex-col items-center justify-center gap-0.5 relative">
                <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                {set.weight > 0 && (
                  <div className="scale-[0.55] sm:scale-[0.65] origin-top absolute top-full mt-0.5 whitespace-nowrap opacity-60 pointer-events-none">
                    <PlateCalculator weight={toDisplay(set.weight)} unit={unit} />
                  </div>
                )}
              </div>

              <div className="flex-1 flex gap-1 sm:gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <NumberInput
                    value={set.weight ? toDisplay(set.weight) : 0}
                    onChange={(val) =>
                      onUpdateSet(set.id, { weight: toKg(val) || 0 })
                    }
                    className="w-full text-xs h-9 px-0"
                    step={2.5}
                    min={0}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <NumberInput
                    value={set.reps || 0}
                    onChange={(val) =>
                      onUpdateSet(set.id, { reps: val || 0 })
                    }
                    className="w-full text-xs h-9 px-0"
                    step={1}
                    min={0}
                  />
                </div>
              </div>

              <div className="w-[72px] sm:w-[84px] shrink-0 flex gap-0.5 sm:gap-1 items-center justify-center">
                <button
                  type="button"
                  onClick={() => onUpdateSet(set.id, {
                    rir: set.rir === undefined ? 2 : undefined, // 임시 토글용
                  })}
                  className={`flex items-center justify-center flex-1 h-9 rounded-md sm:rounded-lg transition-all ${set.rir !== undefined || set.isPainful
                    ? 'bg-orange-500/20 text-orange-500'
                    : 'bg-muted/50 text-muted-foreground hover:bg-orange-500/20'
                    }`}
                  title="컨디션(RIR/통증) 기록"
                >
                  <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newStatus = !set.completed;
                    onUpdateSet(set.id, { completed: newStatus });
                  }}
                  className={`flex items-center justify-center flex-1 h-9 rounded-md sm:rounded-lg transition-all ${set.completed
                    ? 'bg-primary text-primary-foreground animate-check'
                    : 'bg-muted/50 text-muted-foreground hover:bg-primary/20'
                    }`}
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {exercise.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveSet(set.id)}
                    className="flex items-center justify-center w-7 sm:w-8 h-9 rounded-md sm:rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all shrink-0 ml-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row / Condition Box */}
            <div className="flex flex-col w-full pl-8 sm:pl-10 mt-0.5 pr-1">
              {(set.rir !== undefined || set.isPainful) ? (
                <div className="w-full bg-black/20 rounded-lg p-2.5 flex flex-col gap-2.5 border border-orange-500/20">
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
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateSet(set.id, { rir: 2 })}
                  className="w-full py-1.5 rounded-lg border border-transparent hover:border-orange-500/30 bg-secondary/30 hover:bg-orange-500/10 text-muted-foreground/80 hover:text-orange-500 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
                >
                  <Thermometer className="w-3 h-3" />
                  컨디션 및 메모 추가
                </button>
              )}
            </div>
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
