import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exerciseTemplates } from '@/data/exercises';
import { ProgramExercise } from '@/types/program';
import { ExerciseCategory } from '@/types/workout';

interface ExerciseInput {
  id: string;
  name: string;
  category: string;
  maxWeight: number;
}

interface WeeklyExercise {
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  rpe?: number;
  note?: string;
}

interface WeekPlan {
  week: number;
  label: string;
  isDeload: boolean;
  exercises: WeeklyExercise[];
}

interface OverloadProgram {
  name: string;
  description: string;
  weeklyPlans: WeekPlan[];
}

const GOALS = [
  { id: 'strength', label: '근력', desc: '저횟수 고중량' },
  { id: 'hypertrophy', label: '근비대', desc: '중횟수 중중량' },
  { id: 'endurance', label: '근지구력', desc: '고횟수 저중량' },
] as const;

const WEEKS_OPTIONS = [
  { id: '4', label: '4주' },
  { id: '6', label: '6주' },
  { id: '8', label: '8주' },
  { id: '12', label: '12주' },
] as const;

interface ProgressiveOverloadViewProps {
  onSaveAsProgram: (name: string, description: string, daysOfWeek: string[], exercises: Omit<ProgramExercise, 'id'>[]) => void;
}

export function ProgressiveOverloadView({ onSaveAsProgram }: ProgressiveOverloadViewProps) {
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [goal, setGoal] = useState<string>('hypertrophy');
  const [weeks, setWeeks] = useState<string>('8');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<OverloadProgram | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const addExercise = (name: string, category: string) => {
    if (exercises.find(e => e.name === name)) return;
    setExercises(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      category,
      maxWeight: 0,
    }]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const updateMaxWeight = (id: string, weight: number) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, maxWeight: weight } : e));
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleGenerate = async () => {
    if (exercises.length === 0) {
      toast({ title: '운동을 추가해주세요', variant: 'destructive' });
      return;
    }
    if (exercises.some(e => e.maxWeight <= 0)) {
      toast({ title: '모든 운동의 맥스 무게를 입력해주세요', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setGenerated(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-overload', {
        body: { exercises, weeks: parseInt(weeks), goal },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGenerated(data as OverloadProgram);
      setExpandedWeek(0);
    } catch (e: any) {
      console.error('Generate error:', e);
      toast({
        title: '생성 실패',
        description: e.message || '프로그램 생성에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeek = (weekPlan: WeekPlan) => {
    const programExercises = weekPlan.exercises.map((ex, i) => ({
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      targetSets: ex.sets,
      targetReps: ex.reps,
      targetWeight: ex.weight,
      orderIndex: i,
    }));
    onSaveAsProgram(
      `${generated?.name} - ${weekPlan.label}`,
      generated?.description || '',
      [],
      programExercises
    );
    toast({ title: '저장 완료', description: `${weekPlan.label} 프로그램이 저장되었습니다.` });
  };

  const filteredTemplates = exerciseTemplates.filter(t =>
    t.name.includes(searchQuery) || t.category.includes(searchQuery)
  );

  const groupedTemplates = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof exerciseTemplates>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          점진적 과부하
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          현재 맥스를 입력하면 과학적 근거 기반으로 주차별 증량 프로그램을 설계합니다
        </p>
      </div>

      {/* Exercise Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground">운동 & 현재 1RM (kg)</label>
        {exercises.map(ex => (
          <div key={ex.id} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-secondary/40">
              <Badge variant="outline" className="text-[10px] shrink-0">{ex.category}</Badge>
              <span className="text-sm font-medium truncate">{ex.name}</span>
            </div>
            <Input
              type="number"
              placeholder="kg"
              value={ex.maxWeight || ''}
              onChange={(e) => updateMaxWeight(ex.id, Number(e.target.value))}
              className="w-20 text-center rounded-xl"
            />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeExercise(ex.id)}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        ))}

        {showExercisePicker ? (
          <Card className="border-primary/30">
            <CardContent className="p-3 space-y-2">
              <Input
                placeholder="운동 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-2">
                {Object.entries(groupedTemplates).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{category}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(item => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => addExercise(item.name, item.category)}
                          disabled={!!exercises.find(e => e.name === item.name)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 transition-colors disabled:opacity-30"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowExercisePicker(false)}>
                닫기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => setShowExercisePicker(true)}>
            <Plus className="w-4 h-4" /> 운동 추가
          </Button>
        )}
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">훈련 목표</label>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGoal(g.id)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                goal === g.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="font-semibold text-sm">{g.label}</div>
              <div className="text-[10px] text-muted-foreground">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">프로그램 기간</label>
        <div className="flex gap-2">
          {WEEKS_OPTIONS.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeeks(w.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                weeks === w.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={loading || exercises.length === 0}
        className="w-full h-12 rounded-xl text-base font-bold gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AI가 프로그램을 설계 중...
          </>
        ) : (
          <>
            <TrendingUp className="w-5 h-5" />
            점진적 과부하 프로그램 생성
          </>
        )}
      </Button>

      {/* Result */}
      {generated && (
        <div className="space-y-3 slide-up">
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="font-bold text-base">{generated.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{generated.description}</p>
            </CardContent>
          </Card>

          {generated.weeklyPlans.map((wp, idx) => (
            <Card
              key={wp.week}
              className={`overflow-hidden transition-all ${wp.isDeload ? 'border-yellow-500/30' : 'border-border'}`}
            >
              <button
                type="button"
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setExpandedWeek(expandedWeek === idx ? null : idx)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{wp.label}</span>
                  {wp.isDeload && (
                    <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      디로드
                    </Badge>
                  )}
                </div>
                {expandedWeek === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedWeek === idx && (
                <CardContent className="p-4 pt-0 space-y-2">
                  {wp.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-secondary/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium truncate">{ex.exerciseName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {ex.sets}×{ex.reps}
                        </span>
                        <span className="text-xs tabular-nums text-primary font-semibold">
                          {ex.weight}kg
                        </span>
                        {ex.rpe && (
                          <Badge variant="outline" className="text-[9px] px-1">
                            RPE {ex.rpe}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {wp.exercises.some(e => e.note) && (
                    <div className="mt-2 space-y-1">
                      {wp.exercises.filter(e => e.note).map((ex, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">
                          💡 {ex.exerciseName}: {ex.note}
                        </p>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl gap-2 mt-2"
                    onClick={() => handleSaveWeek(wp)}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {wp.label} 프로그램으로 저장
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
