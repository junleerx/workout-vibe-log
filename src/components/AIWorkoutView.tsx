import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Zap, RotateCw, Save, Play, Loader2, History, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { ProgramExercise } from '@/types/program';
import { AIProgramGeneratorView } from './AIProgramGeneratorView';
import { AIChatView } from './AIChatView';
import { Workout } from '@/types/workout';

interface GeneratedProgram {
  name: string;
  description: string;
  workoutStyle?: 'classic' | 'amrap' | 'emom' | 'rft';
  timeLimit?: number;
  targetRounds?: number;
  exercises: Omit<ProgramExercise, 'id' | 'orderIndex'>[];
}

interface AIWorkoutViewProps {
  onSaveAsProgram: (
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[],
    note?: string | null
  ) => void;
  onSaveMultiplePrograms: (
    programs: {
      name: string;
      description: string;
      daysOfWeek: string[];
      exercises: Omit<ProgramExercise, 'id'>[];
      note?: string | null;
    }[]
  ) => void;
  onStartWorkout: (exercises: { exerciseName: string; muscleGroup: string; targetSets?: number; targetReps?: number; targetWeight?: number; targetDistance?: number; targetTime?: number }[]) => void;
  recentWorkouts?: Workout[];
}

const WORKOUT_TYPES = [
  { id: 'circuit', label: 'Hyrox', icon: RotateCw, desc: '기능성 서킷' },
  { id: 'hiit', label: 'CrossFit', icon: Zap, desc: '크로스핏(AMRAP/EMOM)' },
] as const;

const DIFFICULTIES = [
  { id: 'beginner', label: '초급' },
  { id: 'intermediate', label: '중급' },
  { id: 'advanced', label: '고급' },
] as const;

const DURATIONS = [
  { id: '20', label: '20분' },
  { id: '30', label: '30분' },
  { id: '45', label: '45분' },
  { id: '60', label: '60분' },
] as const;

const FOCUS_AREAS = [
  { id: '상체', label: '상체' },
  { id: '하체', label: '하체' },
  { id: '전신', label: '전신' },
  { id: '코어', label: '코어' },
] as const;

