import { useState } from 'react';
import { Workout } from '@/types/workout';
import { useWorkoutExport } from '@/hooks/useWorkoutExport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: Workout[];
  selectedMemberName?: string;
}

export function ExportDialog({
  isOpen,
  onOpenChange,
  workouts,
  selectedMemberName,
}: ExportDialogProps) {
  const { exportWorkouts, isExporting } = useWorkoutExport();
  const { unit } = useWeightUnit();

  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includeStats, setIncludeStats] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '1month' | '3month' | '6month' | '1year'>('all');

  const getDateRangeFilter = (): { startDate?: Date; endDate?: Date } => {
    const now = new Date();
    switch (dateRange) {
      case '1month':
        return { startDate: subMonths(now, 1), endDate: now };
      case '3month':
        return { startDate: subMonths(now, 3), endDate: now };
      case '6month':
        return { startDate: subMonths(now, 6), endDate: now };
      case '1year':
        return { startDate: subMonths(now, 12), endDate: now };
      default:
        return {};
    }
  };

  const filteredWorkouts = (() => {
    if (dateRange === 'all') return workouts;
    const { startDate, endDate } = getDateRangeFilter();
    return workouts.filter(w => {
      const wDate = new Date(w.date);
      return (
        (!startDate || wDate >= startDate) &&
        (!endDate || wDate <= endDate)
      );
    });
  })();

  const handleExport = async () => {
    const { startDate, endDate } = getDateRangeFilter();
    await exportWorkouts(filteredWorkouts, format, {
      includeStats,
      weightUnit: unit as 'kg' | 'lbs',
      startDate,
      endDate,
      memberName: selectedMemberName,
    });
    onOpenChange(false);
  };

  const getDateRangeLabel = (): string => {
    if (dateRange === 'all') return '전체 기간';
    const { startDate } = getDateRangeFilter();
    if (startDate) {
      return `${format(startDate, 'yyyy.MM.dd', { locale: ko })} ~ 현재`;
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>운동 기록 내보내기</DialogTitle>
          <DialogDescription>
            원하는 형식으로 운동 기록을 다운로드하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format-select">파일 형식</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
              <SelectTrigger id="format-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  CSV (Excel, Google Sheets)
                </SelectItem>
                <SelectItem value="json">
                  JSON (백업용)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {format === 'csv'
                ? 'Excel이나 Google Sheets에서 열 수 있습니다.'
                : '데이터 백업이나 다른 애플리케이션으로 가져오기에 사용합니다.'}
            </p>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label htmlFor="date-range-select">기간</Label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger id="date-range-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="1month">최근 1개월</SelectItem>
                <SelectItem value="3month">최근 3개월</SelectItem>
                <SelectItem value="6month">최근 6개월</SelectItem>
                <SelectItem value="1year">최근 1년</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabel()}
            </p>
          </div>

          {/* Statistics Option */}
          {format === 'csv' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-stats"
                checked={includeStats}
                onCheckedChange={(checked) => setIncludeStats(checked === true)}
              />
              <Label htmlFor="include-stats" className="cursor-pointer">
                통계 포함
              </Label>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-secondary/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">내보낼 운동:</span>
              <span className="font-semibold">{filteredWorkouts.length}개</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">총 운동 세트:</span>
              <span className="font-semibold">
                {filteredWorkouts.reduce(
                  (sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0),
                  0
                )}개
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">파일 형식:</span>
              <span className="font-semibold">{format.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || filteredWorkouts.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                진행 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                다운로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
