import { useMemo, useState, useCallback } from 'react';
import { Workout } from '@/types/workout';
import { Member } from '@/types/member';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { Dumbbell, Clock, Flame, Target, Timer, ChevronRight, Pencil } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays, isSameDay, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DashboardCalendar } from './DashboardCalendar';

interface DashboardViewProps {
    workouts: Workout[];
    selectedMember: Member | null;
    onNavigateToHistory?: () => void;
}

// ────────────────────────────── helpers ──────────────────────────────

function formatDurationShort(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
}

// ────────────────────────────── component ──────────────────────────────

export function DashboardView({ workouts, selectedMember, onNavigateToHistory }: DashboardViewProps) {
    const { unit, toDisplay } = useWeightUnit();

    // ─── user-configurable weekly goal ───
    const [weeklyGoal, setWeeklyGoal] = useState(() => {
        const saved = localStorage.getItem('weeklyGoal');
        return saved ? parseInt(saved) : 5;
    });

    const handleEditGoal = useCallback(() => {
        const input = window.prompt('주간 운동 목표 횟수를 입력하세요:', String(weeklyGoal));
        if (input !== null) {
            const val = parseInt(input);
            if (!isNaN(val) && val > 0 && val <= 14) {
                setWeeklyGoal(val);
                localStorage.setItem('weeklyGoal', String(val));
            }
        }
    }, [weeklyGoal]);

    // ─── derived stats ───
    const stats = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const thisWeekWorkouts = workouts.filter(w => {
            const d = parseISO(w.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });

        // weekly active minutes
        const weeklyMinutes = thisWeekWorkouts.reduce((acc, w) => acc + (w.duration ? Math.floor(w.duration / 60) : 0), 0);

        // streak calculation
        let streak = 0;
        const sortedDates = [...new Set(workouts.map(w => w.date.slice(0, 10)))].sort().reverse();
        if (sortedDates.length > 0) {
            // check if today or yesterday has a workout to start streak
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

        // total workouts all-time
        const totalWorkouts = workouts.length;

        // this week daily activity (minutes per day Mon-Sun)
        const dailyActivity: number[] = Array(7).fill(0);
        thisWeekWorkouts.forEach(w => {
            const dayIdx = (parseISO(w.date).getDay() + 6) % 7; // Mon=0
            dailyActivity[dayIdx] += w.duration ? Math.floor(w.duration / 60) : 0;
        });

        // recent workouts (last 5)
        const recent = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

        // week-over-week percentage change
        const prevWeekStart = subDays(weekStart, 7);
        const prevWeekEnd = subDays(weekStart, 1);
        const prevWeekWorkouts = workouts.filter(w => {
            const d = parseISO(w.date);
            return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
        });
        const streakChange = thisWeekWorkouts.length - prevWeekWorkouts.length;

        return {
            totalWorkouts,
            weeklyMinutes,
            streak,
            weeklyCompleted: thisWeekWorkouts.length,
            dailyActivity,
            recent,
            streakChange,
        };
    }, [workouts]);

    const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
    const maxActivity = Math.max(...stats.dailyActivity, 1);
    const progressPercent = Math.min((stats.weeklyCompleted / weeklyGoal) * 100, 100);

    // ─── stat card data ───
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
            color: 'from-brand-red/80 to-brand-red',
        },
        {
            label: '연속 기록',
            value: `${stats.streak}일`,
            sub: stats.streakChange > 0 ? `↑ ${stats.streakChange}` : stats.streakChange < 0 ? `↓ ${Math.abs(stats.streakChange)}` : '—',
            icon: Flame,
            color: 'from-brand-green/80 to-brand-green',
        },
        {
            label: '주간 목표',
            value: `${stats.weeklyCompleted}/${weeklyGoal}`,
            sub: '이번 주 · 탭하여 수정',
            icon: Target,
            color: 'from-brand-blue/80 to-brand-blue',
            onClick: handleEditGoal,
        },
    ];

    // ─── render ───
    return (
        <div className="space-y-6 pb-4">
            {/* ─── greeting ─── */}
            <div>
                <h2 className="text-2xl font-bold">
                    {selectedMember?.name || '회원'}님, 안녕하세요! 👋
                </h2>
                <p className="text-muted-foreground text-sm mt-1">오늘도 좋은 운동 되세요</p>
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
                        {/* bg icon */}
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

            {/* ─── Calendar & Activities (User Reference Design) ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
            >
                <DashboardCalendar workouts={workouts} onNavigateToHistory={onNavigateToHistory} />
            </motion.div>
        </div>
    );
}
