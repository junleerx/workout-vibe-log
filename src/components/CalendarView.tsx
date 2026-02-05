import { useState, useMemo } from 'react';
import { Workout } from '@/types/workout';
import { Member } from '@/types/member';
import { Calendar } from '@/components/ui/calendar';
import { categoryColors } from '@/data/exercises';
import { format, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dumbbell, Timer, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CalendarViewProps {
  workouts: Workout[];
  selectedMember: Member | null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

export function CalendarView({ workouts, selectedMember }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);

  const workoutDates = useMemo(() => {
    return workouts.map(w => parseISO(w.date));
  }, [workouts]);

  const selectedDayWorkouts = useMemo(() => {
    if (!selectedDate) return [];
    return workouts.filter(w => isSameDay(parseISO(w.date), selectedDate));
  }, [workouts, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const hasWorkouts = workouts.some(w => isSameDay(parseISO(w.date), date));
      if (hasWorkouts) {
        setShowWorkoutDialog(true);
      }
    }
  };

  const modifiers = {
    workout: (date: Date) => workoutDates.some(d => isSameDay(d, date)),
  };

  const modifiersStyles = {
    workout: {
      backgroundColor: 'hsl(var(--primary) / 0.2)',
      borderRadius: '50%',
    },
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 card-shadow">
        <h3 className="text-lg font-bold mb-4">
          {selectedMember?.name || '회원'} 운동 캘린더
        </h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={ko}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="w-full"
        />
      </div>

      <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDayWorkouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                이 날짜에 운동 기록이 없습니다.
              </p>
            ) : (
              selectedDayWorkouts.map((workout) => {
                const totalVolume = workout.exercises.reduce(
                  (acc, ex) =>
                    acc + ex.sets.reduce((setAcc, s) => setAcc + s.weight * s.reps, 0),
                  0
                );

                return (
                  <div key={workout.id} className="bg-secondary rounded-xl p-4">
                    {workout.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Timer className="w-3 h-3" />
                        {formatDuration(workout.duration)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">운동 수</p>
                        <p className="text-lg font-bold">{workout.exercises.length}개</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
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
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
