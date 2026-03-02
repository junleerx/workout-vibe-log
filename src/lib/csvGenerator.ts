import { Workout } from '@/types/workout';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface ExportOptions {
  includeStats: boolean;
  weightUnit: 'kg' | 'lbs';
  startDate?: Date;
  endDate?: Date;
  memberName?: string;
}

/**
 * Convert weight from kg to lbs
 */
function convertKgToLbs(kg: number): number {
  return Math.round((kg * 2.20462) * 10) / 10;
}

/**
 * Format weight value based on unit preference
 */
function formatWeight(weightKg: number, unit: 'kg' | 'lbs'): string {
  if (weightKg === 0) return '';
  const value = unit === 'lbs' ? convertKgToLbs(weightKg) : weightKg;
  return value.toString();
}

/**
 * Escape CSV special characters
 */
function escapeCsvValue(value: string | number): string {
  const stringValue = value.toString();
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Generate CSV content from workouts
 */
export function generateWorkoutCsv(workouts: Workout[], options: ExportOptions): string {
  const lines: string[] = [];

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';

  // Filter workouts by date range
  let filteredWorkouts = workouts;
  if (options.startDate || options.endDate) {
    filteredWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      if (options.startDate && workoutDate < options.startDate) return false;
      if (options.endDate && workoutDate > options.endDate) return false;
      return true;
    });
  }

  // CSV Header
  const headers = [
    '날짜',
    '운동명',
    '부위',
    '세트',
    `무게(${options.weightUnit.toUpperCase()})`,
    '횟수',
    '완료',
  ];
  lines.push(headers.map(escapeCsvValue).join(','));

  // Workout data rows
  for (const workout of filteredWorkouts) {
    const dateStr = format(new Date(workout.date), 'yyyy-MM-dd', { locale: ko });

    if (workout.exercises.length === 0) {
      // Workout with no exercises
      lines.push([
        escapeCsvValue(dateStr),
        '',
        '',
        '',
        '',
        '',
        '',
      ].join(','));
    } else {
      // Workout with exercises
      for (const exercise of workout.exercises) {
        if (exercise.sets.length === 0) {
          // Exercise with no sets
          lines.push([
            escapeCsvValue(dateStr),
            escapeCsvValue(exercise.name),
            escapeCsvValue(exercise.category),
            '',
            '',
            '',
            '',
          ].join(','));
        } else {
          // Exercise with sets
          for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
            const set = exercise.sets[setIndex];
            lines.push([
              escapeCsvValue(dateStr),
              escapeCsvValue(exercise.name),
              escapeCsvValue(exercise.category),
              escapeCsvValue(setIndex + 1),
              formatWeight(set.weight, options.weightUnit),
              set.reps > 0 ? escapeCsvValue(set.reps) : '',
              set.completed ? 'Y' : 'N',
            ].join(','));
          }
        }
      }
    }
  }

  // Add summary statistics if requested
  if (options.includeStats && filteredWorkouts.length > 0) {
    lines.push(''); // Blank line
    lines.push('=== 통계 ===');

    const stats = {
      totalWorkouts: filteredWorkouts.length,
      totalExercises: filteredWorkouts.reduce((sum, w) => sum + w.exercises.length, 0),
      totalSets: filteredWorkouts.reduce(
        (sum, w) => sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0),
        0
      ),
      totalVolume: filteredWorkouts.reduce(
        (sum, w) => sum + w.exercises.reduce(
          (exSum, ex) => exSum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0),
          0
        ),
        0
      ),
      totalDuration: filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
    };

    lines.push(`총 운동 일수,${stats.totalWorkouts}`);
    lines.push(`총 운동 개수,${stats.totalExercises}`);
    lines.push(`총 세트 수,${stats.totalSets}`);
    lines.push(`총 볼륨(${options.weightUnit.toUpperCase()}),${formatWeight(stats.totalVolume, options.weightUnit)}`);

    const hours = Math.floor(stats.totalDuration / 3600);
    const minutes = Math.floor((stats.totalDuration % 3600) / 60);
    lines.push(`총 운동 시간,${hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`}`);
  }

  return BOM + lines.join('\n');
}

/**
 * Generate JSON export for backup
 */
export function generateWorkoutJson(workouts: Workout[], options: ExportOptions): string {
  let filteredWorkouts = workouts;

  if (options.startDate || options.endDate) {
    filteredWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      if (options.startDate && workoutDate < options.startDate) return false;
      if (options.endDate && workoutDate > options.endDate) return false;
      return true;
    });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    count: filteredWorkouts.length,
    unit: options.weightUnit,
    workouts: filteredWorkouts,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Trigger file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const link = document.createElement('a');
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateFilename(format: 'csv' | 'json', memberName?: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const suffix = memberName ? `_${memberName}` : '';
  const ext = format === 'csv' ? 'csv' : 'json';
  return `운동기록${suffix}_${dateStr}.${ext}`;
}
