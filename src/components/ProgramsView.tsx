import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Play, Edit2, GripVertical, Target } from 'lucide-react';
import { WorkoutProgram, ProgramExercise, DAYS_OF_WEEK } from '@/types/program';
import { exerciseTemplates } from '@/data/exercises';

interface ProgramsViewProps {
  programs: WorkoutProgram[];
  onCreateProgram: (
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => void;
  onUpdateProgram: (
    id: string,
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => void;
  onDeleteProgram: (programId: string) => void;
  onStartFromProgram: (exercises: ProgramExercise[]) => void;
  customExercises: { id: string; name: string; category: string }[];
  onAddCustomExercise: (name: string, category: string) => void;
  onDeleteCustomExercise: (exerciseId: string) => void;
}

export function ProgramsView({
  programs,
  onCreateProgram,
  onUpdateProgram,
  onDeleteProgram,
  onStartFromProgram,
  customExercises,
  onAddCustomExercise,
  onDeleteCustomExercise,
}: ProgramsViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workoutStyle, setWorkoutStyle] = useState<'classic' | 'amrap' | 'emom' | 'rft' | undefined>(undefined);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [targetRounds, setTargetRounds] = useState<number | undefined>(undefined);
  const [programExercises, setProgramExercises] = useState<Omit<ProgramExercise, 'id'>[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseCategory, setCustomExerciseCategory] = useState('가슴');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupRounds, setActiveGroupRounds] = useState<number>(1);

  const allExercises = [
    ...exerciseTemplates.map(e => ({ id: `template-${e.name}`, name: e.name, category: e.category, isCustom: false })),
    ...customExercises.map((e) => ({ id: e.id, name: e.name, category: e.category, isCustom: true })),
  ];

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddExercise = () => {
    if (customExerciseName.trim()) {
      onAddCustomExercise(customExerciseName.trim(), customExerciseCategory);
      setProgramExercises((prev) => [
        ...prev,
        {
          exerciseName: customExerciseName.trim(),
          muscleGroup: customExerciseCategory,
          targetSets: 0,
          targetReps: 0,
          targetWeight: 0,
          targetDistance: undefined,
          groupId: activeGroupId || undefined,
          groupRounds: activeGroupId ? activeGroupRounds : undefined,
          sets: [],
          orderIndex: prev.length,
        },
      ]);
      setCustomExerciseName('');
      return;
    }

    if (!selectedExercise) return;
    const exercise = allExercises.find((e) => e.name === selectedExercise);
    if (!exercise) return;

    setProgramExercises((prev) => [
      ...prev,
      {
        exerciseName: exercise.name,
        muscleGroup: exercise.category,
        targetSets: 0,
        targetReps: 0,
        targetWeight: 0,
        targetDistance: undefined,
        groupId: activeGroupId || undefined,
        groupRounds: activeGroupId ? activeGroupRounds : undefined,
        sets: [],
        orderIndex: prev.length,
      },
    ]);
    setSelectedExercise('');
  };

  const handleDeleteSelectedCustomExercise = () => {
    const exercise = allExercises.find((e) => e.name === selectedExercise);
    if (exercise && exercise.isCustom) {
      if (confirm(`"${exercise.name}" 운동을 삭제하시겠습니까?`)) {
        onDeleteCustomExercise(exercise.id);
        setSelectedExercise('');
      }
    }
  };

  const handleCreateGroup = () => {
    setActiveGroupId(crypto.randomUUID());
    setActiveGroupRounds(3); // 기본 3라운드
  };

  const handleFinishGroup = () => {
    setActiveGroupId(null);
  };

  const handleRemoveExercise = (index: number) => {
    setProgramExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<Omit<ProgramExercise, 'id'>>) => {
    setProgramExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  const handleEditClick = (program: WorkoutProgram) => {
    setEditingId(program.id);
    setName(program.name);
    setDescription(program.description || '');
    setSelectedDays(program.daysOfWeek);
    setWorkoutStyle(program.workoutStyle as any);
    setTimeLimit(program.timeLimit);
    setTargetRounds(program.targetRounds);
    setProgramExercises(program.exercises.map(({ id, ...rest }) => rest));
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      onUpdateProgram(editingId, name, description, selectedDays, workoutStyle, timeLimit, targetRounds, programExercises);
    } else {
      onCreateProgram(name, description, selectedDays, workoutStyle, timeLimit, targetRounds, programExercises);
    }
    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setSelectedDays([]);
    setWorkoutStyle(undefined);
    setTimeLimit(undefined);
    setTargetRounds(undefined);
    setProgramExercises([]);
    setActiveGroupId(null);
  };

