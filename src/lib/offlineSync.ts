/**
 * Offline Sync Manager - مدير المزامنة للعمل بدون إنترنت
 * يتكامل مع IndexedDB لحفظ البيانات محلياً ومزامنتها عند عودة الاتصال
 */

import { offlineStorage } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';

// Types for sync operations
interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

interface CacheConfig {
  tables: string[];
  ttlMinutes: number;
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  tables: [
    'profiles',
    'organizations',
    'shipments',
    'customers',
    'drivers',
    'vehicles',
  ],
  ttlMinutes: 30,
};

class OfflineSyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    // Initialize offline storage
    offlineStorage.init().catch(console.error);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * التسجيل لمتابعة حالة الاتصال
   */
  onConnectionChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * التحقق من حالة الاتصال
   */
  get online(): boolean {
    return this.isOnline;
  }

  /**
   * التعامل مع عودة الاتصال
   */
  private async handleOnline(): Promise<void> {
    console.log('📶 Connection restored');
    this.isOnline = true;
    this.notifyListeners();
    
    // Sync pending actions
    await this.syncPendingActions();
  }

  /**
   * التعامل مع انقطاع الاتصال
   */
  private handleOffline(): void {
    console.log('📴 Connection lost');
    this.isOnline = false;
    this.notifyListeners();
  }

  /**
   * إشعار المستمعين بتغيير حالة الاتصال
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  /**
   * مزامنة الإجراءات المعلقة
   */
  async syncPendingActions(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress or offline'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          await offlineStorage.removePendingAction(action.id);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`${action.table}: ${error.message}`);
          
          // Update retry count
          await offlineStorage.updateActionRetries(action.id);
          
          // Remove if too many retries
          if (action.retries >= 5) {
            await offlineStorage.removePendingAction(action.id);
          }
        }
      }

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * تنفيذ إجراء معلق
   */
  private async executeAction(action: { type: string; table: string; data: any }): Promise<void> {
    const { type, table, data } = action;

    switch (type) {
      case 'create':
        await (supabase.from(table as any) as any).insert(data);
        break;
      case 'update':
        await (supabase.from(table as any) as any).update(data).eq('id', data.id);
        break;
      case 'delete':
        await (supabase.from(table as any) as any).delete().eq('id', data.id);
        break;
    }
  }

  /**
   * حفظ بيانات للاستخدام دون اتصال
   */
  async cacheData<T>(key: string, data: T, ttlMinutes: number = 30): Promise<void> {
    await offlineStorage.setCache(key, data, ttlMinutes * 60 * 1000);
  }

  /**
   * استرجاع بيانات مخزنة
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    return offlineStorage.getCache<T>(key);
  }

  /**
   * تخزين بيانات الجداول الأساسية للاستخدام دون اتصال
   */
  async cacheEssentialData(organizationId: string): Promise<void> {
    if (!this.isOnline) return;

    const config = DEFAULT_CACHE_CONFIG;

    for (const table of config.tables) {
      try {
        // Use type assertion to bypass strict table name checking
        const { data, error } = await (supabase
          .from(table as any)
          .select('*')
          .limit(500) as any);
        
        if (!error && data) {
          await this.cacheData(`${table}_cache`, data, config.ttlMinutes);
        }
      } catch (error) {
        console.error(`Failed to cache ${table}:`, error);
      }
    }
  }

  /**
   * إضافة إجراء معلق للمزامنة لاحقاً
   */
  async queueAction(type: 'create' | 'update' | 'delete', table: string, data: any): Promise<string> {
    return offlineStorage.addPendingAction({ type, table, data });
  }

  /**
   * حفظ مسودة
   */
  async saveDraft(formId: string, data: any): Promise<void> {
    await offlineStorage.saveDraft(formId, data);
  }

  /**
   * استرجاع مسودة
   */
  async getDraft<T>(formId: string): Promise<T | null> {
    return offlineStorage.getDraft<T>(formId);
  }

  /**
   * حذف مسودة
   */
  async clearDraft(formId: string): Promise<void> {
    await offlineStorage.removeDraft(formId);
  }

  /**
   * الحصول على إحصائيات التخزين المحلي
   */
  async getStats(): Promise<{
    pendingActions: number;
    cachedItems: number;
    drafts: number;
    isOnline: boolean;
  }> {
    const stats = await offlineStorage.getStats();
    return { ...stats, isOnline: this.isOnline };
  }

  /**
   * تنظيف البيانات المنتهية
   */
  async cleanup(): Promise<number> {
    return offlineStorage.cleanupExpiredCache();
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;
