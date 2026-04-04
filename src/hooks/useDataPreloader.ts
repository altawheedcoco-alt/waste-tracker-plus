/**
 * useDataPreloader - تحميل البيانات مسبقاً للعمل بدون إنترنت
 * محسّن: تحديث تفاضلي، أولويات، ضغط، مزامنة لحظية
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offlineStorage';
import { toast } from 'sonner';

interface PreloadCategory {
  key: string;
  label: string;
  table: string;
  select?: string;
  icon: string;
  priority: 'critical' | 'high' | 'normal';
  maxRecords: number;
  /** دقائق - فترة صلاحية هذه الفئة */
  ttlMinutes: number;
  /** هل يتم تحديثها تفاضلياً (فقط الجديد)؟ */
  incrementalField?: string;
}

interface PreloadProgress {
  isPreloading: boolean;
  currentCategory: string;
  progress: number;
  totalCategories: number;
  completedCategories: number;
  totalRecords: number;
  error: string | null;
  lastPreloadAt: Date | null;
  /** حجم البيانات المخزنة تقريبياً بالكيلوبايت */
  estimatedSizeKB: number;
  /** عدد السجلات المحدّثة في آخر تحديث تفاضلي */
  lastDeltaCount: number;
}

const PRELOAD_META_KEY = 'preload_meta';

const CATEGORIES: PreloadCategory[] = [
  // بيانات حرجة - تحديث كل 10 دقائق
  { key: 'shipments', label: 'الشحنات النشطة', table: 'shipments', select: '*', icon: '📦', priority: 'critical', maxRecords: 1000, ttlMinutes: 10, incrementalField: 'updated_at' },
  { key: 'notifications', label: 'الإشعارات', table: 'notifications', select: 'id,title,body,type,is_read,created_at', icon: '🔔', priority: 'critical', maxRecords: 200, ttlMinutes: 5, incrementalField: 'created_at' },

  // بيانات مهمة - تحديث كل 30 دقيقة
  { key: 'invoices', label: 'الفواتير', table: 'invoices', select: '*', icon: '🧾', priority: 'high', maxRecords: 500, ttlMinutes: 30, incrementalField: 'updated_at' },

  // بيانات مرجعية - تحديث كل ساعة
  { key: 'profiles', label: 'المستخدمين', table: 'profiles', select: 'id,full_name,phone,avatar_url,organization_id', icon: '👥', priority: 'normal', maxRecords: 500, ttlMinutes: 60 },
  { key: 'organizations', label: 'المؤسسات', table: 'organizations', select: 'id,name,name_ar,logo_url,type,city', icon: '🏢', priority: 'normal', maxRecords: 300, ttlMinutes: 60 },
  { key: 'waste_types', label: 'أنواع النفايات', table: 'waste_types', select: '*', icon: '♻️', priority: 'normal', maxRecords: 100, ttlMinutes: 120 },
];

/** ترتيب حسب الأولوية */
const SORTED_CATEGORIES = [...CATEGORIES].sort((a, b) => {
  const order = { critical: 0, high: 1, normal: 2 };
  return order[a.priority] - order[b.priority];
});

