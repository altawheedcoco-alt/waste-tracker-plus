/**
 * Offline Storage v2 - نظام التخزين المحلي المتقدم
 * يدعم آلاف العمليات المعلقة مع الترتيب الزمني الصحيح
 * مستوحى من نظام واتساب للعمل بدون إنترنت
 */

const DB_NAME = 'irecycle_offline';
const DB_VERSION = 2; // ترقية لإضافة مخازن جديدة

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  /** ترتيب تسلسلي لضمان المزامنة بالترتيب الصحيح */
  sequence: number;
  /** حالة العملية: pending, syncing, failed, synced */
  status: 'pending' | 'syncing' | 'failed';
  /** معرف المستخدم */
  userId?: string;
  /** بيانات إضافية للسياق */
  meta?: Record<string, any>;
  /** تاريخ الإنشاء الأصلي (للحفاظ على ترتيب الرسائل) */
  originalCreatedAt?: string;
  /** أولوية: critical تُزامن أولاً */
  priority: 'critical' | 'high' | 'normal';
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

/** عداد تسلسلي مستمر لضمان الترتيب حتى مع نفس الـ timestamp */
let sequenceCounter = 0;

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        // تحميل آخر عداد تسلسلي
        this.loadSequenceCounter().then(resolve).catch(resolve);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        if (oldVersion < 1) {
          // مخزن الإجراءات المعلقة
          const pendingStore = db.createObjectStore('pending_actions', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('table', 'table', { unique: false });
          pendingStore.createIndex('sequence', 'sequence', { unique: false });
          pendingStore.createIndex('priority', 'priority', { unique: false });
          pendingStore.createIndex('status', 'status', { unique: false });

          // مخزن البيانات المؤقتة
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });

          // مخزن المسودات
          db.createObjectStore('drafts', { keyPath: 'id' });

          // مخزن بيانات Meta
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        
        if (oldVersion < 2) {
          // ترقية: إضافة فهارس جديدة إن لم تكن موجودة
          if (db.objectStoreNames.contains('pending_actions')) {
            try {
              const tx = (event.target as IDBOpenDBRequest).transaction!;
              const store = tx.objectStore('pending_actions');
              if (!store.indexNames.contains('sequence')) {
                store.createIndex('sequence', 'sequence', { unique: false });
              }
              if (!store.indexNames.contains('priority')) {
                store.createIndex('priority', 'priority', { unique: false });
              }
              if (!store.indexNames.contains('status')) {
                store.createIndex('status', 'status', { unique: false });
              }
            } catch {
              // الفهارس موجودة بالفعل
            }
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        }
      };
    });
  }

  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.isInitialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /** تحميل العداد التسلسلي */
  private async loadSequenceCounter(): Promise<void> {
    try {
      const db = this.db!;
      if (!db.objectStoreNames.contains('meta')) return;
      return new Promise((resolve) => {
        const tx = db.transaction('meta', 'readonly');
        const store = tx.objectStore('meta');
        const req = store.get('sequence_counter');
        req.onsuccess = () => {
          sequenceCounter = req.result?.value || 0;
          resolve();
        };
        req.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /** حفظ العداد التسلسلي */
  private async saveSequenceCounter(): Promise<void> {
    try {
      const db = await this.ensureInit();
      if (!db.objectStoreNames.contains('meta')) return;
      return new Promise((resolve) => {
        const tx = db.transaction('meta', 'readwrite');
        const store = tx.objectStore('meta');
        store.put({ key: 'sequence_counter', value: sequenceCounter });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  }

  // ==================== الإجراءات المعلقة ====================

  /**
   * إضافة إجراء معلق مع ترتيب تسلسلي
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries' | 'sequence' | 'status' | 'priority'> & { priority?: PendingAction['priority'] }): Promise<string> {
    const db = await this.ensureInit();
    sequenceCounter++;
    await this.saveSequenceCounter();
    
    const id = `action_${Date.now()}_${sequenceCounter}_${Math.random().toString(36).substr(2, 6)}`;
    
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
      sequence: sequenceCounter,
      status: 'pending',
      priority: action.priority || 'normal',
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
   * الحصول على جميع الإجراءات المعلقة مرتبة بالتسلسل
   * الأولوية الحرجة أولاً، ثم حسب الترتيب التسلسلي
   */
  async getPendingActions(): Promise<PendingAction[]> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readonly');
      const store = tx.objectStore('pending_actions');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const actions = (request.result as PendingAction[])
          .filter(a => a.status !== 'syncing' || Date.now() - a.timestamp > 60000) // أعد المحاولة إذا مرت دقيقة
          .sort((a, b) => {
            // الأولوية أولاً
            const priorityOrder = { critical: 0, high: 1, normal: 2 };
            const pA = priorityOrder[a.priority || 'normal'] ?? 2;
            const pB = priorityOrder[b.priority || 'normal'] ?? 2;
            if (pA !== pB) return pA - pB;
            // ثم الترتيب التسلسلي
            return (a.sequence || a.timestamp) - (b.sequence || b.timestamp);
          });
        resolve(actions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * الحصول على الإجراءات المعلقة لجدول معين
   */
  async getPendingActionsByTable(table: string): Promise<PendingAction[]> {
    const actions = await this.getPendingActions();
    return actions.filter(a => a.table === table);
  }

  /**
   * تحديث حالة إجراء
   */
  async updateActionStatus(id: string, status: PendingAction['status']): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      const getReq = store.get(id);
      
      getReq.onsuccess = () => {
        const action = getReq.result;
        if (action) {
          action.status = status;
          store.put(action);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
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
   * حذف إجراءات متعددة دفعة واحدة
   */
  async removePendingActions(ids: string[]): Promise<void> {
    const db = await this.ensureInit();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_actions', 'readwrite');
      const store = tx.objectStore('pending_actions');
      ids.forEach(id => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
          action.status = 'failed';
          store.put(action);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ==================== التخزين المؤقت ====================

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

  async getStats(): Promise<{
    pendingActions: number;
    cachedItems: number;
    drafts: number;
  }> {
    const db = await this.ensureInit();
    
    const getCount = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } catch {
          resolve(0);
        }
      });
    };

    const [pendingActions, cachedItems, drafts] = await Promise.all([
      getCount('pending_actions'),
      getCount('cache'),
      getCount('drafts'),
    ]);

    return { pendingActions, cachedItems, drafts };
  }

  /**
   * إحصائيات مفصلة حسب الجدول
   */
  async getDetailedStats(): Promise<{
    pendingActions: number;
    byTable: Record<string, number>;
    byPriority: Record<string, number>;
    oldestPending: Date | null;
  }> {
    const actions = await this.getPendingActions();
    const byTable: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    actions.forEach(a => {
      byTable[a.table] = (byTable[a.table] || 0) + 1;
      byPriority[a.priority || 'normal'] = (byPriority[a.priority || 'normal'] || 0) + 1;
    });

    return {
      pendingActions: actions.length,
      byTable,
      byPriority,
      oldestPending: actions.length > 0 ? new Date(actions[0].timestamp) : null,
    };
  }
}

// مثيل مشترك
export const offlineStorage = new OfflineStorage();
export default offlineStorage;
