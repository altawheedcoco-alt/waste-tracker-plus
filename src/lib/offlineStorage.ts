/**
 * Offline Storage - نظام التخزين المحلي للعمل بدون إنترنت
 * يستخدم IndexedDB للتخزين المستمر
 */

const DB_NAME = 'irecycle_offline';
const DB_VERSION = 1;

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * تهيئة قاعدة البيانات
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // مخزن الإجراءات المعلقة
        if (!db.objectStoreNames.contains('pending_actions')) {
          const pendingStore = db.createObjectStore('pending_actions', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('table', 'table', { unique: false });
        }

        // مخزن البيانات المؤقتة
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // مخزن المسودات
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * التأكد من التهيئة
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ==================== الإجراءات المعلقة ====================

  /**
   * إضافة إجراء معلق
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const db = await this.ensureInit();
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const request = store.add(pendingAction);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * الحصول على جميع الإجراءات المعلقة
   */
  async getPendingActions(): Promise<PendingAction[]> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readonly');
      const store = tx.objectStore('pending_actions');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * حذف إجراء معلق
   */
  async removePendingAction(id: string): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * تحديث محاولات الإجراء
   */
  async updateActionRetries(id: string): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.retries++;
          store.put(action);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ==================== التخزين المؤقت ====================

  /**
   * تخزين بيانات مؤقتة
   */
  async setCache(key: string, data: any, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    const db = await this.ensureInit();
    
    const cached: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const request = store.put(cached);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * استرجاع بيانات مؤقتة
   */
  async getCache<T>(key: string): Promise<T | null> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const cached = request.result as CachedData | undefined;
        if (!cached || cached.expiresAt < Date.now()) {
          resolve(null);
        } else {
          resolve(cached.data as T);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * حذف بيانات مؤقتة
   */
  async removeCache(key: string): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * تنظيف البيانات المنتهية
   */
  async cleanupExpiredCache(): Promise<number> {
    const db = await this.ensureInit();
    const now = Date.now();
    let deleted = 0;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deleted++;
          cursor.continue();
        }
      };
      
      tx.oncomplete = () => resolve(deleted);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== المسودات ====================

  /**
   * حفظ مسودة
   */
  async saveDraft(id: string, data: any): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.put({ id, data, timestamp: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * استرجاع مسودة
   */
  async getDraft<T>(id: string): Promise<T | null> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * حذف مسودة
   */
  async removeDraft(id: string): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== الإحصائيات ====================

  /**
   * الحصول على إحصائيات التخزين
   */
  async getStats(): Promise<{
    pendingActions: number;
    cachedItems: number;
    drafts: number;
  }> {
    const db = await this.ensureInit();
    
    const getCount = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [pendingActions, cachedItems, drafts] = await Promise.all([
      getCount('pending_actions'),
      getCount('cache'),
      getCount('drafts'),
    ]);

    return { pendingActions, cachedItems, drafts };
  }
}

// مثيل مشترك
export const offlineStorage = new OfflineStorage();

export default offlineStorage;
