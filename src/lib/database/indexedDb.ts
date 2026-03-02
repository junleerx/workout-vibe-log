import { Workout } from '@/types/workout';

const DB_NAME = 'workout-vibe-log-db';
const DB_VERSION = 1;

export interface StoredWorkout extends Workout {
  syncedAt?: number;
  isDraft?: boolean;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  workoutId: string;
  workoutData?: StoredWorkout;
  timestamp: number;
  retries: number;
}

export interface SyncMetadata {
  key: 'lastSync' | 'syncError' | 'isOnline';
  value: any;
  updatedAt: number;
}

export class IndexedDbManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create workouts object store
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('syncedAt', 'syncedAt', { unique: false });
          workoutStore.createIndex('isDraft', 'isDraft', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async saveWorkout(workout: StoredWorkout): Promise<void> {
    const tx = this.db!.transaction(['workouts'], 'readwrite');
    const store = tx.objectStore('workouts');
    const data = {
      ...workout,
      syncedAt: workout.syncedAt || Date.now(),
      isDraft: workout.isDraft || false,
    };
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getWorkout(id: string): Promise<StoredWorkout | undefined> {
    const tx = this.db!.transaction(['workouts'], 'readonly');
    const store = tx.objectStore('workouts');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllWorkouts(): Promise<StoredWorkout[]> {
    const tx = this.db!.transaction(['workouts'], 'readonly');
    const store = tx.objectStore('workouts');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getDraftWorkouts(): Promise<StoredWorkout[]> {
    const tx = this.db!.transaction(['workouts'], 'readonly');
    const store = tx.objectStore('workouts');
    const index = store.index('isDraft');
    return new Promise((resolve, reject) => {
      const request = index.getAll(true);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteWorkout(id: string): Promise<void> {
    const tx = this.db!.transaction(['workouts'], 'readwrite');
    const store = tx.objectStore('workouts');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllWorkouts(): Promise<void> {
    const tx = this.db!.transaction(['workouts'], 'readwrite');
    const store = tx.objectStore('workouts');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Sync Queue Management
  async addSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const tx = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const tx = this.db!.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const tx = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearSyncQueue(): Promise<void> {
    const tx = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const item = await this.getSyncQueueItem(id);
    if (!item) return;

    const updated = { ...item, ...updates };
    const tx = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueueItem(id: string): Promise<SyncQueueItem | undefined> {
    const tx = this.db!.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Metadata Management
  async setMetadata(key: 'lastSync' | 'syncError' | 'isOnline', value: any): Promise<void> {
    const tx = this.db!.transaction(['metadata'], 'readwrite');
    const store = tx.objectStore('metadata');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMetadata(key: 'lastSync' | 'syncError' | 'isOnline'): Promise<any> {
    const tx = this.db!.transaction(['metadata'], 'readonly');
    const store = tx.objectStore('metadata');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as SyncMetadata | undefined;
        resolve(result?.value ?? null);
      };
    });
  }

  async clearMetadata(): Promise<void> {
    const tx = this.db!.transaction(['metadata'], 'readwrite');
    const store = tx.objectStore('metadata');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Database stats
  async getStorageStats(): Promise<{ workouts: number; syncQueue: number }> {
    const workouts = await this.getAllWorkouts();
    const syncQueue = await this.getSyncQueue();
    return {
      workouts: workouts.length,
      syncQueue: syncQueue.length,
    };
  }
}

export const dbManager = new IndexedDbManager();
