import { useCallback, useState } from 'react';
import { Workout } from '@/types/workout';
import {
  generateWorkoutCsv,
  generateWorkoutJson,
  downloadFile,
  generateFilename,
  ExportOptions,
} from '@/lib/csvGenerator';
import { useToast } from './use-toast';
import { useWeightUnit } from './useWeightUnit';

interface ExportDialogState {
  isOpen: boolean;
  selectedFormat: 'csv' | 'json';
  includeStats: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export function useWorkoutExport() {
  const { toast } = useToast();
  const { unit } = useWeightUnit();
  const [isExporting, setIsExporting] = useState(false);

  const exportWorkouts = useCallback(
    async (
      workouts: Workout[],
      format: 'csv' | 'json',
      options: Partial<ExportOptions> = {}
    ): Promise<boolean> => {
      if (workouts.length === 0) {
        toast({
          title: '경고',
          description: '내보낼 운동 기록이 없습니다.',
          variant: 'destructive',
        });
        return false;
      }

      try {
        setIsExporting(true);

        const exportOptions: ExportOptions = {
          includeStats: options.includeStats ?? true,
          weightUnit: options.weightUnit ?? (unit as 'kg' | 'lbs'),
          startDate: options.startDate,
          endDate: options.endDate,
          memberName: options.memberName,
        };

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'csv') {
          content = generateWorkoutCsv(workouts, exportOptions);
          filename = generateFilename('csv', options.memberName);
          mimeType = 'text/csv;charset=utf-8;';
        } else {
          content = generateWorkoutJson(workouts, exportOptions);
          filename = generateFilename('json', options.memberName);
          mimeType = 'application/json;charset=utf-8;';
        }

        downloadFile(content, filename, mimeType);

        toast({
          title: '내보내기 완료',
          description: `${workouts.length}개의 운동 기록이 ${filename}로 저장되었습니다.`,
        });

        return true;
      } catch (error) {
        console.error('Export error:', error);
        toast({
          title: '오류',
          description: '파일 내보내기에 실패했습니다.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [toast, unit]
  );

  const exportSingleWorkout = useCallback(
    async (workout: Workout): Promise<boolean> => {
      return exportWorkouts([workout], 'csv', {
        includeStats: false,
      });
    },
    [exportWorkouts]
  );

  const exportWorkoutsByDateRange = useCallback(
    async (
      workouts: Workout[],
      startDate: Date,
      endDate: Date,
      format: 'csv' | 'json' = 'csv'
    ): Promise<boolean> => {
      const filtered = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= startDate && workoutDate <= endDate;
      });

      return exportWorkouts(filtered, format, {
        startDate,
        endDate,
        includeStats: true,
      });
    },
    [exportWorkouts]
  );

  return {
    exportWorkouts,
    exportSingleWorkout,
    exportWorkoutsByDateRange,
    isExporting,
  };
}
