import { useState } from 'react';
import { exerciseTemplates, categoryColors } from '@/data/exercises';
import { ExerciseCategory } from '@/types/workout';
import { CustomExercise } from '@/types/member';
import { Search, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExerciseSelectorProps {
  onSelect: (name: string, category: ExerciseCategory) => void;
  onClose: () => void;
  customExercises?: CustomExercise[];
  onAddCustomExercise?: (name: string, category: string) => Promise<CustomExercise | undefined>;
}

const categories: ExerciseCategory[] = ['가슴', '등', '어깨', '하체', '팔', '복근', '전신'];

export function ExerciseSelector({ 
  onSelect, 
  onClose, 
  customExercises = [],
  onAddCustomExercise,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<ExerciseCategory>('가슴');
  const [isAdding, setIsAdding] = useState(false);

  // Combine default exercises with custom exercises
  const allExercises = [
    ...exerciseTemplates,
    ...customExercises.map(ex => ({
      name: ex.name,
      category: ex.category as ExerciseCategory,
      isCustom: true,
    })),
  ];

  const filteredExercises = allExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCustomExercise = async () => {
    if (!newExerciseName.trim() || !onAddCustomExercise) return;
    
    setIsAdding(true);
    const exercise = await onAddCustomExercise(newExerciseName.trim(), newExerciseCategory);
    if (exercise) {
      setNewExerciseName('');
      setNewExerciseCategory('가슴');
      setShowAddDialog(false);
    }
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container h-full flex flex-col py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">운동 추가</h2>
          <div className="flex items-center gap-2">
            {onAddCustomExercise && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    직접 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>커스텀 운동 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">운동 이름</label>
                      <Input
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="운동 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">카테고리</label>
                      <Select 
                        value={newExerciseCategory} 
                        onValueChange={(value) => setNewExerciseCategory(value as ExerciseCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddCustomExercise}
                      disabled={!newExerciseName.trim() || isAdding}
                      className="w-full"
                    >
                      {isAdding ? '추가 중...' : '운동 추가'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="운동 검색..."
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredExercises.map((exercise, index) => (
            <button
              key={`${exercise.name}-${index}`}
              onClick={() => {
                onSelect(exercise.name, exercise.category);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{exercise.name}</span>
                {'isCustom' in exercise && exercise.isCustom && (
                  <span className="text-xs text-muted-foreground">(커스텀)</span>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  categoryColors[exercise.category]
                }`}
              >
                {exercise.category}
              </span>
            </button>
          ))}
          
          {filteredExercises.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
              {onAddCustomExercise && (
                <p className="text-sm text-muted-foreground mt-2">
                  "직접 추가" 버튼으로 새 운동을 추가해보세요.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
