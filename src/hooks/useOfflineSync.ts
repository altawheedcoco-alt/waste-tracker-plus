/**
 * useOfflineSync v2 - مزامنة ذكية مستوحاة من واتساب
 * يدير آلاف العمليات المعلقة ويزامنها بالترتيب عند عودة الاتصال
 * - مزامنة دفعية (batch) مع الحفاظ على الترتيب
 * - أولويات: رسائل الدردشة أولاً ثم العمليات العادية
 * - إعادة محاولة ذكية مع تراجع أسي
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, PendingAction } from '@/lib/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  errors: string[];
  /** عدد العمليات المزامنة في الدفعة الحالية */
  syncedInBatch: number;
  /** تقدم المزامنة الحالية */
  syncProgress: number;
}

const BATCH_SIZE = 20; // عدد العمليات في كل دفعة
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 3000, 10000, 30000, 60000]; // تراجع أسي

export const useOfflineSync = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
    syncedInBatch: 0,
    syncProgress: 0,
  });
  
  const { isOnline } = useNetworkStatus();
  const syncInProgress = useRef(false);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  const updatePendingCount = useCallback(async () => {
    try {
      const stats = await offlineStorage.getStats();
      setStatus(prev => ({ ...prev, pendingCount: stats.pendingActions }));
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  /**
   * تنفيذ إجراء واحد على قاعدة البيانات
   */
  const executeAction = useCallback(async (action: PendingAction): Promise<void> => {
    const { type, table, data } = action;

    switch (type) {
      case 'create': {
        // إزالة الحقول المؤقتة
        const cleanData = { ...data };
        delete cleanData._tempId;
        delete cleanData._status;
        delete cleanData._offlineId;
        
        const { error } = await supabase.from(table as any).insert(cleanData);
        if (error) throw error;
        break;
      }
      case 'update': {
        const { id: recordId, ...updates } = data.updates || data;
        const targetId = data.id || recordId;
        const { error } = await supabase.from(table as any).update(updates).eq('id', targetId);
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await supabase.from(table as any).delete().eq('id', data.id);
        if (error) throw error;
        break;
      }
    }
  }, []);

  /**
   * مزامنة دفعية مع الحفاظ على الترتيب
   */
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setStatus(prev => ({ ...prev, isSyncing: true, errors: [], syncedInBatch: 0, syncProgress: 0 }));
    
    try {
      const allActions = await offlineStorage.getPendingActions();
      
      if (allActions.length === 0) {
        setStatus(prev => ({ ...prev, isSyncing: false, lastSyncAt: new Date(), pendingCount: 0 }));
        return;
      }

      const errors: string[] = [];
      let totalSynced = 0;
      const totalActions = allActions.length;

      // معالجة في دفعات مع الحفاظ على الترتيب
      for (let batchStart = 0; batchStart < allActions.length; batchStart += BATCH_SIZE) {
        if (!navigator.onLine) {
          console.log('[OfflineSync] فقدان الاتصال أثناء المزامنة');
          break;
        }

        const batch = allActions.slice(batchStart, batchStart + BATCH_SIZE);
        
        // تنفيذ الدفعة بالتسلسل للحفاظ على الترتيب
        for (const action of batch) {
          if (!navigator.onLine) break;

          // تجاهل العمليات التي فشلت كثيراً
          if (action.retries >= MAX_RETRIES) {
            errors.push(`تجاوز الحد: ${action.type} على ${action.table}`);
            await offlineStorage.removePendingAction(action.id);
            continue;
          }

          try {
            // تحديث الحالة إلى "جاري المزامنة"
            await offlineStorage.updateActionStatus(action.id, 'syncing');
            
            await executeAction(action);
            
            // نجاح - حذف من القائمة
            await offlineStorage.removePendingAction(action.id);
            totalSynced++;

            setStatus(prev => ({
              ...prev,
              syncedInBatch: totalSynced,
              syncProgress: Math.round((totalSynced / totalActions) * 100),
            }));
          } catch (error: any) {
            console.error(`[OfflineSync] فشل ${action.id}:`, error);
            await offlineStorage.updateActionRetries(action.id);
            errors.push(`فشل ${action.type} على ${action.table}: ${error.message?.slice(0, 50)}`);
          }
        }
      }

      if (totalSynced > 0) {
        toast.success(`تمت مزامنة ${totalSynced} عملية بنجاح`);
      }

      if (errors.length > 0 && errors.length <= 3) {
        toast.error(`فشلت ${errors.length} عملية أثناء المزامنة`);
      }

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        errors,
        syncProgress: 100,
      }));
      
      await updatePendingCount();

      // إذا بقيت عمليات فاشلة، أعد المحاولة بعد تأخير
      const remaining = await offlineStorage.getPendingActions();
      if (remaining.length > 0 && navigator.onLine) {
        const minRetries = Math.min(...remaining.map(a => a.retries));
        const delay = RETRY_DELAYS[Math.min(minRetries, RETRY_DELAYS.length - 1)];
        retryTimer.current = setTimeout(() => {
          syncInProgress.current = false;
          syncPendingActions();
        }, delay);
      }
    } catch (error) {
      console.error('[OfflineSync] خطأ عام:', error);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: ['فشل في المزامنة'],
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, updatePendingCount, executeAction]);

  /**
   * إضافة إجراء للقائمة المعلقة
   */
  const queueAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any,
    options?: { priority?: PendingAction['priority']; originalCreatedAt?: string; userId?: string; meta?: Record<string, any> }
  ): Promise<string> => {
    const id = await offlineStorage.addPendingAction({
      type,
      table,
      data,
      priority: options?.priority,
      originalCreatedAt: options?.originalCreatedAt,
      userId: options?.userId,
      meta: options?.meta,
    });
    await updatePendingCount();
    
    // مزامنة فورية إذا متصل
    if (isOnline) {
      // تأخير صغير لتجميع عدة عمليات
      setTimeout(() => syncPendingActions(), 100);
    } else {
      toast.info('تم حفظ العملية. ستتم المزامنة عند استعادة الاتصال.', { duration: 2000 });
    }
    
    return id;
  }, [isOnline, syncPendingActions, updatePendingCount]);

  const saveDraft = useCallback(async (id: string, data: any) => {
    await offlineStorage.saveDraft(id, data);
  }, []);

  const getDraft = useCallback(async <T>(id: string): Promise<T | null> => {
    return offlineStorage.getDraft<T>(id);
  }, []);

  const removeDraft = useCallback(async (id: string) => {
    await offlineStorage.removeDraft(id);
  }, []);

  // تهيئة
  useEffect(() => {
    offlineStorage.init().then(() => {
      updatePendingCount();
      offlineStorage.cleanupExpiredCache();
    });
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [updatePendingCount]);

  // مزامنة فورية عند عودة الاتصال
  useEffect(() => {
    if (isOnline && status.pendingCount > 0 && !syncInProgress.current) {
      console.log(`[OfflineSync] عودة الاتصال — مزامنة ${status.pendingCount} عملية...`);
      syncPendingActions();
    }
  }, [isOnline, status.pendingCount, syncPendingActions]);

  return {
    ...status,
    isOnline,
    queueAction,
    syncNow: syncPendingActions,
    saveDraft,
    getDraft,
    removeDraft,
  };
};

export default useOfflineSync;
