/**
 * supabaseOffline - غلاف شامل لكل عمليات الكتابة على Supabase
 * يعمل كبديل مباشر (drop-in replacement) لـ supabase.from().insert/update/delete
 * عند فقدان الاتصال، يحفظ العمليات في IndexedDB ويزامنها عند العودة
 * 
 * الاستخدام:
 *   import { offlineSupabase } from '@/lib/supabaseOffline';
 *   // بدلاً من: await supabase.from('table').insert(data)
 *   // استخدم: await offlineSupabase.insert('table', data)
 */

import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offlineStorage';
import type { PendingAction } from '@/lib/offlineStorage';

interface OfflineWriteOptions {
  /** أولوية العملية */
  priority?: PendingAction['priority'];
  /** إظهار toast عند الحفظ أوفلاين */
  silentQueue?: boolean;
  /** بيانات سياقية إضافية */
  meta?: Record<string, any>;
}

interface OfflineResult {
  success: boolean;
  offline: boolean;
  data?: any;
  error?: any;
  queueId?: string;
}

class SupabaseOfflineProxy {
  /**
   * إدراج سجل - يعمل أونلاين أو أوفلاين
   */
  async insert(
    table: string,
    data: any,
    options?: OfflineWriteOptions
  ): Promise<OfflineResult> {
    if (navigator.onLine) {
      try {
        const result = await supabase.from(table as any).insert(data).select();
        if (result.error) throw result.error;
        return { success: true, offline: false, data: result.data };
      } catch (error) {
        // فشل رغم الاتصال - احفظ أوفلاين
        return this.queueAction('create', table, data, options);
      }
    }
    return this.queueAction('create', table, data, options);
  }

  /**
   * تحديث سجل - يعمل أونلاين أو أوفلاين
   */
  async update(
    table: string,
    id: string,
    updates: any,
    options?: OfflineWriteOptions
  ): Promise<OfflineResult> {
    if (navigator.onLine) {
      try {
        const result = await supabase.from(table as any).update(updates).eq('id', id).select();
        if (result.error) throw result.error;
        return { success: true, offline: false, data: result.data };
      } catch (error) {
        return this.queueAction('update', table, { id, updates }, options);
      }
    }
    return this.queueAction('update', table, { id, updates }, options);
  }

  /**
   * حذف سجل - يعمل أونلاين أو أوفلاين
   */
  async delete(
    table: string,
    id: string,
    options?: OfflineWriteOptions
  ): Promise<OfflineResult> {
    if (navigator.onLine) {
      try {
        const result = await supabase.from(table as any).delete().eq('id', id);
        if (result.error) throw result.error;
        return { success: true, offline: false };
      } catch (error) {
        return this.queueAction('delete', table, { id }, options);
      }
    }
    return this.queueAction('delete', table, { id }, options);
  }

  /**
   * Upsert - إدراج أو تحديث
   */
  async upsert(
    table: string,
    data: any,
    options?: OfflineWriteOptions
  ): Promise<OfflineResult> {
    if (navigator.onLine) {
      try {
        const result = await supabase.from(table as any).upsert(data).select();
        if (result.error) throw result.error;
        return { success: true, offline: false, data: result.data };
      } catch (error) {
        return this.queueAction('create', table, data, { ...options, meta: { ...options?.meta, upsert: true } });
      }
    }
    return this.queueAction('create', table, data, { ...options, meta: { ...options?.meta, upsert: true } });
  }

  /**
   * قراءة مع دعم الكاش أوفلاين
   */
  async select<T>(
    table: string,
    query?: {
      select?: string;
      filter?: Record<string, any>;
      limit?: number;
      order?: { column: string; ascending?: boolean };
    }
  ): Promise<{ data: T[] | null; offline: boolean }> {
    if (navigator.onLine) {
      try {
        let q = supabase.from(table as any).select(query?.select || '*');
        
        if (query?.filter) {
          Object.entries(query.filter).forEach(([key, value]) => {
            q = q.eq(key, value) as any;
          });
        }
        if (query?.order) {
          q = q.order(query.order.column, { ascending: query.order.ascending ?? true }) as any;
        }
        if (query?.limit) {
          q = q.limit(query.limit) as any;
        }

        const { data, error } = await q;
        if (error) throw error;

        // تخزين في الكاش للاستخدام أوفلاين
        const cacheKey = `select_${table}_${JSON.stringify(query || {})}`;
        await offlineStorage.setCache(cacheKey, data, 10 * 60 * 1000); // 10 دقائق

        return { data: data as T[], offline: false };
      } catch {
        // فشل - حاول من الكاش
      }
    }

    // أوفلاين - جلب من الكاش
    const cacheKey = `select_${table}_${JSON.stringify(query || {})}`;
    const cached = await offlineStorage.getCache<T[]>(cacheKey);
    
    // حاول من بيانات التحميل المسبق
    if (!cached) {
      const preloaded = await offlineStorage.getCache<T[]>(`preload_${table}`);
      return { data: preloaded, offline: true };
    }

    return { data: cached, offline: true };
  }

  /**
   * حفظ العملية في الطابور
   */
  private async queueAction(
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any,
    options?: OfflineWriteOptions
  ): Promise<OfflineResult> {
    try {
      const queueId = await offlineStorage.addPendingAction({
        type,
        table,
        data,
        priority: options?.priority || this.inferPriority(table),
        originalCreatedAt: new Date().toISOString(),
        meta: options?.meta,
      });

      console.log(`[OfflineProxy] ⏳ ${type} on ${table} queued (${queueId})`);
      return { success: true, offline: true, queueId };
    } catch (error) {
      console.error(`[OfflineProxy] Failed to queue ${type} on ${table}:`, error);
      return { success: false, offline: true, error };
    }
  }

  /**
   * استنتاج الأولوية من اسم الجدول
   */
  private inferPriority(table: string): PendingAction['priority'] {
    const criticalTables = [
      'direct_messages', 'private_messages', 'channel_messages',
      'notifications', 'shipment_logs', 'delivery_declarations',
    ];
    const highTables = [
      'shipments', 'invoices', 'collection_requests',
      'work_orders', 'accounting_ledger', 'deposits',
    ];

    if (criticalTables.includes(table)) return 'critical';
    if (highTables.includes(table)) return 'high';
    return 'normal';
  }
}

/** مثيل مشترك (Singleton) */
export const offlineSupabase = new SupabaseOfflineProxy();
export default offlineSupabase;
