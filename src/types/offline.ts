export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resourceType: 'workout' | 'exercise' | 'set';
  resourceId: string;
  timestamp: number;
  data?: any;
  retries: number;
  lastAttempt?: number;
}

export interface StorageStats {
  workouts: number;
  syncQueue: number;
  lastCleanup?: number;
}
