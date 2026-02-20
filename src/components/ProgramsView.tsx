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
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => void;
  onUpdateProgram: (
    id: string,
    name: string,
    description: string,
    daysOfWeek: string[],
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => void;
  onDeleteProgram: (programId: string) => void;
  onStartFromProgram: (exercises: ProgramExercise[]) => void;
  customExercises: { name: string; category: string }[];
}

export function ProgramsView({
  programs,
  onCreateProgram,
  onUpdateProgram,
  onDeleteProgram,
  onStartFromProgram,
  customExercises,
}: ProgramsViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [programExercises, setProgramExercises] = useState<Omit<ProgramExercise, 'id'>[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');

  const allExercises = [
    ...exerciseTemplates,
    ...customExercises.map((e) => ({ name: e.name, category: e.category })),
  ];

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddExercise = () => {
    if (!selectedExercise) return;
    const exercise = allExercises.find((e) => e.name === selectedExercise);
    if (!exercise) return;

    setProgramExercises((prev) => [
      ...prev,
      {
        exerciseName: exercise.name,
        muscleGroup: exercise.category,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 0,
        sets: [], // Fix: Ensure sets is initialized
        workoutStyle: 'classic',
        timeLimit: 10,
        orderIndex: prev.length,
      },
    ]);
    setSelectedExercise('');
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
    setProgramExercises(program.exercises.map(({ id, ...rest }) => rest));
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      onUpdateProgram(editingId, name, description, selectedDays, programExercises);
    } else {
      onCreateProgram(name, description, selectedDays, programExercises);
    }
    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setSelectedDays([]);
    setProgramExercises([]);
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">운동 추가</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                  >
                    <option value="">운동을 선택하세요</option>
                    {allExercises.map((ex) => (
                      <option key={ex.name} value={ex.name}>{ex.name} ({ex.category})</option>
                    ))}
                  </select>
                  <Button type="button" onClick={handleAddExercise} disabled={!selectedExercise} className="rounded-xl px-4">
                    추가
                  </Button>
                </div>
              </div>

              {/* Exercise List */}
              {programExercises.length > 0 && (
                <div className="space-y-2">
                  {programExercises.map((ex, index) => (
                    <div key={index} className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                          <span className="font-medium text-sm">{ex.exerciseName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5">{ex.muscleGroup}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveExercise(index)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>

                      {/* Workout Style & Time Limit (AMRAP/EMOM) */}
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-medium">스타일</span>
                          <select
                            className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            value={ex.workoutStyle || 'classic'}
                            onChange={(e) => handleUpdateExercise(index, { workoutStyle: e.target.value as any })}
                          >
                            <option value="classic">일반 (세트/랩스)</option>
                            <option value="amrap">AMRAP (최대한 많이)</option>
                            <option value="emom">EMOM (매분마다)</option>
                          </select>
                        </div>
                        {(ex.workoutStyle === 'amrap' || ex.workoutStyle === 'emom') && (
                          <div className="w-[80px] space-y-1">
                            <span className="text-[10px] text-muted-foreground font-medium">제한(분)</span>
                            <Input
                              type="number"
                              value={ex.timeLimit || 10}
                              onChange={(e) => handleUpdateExercise(index, { timeLimit: Number(e.target.value) })}
                              className="h-8 rounded-lg text-center text-xs"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-medium">세트</span>
                          <Input type="number" value={ex.targetSets} onChange={(e) => handleUpdateExercise(index, { targetSets: Number(e.target.value) })} className="h-8 rounded-lg text-center text-sm" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-medium">횟수</span>
                          <Input type="number" value={ex.targetReps} onChange={(e) => handleUpdateExercise(index, { targetReps: Number(e.target.value) })} className="h-8 rounded-lg text-center text-sm" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-medium">무게(kg)</span>
                          <Input type="number" value={ex.targetWeight} onChange={(e) => handleUpdateExercise(index, { targetWeight: Number(e.target.value) })} className="h-8 rounded-lg text-center text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSave} className="w-full rounded-xl h-11 font-semibold" disabled={!name.trim()}>
                {editingId ? '수정 완료' : '프로그램 생성'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    <h3 className="font-bold text-base">{program.name}</h3>
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
                  {program.exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-secondary/40">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground/90">{ex.exerciseName}</span>
                        {ex.workoutStyle === 'amrap' && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-orange-500/10 text-orange-500 border-none">AMRAP {ex.timeLimit}분</Badge>}
                        {ex.workoutStyle === 'emom' && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-blue-500/10 text-blue-500 border-none">EMOM {ex.timeLimit}분</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums text-right">
                        {ex.workoutStyle === 'classic' || !ex.workoutStyle ? (
                          <>
                            {ex.targetSets}×{ex.targetReps}
                            {ex.targetWeight > 0 && <span className="ml-1 text-primary/80">{ex.targetWeight}kg</span>}
                          </>
                        ) : (
                          <span>도전!</span>
                        )}
                      </span>
                    </div>
                  ))}
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
