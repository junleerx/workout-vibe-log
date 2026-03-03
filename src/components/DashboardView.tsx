import { useMemo, useState, useCallback } from 'react';
import { Workout } from '@/types/workout';
import { Member } from '@/types/member';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { Dumbbell, Clock, Flame, Target, Timer, AlertTriangle, ArrowRight } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays, differenceInCalendarDays, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DashboardCalendar } from './DashboardCalendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface DashboardViewProps {
    workouts: Workout[];
    selectedMember: Member | null;
    isLoading?: boolean;
    onNavigateToHistory?: () => void;
    onNavigateToWorkout?: () => void;
    onNavigateToAI?: () => void;
}

function formatDurationShort(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
}

// 근육군 카테고리 그룹
const MUSCLE_GROUPS = ['가슴', '등', '어깨', '하체', '팔', '복근', '전신'] as const;

export function DashboardView({ workouts, selectedMember, isLoading, onNavigateToHistory, onNavigateToWorkout, onNavigateToAI }: DashboardViewProps) {
    const { unit, toDisplay } = useWeightUnit();
    const [showGoalSheet, setShowGoalSheet] = useState(false);

    // ─── user-configurable weekly goal ───
    const [weeklyGoal, setWeeklyGoal] = useState(() => {
        const saved = localStorage.getItem('weeklyGoal');
        return saved ? parseInt(saved) : 5;
    });
    const [tempGoal, setTempGoal] = useState(weeklyGoal);

    const handleSaveGoal = useCallback(() => {
        setWeeklyGoal(tempGoal);
        localStorage.setItem('weeklyGoal', String(tempGoal));
        setShowGoalSheet(false);
    }, [tempGoal]);

    // ─── derived stats ───
    const stats = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const thisWeekWorkouts = workouts.filter(w => {
            const d = parseISO(w.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });

        const weeklyMinutes = thisWeekWorkouts.reduce((acc, w) => acc + (w.duration ? Math.floor(w.duration / 60) : 0), 0);

        // streak
        let streak = 0;
        const sortedDates = [...new Set(workouts.map(w => w.date.slice(0, 10)))].sort().reverse();
        if (sortedDates.length > 0) {
            const today = format(now, 'yyyy-MM-dd');
            const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                streak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const diff = differenceInCalendarDays(parseISO(sortedDates[i - 1]), parseISO(sortedDates[i]));
                    if (diff === 1) streak++;
                    else break;
                }
            }
        }

        const totalWorkouts = workouts.length;

        const prevWeekStart = subDays(weekStart, 7);
        const prevWeekEnd = subDays(weekStart, 1);
        const prevWeekWorkouts = workouts.filter(w => {
            const d = parseISO(w.date);
            return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
        });
        const streakChange = thisWeekWorkouts.length - prevWeekWorkouts.length;

        // ─── 근육군 균형 분석 (최근 2주) ───
        const twoWeeksAgo = subWeeks(now, 2);
        const recentWorkouts = workouts.filter(w => parseISO(w.date) >= twoWeeksAgo);
        const muscleGroupCount: Record<string, number> = {};
        MUSCLE_GROUPS.forEach(g => { muscleGroupCount[g] = 0; });
        recentWorkouts.forEach(w => {
            w.exercises.forEach(ex => {
                if (muscleGroupCount[ex.category] !== undefined) {
                    muscleGroupCount[ex.category]++;
                }
            });
        });
        const neglectedGroups = MUSCLE_GROUPS.filter(g => g !== '전신' && muscleGroupCount[g] === 0);

        return {
            totalWorkouts,
            weeklyMinutes,
            streak,
            weeklyCompleted: thisWeekWorkouts.length,
            streakChange,
            muscleGroupCount,
            neglectedGroups,
        };
    }, [workouts]);

    const progressPercent = Math.min((stats.weeklyCompleted / weeklyGoal) * 100, 100);

    const statCards = [
        {
            label: '총 운동',
            value: stats.totalWorkouts.toLocaleString(),
            sub: '전체 기간',
            icon: Dumbbell,
            color: 'from-primary/80 to-primary',
        },
        {
            label: '활동 시간',
            value: stats.weeklyMinutes.toLocaleString(),
            sub: '분 (이번 주)',
            icon: Clock,
            color: 'from-accent/80 to-accent',
        },
        {
            label: '연속 기록',
            value: `${stats.streak}일`,
            sub: stats.streakChange > 0 ? `↑ ${stats.streakChange}` : stats.streakChange < 0 ? `↓ ${Math.abs(stats.streakChange)}` : '—',
            icon: Flame,
            color: 'from-amber-500/80 to-amber-500',
        },
        {
            label: '주간 목표',
            value: `${stats.weeklyCompleted}/${weeklyGoal}`,
            sub: '탭하여 목표 수정',
            icon: Target,
            color: 'from-yellow-400/80 to-yellow-500',
            onClick: () => { setTempGoal(weeklyGoal); setShowGoalSheet(true); },
        },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">운동 기록을 불러오는 중...</p>
            </div>
        );
    }

    // ─── 빈 상태 (첫 방문) ───
    if (workouts.length === 0) {
        return (
            <div className="space-y-6 pb-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        {selectedMember?.name || '회원'}님, 안녕하세요! 👋
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1 break-keep">첫 운동을 시작해봐요!</p>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-6 card-shadow border border-border/30 text-center"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">아직 운동 기록이 없어요</h3>
                    <p className="text-sm text-muted-foreground mb-5 break-keep">
                        운동을 시작하거나, AI로 맞춤 프로그램을 만들어보세요.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full gap-2" onClick={onNavigateToWorkout}>
                            <Dumbbell className="w-4 h-4" />
                            지금 바로 운동 시작
                            <ArrowRight className="w-4 h-4 ml-auto" />
                        </Button>
                        <Button variant="outline" className="w-full gap-2" onClick={onNavigateToAI}>
                            AI로 맞춤 프로그램 만들기
                            <ArrowRight className="w-4 h-4 ml-auto" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-4">
            {/* ─── greeting ─── */}
            <div>
                <h2 className="text-2xl font-bold">
                    {selectedMember?.name || '회원'}님, 안녕하세요! 👋
                </h2>
                <p className="text-muted-foreground text-sm mt-1 break-keep">오늘도 좋은 운동 되세요</p>
            </div>

            {/* ─── stat cards ─── */}
            <div className="grid grid-cols-2 gap-3">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        onClick={'onClick' in card ? (card as any).onClick : undefined}
                        className={`bg-card rounded-2xl p-4 card-shadow border border-border/30 flex flex-col justify-between min-h-[120px] relative overflow-hidden ${'onClick' in card ? 'cursor-pointer active:scale-[0.97] transition-transform' : ''}`}
                    >
                        <div className="absolute -right-2 -top-2 opacity-[0.07]">
                            <card.icon className="w-20 h-20" />
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                                <card.icon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="relative z-10 mt-2">
                            <p className="text-2xl font-extrabold tracking-tight">{card.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── weekly goal progress ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="bg-card rounded-2xl p-5 card-shadow border border-border/30"
            >
                <h3 className="text-sm font-bold text-primary mb-3">주간 목표 진행률</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{stats.weeklyCompleted}회 / {weeklyGoal}회 완료</span>
                    <span className="font-bold text-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>
            </motion.div>

            {/* ─── 근육군 균형 분석 ─── */}
            {stats.neglectedGroups.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">루틴 불균형 감지</p>
                            <p className="text-xs text-muted-foreground mt-0.5 break-keep">
                                최근 2주간 <span className="font-semibold text-amber-500">{stats.neglectedGroups.join(', ')}</span> 운동이 없었어요.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                        {MUSCLE_GROUPS.filter(g => g !== '전신').map(g => {
                            const count = stats.muscleGroupCount[g] || 0;
                            const isNeglected = count === 0;
                            return (
                                <div
                                    key={g}
                                    className={`rounded-lg px-2 py-1.5 text-center text-[11px] font-semibold border ${isNeglected
                                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                        : 'bg-primary/10 border-primary/20 text-primary'
                                        }`}
                                >
                                    {g}
                                    <div className="text-[10px] font-normal opacity-70">{count}회</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ─── Calendar ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
            >
                <DashboardCalendar workouts={workouts} onNavigateToHistory={onNavigateToHistory} />
            </motion.div>

            {/* ─── 주간 목표 수정 Sheet ─── */}
            <Sheet open={showGoalSheet} onOpenChange={setShowGoalSheet}>
                <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
                    <SheetHeader className="mb-6">
                        <SheetTitle>주간 운동 목표</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 px-1">
                        <div className="text-center">
                            <span className="text-5xl font-black text-primary">{tempGoal}</span>
                            <span className="text-xl text-muted-foreground ml-2">회 / 주</span>
                        </div>
                        <Slider
                            min={1}
                            max={14}
                            step={1}
                            value={[tempGoal]}
                            onValueChange={([v]) => setTempGoal(v)}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>1회</span>
                            <span>7회</span>
                            <span>14회</span>
                        </div>
                        <Button className="w-full h-12 text-base font-bold" onClick={handleSaveGoal}>
                            저장
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
