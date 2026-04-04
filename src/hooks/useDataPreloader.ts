/**
 * useDataPreloader - تحميل البيانات مسبقاً للعمل بدون إنترنت
 * يحمل الشحنات والفواتير والعملاء والسائقين إلى IndexedDB
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offlineStorage';
import { toast } from 'sonner';

interface PreloadCategory {
  key: string;
  label: string;
  table: string;
  filter?: Record<string, any>;
  select?: string;
  icon: string;
}

interface PreloadProgress {
  isPreloading: boolean;
  currentCategory: string;
  progress: number; // 0-100
  totalCategories: number;
  completedCategories: number;
  totalRecords: number;
  error: string | null;
  lastPreloadAt: Date | null;
}

const PRELOAD_TTL = 24 * 60 * 60 * 1000; // 24 hours
const PRELOAD_META_KEY = 'preload_meta';

const CATEGORIES: PreloadCategory[] = [
  { key: 'shipments', label: 'الشحنات النشطة', table: 'shipments', select: '*', icon: '📦' },
  { key: 'invoices', label: 'الفواتير', table: 'invoices', select: '*', icon: '🧾' },
  { key: 'profiles', label: 'المستخدمين', table: 'profiles', select: 'id,full_name,phone,avatar_url,organization_id', icon: '👥' },
  { key: 'organizations', label: 'المؤسسات', table: 'organizations', select: 'id,name,name_ar,logo_url,type,city', icon: '🏢' },
  { key: 'waste_types', label: 'أنواع النفايات', table: 'waste_types', select: '*', icon: '♻️' },
  { key: 'notifications', label: 'الإشعارات', table: 'notifications', select: 'id,title,body,type,is_read,created_at', icon: '🔔' },
];

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
  });
  const abortRef = useRef(false);

  // Load last preload time from cache
  const loadMeta = useCallback(async () => {
    try {
      const meta = await offlineStorage.getCache<{ lastPreloadAt: string; totalRecords: number }>(PRELOAD_META_KEY);
      if (meta) {
        setProgress(prev => ({
          ...prev,
          lastPreloadAt: new Date(meta.lastPreloadAt),
          totalRecords: meta.totalRecords,
        }));
      }
    } catch {}
  }, []);

  const preloadAll = useCallback(async () => {
    abortRef.current = false;
    setProgress(prev => ({
      ...prev,
      isPreloading: true,
      progress: 0,
      completedCategories: 0,
      error: null,
      currentCategory: '',
      totalRecords: 0,
    }));

    let totalRecords = 0;

    try {
      for (let i = 0; i < CATEGORIES.length; i++) {
        if (abortRef.current) break;

        const cat = CATEGORIES[i];
        setProgress(prev => ({
          ...prev,
          currentCategory: cat.label,
          progress: Math.round((i / CATEGORIES.length) * 100),
        }));

        try {
          const { data, error } = await supabase
            .from(cat.table as any)
            .select(cat.select || '*')
            .limit(500);

          if (error) throw error;

          if (data && data.length > 0) {
            await offlineStorage.setCache(`preload_${cat.key}`, data, PRELOAD_TTL);
            totalRecords += data.length;
          }
        } catch (catError: any) {
          console.warn(`[Preloader] Failed to preload ${cat.key}:`, catError.message);
          // Continue with other categories
        }

        setProgress(prev => ({
          ...prev,
          completedCategories: i + 1,
          totalRecords,
        }));
      }

      // Save meta
      const meta = { lastPreloadAt: new Date().toISOString(), totalRecords };
      await offlineStorage.setCache(PRELOAD_META_KEY, meta, PRELOAD_TTL);

      setProgress(prev => ({
        ...prev,
        isPreloading: false,
        progress: 100,
        currentCategory: '',
        lastPreloadAt: new Date(),
        totalRecords,
        completedCategories: CATEGORIES.length,
      }));

      toast.success(`تم تحميل ${totalRecords} سجل للعمل بدون إنترنت`);
    } catch (error: any) {
      setProgress(prev => ({
        ...prev,
        isPreloading: false,
        error: error.message || 'فشل في التحميل المسبق',
      }));
      toast.error('فشل في التحميل المسبق للبيانات');
    }
  }, []);

  const cancelPreload = useCallback(() => {
    abortRef.current = true;
    setProgress(prev => ({ ...prev, isPreloading: false, currentCategory: '' }));
  }, []);

  /**
   * Get preloaded data for offline use
   */
  const getPreloadedData = useCallback(async <T>(category: string): Promise<T[] | null> => {
    return offlineStorage.getCache<T[]>(`preload_${category}`);
  }, []);

  /**
   * Clear all preloaded data
   */
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
    }));
    toast.success('تم مسح البيانات المحملة مسبقاً');
  }, []);

  /**
   * Estimate storage size
   */
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
    cancelPreload,
    getPreloadedData,
    clearPreloadedData,
    getPreloadSize,
    loadMeta,
  };
};

export default useDataPreloader;