export function AIWorkoutView({ onSaveAsProgram, onSaveMultiplePrograms, onStartWorkout, recentWorkouts = [] }: AIWorkoutViewProps) {
  const { unit, toDisplay } = useWeightUnit();
  const [mode, setMode] = useState<'wod' | 'plan' | 'chat'>('wod');
  const [workoutType, setWorkoutType] = useState<string>('circuit');
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [duration, setDuration] = useState<string>('30');
  const [focusArea, setFocusArea] = useState<string>('전신');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedProgram | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(null);

    // 최근 운동 컨텍스트 요약 (최근 5개)
    const recentContext = recentWorkouts.slice(0, 5).map(w => ({
      date: w.date.slice(0, 10),
      exercises: w.exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        maxWeight: Math.max(...ex.sets.filter(s => s.weight > 0).map(s => s.weight), 0),
        totalSets: ex.sets.filter(s => s.completed).length,
      })),
    }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: { workoutType, difficulty, duration: parseInt(duration), focusAreas: [focusArea], recentHistory: recentContext },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGenerated(data as GeneratedProgram);
    } catch (e: any) {
      console.error('Generate error:', e);
      toast({
        title: '생성 실패',
        description: e.message || 'AI 운동 생성에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!generated) return;
    const exercises = generated.exercises.map((ex, i) => ({ ...ex, orderIndex: i }));
    onSaveAsProgram(
      generated.name,
      generated.description,
      [],
      generated.workoutStyle,
      generated.timeLimit,
      generated.targetRounds,
      exercises
    );
    toast({ title: '저장 완료', description: '프로그램으로 저장되었습니다.' });
  };

  const handleStart = () => {
    if (!generated) return;
    onStartWorkout(generated.exercises);
  };

  return (
    <div className="space-y-6 slide-up">
      {/* Mode toggle */}
      <div className="flex bg-secondary/50 p-1 rounded-2xl w-full max-w-sm mx-auto mb-6 slide-down">
        <button
          onClick={() => setMode('wod')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'wod' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          WOD
        </button>
        <button
          onClick={() => setMode('plan')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'plan' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          프로그램
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${mode === 'chat' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          채팅
        </button>
      </div>

      {mode === 'chat' ? (
        <AIChatView recentWorkouts={recentWorkouts} />
      ) : mode === 'plan' ? (
        <AIProgramGeneratorView
          onSavePrograms={onSaveMultiplePrograms}
          onCancel={() => setMode('wod')}
        />
      ) : (
        <>
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              AI 운동 추천
            </h2>
            <p className="text-sm text-muted-foreground break-keep">오늘 컨디션에 딱 맞는 크로스핏/하이록스 루틴을 만들어보세요</p>
            {recentWorkouts.length > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                <History className="w-3.5 h-3.5" />
                최근 {Math.min(recentWorkouts.length, 5)}회 운동 기록 반영
              </div>
            )}
          </div>

          {/* Workout Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">운동 타입</label>
            <div className="grid grid-cols-2 gap-3">
              {WORKOUT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setWorkoutType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${workoutType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                    }`}
                >
                  <type.icon className={`w-5 h-5 mb-2 ${workoutType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="font-semibold text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">난이도</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${difficulty === d.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">운동 시간</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${duration === d.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">집중 부위</label>
            <div className="flex gap-2">
              {FOCUS_AREAS.map(area => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setFocusArea(area.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${focusArea === area.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !focusArea}
            className="w-full h-12 rounded-xl text-base font-bold gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI가 프로그램을 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                프로그램 생성하기
              </>
            )}
          </Button>

          {/* Generated Result */}
          {generated && (
            <Card className="overflow-hidden border-primary/30 bg-card/80 backdrop-blur-sm slide-up">
              <CardContent className="p-0">
                <div className="p-4 bg-primary/5 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{generated.name}</h3>
                    {generated.workoutStyle === 'amrap' && <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">🔥 AMRAP {generated.timeLimit}분</Badge>}
                    {generated.workoutStyle === 'emom' && <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">⏰ EMOM {generated.timeLimit}분</Badge>}
                    {generated.workoutStyle === 'rft' && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-bold">🏆 {generated.targetRounds} Rounds</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{generated.description}</p>
                </div>
                <div className="p-4 space-y-2">
                  {generated.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-secondary/40">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="font-medium">{ex.exerciseName}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5">{ex.muscleGroup}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums text-right">
                        {ex.targetDistance ? (
                          <span className="text-primary/90 font-medium">{ex.targetDistance}m</span>
                        ) : null}
                        {ex.targetTime ? (
                          <span className="text-accent/90 font-medium ml-1">{ex.targetTime}초</span>
                        ) : null}
                        {(ex.targetDistance || ex.targetTime) && (ex.targetSets || ex.targetReps || ex.targetWeight > 0) ? ' / ' : ''}

                        {(ex.targetSets || 0) > 0 && (ex.targetReps || 0) > 0 && `${ex.targetSets}×${ex.targetReps}`}
                        {((ex.targetSets || 0) === 0 || (ex.targetReps || 0) === 0) && (ex.targetReps || 0) > 0 && `${ex.targetReps} reps`}

                        {ex.targetWeight > 0 && (
                          <span className="ml-1 text-primary/80">
                            {toDisplay(ex.targetWeight)}{unit}
                          </span>
                        )}
                        {ex.targetWeight === 0 && !ex.targetDistance && <span className="ml-1 text-muted-foreground/60">(Bodyweight)</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-xl gap-2" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    프로그램 저장
                  </Button>
                  <Button className="rounded-xl gap-2" onClick={handleStart}>
                    <Play className="w-4 h-4" />
                    바로 시작
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
