/**
 * useOfflineSync - Hook للمزامنة عند استعادة الاتصال
 * يدير الإجراءات المعلقة ويعيد تنفيذها
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  errors: string[];
}

export const useOfflineSync = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
  });
  
  const { isOnline } = useNetworkStatus();
  const syncInProgress = useRef(false);

  /**
   * تحديث عدد الإجراءات المعلقة
   */
  const updatePendingCount = useCallback(async () => {
    try {
      const stats = await offlineStorage.getStats();
      setStatus(prev => ({ ...prev, pendingCount: stats.pendingActions }));
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  /**
   * مزامنة الإجراءات المعلقة
   */
  const syncPendingActions = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setStatus(prev => ({ ...prev, isSyncing: true, errors: [] }));
    
    try {
      const actions = await offlineStorage.getPendingActions();
      
      if (actions.length === 0) {
        setStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSyncAt: new Date() 
        }));
        return;
      }

      const errors: string[] = [];
      let successCount = 0;

      for (const action of actions) {
        try {
          // تجاهل الإجراءات التي فشلت كثيراً
          if (action.retries >= 3) {
            errors.push(`فشل ${action.type} على ${action.table}: تجاوز عدد المحاولات`);
            await offlineStorage.removePendingAction(action.id);
            continue;
          }

          // تنفيذ الإجراء باستخدام rpc أو طريقة عامة
          let error = null;
          switch (action.type) {
            case 'create':
              const insertResult = await supabase
                .from(action.table as any)
                .insert(action.data);
              error = insertResult.error;
              break;
            case 'update':
              const updateResult = await supabase
                .from(action.table as any)
                .update(action.data.updates)
                .eq('id', action.data.id);
              error = updateResult.error;
              break;
            case 'delete':
              const deleteResult = await supabase
                .from(action.table as any)
                .delete()
                .eq('id', action.data.id);
              error = deleteResult.error;
              break;
          }

          if (error) {
            throw error;
          }

          await offlineStorage.removePendingAction(action.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          await offlineStorage.updateActionRetries(action.id);
          errors.push(`فشل ${action.type} على ${action.table}`);
        }
      }

      if (successCount > 0) {
        toast.success(`تمت مزامنة ${successCount} عملية بنجاح`);
      }

      if (errors.length > 0) {
        toast.error(`فشلت ${errors.length} عملية أثناء المزامنة`);
      }

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        errors,
      }));
      
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: ['فشل في المزامنة'],
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, updatePendingCount]);

  /**
   * إضافة إجراء للقائمة المعلقة
   */
  const queueAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ): Promise<string> => {
    const id = await offlineStorage.addPendingAction({ type, table, data });
    await updatePendingCount();
    
    // محاولة المزامنة فوراً إذا متصل
    if (isOnline) {
      syncPendingActions();
    } else {
      toast.info('تم حفظ العملية. ستتم المزامنة عند استعادة الاتصال.');
    }
    
    return id;
  }, [isOnline, syncPendingActions, updatePendingCount]);

  /**
   * حفظ مسودة
   */
  const saveDraft = useCallback(async (id: string, data: any) => {
    await offlineStorage.saveDraft(id, data);
  }, []);

  /**
   * استرجاع مسودة
   */
  const getDraft = useCallback(async <T>(id: string): Promise<T | null> => {
    return offlineStorage.getDraft<T>(id);
  }, []);

  /**
   * حذف مسودة
   */
  const removeDraft = useCallback(async (id: string) => {
    await offlineStorage.removeDraft(id);
  }, []);

  // تهيئة عند التحميل
  useEffect(() => {
    offlineStorage.init().then(() => {
      updatePendingCount();
      // تنظيف البيانات المنتهية
      offlineStorage.cleanupExpiredCache();
    });
  }, [updatePendingCount]);

  // مزامنة عند استعادة الاتصال
  useEffect(() => {
    if (isOnline && status.pendingCount > 0) {
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
