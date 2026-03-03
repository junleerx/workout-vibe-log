import { useMemo } from 'react';
import { Workout } from '@/types/workout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dumbbell, Clock, Trophy, TrendingUp, X, Flame, BarChart2 } from 'lucide-react';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface WorkoutSummaryProps {
  workout: Workout;
  allWorkouts: Workout[];
  onClose: () => void;
}

export function WorkoutSummary({ workout, allWorkouts, onClose }: WorkoutSummaryProps) {
  const { unit, toDisplay } = useWeightUnit();

  const stats = useMemo(() => {
    const completedSets = workout.exercises.flatMap(ex => ex.sets.filter(s => s.completed));
    const totalSets = completedSets.length;
    const totalVolume = completedSets.reduce((acc, s) => acc + s.weight * s.reps, 0);
    const totalReps = completedSets.reduce((acc, s) => acc + s.reps, 0);
    const durationMin = workout.duration ? Math.round(workout.duration / 60) : 0;

    // PR 감지 - 이전 기록과 비교
    const prs: { exerciseName: string; weight: number; previousBest: number }[] = [];
    workout.exercises.forEach(ex => {
      const maxWeight = Math.max(...ex.sets.filter(s => s.completed && s.weight > 0).map(s => s.weight), 0);
      if (maxWeight === 0) return;

      // 이 운동의 이전 최고 기록 (현재 workout 제외)
      let prevBest = 0;
      allWorkouts.forEach(w => {
        if (w.id === workout.id) return;
        w.exercises.forEach(prevEx => {
          if (prevEx.name === ex.name) {
            const prevMax = Math.max(...prevEx.sets.filter(s => s.weight > 0).map(s => s.weight), 0);
            if (prevMax > prevBest) prevBest = prevMax;
          }
        });
      });

      if (prevBest > 0 && maxWeight > prevBest) {
        prs.push({ exerciseName: ex.name, weight: maxWeight, previousBest: prevBest });
      } else if (prevBest === 0 && maxWeight > 0) {
        // 첫 기록도 PR
        prs.push({ exerciseName: ex.name, weight: maxWeight, previousBest: 0 });
      }
    });

    return { totalSets, totalVolume, totalReps, durationMin, prs };
  }, [workout, allWorkouts]);

  return (
    <AnimatePresence>
      <motion.div
        key="workout-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl pb-safe overflow-hidden"
        >
          {/* 헤더 */}
          <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 p-6 text-center border-b border-border/30">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            >
              <Dumbbell className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black">운동 완료! 🎉</h2>
            <p className="text-sm text-muted-foreground mt-1">오늘도 수고하셨습니다</p>
          </div>

          {/* 스탯 */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-2xl p-3 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-black">{stats.durationMin}</p>
                <p className="text-[11px] text-muted-foreground">분</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-3 text-center">
                <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-black">{stats.totalSets}</p>
                <p className="text-[11px] text-muted-foreground">세트</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-3 text-center">
                <BarChart2 className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-xl font-black">{stats.totalVolume > 0 ? toDisplay(stats.totalVolume).toLocaleString() : '—'}</p>
                <p className="text-[11px] text-muted-foreground">{unit} 볼륨</p>
              </div>
            </div>

            {/* 운동 목록 */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">오늘 한 운동</h3>
              <div className="space-y-1.5">
                {workout.exercises.map(ex => {
                  const completedSets = ex.sets.filter(s => s.completed);
                  const maxW = Math.max(...completedSets.filter(s => s.weight > 0).map(s => s.weight), 0);
                  return (
                    <div key={ex.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-secondary/30">
                      <span className="font-medium">{ex.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {completedSets.length}세트
                        {maxW > 0 && ` · ${toDisplay(maxW)}${unit}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PR 달성 */}
            {stats.prs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-amber-600 dark:text-amber-400">
                    PR 달성! {stats.prs.length > 1 ? `${stats.prs.length}개` : ''}
                  </h3>
                </div>
                {stats.prs.map((pr, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="font-medium">{pr.exerciseName}</span>
                    <div className="flex items-center gap-2">
                      {pr.previousBest > 0 && (
                        <span className="text-xs text-muted-foreground line-through">{toDisplay(pr.previousBest)}{unit}</span>
                      )}
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {toDisplay(pr.weight)}{unit}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            <Button className="w-full h-12 text-base font-bold" onClick={onClose}>
              확인
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
