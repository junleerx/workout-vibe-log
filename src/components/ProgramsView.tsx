import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NumberInput } from '@/components/ui/number-input';
import { Plus, Trash2, Play, Edit2, GripVertical, Target, ChevronUp, ChevronDown, Copy, Folder, FolderPlus, FolderOpen, MoreVertical, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

import { WorkoutProgram, ProgramExercise, DAYS_OF_WEEK } from '@/types/program';
import { exerciseTemplates } from '@/data/exercises';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface ProgramsViewProps {
  programs: WorkoutProgram[];
  onCreateProgram: (
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[],
    folder?: string | null,
    note?: string | null
  ) => void;
  onUpdateProgram: (
    id: string,
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[],
    folder?: string | null,
    note?: string | null
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
  const [note, setNote] = useState('');
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
  const [activeGroupRestTime, setActiveGroupRestTime] = useState<number>(60);
  const [isGroupingMode, setIsGroupingMode] = useState(false);
  const [selectedIndicesForGroup, setSelectedIndicesForGroup] = useState<number[]>([]);
  const { unit, toDisplay, toKg } = useWeightUnit();
  const [hiddenTemplates, setHiddenTemplates] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('hidden_templates') || '[]'); } catch { return []; }
  });
  const [managetab, setManagetab] = useState<'custom' | 'builtin'>('custom');

  // 폴더 관리 상태
  const [folders, setFolders] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('program_folders') || '[]'); } catch { return []; }
  });
  const [programFolders, setProgramFolders] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('program_folder_mapping') || '{}'); } catch { return {}; }
  });
  const [activeFolder, setActiveFolder] = useState<string>('전체');
  const [isFolderManageOpen, setIsFolderManageOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const saveFolders = (newFolders: string[]) => {
    setFolders(newFolders);
    localStorage.setItem('program_folders', JSON.stringify(newFolders));
  };
  const saveProgramFolders = (newMapping: Record<string, string>) => {
    setProgramFolders(newMapping);
    localStorage.setItem('program_folder_mapping', JSON.stringify(newMapping));
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    if (folders.includes(newFolderName.trim())) {
      alert('이미 존재하는 폴더 이름입니다.');
      return;
    }
    saveFolders([...folders, newFolderName.trim()]);
    setNewFolderName('');
  };

  const activeAllFolders = Array.from(new Set([
    ...folders,
    ...programs.map(p => p.folder).filter(Boolean)
  ])) as string[];

  const handleDeleteFolder = (folderName: string) => {
    if (window.confirm(`"${folderName}" 폴더를 삭제하시겠습니까? (안에 있는 프로그램들은 '미분류'로 이동됩니다)`)) {
      saveFolders(folders.filter(f => f !== folderName));
      if (activeFolder === folderName) setActiveFolder('전체');

      const newMapping = { ...programFolders };
      programs.forEach(p => {
        if ((p.folder || newMapping[p.id]) === folderName) {
          delete newMapping[p.id];
          onUpdateProgram(p.id, p.name, p.description || '', p.daysOfWeek, p.workoutStyle, p.timeLimit, p.targetRounds, p.exercises.map(({ id, ...rest }) => rest), null, p.note);
        }
      });
      saveProgramFolders(newMapping);
    }
  };

  const handleRenameFolder = (oldName: string) => {
    const newName = editFolderName.trim();
    if (!newName || newName === oldName) {
      setEditingFolder(null);
      return;
    }
    if (activeAllFolders.includes(newName)) {
      alert('이미 존재하는 폴더 이름입니다.');
      return;
    }

    const newFolders = folders.map(f => f === oldName ? newName : f);
    saveFolders(newFolders);
    if (activeFolder === oldName) setActiveFolder(newName);

    const newMapping = { ...programFolders };
    programs.forEach(p => {
      if ((p.folder || newMapping[p.id]) === oldName) {
        newMapping[p.id] = newName;
        onUpdateProgram(p.id, p.name, p.description || '', p.daysOfWeek, p.workoutStyle, p.timeLimit, p.targetRounds, p.exercises.map(({ id, ...rest }) => rest), newName, p.note);
      }
    });
    saveProgramFolders(newMapping);
    setEditingFolder(null);
  };

  const handleMoveToFolder = (programId: string, folderName: string | null) => {
    const newMapping = { ...programFolders };
    if (folderName) {
      newMapping[programId] = folderName;
    } else {
      delete newMapping[programId];
    }
    saveProgramFolders(newMapping);

    const program = programs.find((p) => p.id === programId);
    if (program) {
      onUpdateProgram(program.id, program.name, program.description || '', program.daysOfWeek, program.workoutStyle, program.timeLimit, program.targetRounds, program.exercises.map(({ id, ...rest }) => rest), folderName, program.note);
    }
  };

  const filteredPrograms = programs.filter(p => {
    const pFolder = p.folder || programFolders[p.id];
    if (activeFolder === '전체') return true;
    if (activeFolder === '미분류') return !pFolder;
    return pFolder === activeFolder;
  });

  const toggleHideTemplate = (name: string) => {
    setHiddenTemplates((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      localStorage.setItem('hidden_templates', JSON.stringify(next));
      return next;
    });
  };

  const allExercises = [
    ...exerciseTemplates
      .filter(e => !hiddenTemplates.includes(e.name))
      .map(e => ({ id: `template-${e.name}`, name: e.name, category: e.category, isCustom: false })),
    ...customExercises.map((e) => ({ id: e.id, name: e.name, category: e.category, isCustom: true })),
  ];

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddExercise = () => {
    let newEx: Omit<ProgramExercise, 'id'> | null = null;

    if (customExerciseName.trim()) {
      onAddCustomExercise(customExerciseName.trim(), customExerciseCategory);
      newEx = {
        exerciseName: customExerciseName.trim(),
        muscleGroup: customExerciseCategory,
        targetSets: 0,
        targetReps: 0,
        targetWeight: 0,
        targetDistance: undefined,
        targetTime: undefined,
        groupId: activeGroupId || undefined,
        groupRounds: activeGroupId ? activeGroupRounds : undefined,
        groupRestTime: activeGroupId ? activeGroupRestTime : undefined,
        sets: [],
        orderIndex: programExercises.length,
      };
      setCustomExerciseName('');
    } else if (selectedExercise) {
      const exercise = allExercises.find((e) => e.name === selectedExercise);
      if (exercise) {
        newEx = {
          exerciseName: exercise.name,
          muscleGroup: exercise.category,
          targetSets: 0,
          targetReps: 0,
          targetWeight: 0,
          targetDistance: undefined,
          targetTime: undefined,
          groupId: activeGroupId || undefined,
          groupRounds: activeGroupId ? activeGroupRounds : undefined,
          groupRestTime: activeGroupId ? activeGroupRestTime : undefined,
          sets: [],
          orderIndex: programExercises.length,
        };
        setSelectedExercise('');
      }
    }

    if (!newEx) return;

    setProgramExercises((prev) => {
      if (activeGroupId) {
        let lastIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].groupId === activeGroupId) {
            lastIdx = i;
            break;
          }
        }
        if (lastIdx !== -1) {
          const next = [...prev];
          next.splice(lastIdx + 1, 0, newEx!);
          return next;
        }
      }
      return [...prev, newEx!];
    });
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
    setActiveGroupRestTime(60); // 기본 60초 휴식
  };

  const handleFinishGroup = () => {
    setActiveGroupId(null);
  };

  const handleRemoveExercise = (index: number) => {
    setProgramExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    setProgramExercises((prev) => {
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const handleUpdateExercise = (index: number, updates: Partial<Omit<ProgramExercise, 'id'>>) => {
    setProgramExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  const handleCreateGroupFromSelection = () => {
    if (selectedIndicesForGroup.length < 2) {
      alert('서킷으로 묶으려면 2개 이상의 운동을 선택해주세요.');
      return;
    }
    const newGroupId = crypto.randomUUID();
    const sortedSelected = [...selectedIndicesForGroup].sort((a, b) => a - b);
    const insertIndex = sortedSelected[0];

    setProgramExercises((prev) => {
      const next = [...prev];
      const selectedExs = sortedSelected.map(idx => ({ ...next[idx], groupId: newGroupId, groupRounds: 3, groupRestTime: 60 }));
      // Remove selected from their original positions (working backwards to preserve indices)
      for (let i = sortedSelected.length - 1; i >= 0; i--) {
        next.splice(sortedSelected[i], 1);
      }
      // Insert them all at the first selection's original index
      next.splice(insertIndex, 0, ...selectedExs);
      return next;
    });

    setIsGroupingMode(false);
    setSelectedIndicesForGroup([]);
  };

  const handleUngroup = (groupId: string) => {
    setProgramExercises((prev) =>
      prev.map(ex => ex.groupId === groupId ? { ...ex, groupId: undefined, groupRounds: undefined } : ex)
    );
  };

  const handleEditClick = (program: WorkoutProgram) => {
    setEditingId(program.id);
    setName(program.name);
    setDescription(program.description || '');
    setNote(program.note || '');
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
      if (window.confirm('프로그램을 이대로 수정하시겠습니까?')) {
        const editingProgram = programs.find((p) => p.id === editingId);
        const folder = editingProgram?.folder || programFolders[editingId] || null;
        onUpdateProgram(editingId, name, description, selectedDays, workoutStyle, timeLimit, targetRounds, programExercises, folder, note);
      } else {
        return; // 수정 취소
      }
    } else {
      onCreateProgram(name, description, selectedDays, workoutStyle, timeLimit, targetRounds, programExercises, activeFolder !== '전체' && activeFolder !== '미분류' ? activeFolder : null, note);
    }
    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setNote('');
    setSelectedDays([]);
    setWorkoutStyle(undefined);
    setTimeLimit(undefined);
    setTargetRounds(undefined);
    setProgramExercises([]);
    setActiveGroupId(null);
    setActiveGroupRestTime(60);
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
          <p className="text-sm text-muted-foreground mt-0.5 break-keep">루틴을 만들고 요일별로 관리하세요</p>
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
              <div className="space-y-1.5 py-1">
                {/* Active exercises — built-in (not hidden) */}
                {exerciseTemplates.filter(ex => !hiddenTemplates.includes(ex.name)).map((ex) => (
                  <div key={`t-${ex.name}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50 border border-border/40">
                    <div>
                      <span className="text-sm font-medium">{ex.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{ex.category}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => toggleHideTemplate(ex.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {/* Active exercises — custom */}
                {customExercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50 border border-border/40">
                    <div>
                      <span className="text-sm font-medium">{ex.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{ex.category}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(`"${ex.name}" 운동을 삭제하시겠습니까?`)) onDeleteCustomExercise(ex.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {/* Deleted / hidden — restore section */}
                {hiddenTemplates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                    <p className="text-xs text-muted-foreground mb-2">삭제된 운동 ({hiddenTemplates.length}개) — 복원 가능</p>
                    {exerciseTemplates.filter(ex => hiddenTemplates.includes(ex.name)).map((ex) => (
                      <div key={`d-${ex.name}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/20 border border-border/20 opacity-50">
                        <span className="text-sm line-through">{ex.name}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg text-primary" onClick={() => toggleHideTemplate(ex.name)}>복원</Button>
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
                <div className="space-y-4">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="프로그램 이름 (예: 데스캠프 1주차)" className="h-10 text-base" />
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="간단한 설명 (선택사항)" className="h-20 resize-none text-sm" />
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="이 프로그램에 대한 개인적인 메모나 팁을 적어주세요 (선택사항, 팝업/화면에 표시됨)" className="h-20 resize-none text-sm bg-secondary/30" />
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
                      {activeGroupId ? '진행 중인 서킷 블록에 운동 추가' : '운동 추가 (목록 또는 직접 입력)'}
                    </label>
                    {!activeGroupId ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsGroupingMode(!isGroupingMode)} className={`h-7 text-xs rounded-lg transition-colors ${isGroupingMode ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                          {isGroupingMode ? '선택 취소' : '기존 운동 묶기'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleCreateGroup} className="h-7 text-xs rounded-lg border-primary/30 text-primary">
                          + 신규 서킷 블록
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <span>라운드:</span>
                          <Input
                            type="number"
                            value={activeGroupRounds}
                            onChange={(e) => setActiveGroupRounds(Number(e.target.value) || 1)}
                            className="w-12 h-6 px-1 text-center rounded bg-background/50 border-primary/20"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                          <span>쉬는시간:</span>
                          <Input
                            type="number"
                            value={activeGroupRestTime}
                            onChange={(e) => setActiveGroupRestTime(Number(e.target.value) || 0)}
                            className="w-14 h-6 px-1 text-center rounded bg-background/50 border-accent/20"
                          />
                          <span>초</span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleFinishGroup} className="h-7 text-xs rounded-lg">
                          블록 완료
                        </Button>
                      </div>
                    )}
                  </div>

                  {isGroupingMode && (
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg mb-2">
                      <span className="text-xs text-primary font-medium">{selectedIndicesForGroup.length}개 운동 선택됨</span>
                      <Button size="sm" onClick={handleCreateGroupFromSelection} disabled={selectedIndicesForGroup.length < 2} className="h-7 text-xs rounded-lg">
                        선택 항목 서킷으로 묶기
                      </Button>
                    </div>
                  )}

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
                            <div className="flex items-center justify-between gap-2 mb-1 pl-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                                  🔥
                                </Badge>
                                <input
                                  type="number"
                                  min={1}
                                  value={ex.groupRounds || 3}
                                  onChange={(e) => {
                                    const newRounds = Number(e.target.value) || 1;
                                    const gid = ex.groupId;
                                    setProgramExercises((prev) =>
                                      prev.map((item) =>
                                        item.groupId === gid ? { ...item, groupRounds: newRounds } : item
                                      )
                                    );
                                  }}
                                  className="w-12 h-6 text-center text-xs font-bold rounded-lg border border-primary/30 bg-primary/10 text-primary focus:outline-none"
                                />
                                <span className="text-xs text-muted-foreground font-medium">R</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-accent font-medium">⏸</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={ex.groupRestTime || 0}
                                  onChange={(e) => {
                                    const newRestTime = Number(e.target.value) || 0;
                                    const gid = ex.groupId;
                                    setProgramExercises((prev) =>
                                      prev.map((item) =>
                                        item.groupId === gid ? { ...item, groupRestTime: newRestTime } : item
                                      )
                                    );
                                  }}
                                  className="w-14 h-6 text-center text-xs font-bold rounded-lg border border-accent/30 bg-accent/10 text-accent focus:outline-none"
                                />
                                <span className="text-xs text-muted-foreground font-medium">초 휴식</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleUngroup(ex.groupId!)} className="h-6 text-[10px] rounded hover:bg-destructive/10 hover:text-destructive">
                                블록 해제
                              </Button>
                            </div>
                          )}
                          <div className={`p-3 bg-secondary/50 border-border/50 space-y-3 ${isGrouped
                            ? `border-x ${isFirstInGroup ? 'rounded-t-xl border-t' : ''} ${isLastInGroup ? 'rounded-b-xl border-b mb-2' : ''} ${!isFirstInGroup && !isLastInGroup ? 'border-y-0' : ''} ml-2 border-l-primary/30`
                            : 'rounded-xl border'
                            } ${isGroupingMode && !isGrouped ? 'opacity-80' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isGroupingMode && !isGrouped && (
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 mr-1 accent-primary rounded bg-background border-border/50"
                                    checked={selectedIndicesForGroup.includes(index)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedIndicesForGroup(prev => [...prev, index]);
                                      else setSelectedIndicesForGroup(prev => prev.filter(i => i !== index));
                                    }}
                                  />
                                )}
                                {!isGroupingMode && (
                                  <div className="flex flex-col">
                                    <button type="button" onClick={() => handleMoveExercise(index, 'up')} disabled={index === 0} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 leading-none">
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleMoveExercise(index, 'down')} disabled={index === programExercises.length - 1} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 leading-none">
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                <span className="font-medium text-sm">{ex.exerciseName}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5">{ex.muscleGroup}</Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveExercise(index)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>

                            {/* Desktop: 5 cols, Mobile: 3 top + 2 bottom for better fit */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 flex-wrap">
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetSets ? 'text-primary' : 'text-muted-foreground/60'}`}>세트</span>
                                <NumberInput min={0} value={ex.targetSets || 0} onChange={(val) => handleUpdateExercise(index, { targetSets: val })} className={`h-8 rounded-lg text-sm transition-all ${!ex.targetSets ? 'opacity-70' : ''}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetReps ? 'text-primary' : 'text-muted-foreground/60'}`}>횟수</span>
                                <NumberInput min={0} value={ex.targetReps || 0} onChange={(val) => handleUpdateExercise(index, { targetReps: val })} className={`h-8 rounded-lg text-sm transition-all ${!ex.targetReps ? 'opacity-70' : ''}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetWeight ? 'text-primary' : 'text-muted-foreground/60'}`}>무게({unit})</span>
                                <NumberInput step={2.5} min={0} value={ex.targetWeight ? toDisplay(ex.targetWeight) : 0} onChange={(val) => handleUpdateExercise(index, { targetWeight: toKg(val) || 0 })} className={`h-8 rounded-lg text-sm transition-all ${!ex.targetWeight ? 'opacity-70' : ''}`} />
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetDistance ? 'text-primary' : 'text-muted-foreground/60'}`}>거리(m)</span>
                                <Input type="number" placeholder="로잉 등" value={ex.targetDistance || ''} onChange={(e) => handleUpdateExercise(index, { targetDistance: Number(e.target.value) || undefined })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetDistance ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                              <div className="space-y-1 col-span-3 sm:col-span-1">
                                <span className={`text-[10px] font-medium transition-colors ${ex.targetTime ? 'text-primary' : 'text-muted-foreground/60'}`}>시간(초)</span>
                                <Input type="number" placeholder="예: 60" value={ex.targetTime || ''} onChange={(e) => handleUpdateExercise(index, { targetTime: Number(e.target.value) || undefined })} className={`h-8 rounded-lg text-center text-sm transition-all ${!ex.targetTime ? 'bg-secondary/30 border-transparent text-muted-foreground placeholder:text-muted-foreground/40' : 'bg-background'}`} />
                              </div>
                            </div>
                          </div>
                          {isLastInGroup && activeGroupId !== ex.groupId && (
                            <div className="flex justify-center -mt-1 mb-3 relative z-10 w-full">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] rounded-full border-primary/30 text-primary bg-background/90 shadow-sm hover:bg-primary/10 px-4 whitespace-nowrap"
                                onClick={() => {
                                  setActiveGroupId(ex.groupId!);
                                  setActiveGroupRounds(ex.groupRounds!);
                                  setActiveGroupRestTime(ex.groupRestTime || 60);
                                  const modal = document.querySelector('[role="dialog"]') || document.querySelector('.max-h-\\[90vh\\]');
                                  modal?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                + 이 서킷 블록에 추가
                              </Button>
                            </div>
                          )}
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

      {/* Folders UI */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveFolder('전체')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFolder === '전체' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
        >
          전체
        </button>
        {activeAllFolders.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFolder === folder ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
          >
            {folder}
          </button>
        ))}
        <button
          onClick={() => setActiveFolder('미분류')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeFolder === '미분류' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
        >
          미분류
        </button>
        <button
          onClick={() => setIsFolderManageOpen(true)}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary/30 text-muted-foreground hover:bg-secondary/80 border border-dashed border-border transition-colors ml-1"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Folder Management Dialog */}
      <Dialog open={isFolderManageOpen} onOpenChange={setIsFolderManageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>폴더 관리</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="새 폴더 이름"
                className="h-9 rounded-xl flex-1"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') handleAddFolder();
                }}
              />
              <Button size="sm" onClick={handleAddFolder} className="h-9 rounded-xl whitespace-nowrap px-4">추가</Button>
            </div>

            <div className="space-y-2 mt-4">
              {activeAllFolders.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4 bg-secondary/20 rounded-xl">생성된 폴더가 없습니다</p>
              )}
              {activeAllFolders.map(folder => (
                <div key={folder} className="flex items-center justify-between px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl">
                  {editingFolder === folder ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Folder className="w-4 h-4 text-primary shrink-0" />
                      <Input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="h-7 text-sm px-2 flex-1"
                        onKeyDown={(e) => {
                          if (e.nativeEvent.isComposing) return;
                          if (e.key === 'Enter') handleRenameFolder(folder);
                          if (e.key === 'Escape') setEditingFolder(null);
                        }}
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-primary" onClick={() => handleRenameFolder(folder)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-muted-foreground" onClick={() => setEditingFolder(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{folder}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => { setEditingFolder(folder); setEditFolderName(folder); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFolder(folder)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {
        filteredPrograms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">프로그램이 없습니다</h3>
            <p className="text-sm text-muted-foreground break-keep">운동 프로그램을 만들어<br />일관된 루틴을 유지하세요</p>
          </div>
        )
      }

      {/* Program Cards */}
      <div className="grid gap-4">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm gradient-border hover-lift">
            <CardContent className="p-0">
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{program.name}</h3>
                      {program.workoutStyle === 'amrap' && <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">🔥 AMRAP {program.timeLimit}분</Badge>}
                      {program.workoutStyle === 'emom' && <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">⏰ EMOM {program.timeLimit}분</Badge>}
                      {program.workoutStyle === 'rft' && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-bold">🏆 {program.targetRounds} Rounds</Badge>}
                    </div>
                    {program.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{program.description}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 -mr-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="폴더 이동">
                          <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs">폴더 선택</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleMoveToFolder(program.id, null)}
                          className={!(program.folder || programFolders[program.id]) ? 'bg-primary/10 text-primary font-medium' : ''}
                        >
                          미분류
                        </DropdownMenuItem>
                        {activeAllFolders.map(folder => (
                          <DropdownMenuItem
                            key={folder}
                            onClick={() => handleMoveToFolder(program.id, folder)}
                            className={(program.folder || programFolders[program.id]) === folder ? 'bg-primary/10 text-primary font-medium' : ''}
                          >
                            <Folder className="w-3.5 h-3.5 mr-2" />
                            {folder}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="복제" onClick={() => onCreateProgram(
                      `${program.name} (복사)`,
                      program.description || '',
                      program.daysOfWeek,
                      program.workoutStyle,
                      program.timeLimit,
                      program.targetRounds,
                      program.exercises.map(({ id, ...rest }) => rest),
                      program.folder || programFolders[program.id] || null,
                      program.note
                    )}>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEditClick(program)}>
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                      if (window.confirm('정말 이 프로그램을 삭제하시겠습니까? 삭제된 프로그램은 복구할 수 없습니다.')) {
                        onDeleteProgram(program.id);
                      }
                    }}>
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
                            {ex.groupRestTime && (
                              <Badge variant="secondary" className="bg-accent/20 text-accent border-none text-[10px] py-0">
                                ⏸ {ex.groupRestTime}초 휴식
                              </Badge>
                            )}
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
                            {ex.targetTime ? (
                              <span className="text-accent/90 px-2 py-0.5 rounded bg-accent/10">{ex.targetTime}초</span>
                            ) : null}

                            {(ex.targetSets > 0 || ex.targetReps > 0) && (
                              <span className="px-2 py-0.5 rounded bg-secondary">
                                {ex.targetSets > 0 ? `${ex.targetSets}×` : ''}{ex.targetReps > 0 ? ex.targetReps : ''}
                              </span>
                            )}

                            {ex.targetWeight > 0 && (
                              <span className="text-primary/80 px-2 py-0.5 rounded bg-primary/10">
                                {toDisplay(ex.targetWeight)}{unit}
                              </span>
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
    </div >
  );
}
