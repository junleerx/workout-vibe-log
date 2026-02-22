import { useMemo, useState } from 'react';
import { Workout, Exercise } from '@/types/workout';
import { Member } from '@/types/member';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface ProgressViewProps {
  workouts: Workout[];
  selectedMember: Member | null;
}

interface ExerciseProgressData {
  date: string;
  dateLabel: string;
  maxWeight: number;
  totalReps: number;
  totalVolume: number;
}

const chartConfig: ChartConfig = {
  maxWeight: {
    label: '최대 무게',
    color: 'hsl(var(--primary))',
  },
  totalReps: {
    label: '총 반복 횟수',
    color: 'hsl(var(--accent))',
  },
};

export function ProgressView({ workouts, selectedMember }: ProgressViewProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const { unit, toDisplay } = useWeightUnit();

  // Get unique exercises from all workouts
  const availableExercises = useMemo(() => {
    const exercises = new Map<string, string>();
    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        exercises.set(ex.name, ex.category);
      });
    });
    return Array.from(exercises.entries()).map(([name, category]) => ({ name, category }));
  }, [workouts]);

  // Set default selected exercise
  useMemo(() => {
    if (availableExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(availableExercises[0].name);
    }
  }, [availableExercises, selectedExercise]);

  // Get progress data for selected exercise
  const progressData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: ExerciseProgressData[] = [];

    workouts
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(workout => {
        const exercise = workout.exercises.find(ex => ex.name === selectedExercise);
        if (exercise) {
          const maxWeight = Math.max(...exercise.sets.map(s => s.weight), 0);
          const totalReps = exercise.sets.reduce((acc, s) => acc + s.reps, 0);
          const totalVolume = exercise.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

          data.push({
            date: workout.date,
            dateLabel: format(parseISO(workout.date), 'M/d'),
            maxWeight,
            totalReps,
            totalVolume,
          });
        }
      });

    return data;
  }, [workouts, selectedExercise]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (progressData.length < 2) {
      return {
        latestWeight: progressData[progressData.length - 1]?.maxWeight || 0,
        latestReps: progressData[progressData.length - 1]?.totalReps || 0,
        weightChange: 0,
        weightChangePercent: 0,
      };
    }

    const first = progressData[0];
    const last = progressData[progressData.length - 1];

    const weightChange = last.maxWeight - first.maxWeight;
    const weightChangePercent = first.maxWeight > 0
      ? ((weightChange / first.maxWeight) * 100)
      : 0;

    return {
      latestWeight: last.maxWeight,
      latestReps: last.totalReps,
      weightChange,
      weightChangePercent,
    };
  }, [progressData]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-primary" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">진행 상황 없음</h2>
          <p className="text-muted-foreground">
            {selectedMember?.name || '회원'}님의 운동 기록이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-4 card-shadow">
        <h3 className="text-lg font-bold mb-4">
          {selectedMember?.name || '회원'} 진행 상황
        </h3>

        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="운동 선택" />
          </SelectTrigger>
          <SelectContent>
            {availableExercises.map((ex) => (
              <SelectItem key={ex.name} value={ex.name}>
                {ex.name} ({ex.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {progressData.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-primary/80 mb-1 font-semibold">최근 무게</p>
                <p className="text-2xl font-bold text-primary">{toDisplay(stats.latestWeight)} {unit}</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-xs text-accent/80 mb-1 font-semibold">최근 반복 횟수</p>
                <p className="text-2xl font-bold text-accent">{stats.latestReps} 회</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 col-span-2">
                <p className="text-xs text-amber-500/80 mb-1 font-semibold">무게 변화</p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(stats.weightChange)}
                  <span className="text-2xl font-bold">
                    {stats.weightChange > 0 ? '+' : ''}{toDisplay(stats.weightChange)} {unit}
                  </span>
                  <span className={`text-sm ${stats.weightChangePercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    ({stats.weightChangePercent >= 0 ? '+' : ''}{stats.weightChangePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Weight Progress Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">무게 진행 그래프</h4>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dateLabel"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${toDisplay(value)}${unit}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          if (payload && payload[0]) {
                            return format(parseISO(payload[0].payload.date), 'yyyy년 M월 d일');
                          }
                          return '';
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="var(--color-maxWeight)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-maxWeight)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Reps Progress Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">반복 횟수 진행 그래프</h4>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="dateLabel"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}회`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          if (payload && payload[0]) {
                            return format(parseISO(payload[0].payload.date), 'yyyy년 M월 d일');
                          }
                          return '';
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="totalReps"
                    fill="var(--color-totalReps)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </>
        )}

        {progressData.length === 0 && selectedExercise && (
          <p className="text-center text-muted-foreground py-8">
            "{selectedExercise}" 운동 기록이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
