import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings, Play, ChevronLeft, ChevronRight, Dumbbell, History } from 'lucide-react';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { Workout } from '@/types/workout';
import { ProgramExercise } from '@/types/program';

const LIFTS = ['Squat', 'Bench', 'Deadlift', 'OHP'] as const;
type Lift = typeof LIFTS[number];

const LIFT_META: Record<Lift, { label: string; category: ProgramExercise['muscleGroup'] }> = {
  Squat: { label: '스쿼트', category: '하체' },
  Bench: { label: '벤치프레스', category: '가슴' },
  Deadlift: { label: '데드리프트', category: '하체' },
  OHP: { label: '오버헤드프레스', category: '어깨' },
};

const WEEK_CONFIG = {
  1: { label: 'Week 1', sub: '5s', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', sets: [{ pct: 0.65, reps: '5', amrap: false }, { pct: 0.75, reps: '5', amrap: false }, { pct: 0.85, reps: '5+', amrap: true }] },
  2: { label: 'Week 2', sub: '3s', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', sets: [{ pct: 0.70, reps: '3', amrap: false }, { pct: 0.80, reps: '3', amrap: false }, { pct: 0.90, reps: '3+', amrap: true }] },
  3: { label: 'Week 3', sub: '5/3/1+', color: 'bg-primary/10 text-primary border-primary/20', sets: [{ pct: 0.75, reps: '5', amrap: false }, { pct: 0.85, reps: '3', amrap: false }, { pct: 0.95, reps: '1+', amrap: true }] },
  4: { label: 'Week 4', sub: 'Deload', color: 'bg-muted text-muted-foreground border-border', sets: [{ pct: 0.40, reps: '5', amrap: false }, { pct: 0.50, reps: '5', amrap: false }, { pct: 0.60, reps: '5', amrap: false }] },
} as const;

interface Props {
  workouts: Workout[];
  onStartFromProgram: (exercises: ProgramExercise[]) => void;
}

function loadRms(): Record<Lift, number> {
  try { return { Squat: 0, Bench: 0, Deadlift: 0, OHP: 0, ...JSON.parse(localStorage.getItem('531_rms') || '{}') }; }
  catch { return { Squat: 0, Bench: 0, Deadlift: 0, OHP: 0 }; }
}

function loadWeek(): 1 | 2 | 3 | 4 {
  const v = parseInt(localStorage.getItem('531_week') || '1');
  return ([1, 2, 3, 4].includes(v) ? v : 1) as 1 | 2 | 3 | 4;
}

export function FiveThreeOneView({ workouts, onStartFromProgram }: Props) {
  const { unit } = useWeightUnit();
  const [rms, setRms] = useState<Record<Lift, number>>(loadRms);
  const [currentWeek, setCurrentWeek] = useState<1 | 2 | 3 | 4>(loadWeek);
  const [selectedLift, setSelectedLift] = useState<Lift>('Squat');
  const [draftRms, setDraftRms] = useState<Record<Lift, number>>(loadRms);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const round = (v: number) => unit === 'kg'
    ? Math.round(v * 2) / 2   // 0.5kg 단위
    : Math.round(v / 2.5) * 2.5; // 2.5lb 단위

  const tm = (lift: Lift) => Math.round(rms[lift] * 0.9);

  const weekCfg = WEEK_CONFIG[currentWeek];
  const liftTm = tm(selectedLift);
  const hasRms = LIFTS.some(l => rms[l] > 0);

  const prevWeek = () => {
    const w = ((currentWeek - 2 + 4) % 4 + 1) as 1 | 2 | 3 | 4;
    setCurrentWeek(w);
    localStorage.setItem('531_week', String(w));
  };

  const nextWeek = () => {
    const w = (currentWeek % 4 + 1) as 1 | 2 | 3 | 4;
    setCurrentWeek(w);
    localStorage.setItem('531_week', String(w));
  };

  const saveRms = () => {
    setRms({ ...draftRms });
    localStorage.setItem('531_rms', JSON.stringify(draftRms));
    setIsSettingOpen(false);
  };

  const handleStart = () => {
    if (liftTm === 0) return;
    const meta = LIFT_META[selectedLift];

    // 메인 세트: 각 세트를 별도 exercise로 → WorkoutView에서 무게별 구분 표시
    const mainExercises: ProgramExercise[] = weekCfg.sets.map((s, i) => ({
      id: `531-main-${i}`,
      exerciseName: `${meta.label} (${Math.round(s.pct * 100)}%${s.amrap ? ' AMRAP' : ''})`,
      muscleGroup: meta.category,
      orderIndex: i,
      targetSets: 1,
      targetReps: parseInt(s.reps),
      targetWeight: round(liftTm * s.pct),
      sets: [{
        setNumber: 1,
        targetReps: parseInt(s.reps),
        targetWeight: round(liftTm * s.pct),
        restTime: 180,
      }],
    }));

    // BBB: 5 × 10 @ 60% TM
    const bbbWeight = round(liftTm * 0.6);
    const bbbExercise: ProgramExercise = {
      id: '531-bbb',
      exerciseName: `${meta.label} BBB (60%)`,
      muscleGroup: meta.category,
      orderIndex: mainExercises.length,
      targetSets: 5,
      targetReps: 10,
      targetWeight: bbbWeight,
      sets: Array.from({ length: 5 }, (_, i) => ({
        setNumber: i + 1,
        targetReps: 10,
        targetWeight: bbbWeight,
        restTime: 90,
      })),
    };

    onStartFromProgram([...mainExercises, bbbExercise]);
  };

  // 5/3/1 히스토리: 운동명에 '%' 또는 'BBB' 포함된 세션
  const historyWorkouts = workouts
    .filter(w => w.exercises.some(e => e.name.includes('%') || e.name.includes('BBB')))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">5/3/1 BBB</h3>
          <p className="text-xs text-muted-foreground mt-0.5">점진적 과부하 파워리프팅 루틴</p>
        </div>
        <Sheet open={isSettingOpen} onOpenChange={setIsSettingOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-9 text-xs"
              onClick={() => setDraftRms({ ...rms })}>
              <Settings className="w-3.5 h-3.5" />
              1RM 설정
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-[28px] p-0 pb-safe">
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1" />
            <SheetHeader className="px-5 pt-3 pb-4 border-b border-border/10">
              <SheetTitle className="text-base font-bold">1RM 입력</SheetTitle>
              <p className="text-xs text-muted-foreground">실제 1RM을 입력하세요. TM(Training Max)은 자동으로 90%로 계산됩니다.</p>
            </SheetHeader>
            <div className="px-5 py-5 space-y-4">
              {LIFTS.map(lift => (
                <div key={lift} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-24 shrink-0">{LIFT_META[lift].label}</span>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draftRms[lift] || ''}
                      onChange={e => setDraftRms(prev => ({ ...prev, [lift]: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="pr-10 h-10 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
                  </div>
                  <div className="text-right w-20 shrink-0">
                    <div className="text-xs text-muted-foreground">TM</div>
                    <div className="text-sm font-bold text-primary">
                      {draftRms[lift] ? `${Math.round(draftRms[lift] * 0.9)}${unit}` : '–'}
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={saveRms} className="w-full mt-2 rounded-xl">저장</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 1RM 미입력 안내 */}
      {!hasRms && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="py-6 text-center space-y-2">
            <Dumbbell className="w-8 h-8 text-primary/40 mx-auto" />
            <p className="text-sm font-semibold text-primary/80">1RM을 먼저 입력하세요</p>
            <p className="text-xs text-muted-foreground">상단의 '1RM 설정' 버튼으로 4개 종목의 1RM을 입력하면 자동으로 주차별 무게가 계산됩니다.</p>
          </CardContent>
        </Card>
      )}

      {hasRms && (
        <>
          {/* 주차 선택 */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={prevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className={`flex-1 text-center px-4 py-2.5 rounded-2xl border ${weekCfg.color}`}>
              <div className="text-base font-bold">{weekCfg.label}</div>
              <div className="text-[11px] opacity-70">{weekCfg.sub}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 4주 미니 진행 표시 */}
          <div className="grid grid-cols-4 gap-1.5">
            {([1, 2, 3, 4] as const).map(w => (
              <button
                key={w}
                onClick={() => { setCurrentWeek(w); localStorage.setItem('531_week', String(w)); }}
                className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${currentWeek === w
                  ? WEEK_CONFIG[w].color + ' shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary/60'}`}
              >
                <div>{WEEK_CONFIG[w].label.replace('Week ', 'W')}</div>
                <div className="opacity-60 font-normal">{WEEK_CONFIG[w].sub}</div>
              </button>
            ))}
          </div>

          {/* 종목 선택 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">오늘 운동할 종목</p>
            <div className="grid grid-cols-2 gap-2">
              {LIFTS.map(lift => (
                <button
                  key={lift}
                  onClick={() => setSelectedLift(lift)}
                  className={`py-3 px-4 rounded-2xl border text-sm font-semibold text-left transition-all ${selectedLift === lift
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-secondary/40 text-foreground border-border/40 hover:bg-secondary/60'}`}
                >
                  <div>{LIFT_META[lift].label}</div>
                  <div className={`text-[10px] mt-0.5 font-normal ${selectedLift === lift ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    1RM {rms[lift]}{unit} · TM {tm(lift)}{unit}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 세트 구성 미리보기 */}
          {liftTm > 0 && (
            <Card className="border-border/30 overflow-hidden">
              <div className="px-4 py-3 bg-secondary/30 border-b border-border/20">
                <div className="text-xs font-bold text-muted-foreground">{LIFT_META[selectedLift].label} — {weekCfg.label} ({weekCfg.sub})</div>
              </div>
              <CardContent className="p-0">
                {/* 메인 세트 */}
                <div className="divide-y divide-border/10">
                  {weekCfg.sets.map((s, i) => (
                    <div key={i} className={`flex items-center px-4 py-3 ${s.amrap ? 'bg-primary/5' : ''}`}>
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold mr-3 shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <span className="text-sm font-bold">{round(liftTm * s.pct)}{unit}</span>
                        <span className="text-xs text-muted-foreground ml-2">{Math.round(s.pct * 100)}% TM</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${s.amrap ? 'border-primary/40 text-primary' : ''}`}>
                        {s.reps}회{s.amrap ? ' AMRAP' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* BBB */}
                {currentWeek !== 4 && (
                  <div className="border-t border-border/30 bg-secondary/20 px-4 py-3">
                    <div className="text-[10px] font-bold text-muted-foreground mb-2">BBB (Boring But Big)</div>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <span className="text-sm font-bold">{round(liftTm * 0.6)}{unit}</span>
                        <span className="text-xs text-muted-foreground ml-2">60% TM</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">5 × 10회</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 운동 시작 버튼 */}
          <Button
            className="w-full h-12 rounded-2xl text-sm font-bold gap-2 shadow-md"
            onClick={handleStart}
            disabled={liftTm === 0}
          >
            <Play className="w-4 h-4" />
            {LIFT_META[selectedLift].label} 운동 시작
          </Button>

          {/* 히스토리 */}
          {historyWorkouts.length > 0 && (
            <div>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3"
                onClick={() => setShowHistory(v => !v)}
              >
                <History className="w-3.5 h-3.5" />
                최근 5/3/1 기록 ({historyWorkouts.length})
                <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {historyWorkouts.map(w => (
                    <Card key={w.id} className="border-border/30">
                      <CardContent className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold">{new Date(w.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                          <span className="text-[10px] text-muted-foreground">{w.exercises.length}개 운동</span>
                        </div>
                        <div className="space-y-1">
                          {w.exercises.slice(0, 4).map(ex => (
                            <div key={ex.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground truncate mr-2">{ex.name}</span>
                              <span className="font-semibold shrink-0">
                                {ex.sets.filter(s => s.completed).length}/{ex.sets.length} 세트
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
