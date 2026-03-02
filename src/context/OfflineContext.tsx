import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dbManager } from '@/lib/database/indexedDb';

export interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  retrySync: () => Promise<void>;
  clearSyncError: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize offline context
  useEffect(() => {
    const init = async () => {
      try {
        await dbManager.init();

        // Set initial online status
        setIsOnline(navigator.onLine);

        // Load last sync time
        const lastSync = await dbManager.getMetadata('lastSync');
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      } catch (error) {
        console.error('Failed to initialize offline context:', error);
      }
    };

    init();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Going online');
      setIsOnline(true);
      setSyncError(null);
    };

    const handleOffline = () => {
      console.log('[Offline] Going offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retrySync = useCallback(async () => {
    // This will be called by useOfflineSync hook
    // Placeholder for now
    console.log('[Offline] Sync retry requested');
  }, []);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    retrySync,
    clearSyncError,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineContext must be used within OfflineProvider');
  }
  return context;
}
