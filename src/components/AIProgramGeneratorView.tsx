import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Save, Sparkles, Loader2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProgramExercise } from '@/types/program';
import { Badge } from '@/components/ui/badge';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

interface AIProgramGeneratorProps {
    onSavePrograms: (
        programs: {
            name: string;
            description: string;
            daysOfWeek: string[];
            exercises: Omit<ProgramExercise, 'id'>[];
            note?: string;
        }[]
    ) => void;
    onCancel: () => void;
}

const WEEKS_OPTIONS = [4, 8, 12];
const DAYS_PER_WEEK_OPTIONS = [3, 4, 5, 6];
const GOALS = ['근력 강화 (Strength)', '근비대 (Muscle Building)', '체지방 감량 (Fat Loss)', '기능성/크로스핏 (Functional/CrossFit)', '5/3/1 BBB (파워빌딩)'];
const LEVELS = ['초급', '중급', '고급'];

export function AIProgramGeneratorView({ onSavePrograms, onCancel }: AIProgramGeneratorProps) {
    const [weeks, setWeeks] = useState<number>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
    const [goal, setGoal] = useState<string>('근비대 (Muscle Building)');
    const [level, setLevel] = useState<string>('중급');
    const [loading, setLoading] = useState(false);
    const [generatedPrograms, setGeneratedPrograms] = useState<any[] | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // 5/3/1 Specific State
    const [oneRMs, setOneRMs] = useState({
        squat: '',
        bench: '',
        deadlift: '',
        ohp: ''
    });

    const { toast } = useToast();
    const { unit } = useWeightUnit();

    const handleSave = () => {
        if (!generatedPrograms || selectedIndices.length === 0) {
            toast({
                title: '선택된 프로그램이 없습니다.',
                description: '저장할 프로그램을 하나 이상 선택해주세요.',
                variant: 'destructive',
            });
            return;
        }

        const programsToSave = generatedPrograms.filter((_, idx) => selectedIndices.includes(idx));
        onSavePrograms(programsToSave);
        toast({
            title: '프로그램 저장 완료!',
            description: `선택하신 ${programsToSave.length}개의 프로그램이 내 루틴에 추가되었습니다.`,
        });
        onCancel();
    };

    const toggleSelection = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-macrocycle', {
                body: {
                    weeks,
                    daysPerWeek,
                    goal,
                    level,
                    unit,
                    oneRMs: goal.includes('5/3/1') ? oneRMs : null
                },
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
                    note: goal.includes('5/3/1') ? `531|S${oneRMs.squat}|B${oneRMs.bench}|D${oneRMs.deadlift}|O${oneRMs.ohp}` : undefined,
                };
            });

            setGeneratedPrograms(programsToSave);
            setSelectedIndices(programsToSave.map((_, i: number) => i));
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

    return (
        <div className="space-y-6 slide-up">
            <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    AI 장기 프로그램 생성
                </h2>
                <p className="text-sm text-muted-foreground break-keep">목표에 맞는 다주간(Multi-week) 훈련 계획을 AI가 자동으로 설계합니다.</p>
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

                {/* 1RM Inputs for 5/3/1 */}
                {goal.includes('5/3/1') && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-primary">나의 1RM 설정 (현재 {unit})</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold opacity-70">스쿼트 (Squat)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={oneRMs.squat}
                                    onChange={(e) => setOneRMs(prev => ({ ...prev, squat: e.target.value }))}
                                    className="bg-background/50 h-10 rounded-lg text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold opacity-70">벤치 프레스 (Bench)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={oneRMs.bench}
                                    onChange={(e) => setOneRMs(prev => ({ ...prev, bench: e.target.value }))}
                                    className="bg-background/50 h-10 rounded-lg text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold opacity-70">데드리프트 (Deadlift)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={oneRMs.deadlift}
                                    onChange={(e) => setOneRMs(prev => ({ ...prev, deadlift: e.target.value }))}
                                    className="bg-background/50 h-10 rounded-lg text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold opacity-70">밀리터리 프레스 (OHP)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={oneRMs.ohp}
                                    onChange={(e) => setOneRMs(prev => ({ ...prev, ohp: e.target.value }))}
                                    className="bg-background/50 h-10 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                            * 입력하신 1RM의 90%를 훈련 최대중량(Training Max)으로 설정하여 점진적 보조 운동과 본 운동 무게가 자동 계산됩니다.
                        </p>

                        {/* 4-Week Preview Table */}
                        {(oneRMs.squat || oneRMs.bench || oneRMs.deadlift || oneRMs.ohp) && (
                            <div className="mt-4 border rounded-xl overflow-hidden bg-background/40">
                                <div className="p-2.5 bg-secondary/30 border-b">
                                    <h4 className="text-[11px] font-bold text-foreground">4주간의 5/3/1 본운동 설계 가이드 ({unit})</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="hover:bg-transparent border-b-muted-foreground/10">
                                                <TableHead className="h-8 text-[10px] py-1">종목 / TM</TableHead>
                                                <TableHead className="h-8 text-[10px] py-1 text-center font-bold text-primary">
                                                    <div>Week 1</div>
                                                    <div className="text-[9px] font-normal opacity-60">5s</div>
                                                </TableHead>
                                                <TableHead className="h-8 text-[10px] py-1 text-center">
                                                    <div>Week 2</div>
                                                    <div className="text-[9px] font-normal opacity-60">3s</div>
                                                </TableHead>
                                                <TableHead className="h-8 text-[10px] py-1 text-center">
                                                    <div>Week 3</div>
                                                    <div className="text-[9px] font-normal opacity-60">5/3/1+</div>
                                                </TableHead>
                                                <TableHead className="h-8 text-[10px] py-1 text-center text-muted-foreground/60">
                                                    <div>Week 4</div>
                                                    <div className="text-[9px] font-normal opacity-60">Deload</div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { label: 'Squat', val: Number(oneRMs.squat) || 0 },
                                                { label: 'Bench', val: Number(oneRMs.bench) || 0 },
                                                { label: 'Deadlift', val: Number(oneRMs.deadlift) || 0 },
                                                { label: 'OHP', val: Number(oneRMs.ohp) || 0 },
                                            ].map((lift) => {
                                                const tm = Math.round(lift.val * 0.9);
                                                const round = (v: number) => Math.round(v / 2.5) * 2.5;
                                                return (
                                                    <TableRow key={lift.label} className="hover:bg-transparent border-b-muted-foreground/10">
                                                        <TableCell className="py-2 text-[10px]">
                                                            <span className="font-bold">{lift.label}</span>
                                                            <div className="text-[9px] opacity-60">TM: {tm > 0 ? tm : '–'}</div>
                                                        </TableCell>
                                                        <TableCell className="py-2 text-[10px] text-center bg-primary/5 align-top">
                                                            {tm > 0 ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[9px] opacity-50">65%</div>
                                                                    <div>{round(tm * 0.65)}</div>
                                                                    <div className="text-[9px] opacity-50">75%</div>
                                                                    <div>{round(tm * 0.75)}</div>
                                                                    <div className="text-[9px] opacity-50">85%</div>
                                                                    <div className="font-bold text-primary">{round(tm * 0.85)}</div>
                                                                </div>
                                                            ) : '–'}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-[10px] text-center align-top">
                                                            {tm > 0 ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[9px] opacity-50">70%</div>
                                                                    <div>{round(tm * 0.7)}</div>
                                                                    <div className="text-[9px] opacity-50">80%</div>
                                                                    <div>{round(tm * 0.8)}</div>
                                                                    <div className="text-[9px] opacity-50">90%</div>
                                                                    <div className="font-bold">{round(tm * 0.9)}</div>
                                                                </div>
                                                            ) : '–'}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-[10px] text-center align-top">
                                                            {tm > 0 ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[9px] opacity-50">75%</div>
                                                                    <div>{round(tm * 0.75)}</div>
                                                                    <div className="text-[9px] opacity-50">85%</div>
                                                                    <div>{round(tm * 0.85)}</div>
                                                                    <div className="text-[9px] opacity-50">95%+</div>
                                                                    <div className="font-bold">{round(tm * 0.95)}</div>
                                                                </div>
                                                            ) : '–'}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-[10px] text-center opacity-50 align-top">
                                                            {tm > 0 ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="text-[9px] opacity-50">40%</div>
                                                                    <div>{round(tm * 0.4)}</div>
                                                                    <div className="text-[9px] opacity-50">50%</div>
                                                                    <div>{round(tm * 0.5)}</div>
                                                                    <div className="text-[9px] opacity-50">60%</div>
                                                                    <div>{round(tm * 0.6)}</div>
                                                                </div>
                                                            ) : '–'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-2 bg-muted/20">
                                    <p className="text-[9px] text-muted-foreground/70 leading-tight">
                                        * Week 1~3은 메인 세트의 가이드 중량이며, BBB 보조세트는 {unit === 'kg' ? 'TM의 50~60% 선' : 'TM의 50-60%'}에서 고정 수행합니다. Week 4는 디로딩주간입니다.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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

                {/* Generated Preview */}
                {generatedPrograms && (
                    <div className="space-y-4 pt-4 slide-down mt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                생성된 프로그램 미리보기
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium bg-secondary/80 px-2 py-1 rounded-md">
                                {selectedIndices.length} / {generatedPrograms.length} 선택됨
                            </span>
                        </div>
                        {generatedPrograms.map((prog, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                                <Card
                                    key={idx}
                                    className={`overflow-hidden border transition-all cursor-pointer ${isSelected ? 'border-primary ring-1 ring-primary/50 bg-primary/5' : 'border-border/50 bg-card/50 opacity-70'} backdrop-blur-sm`}
                                    onClick={() => toggleSelection(idx)}
                                >
                                    <CardContent className="p-0">
                                        <div className={`p-3 border-b flex items-center gap-3 ${isSelected ? 'bg-primary/10 border-primary/20' : 'bg-secondary/30 border-border/30'}`}>
                                            <button type="button" className={`w-5 h-5 flex items-center justify-center rounded-md border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground bg-background text-transparent'}`}>
                                                {isSelected && <CheckSquare className="w-4 h-4" />}
                                                {!isSelected && <Square className="w-4 h-4 opacity-0" />}
                                            </button>
                                            <div className="flex items-center gap-2 flex-1">
                                                <h4 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{prog.name}</h4>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {prog.exercises.map((ex: any, i: number) => (
                                                <div key={i} className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg ${isSelected ? 'bg-background/80 shadow-sm' : 'bg-secondary/20'}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isSelected ? 'bg-primary/20 text-primary' : 'bg-border text-muted-foreground'}`}>{i + 1}</span>
                                                        <span className={`font-medium truncate max-w-[120px] sm:max-w-[160px] ${!isSelected && 'text-muted-foreground'}`}>{ex.exerciseName}</span>
                                                    </div>
                                                    <span className={`tabular-nums text-right whitespace-nowrap ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                                                        {(ex.targetSets || 0) > 0 && (ex.targetReps || 0) > 0 && `${ex.targetSets}×${ex.targetReps}`}
                                                        {ex.targetWeight > 0 && ` @ ${ex.targetWeight}`}
                                                        {ex.targetWeight === 0 && ' @ BW'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Button
                            className="w-full h-12 rounded-xl mt-4 gap-2 text-base shadow-md transition-all"
                            onClick={handleSave}
                            disabled={selectedIndices.length === 0}
                            variant={selectedIndices.length === 0 ? "secondary" : "default"}
                        >
                            <Save className="w-5 h-5" />
                            {selectedIndices.length > 0 ? `선택한 ${selectedIndices.length}개 프로그램 저장` : '프로그램을 선택해주세요'}
                        </Button>
                    </div>
                )}

                <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground mt-2">
                    취소
                </Button>
            </div>
        </div >
    );
}
