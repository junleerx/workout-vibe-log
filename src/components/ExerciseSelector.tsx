import { useState } from 'react';
import { exerciseTemplates, categoryColors } from '@/data/exercises';
import { ExerciseCategory } from '@/types/workout';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExerciseSelectorProps {
  onSelect: (name: string, category: ExerciseCategory) => void;
  onClose: () => void;
}

const categories: ExerciseCategory[] = ['가슴', '등', '어깨', '하체', '팔', '복근', '전신'];

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);

  const filteredExercises = exerciseTemplates.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container h-full flex flex-col py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">운동 추가</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
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
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.name}
              onClick={() => {
                onSelect(exercise.name, exercise.category);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl hover:bg-secondary transition-colors"
            >
              <span className="font-medium">{exercise.name}</span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  categoryColors[exercise.category]
                }`}
              >
                {exercise.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
