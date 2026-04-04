/**
 * useOfflineAware - Hook شامل لجعل أي عملية كتابة تدعم الأوفلاين
 * يوفر وظائف insert/update/delete تعمل بشفافية مع أو بدون إنترنت
 * 
 * الاستخدام:
 *   const { insert, update, remove, isOnline, pendingCount } = useOfflineAware();
 *   await insert('shipments', { ... });
 *   await update('invoices', id, { status: 'paid' });
 */

import { useCallback } from 'react';
import { offlineSupabase } from '@/lib/supabaseOffline';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'sonner';
import type { PendingAction } from '@/lib/offlineStorage';

interface OfflineAwareOptions {
  /** أولوية العملية */
  priority?: PendingAction['priority'];
  /** رسالة نجاح */
  successMessage?: string;
  /** رسالة نجاح أوفلاين */
  offlineMessage?: string;
  /** إخفاء الرسائل */
  silent?: boolean;
  /** بيانات سياقية */
  meta?: Record<string, any>;
}

export const useOfflineAware = () => {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, isSyncing, syncNow, syncProgress } = useOfflineSync();

  const insert = useCallback(async (
    table: string,
    data: any,
    options?: OfflineAwareOptions
  ) => {
    const result = await offlineSupabase.insert(table, data, {
      priority: options?.priority,
      meta: options?.meta,
    });

    if (!options?.silent) {
      if (result.offline) {
        toast.info(options?.offlineMessage || 'تم حفظ العملية — ستُزامن عند عودة الاتصال', { duration: 2000 });
      } else if (result.success && options?.successMessage) {
        toast.success(options.successMessage);
      }
    }
    return result;
  }, []);

  const update = useCallback(async (
    table: string,
    id: string,
    updates: any,
    options?: OfflineAwareOptions
  ) => {
    const result = await offlineSupabase.update(table, id, updates, {
      priority: options?.priority,
      meta: options?.meta,
    });

    if (!options?.silent) {
      if (result.offline) {
        toast.info(options?.offlineMessage || 'تم حفظ التعديل — سيُزامن عند عودة الاتصال', { duration: 2000 });
      } else if (result.success && options?.successMessage) {
        toast.success(options.successMessage);
      }
    }
    return result;
  }, []);

  const remove = useCallback(async (
    table: string,
    id: string,
    options?: OfflineAwareOptions
  ) => {
    const result = await offlineSupabase.delete(table, id, {
      priority: options?.priority,
      meta: options?.meta,
    });

    if (!options?.silent) {
      if (result.offline) {
        toast.info(options?.offlineMessage || 'تم حفظ الحذف — سيُزامن عند عودة الاتصال', { duration: 2000 });
      } else if (result.success && options?.successMessage) {
        toast.success(options.successMessage);
      }
    }
    return result;
  }, []);

  const query = useCallback(async <T>(
    table: string,
    queryOpts?: {
      select?: string;
      filter?: Record<string, any>;
      limit?: number;
      order?: { column: string; ascending?: boolean };
    }
  ) => {
    return offlineSupabase.select<T>(table, queryOpts);
  }, []);

  return {
    insert,
    update,
    remove,
    query,
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    syncProgress,
  };
};

export default useOfflineAware;