  const getDayLabel = (dayId: string) => {
    return DAYS_OF_WEEK.find((d) => d.id === dayId)?.label || dayId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">운동 프로그램</h2>
          <p className="text-sm text-muted-foreground mt-0.5">루틴을 만들고 요일별로 관리하세요</p>
        </div>
        <div className="flex gap-2">
          {/* Manage Exercise List */}
          <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-9">
                <Trash2 className="w-3.5 h-3.5" />
                운동 관리
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base">운동 목록 관리</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-1">
                {customExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">추가한 커스텀 운동이 없습니다.</p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium mb-2">내 커스텀 운동 ({customExercises.length}개)</p>
                    {customExercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50 border border-border/40">
                        <div>
                          <span className="text-sm font-medium">{ex.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{ex.category}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`"${ex.name}" 운동을 삭제하시겠습니까?`)) {
                              onDeleteCustomExercise(ex.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open) { setIsDialogOpen(true); } else { closeDialog(); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl" onClick={() => setEditingId(null)}>
                <Plus className="w-4 h-4" />
                새 프로그램
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">{editingId ? '프로그램 수정' : '새 프로그램 만들기'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">프로그램 이름</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 월/수 상체 루틴" className="rounded-xl" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">설명 (선택)</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="프로그램에 대한 메모..." className="rounded-xl resize-none" rows={2} />
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">요일</label>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleDayToggle(day.id)}
                        className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 ${selectedDays.includes(day.id)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Exercise */}
                <div className={`space-y-3 p-3 rounded-xl border ${activeGroupId ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/20'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      {activeGroupId ? '진행 중인 서킷 블록에 운동 추가' : '운동 추가 (목록 선택 또는 직접 입력)'}
                    </label>
                    {!activeGroupId ? (
                      <Button variant="outline" size="sm" onClick={handleCreateGroup} className="h-7 text-xs rounded-lg border-primary/30 text-primary">
                        + 서킷/블록 묶기
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <span>목표 라운드:</span>
                          <Input
                            type="number"
                            value={activeGroupRounds}
                            onChange={(e) => setActiveGroupRounds(Number(e.target.value) || 1)}
                            className="w-12 h-6 px-1 text-center rounded bg-background/50 border-primary/20"
                          />
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleFinishGroup} className="h-7 text-xs rounded-lg">
                          블록 완료
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                      <select
                        className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={selectedExercise}
                        onChange={(e) => {
                          setSelectedExercise(e.target.value);
                          setCustomExerciseName(''); // 목록 선택 시 수동입력 초기화
                        }}
                      >
                        <option value="">운동 목록에서 선택...</option>
                        {allExercises.map((ex) => (
                          <option key={ex.id} value={ex.name}>{ex.name} ({ex.category})</option>
                        ))}
                      </select>
                      {selectedExercise && allExercises.find(e => e.name === selectedExercise)?.isCustom && (
                        <Button type="button" variant="ghost" size="icon" onClick={handleDeleteSelectedCustomExercise} className="text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="목록에 없는 운동 직접 입력"
                        value={customExerciseName}
                        onChange={(e) => {
                          setCustomExerciseName(e.target.value);
                          setSelectedExercise(''); // 수동입력 시 목록 선택 초기화
                        }}
                        className="rounded-xl h-10"
                      />
                      {customExerciseName.trim() && (
                        <select
                          className="w-24 rounded-xl border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          value={customExerciseCategory}
                          onChange={(e) => setCustomExerciseCategory(e.target.value)}
                        >
                          <option value="가슴">가슴</option>
                          <option value="등">등</option>
                          <option value="어깨">어깨</option>
                          <option value="하체">하체</option>
                          <option value="팔">팔</option>
                          <option value="복근">복근</option>
                          <option value="전신">전신</option>
                          <option value="유산소">유산소</option>
                        </select>
                      )}
                    </div>
                    <Button type="button" onClick={handleAddExercise} disabled={!selectedExercise && !customExerciseName.trim()} className="rounded-xl px-4 h-10">
                      추가
                    </Button>
                  </div>
                </div>

                {/* Exercise List */}
                {programExercises.length > 0 && (
                  <div className="space-y-2">
                    {programExercises.map((ex, index) => {
                      // 서킷 블록 시각적 처리
                      const isGrouped = !!ex.groupId;
                      const isFirstInGroup = isGrouped && (index === 0 || programExercises[index - 1].groupId !== ex.groupId);
                      const isLastInGroup = isGrouped && (index === programExercises.length - 1 || programExercises[index + 1].groupId !== ex.groupId);

                      return (
                        <div key={index} className={`relative flex flex-col ${isGrouped ? 'mx-1' : ''}`}>
                          {isFirstInGroup && (
                            <div className="flex items-center gap-2 mb-1 pl-1">
                              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                                🔥 {ex.groupRounds} Rounds
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium">서킷 블록</span>
                            </div>
                          )}
                          <div className={`p-3 bg-secondary/50 border-border/50 space-y-3 ${isGrouped
                            ? `border-x ${isFirstInGroup ? 'rounded-t-xl border-t' : ''} ${isLastInGroup ? 'rounded-b-xl border-b mb-2' : ''} ${!isFirstInGroup && !isLastInGroup ? 'border-y-0' : ''} ml-2 border-l-primary/30`
                            : 'rounded-xl border'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                                <span className="font-medium text-sm">{ex.exerciseName}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5">{ex.muscleGroup}</Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveExercise(index)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-3 flex-wrap">
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetSets ? 'text-primary' : 'text-muted-foreground/60'}`}>세트</span>
                                <Input type="number" placeholder="예: 3" value={ex.targetSets || ''} onChange={(e) => handleUpdateExercise(index, { targetSets: Number(e.target.value) || 0 })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetSets ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetReps ? 'text-primary' : 'text-muted-foreground/60'}`}>횟수</span>
                                <Input type="number" placeholder="예: 10" value={ex.targetReps || ''} onChange={(e) => handleUpdateExercise(index, { targetReps: Number(e.target.value) || 0 })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetReps ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetWeight ? 'text-primary' : 'text-muted-foreground/60'}`}>무게(kg)</span>
                                <Input type="number" placeholder="자유" value={ex.targetWeight || ''} onChange={(e) => handleUpdateExercise(index, { targetWeight: Number(e.target.value) || 0 })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetWeight ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetDistance ? 'text-primary' : 'text-muted-foreground/60'}`}>거리(m)</span>
                                <Input type="number" placeholder="로잉 등" value={ex.targetDistance || ''} onChange={(e) => handleUpdateExercise(index, { targetDistance: Number(e.target.value) || undefined })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetDistance ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button onClick={handleSave} className="w-full rounded-xl h-11 font-semibold" disabled={!name.trim()}>
                  {editingId ? '수정 완료' : '프로그램 생성'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty State */}
      {programs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">프로그램이 없습니다</h3>
          <p className="text-sm text-muted-foreground">운동 프로그램을 만들어<br />일관된 루틴을 유지하세요</p>
        </div>
      )}

      {/* Program Cards */}
      <div className="grid gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{program.name}</h3>
                      {program.workoutStyle === 'amrap' && <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-none font-bold">🔥 AMRAP {program.timeLimit}분</Badge>}
                      {program.workoutStyle === 'emom' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold">⏰ EMOM {program.timeLimit}분</Badge>}
                      {program.workoutStyle === 'rft' && <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-none font-bold">🏆 {program.targetRounds} Rounds</Badge>}
                    </div>
                    {program.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{program.description}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 -mr-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEditClick(program)}>
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onDeleteProgram(program.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                    </Button>
                  </div>
                </div>

                {/* Day Badges */}
                {program.daysOfWeek.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <span
                        key={day.id}
                        className={`w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${program.daysOfWeek.includes(day.id)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary/50 text-muted-foreground/30'
                          }`}
                      >
                        {day.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Exercise List */}
                <div className="space-y-1.5">
                  {program.exercises.map((ex, index) => {
                    const isGrouped = !!ex.groupId;
                    const isFirstInGroup = isGrouped && (index === 0 || program.exercises[index - 1].groupId !== ex.groupId);
                    const isLastInGroup = isGrouped && (index === program.exercises.length - 1 || program.exercises[index + 1].groupId !== ex.groupId);

                    return (
                      <div key={ex.id} className="relative flex flex-col">
                        {isFirstInGroup && (
                          <div className="flex items-center gap-1.5 mt-2 mb-1 px-1">
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] py-0">
                              🔥 {ex.groupRounds} Rounds
                            </Badge>
                          </div>
                        )}
                        <div className={`flex items-center justify-between text-sm py-2 px-3 bg-secondary/40 border border-border/30 ${isGrouped
                          ? `${isFirstInGroup ? 'rounded-t-lg border-t' : ''} ${isLastInGroup ? 'rounded-b-lg border-b mb-1' : ''} ${!isFirstInGroup && !isLastInGroup ? 'border-y-0' : ''} ml-2 border-l-2 border-l-primary/40`
                          : 'rounded-lg'
                          }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground/90">{ex.exerciseName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium tabular-nums">
                            {ex.targetDistance ? (
                              <span className="text-primary/90 px-2 py-0.5 rounded bg-primary/10">{ex.targetDistance}m</span>
                            ) : null}

                            {(ex.targetSets > 0 || ex.targetReps > 0) && (
                              <span className="px-2 py-0.5 rounded bg-secondary">
                                {ex.targetSets > 0 ? `${ex.targetSets}×` : ''}{ex.targetReps > 0 ? ex.targetReps : ''}
                              </span>
                            )}

                            {ex.targetWeight > 0 && (
                              <span className="text-primary/80 px-2 py-0.5 rounded bg-primary/10">{ex.targetWeight}kg</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={() => onStartFromProgram(program.exercises)}
                disabled={program.exercises.length === 0}
                className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-t border-border/30"
              >
                <Play className="w-4 h-4" />
                이 프로그램으로 운동 시작
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
