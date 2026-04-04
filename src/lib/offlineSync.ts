/**
 * Offline Sync Manager v2 - مدير المزامنة المحسّن
 * يتكامل مع offlineStorage v2 لدعم الترتيب والأولويات
 */

import { offlineStorage } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class OfflineSyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    offlineStorage.init().catch(console.error);
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  onConnectionChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  get online(): boolean {
    return this.isOnline;
  }

  private async handleOnline(): Promise<void> {
    console.log('📶 Connection restored');
    this.isOnline = true;
    this.notifyListeners();
    await this.syncPendingActions();
  }

  private handleOffline(): void {
    console.log('📴 Connection lost');
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  async syncPendingActions(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync in progress or offline'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await offlineStorage.updateActionStatus(action.id, 'syncing');
          await this.executeAction(action);
          await offlineStorage.removePendingAction(action.id);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`${action.table}: ${error.message}`);
          await offlineStorage.updateActionRetries(action.id);
          
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

  private async executeAction(action: { type: string; table: string; data: any; meta?: Record<string, any> }): Promise<void> {
    const { type, table, data, meta } = action;

    switch (type) {
      case 'create':
        if (meta?.upsert) {
          const { error } = await (supabase.from(table as any) as any).upsert(data);
          if (error) throw error;
        } else {
          const cleanData = { ...data };
          delete cleanData._tempId;
          delete cleanData._status;
          delete cleanData._offlineId;
          const { error } = await (supabase.from(table as any) as any).insert(cleanData);
          if (error) throw error;
        }
        break;
      case 'update': {
        const updates = data.updates || data;
        const id = data.id;
        const { error } = await (supabase.from(table as any) as any).update(updates).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await (supabase.from(table as any) as any).delete().eq('id', data.id);
        if (error) throw error;
        break;
      }
    }
  }

  async cacheData<T>(key: string, data: T, ttlMinutes: number = 30): Promise<void> {
    await offlineStorage.setCache(key, data, ttlMinutes * 60 * 1000);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return offlineStorage.getCache<T>(key);
  }

  async cacheEssentialData(organizationId: string): Promise<void> {
    if (!this.isOnline) return;

    const tables = ['profiles', 'organizations', 'shipments', 'invoices', 'waste_types'];

    for (const table of tables) {
      try {
        const { data, error } = await (supabase.from(table as any).select('*').limit(500) as any);
        if (!error && data) {
          await this.cacheData(`${table}_cache`, data, 30);
        }
      } catch (error) {
        console.error(`Failed to cache ${table}:`, error);
      }
    }
  }

  async queueAction(type: 'create' | 'update' | 'delete', table: string, data: any): Promise<string> {
    return offlineStorage.addPendingAction({ type, table, data });
  }

  async saveDraft(formId: string, data: any): Promise<void> {
    await offlineStorage.saveDraft(formId, data);
  }

  async getDraft<T>(formId: string): Promise<T | null> {
    return offlineStorage.getDraft<T>(formId);
  }

  async clearDraft(formId: string): Promise<void> {
    await offlineStorage.removeDraft(formId);
  }

  async getStats(): Promise<{
    pendingActions: number;
    cachedItems: number;
    drafts: number;
    isOnline: boolean;
  }> {
    const stats = await offlineStorage.getStats();
    return { ...stats, isOnline: this.isOnline };
  }

  async cleanup(): Promise<number> {
    return offlineStorage.cleanupExpiredCache();
  }
}

export const offlineSyncManager = new OfflineSyncManager();
export default offlineSyncManager;
