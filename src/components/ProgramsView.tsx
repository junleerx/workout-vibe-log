import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Play, Dumbbell, Edit2 } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">운동 프로그램</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4" />
              프로그램 만들기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? '프로그램 수정' : '새 프로그램 만들기'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로그램 이름</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 상체 운동" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">설명 (선택)</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="프로그램 설명..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">요일 선택</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Badge key={day.id} variant={selectedDays.includes(day.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleDayToggle(day.id)}>
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">운동 추가</label>
                <div className="flex gap-2">
                  <select className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
                    <option value="">운동 선택...</option>
                    {allExercises.map((ex) => (<option key={ex.name} value={ex.name}>{ex.name} ({ex.category})</option>))}
                  </select>
                  <Button type="button" onClick={handleAddExercise} disabled={!selectedExercise}>추가</Button>
                </div>
              </div>
              {programExercises.length > 0 && (
                <div className="space-y-3">
                  {programExercises.map((ex, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ex.exerciseName}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveExercise(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="number" value={ex.targetSets} onChange={(e) => handleUpdateExercise(index, { targetSets: Number(e.target.value) })} />
                        <Input type="number" value={ex.targetReps} onChange={(e) => handleUpdateExercise(index, { targetReps: Number(e.target.value) })} />
                        <Input type="number" value={ex.targetWeight} onChange={(e) => handleUpdateExercise(index, { targetWeight: Number(e.target.value) })} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleSave} className="w-full" disabled={!name.trim()}>{editingId ? '수정 완료' : '프로그램 생성'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div><CardTitle className="text-lg">{program.name}</CardTitle></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(program)}><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteProgram(program.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">{program.daysOfWeek.map((day) => (<Badge key={day} variant="secondary">{getDayLabel(day)}</Badge>))}</div>
              <div className="space-y-2">{program.exercises.map((ex) => (<div key={ex.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-secondary/30"><span>{ex.exerciseName}</span><span className="text-muted-foreground">{ex.targetSets}세트 × {ex.targetReps}회 {ex.targetWeight > 0 && `@ ${ex.targetWeight}kg`}</span></div>))}</div>
              <Button className="w-full gap-2" onClick={() => onStartFromProgram(program.exercises)} disabled={program.exercises.length === 0}><Play className="w-4 h-4" />운동 시작</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
