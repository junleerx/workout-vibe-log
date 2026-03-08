import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Workout } from '@/types/workout';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface DataExportProps {
  workouts: Workout[];
}

export function DataExport({ workouts }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { unit } = useWeightUnit();

  // UTC -> Local for consistent export behavior
  const getLocalDate = (isoString: string) => {
    const parts = isoString.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (workouts.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      const headers = ['날짜', '운동 이름', '부위', '세트 수', `총 볼륨(${unit})`, '운동 시간(초)', '컨디션(isPainful)'];
      
      const rows = workouts.flatMap(workout => {
        const dateDesc = format(getLocalDate(workout.date), 'yyyy-MM-dd', { locale: ko });
        return workout.exercises.map(ex => {
          const setsCount = ex.sets.length;
          const totalVolume = ex.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
          const hasPain = ex.sets.some(s => s.isPainful) ? 'Y' : 'N';
          return [dateDesc, ex.name, ex.category, setsCount, totalVolume, workout.duration || 0, hasPain].join(',');
        });
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workout_history_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="gap-2 rounded-xl text-xs h-9">
      <Download className="w-3.5 h-3.5" />
      데이터 내보내기 (CSV)
    </Button>
  );
}