export const useDataPreloader = () => {
  const [progress, setProgress] = useState<PreloadProgress>({
    isPreloading: false,
    currentCategory: '',
    progress: 0,
    totalCategories: CATEGORIES.length,
    completedCategories: 0,
    totalRecords: 0,
    error: null,
    lastPreloadAt: null,
    estimatedSizeKB: 0,
    lastDeltaCount: 0,
  });
  const abortRef = useRef(false);

  const loadMeta = useCallback(async () => {
    try {
      const meta = await offlineStorage.getCache<{
        lastPreloadAt: string;
        totalRecords: number;
        estimatedSizeKB: number;
        categoryTimestamps: Record<string, string>;
      }>(PRELOAD_META_KEY);
      if (meta) {
        setProgress(prev => ({
          ...prev,
          lastPreloadAt: new Date(meta.lastPreloadAt),
          totalRecords: meta.totalRecords,
          estimatedSizeKB: meta.estimatedSizeKB || 0,
        }));
      }
    } catch {}
  }, []);

  /**
   * تحديث تفاضلي - يجلب فقط السجلات المحدّثة منذ آخر تحميل
   */
  const incrementalSync = useCallback(async (cat: PreloadCategory, lastTimestamp: string | null): Promise<{ data: any[]; isFullSync: boolean }> => {
    if (!cat.incrementalField || !lastTimestamp) {
      // Full sync
      const { data, error } = await supabase
        .from(cat.table as any)
        .select(cat.select || '*')
        .order('created_at', { ascending: false })
        .limit(cat.maxRecords);
      if (error) throw error;
      return { data: data || [], isFullSync: true };
    }

    // Delta sync - فقط الجديد/المحدّث
    const { data: deltaData, error } = await supabase
      .from(cat.table as any)
      .select(cat.select || '*')
      .gt(cat.incrementalField, lastTimestamp)
      .order(cat.incrementalField, { ascending: false })
      .limit(cat.maxRecords);
    if (error) throw error;

    return { data: deltaData || [], isFullSync: false };
  }, []);

  /**
   * تحميل كامل أو تحديث تفاضلي حسب الحاجة
   */
  const preloadAll = useCallback(async (forceFullSync = false) => {
    abortRef.current = false;
    setProgress(prev => ({
      ...prev,
      isPreloading: true,
      progress: 0,
      completedCategories: 0,
      error: null,
      currentCategory: '',
      lastDeltaCount: 0,
    }));

    let totalRecords = 0;
    let deltaCount = 0;
    let estimatedSizeKB = 0;

    // تحميل بيانات Meta السابقة
    const metaRaw = await offlineStorage.getCache<{
      categoryTimestamps: Record<string, string>;
      totalRecords: number;
    }>(PRELOAD_META_KEY);
    const categoryTimestamps: Record<string, string> = metaRaw?.categoryTimestamps || {};

    try {
      for (let i = 0; i < SORTED_CATEGORIES.length; i++) {
        if (abortRef.current) break;

        const cat = SORTED_CATEGORIES[i];

        // تحقق: هل هذه الفئة تحتاج تحديث؟
        const lastTs = categoryTimestamps[cat.key];
        const lastTsTime = lastTs ? new Date(lastTs).getTime() : 0;
        const ttlMs = cat.ttlMinutes * 60 * 1000;
        const needsUpdate = forceFullSync || !lastTsTime || (Date.now() - lastTsTime > ttlMs);

        if (!needsUpdate) {
          // البيانات لا تزال صالحة، احسب من الكاش
          const cached = await offlineStorage.getCache<any[]>(`preload_${cat.key}`);
          if (cached) totalRecords += cached.length;
          setProgress(prev => ({
            ...prev,
            completedCategories: i + 1,
            progress: Math.round(((i + 1) / SORTED_CATEGORIES.length) * 100),
          }));
          continue;
        }

        setProgress(prev => ({
          ...prev,
          currentCategory: `${cat.icon} ${cat.label}`,
          progress: Math.round((i / SORTED_CATEGORIES.length) * 100),
        }));

        try {
          const lastTimestamp = forceFullSync ? null : categoryTimestamps[cat.key] || null;
          const { data, isFullSync } = await incrementalSync(cat, lastTimestamp);

          if (isFullSync) {
            // تحميل كامل - استبدال
            if (data.length > 0) {
              await offlineStorage.setCache(`preload_${cat.key}`, data, ttlMs);
              totalRecords += data.length;
            }
          } else {
            // تحديث تفاضلي - دمج مع الموجود
            const existing = await offlineStorage.getCache<any[]>(`preload_${cat.key}`) || [];
            if (data.length > 0) {
              const newIds = new Set(data.map((d: any) => d.id));
              const merged = [
                ...data,
                ...existing.filter((e: any) => !newIds.has(e.id)),
              ].slice(0, cat.maxRecords);
              await offlineStorage.setCache(`preload_${cat.key}`, merged, ttlMs);
              totalRecords += merged.length;
              deltaCount += data.length;
            } else {
              totalRecords += existing.length;
            }
          }

          // تحديث الطابع الزمني لهذه الفئة
          categoryTimestamps[cat.key] = new Date().toISOString();

          // تقدير الحجم
          const dataStr = JSON.stringify(data);
          estimatedSizeKB += Math.round(dataStr.length / 1024);
        } catch (catError: any) {
          console.warn(`[Preloader] Failed to preload ${cat.key}:`, catError.message);
        }

        setProgress(prev => ({
          ...prev,
          completedCategories: i + 1,
          totalRecords,
        }));
      }

      // حساب الحجم الكلي
      const totalSizeKB = await estimateTotalSize();

      // حفظ Meta
      const meta = {
        lastPreloadAt: new Date().toISOString(),
        totalRecords,
        estimatedSizeKB: totalSizeKB,
        categoryTimestamps,
      };
      await offlineStorage.setCache(PRELOAD_META_KEY, meta, 7 * 24 * 60 * 60 * 1000); // 7 أيام

      setProgress(prev => ({
        ...prev,
        isPreloading: false,
        progress: 100,
        currentCategory: '',
        lastPreloadAt: new Date(),
        totalRecords,
        completedCategories: SORTED_CATEGORIES.length,
        estimatedSizeKB: totalSizeKB,
        lastDeltaCount: deltaCount,
      }));

      if (deltaCount > 0) {
        toast.success(`تم تحديث ${deltaCount} سجل جديد`);
      } else if (totalRecords > 0) {
        toast.success(`البيانات محدّثة — ${totalRecords} سجل جاهز للعمل بدون إنترنت`);
      }
    } catch (error: any) {
      setProgress(prev => ({
        ...prev,
        isPreloading: false,
        error: error.message || 'فشل في التحميل المسبق',
      }));
      toast.error('فشل في التحميل المسبق للبيانات');
    }
  }, [incrementalSync]);

  /**
   * تحديث سريع للبيانات الحرجة فقط (شحنات + إشعارات)
   */
  const quickSync = useCallback(async () => {
    if (!navigator.onLine) return;

    const criticalCats = SORTED_CATEGORIES.filter(c => c.priority === 'critical');
    const metaRaw = await offlineStorage.getCache<{
      categoryTimestamps: Record<string, string>;
    }>(PRELOAD_META_KEY);
    const timestamps = metaRaw?.categoryTimestamps || {};

    let deltaCount = 0;

    for (const cat of criticalCats) {
      try {
        const lastTs = timestamps[cat.key] || null;
        const { data, isFullSync } = await incrementalSync(cat, lastTs);

        if (data.length > 0) {
          if (isFullSync) {
            await offlineStorage.setCache(`preload_${cat.key}`, data, cat.ttlMinutes * 60 * 1000);
          } else {
            const existing = await offlineStorage.getCache<any[]>(`preload_${cat.key}`) || [];
            const newIds = new Set(data.map((d: any) => d.id));
            const merged = [...data, ...existing.filter((e: any) => !newIds.has(e.id))].slice(0, cat.maxRecords);
            await offlineStorage.setCache(`preload_${cat.key}`, merged, cat.ttlMinutes * 60 * 1000);
            deltaCount += data.length;
          }
          timestamps[cat.key] = new Date().toISOString();
        }
      } catch (e: any) {
        console.warn(`[QuickSync] ${cat.key}:`, e.message);
      }
    }

    // تحديث Meta
    if (deltaCount > 0) {
      const meta = await offlineStorage.getCache<any>(PRELOAD_META_KEY) || {};
      meta.categoryTimestamps = { ...meta.categoryTimestamps, ...timestamps };
      meta.lastPreloadAt = new Date().toISOString();
      await offlineStorage.setCache(PRELOAD_META_KEY, meta, 7 * 24 * 60 * 60 * 1000);
    }

    return deltaCount;
  }, [incrementalSync]);

  const cancelPreload = useCallback(() => {
    abortRef.current = true;
    setProgress(prev => ({ ...prev, isPreloading: false, currentCategory: '' }));
  }, []);

  const getPreloadedData = useCallback(async <T>(category: string): Promise<T[] | null> => {
    return offlineStorage.getCache<T[]>(`preload_${category}`);
  }, []);

  const clearPreloadedData = useCallback(async () => {
    for (const cat of CATEGORIES) {
      await offlineStorage.removeCache(`preload_${cat.key}`);
    }
    await offlineStorage.removeCache(PRELOAD_META_KEY);
    setProgress(prev => ({
      ...prev,
      totalRecords: 0,
      lastPreloadAt: null,
      completedCategories: 0,
      estimatedSizeKB: 0,
      lastDeltaCount: 0,
    }));
    toast.success('تم مسح البيانات المحملة مسبقاً');
  }, []);

  const getPreloadSize = useCallback(async (): Promise<number> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const est = await navigator.storage.estimate();
      return est.usage || 0;
    }
    return 0;
  }, []);

  return {
    ...progress,
    categories: CATEGORIES,
    preloadAll,
    quickSync,
    cancelPreload,
    getPreloadedData,
    clearPreloadedData,
    getPreloadSize,
    loadMeta,
  };
};

/** تقدير حجم البيانات المخزنة */
async function estimateTotalSize(): Promise<number> {
  let total = 0;
  for (const cat of CATEGORIES) {
    try {
      const data = await offlineStorage.getCache<any[]>(`preload_${cat.key}`);
      if (data) {
        total += Math.round(JSON.stringify(data).length / 1024);
      }
    } catch {}
  }
  return total;
}

export default useDataPreloader;
