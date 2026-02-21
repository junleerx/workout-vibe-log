import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Save, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProgramExercise } from '@/types/program';

interface AIProgramGeneratorProps {
    onSavePrograms: (
        programs: {
            name: string;
            description: string;
            daysOfWeek: string[];
            exercises: Omit<ProgramExercise, 'id'>[];
        }[]
    ) => void;
    onCancel: () => void;
}

const WEEKS_OPTIONS = [4, 8, 12];
const DAYS_PER_WEEK_OPTIONS = [3, 4, 5, 6];
const GOALS = ['근력 강화 (Strength)', '근비대 (Muscle Building)', '체지방 감량 (Fat Loss)', '기능성/크로스핏 (Functional/CrossFit)'];
const LEVELS = ['초급', '중급', '고급'];

export function AIProgramGeneratorView({ onSavePrograms, onCancel }: AIProgramGeneratorProps) {
    const [weeks, setWeeks] = useState<number>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
    const [goal, setGoal] = useState<string>('근비대 (Muscle Building)');
    const [level, setLevel] = useState<string>('중급');
    const [focusAreas, setFocusAreas] = useState<string[]>(['전신']);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-macrocycle', {
                body: { weeks, daysPerWeek, goal, level, focusAreas },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // Convert generated JSON to program format
            const plan = data;
            const programsToSave = plan.workouts.map((day: any) => {
                const exercises = day.exercises.map((ex: any, i: number) => ({
                    ...ex,
                    orderIndex: i,
                }));

                return {
                    name: `[${weeks}주 완성] ${day.name}`,
                    description: `${plan.planDescription}\n\n[이번 주 목표]\n${day.description}\n\n[점진적 과부하 가이드]\n${plan.progressionGuide}`,
                    daysOfWeek: day.daysOfWeek,
                    exercises,
                };
            });

            onSavePrograms(programsToSave);
            toast({
                title: '프로그램 생성 완료!',
                description: `${weeks}주 분량의 프로그램이 저장되었습니다. 프로그램을 확인해주세요.`,
            });
            onCancel();
        } catch (e: any) {
            console.error('Generate error:', e);
            toast({
                title: '생성 실패',
                description: e.message || 'AI 장기 프로그램 생성에 실패했습니다.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleFocus = (area: string) => {
        setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
    };

    return (
        <div className="space-y-6 slide-up">
            <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    AI 장기 프로그램 생성
                </h2>
                <p className="text-sm text-muted-foreground">목표에 맞는 다주간(Multi-week) 훈련 계획을 AI가 자동으로 설계합니다.</p>
            </div>

            <div className="space-y-6">
                {/* Weeks & Days */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90">기간 (주)</h3>
                        <div className="flex flex-wrap gap-2">
                            {WEEKS_OPTIONS.map((w) => (
                                <button
                                    key={w}
                                    onClick={() => setWeeks(w)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${weeks === w ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                                        }`}
                                >
                                    {w}주
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90">주당 운동 일수</h3>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_PER_WEEK_OPTIONS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDaysPerWeek(d)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${daysPerWeek === d ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                                        }`}
                                >
                                    주 {d}회
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Goal */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/90">운동 목적</h3>
                    <div className="flex flex-wrap gap-2">
                        {GOALS.map((g) => (
                            <button
                                key={g}
                                onClick={() => setGoal(g)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all w-full text-left ${goal === g ? 'bg-primary/10 border-2 border-primary text-primary' : 'bg-secondary/30 border-2 border-transparent text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Level */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/90">운동 난이도</h3>
                    <div className="flex flex-wrap gap-2">
                        {LEVELS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLevel(l)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 ${level === l ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Focus Areas */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/90">집중 부위</h3>
                    <div className="flex flex-wrap gap-2">
                        {['상체', '하체', '전신', '코어', '유산소/컨디셔닝'].map((area) => (
                            <button
                                key={area}
                                onClick={() => toggleFocus(area)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${focusAreas.includes(area) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full h-14 text-base font-bold shadow-lg shadow-primary/25 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 slide-up group relative overflow-hidden"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI가 완벽한 한 주 루틴을 설계 중입니다...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {weeks}주 매크로사이클 생성하기
                        </div>
                    )}
                    {loading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                </Button>
                <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
                    취소
                </Button>
            </div>
        </div>
    );
}
