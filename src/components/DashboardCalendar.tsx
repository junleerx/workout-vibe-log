import { useState, useMemo } from 'react';
import { Workout } from '@/types/workout';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardCalendarProps {
    workouts: Workout[];
    onNavigateToHistory?: () => void;
}

export function DashboardCalendar({ workouts, onNavigateToHistory }: DashboardCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const onDateClick = (day: Date) => setSelectedDate(day);

    // Generate days for the grid
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const selectedDayWorkouts = useMemo(() => {
        return workouts.filter(w => isSameDay(parseISO(w.date), selectedDate));
    }, [workouts, selectedDate]);

    function formatDurationShort(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}H ${m}M`;
        return `${m} Mins`;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-primary">Choose Date</h3>
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold min-w-[80px] text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: ko })}
                    </span>
                    <button onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Weekday indicator pills */}
            <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                    <div key={day} className="h-7 flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-black tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl p-5 card-shadow border border-border/30"
            >
                <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                    {calendarDays.map((day, i) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const hasWorkout = workouts.some(w => isSameDay(parseISO(w.date), day));

                        return (
                            <div key={day.toString()} className="flex justify-center relative">
                                <button
                                    onClick={() => onDateClick(day)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110 z-10'
                                            : isCurrentMonth
                                                ? 'text-foreground hover:bg-secondary'
                                                : 'text-muted-foreground/30'
                                        }`}
                                >
                                    {format(day, 'd')}
                                </button>
                                {/* Dot indicator for workouts on unselected days */}
                                {!isSelected && hasWorkout && (
                                    <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Activities List */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-primary mb-4 px-1">Activities</h3>
                <AnimatePresence mode="popLayout">
                    {selectedDayWorkouts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card rounded-2xl p-8 text-center border border-border/30 card-shadow"
                        >
                            <p className="text-muted-foreground text-sm">해당 날짜에 기록된 활동이 없습니다.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {selectedDayWorkouts.map((workout, index) => {
                                const mainCategory = workout.exercises[0]?.category || '운동';
                                const totalVolume = workout.exercises.reduce(
                                    (acc, ex) => acc + ex.sets.reduce((setAcc, s) => setAcc + s.weight * s.reps, 0),
                                    0
                                );

                                return (
                                    <motion.div
                                        key={workout.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={onNavigateToHistory}
                                        className="bg-card rounded-3xl p-4 card-shadow border border-border/30 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/10 rounded-2xl" />
                                            <Dumbbell className="w-7 h-7 text-primary relative z-10" />
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-1">
                                                <Flame className="w-3 h-3 text-accent" />
                                                Volume {totalVolume.toLocaleString()} Kg
                                            </div>
                                            <h4 className="font-bold text-base text-foreground truncate">{mainCategory} 운동</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(parseISO(workout.date), 'MMMM dd - h:mm a', { locale: ko })}
                                            </p>
                                        </div>
                                        {workout.duration && (
                                            <div className="text-right flex-shrink-0 flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-bold text-primary/70 mb-0.5">Duration</span>
                                                <span className="text-sm font-bold text-primary">
                                                    {formatDurationShort(workout.duration)}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
