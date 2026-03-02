import { useOfflineContext } from '@/context/OfflineContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function SyncStatusBadge() {
  const { isOnline, isSyncing, syncError, lastSyncTime, retrySync, clearSyncError } = useOfflineContext();

  if (!isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <div className="animate-pulse">
            <WifiOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-400">오프라인 모드</p>
            <p className="text-xs text-slate-400 break-keep">변경사항은 자동으로 저장되며, 온라인 복귀 시 동기화됩니다.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isSyncing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40"
      >
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-700 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <div className="animate-spin">
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-300">동기화 중...</p>
            <p className="text-xs text-blue-200">변경사항을 업로드하고 있습니다.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (syncError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40"
      >
        <div className="bg-gradient-to-r from-red-900 to-red-800 border border-red-700 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-300">동기화 실패</p>
            <p className="text-xs text-red-200 break-keep truncate">{syncError}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={retrySync}
            className="h-6 px-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-700/50 flex-shrink-0"
          >
            재시도
          </Button>
          <button
            onClick={clearSyncError}
            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </motion.div>
    );
  }

  if (lastSyncTime) {
    const timeAgo = (now: Date, past: Date) => {
      const diff = now.getTime() - past.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);

      if (minutes < 1) return '방금';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      return format(past, 'M월 d일', { locale: ko });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40"
      >
        <div className="bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <Wifi className="w-4 h-4 text-green-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-300">동기화 완료</p>
            <p className="text-xs text-green-200">{timeAgo(new Date(), lastSyncTime)}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
