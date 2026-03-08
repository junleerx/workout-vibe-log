import { useState, useMemo } from 'react';
import { Workout, WorkoutSet } from '@/types/workout';
import { categoryColors } from '@/data/exercises';
import { Calendar, Trash2, Dumbbell, Timer, ChevronDown, ChevronUp, Search, MapPin, Clock, Pencil, Check, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useWeightUnit } from '@/hooks/useWeightUnit';

type DateFilter = 'all' | 'this-week' | 'this-month' | 'last-month';

interface HistoryViewProps {
  workouts: Workout[];
  onDeleteWorkout: (workoutId: string) => void;
  onUpdateSavedSet?: (setId: string, updates: { weight?: number; reps?: number }) => Promise<void>;
  onSaveAsProgram?: (workout: Workout, name: string) => Promise<void>;
  onAddManualWorkout?: (workout: Workout) => Promise<boolean>;
}

// UTC 날짜 문자열을 안전하게 로컬 날짜로 변환하는 함수
const getLocalDate = (isoString: string) => {
  const parts = isoString.split('T')[0].split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export function HistoryView({ workouts, onDeleteWorkout, onUpdateSavedSet, onSaveAsProgram, onAddManualWorkout }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualExercises, setManualExercises] = useState<{ name: string, sets: { weight: number, reps: number }[] }[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const { unit, toDisplay, toKg } = useWeightUnit();

  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editReps, setEditReps] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    const now = new Date();
    return workouts.filter((w) => {
      // 텍스트 검색
      if (search && !w.exercises.some((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))) return false;
      // 날짜 필터
      if (dateFilter === 'all') return true;
      const d = parseISO(w.date);
      if (dateFilter === 'this-week') return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
      if (dateFilter === 'this-month') return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
      if (dateFilter === 'last-month') {
        const lm = subMonths(now, 1);
        return isWithinInterval(d, { start: startOfMonth(lm), end: endOfMonth(lm) });
      }
      return true;
    });
  }, [workouts, search, dateFilter]);

  const DATE_FILTER_LABELS: { id: DateFilter; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'this-week', label: '이번 주' },
    { id: 'this-month', label: '이번 달' },
    { id: 'last-month', label: '지난 달' },
  ];

  const startEditing = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setEditWeight(toDisplay(set.weight));
    setEditReps(set.reps);
  };

  const cancelEditing = () => {
    setEditingSetId(null);
    setEditWeight(0);
    setEditReps(0);
  };

  const saveEditing = async (setId: string) => {
    if (!onUpdateSavedSet) return;
    const newWeight = toKg(editWeight || 0);
    const newReps = editReps || 0;
    await onUpdateSavedSet(setId, { weight: newWeight, reps: newReps });
    setEditingSetId(null);
  };

  const handleSaveProgram = (workout: Workout) => {
    if (!onSaveAsProgram) return;
    const name = window.prompt('이 운동 기록을 어떤 이름의 프로그램으로 저장할까요?', '새 프로그램');
    if (name) {
      onSaveAsProgram(workout, name);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Search & Manual Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="운동 이름으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl glass border-border/30 focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
        <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2 shrink-0 h-10 px-3 rounded-xl font-semibold">
              <Plus className="w-4 h-4" />
              기록 직접 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>운동 기록 직접 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">운동한 날짜를 선택해주세요</label>
                <Input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">운동 종목 및 세트</label>
                {manualExercises.map((ex, exIdx) => (
                  <div key={exIdx} className="p-3 border border-border/40 rounded-xl space-y-3 bg-secondary/10">
                    <div className="flex items-center justify-between gap-2">
                      <Input placeholder="운동 이름 (예: 벤치프레스)" value={ex.name} onChange={e => {
                        const newEx = [...manualExercises];
                        newEx[exIdx].name = e.target.value;
                        setManualExercises(newEx);
                      }} className="h-9 flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => setManualExercises(manualExercises.filter((_, i) => i !== exIdx))} className="h-9 text-destructive whitespace-nowrap">삭제</Button>
                    </div>
                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-2 justify-between px-1">
                          <span className="text-[11px] text-muted-foreground w-6 font-medium bg-foreground/5 rounded px-1 min-w-[34px] text-center">{setIdx + 1}세트</span>
                          <div className="flex items-center gap-1">
                            <NumberInput value={set.weight} onChange={val => {
                              const newEx = [...manualExercises];
                              newEx[exIdx].sets[setIdx].weight = val;
                              setManualExercises(newEx);
                            }} min={0} className="w-[60px] h-8 text-xs text-center border-border/50 bg-background/50" />
                            <span className="text-[11px] font-medium text-muted-foreground">kg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <NumberInput value={set.reps} onChange={val => {
                              const newEx = [...manualExercises];
                              newEx[exIdx].sets[setIdx].reps = val;
                              setManualExercises(newEx);
                            }} min={0} className="w-[50px] h-8 text-xs text-center border-border/50 bg-background/50" />
                            <span className="text-[11px] font-medium text-muted-foreground">회</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const newEx = [...manualExercises];
                            newEx[exIdx].sets = newEx[exIdx].sets.filter((_, i) => i !== setIdx);
                            setManualExercises(newEx);
                          }} className="text-muted-foreground w-8 h-8 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        const newEx = [...manualExercises];
                        const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { weight: 0, reps: 0 };
                        newEx[exIdx].sets.push({ weight: lastSet.weight, reps: lastSet.reps });
                        setManualExercises(newEx);
                      }} className="w-full h-8 text-xs border-dashed gap-1 mt-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                        <Plus className="w-3 h-3" /> 세트 연달아 추가
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={() => {
                  setManualExercises([...manualExercises, { name: '', sets: [{ weight: 0, reps: 0 }] }]);
                }} className="w-full h-11 gap-1 border-dashed rounded-xl">
                  <Plus className="w-4 h-4" /> 운동 추가하기
                </Button>
              </div>

              <div className="pt-2">
                <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={async () => {
                  if (!onAddManualWorkout) return;
                  const d = parseISO(manualDate);
                  const validExercises = manualExercises.filter(ex => ex.name.trim() !== '');
                  if (validExercises.length === 0) return alert('운동을 한 개 이상 입력해주세요.');

                  const workout: Workout = {
                    id: crypto.randomUUID(),
                    date: format(d, "yyyy-MM-dd'T'12:00:00"),
                    exercises: validExercises.map((ex, i) => ({
                      id: crypto.randomUUID(),
                      name: ex.name,
                      category: '하체' as any, // fallback category
                      sets: ex.sets.map((s) => ({
                        id: crypto.randomUUID(),
                        weight: s.weight,
                        reps: s.reps,
                        completed: true
                      }))
                    }))
                  };
                  const success = await onAddManualWorkout(workout);
                  if (success) {
                    setIsManualModalOpen(false);
                    setManualExercises([]);
                    alert('운동 기록이 성공적으로 저장되었습니다!');
                  }
                }}>
                  새로운 기록 저장하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 날짜 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DATE_FILTER_LABELS.map(f => (
          <button
            key={f.id}
            onClick={() => setDateFilter(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${dateFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && workouts.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 mt-4 opacity-70">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">운동 기록이 없습니다</h2>
          <p className="text-sm text-muted-foreground break-keep text-center">첫 운동을 시작하거나,<br />우측 상단 <b>+ 기록 직접 추가</b> 버튼으로 지난 운동을 기록해보세요!</p>
        </div>
      )}

      {filtered.length === 0 && workouts.length > 0 && (
        <p className="text-center text-muted-foreground py-10">해당 기간의 기록이 없습니다.</p>
      )}

      {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((workout) => {
        const totalVolume = workout.exercises.reduce(
          (acc, ex) => acc + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
          0
        );
        const isExpanded = expandedId === workout.id;

        return (
          <div key={workout.id} className="bg-card rounded-xl card-shadow slide-up overflow-hidden accent-stripe hover-lift">
            {/* Header — always visible */}
            <div
              className="p-4 cursor-pointer select-none"
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-primary">
                    {format(getLocalDate(workout.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {workout.duration && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatDuration(workout.duration)}
                      </span>
                    )}
                    <span>{workout.exercises.length}개 운동</span>
                    {totalVolume > 0 && <span>{toDisplay(totalVolume).toLocaleString()} {unit}</span>}
                  </div>
                  {/* Exercise name pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workout.exercises.slice(0, 4).map((ex) => (
                      <span key={ex.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[ex.category] || 'bg-secondary text-muted-foreground border-transparent'}`}>
                        {ex.name}
                      </span>
                    ))}
                    {workout.exercises.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        +{workout.exercises.length - 4}개
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  {onSaveAsProgram && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); handleSaveProgram(workout); }}
                      title="프로그램으로 저장"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /><line x1="12" x2="12" y1="7" y2="13" /><line x1="15" x2="9" y1="10" y2="10" /></svg>
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('이 운동 기록을 삭제하시겠습니까?')) onDeleteWorkout(workout.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded detail — set-level data with edit capability */}
            {isExpanded && (
              <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-semibold text-sm">{exercise.name}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${categoryColors[exercise.category]}`}>
                        {exercise.category}
                      </span>
                      {exercise.targetDistance && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
                          <MapPin className="w-2.5 h-2.5" />
                          {exercise.targetDistance}m
                        </span>
                      )}
                      {exercise.targetTime && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-accent/10 text-accent">
                          <Clock className="w-2.5 h-2.5" />
                          {exercise.targetTime}초
                        </span>
                      )}
                    </div>
                    {/* Per-set breakdown with edit */}
                    <div className="ml-5 space-y-1">
                      {exercise.sets.map((set, i) => (
                        <div key={set.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-10 text-right font-medium text-foreground/60">Set {i + 1}</span>

                          {editingSetId === set.id ? (
                            /* ─── EDITING MODE ─── */
                            <>
                              <NumberInput
                                value={editWeight}
                                onChange={(val) => setEditWeight(val)}
                                className="w-24 h-7 text-xs"
                                step={2.5}
                                min={0}
                              />
                              <span className="text-muted-foreground text-[10px]">{unit}</span>
                              <span className="text-muted-foreground">×</span>
                              <NumberInput
                                value={editReps}
                                onChange={(val) => setEditReps(val)}
                                className="w-24 h-7 text-xs"
                                step={1}
                                min={0}
                              />
                              <span className="text-muted-foreground text-[10px]">회</span>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-amber-500 hover:text-amber-500/80"
                                onClick={() => saveEditing(set.id)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={cancelEditing}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            /* ─── DISPLAY MODE ─── */
                            <>
                              {set.weight > 0 && <span className="text-primary font-semibold">{toDisplay(set.weight)}{unit}</span>}
                              {set.reps > 0 && <span>× {set.reps}회</span>}
                              {set.weight === 0 && set.reps === 0 && <span className="italic">기록 없음</span>}
                              {set.completed && <span className="text-amber-500">✓</span>}
                              {onUpdateSavedSet && (
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-5 w-5 ml-1 text-muted-foreground/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ opacity: 1 }}
                                  onClick={() => startEditing(set)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {/* Pagination Controls */}
      {filtered.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {Math.ceil(filtered.length / itemsPerPage)} 페이지
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
