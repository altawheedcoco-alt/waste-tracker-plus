/**
 * AutoDataPreloader - تحميل وتحديث البيانات تلقائياً
 * - تحديث سريع للبيانات الحرجة كل 3 دقائق
 * - تحديث كامل كل 30 دقيقة
 * - تحديث فوري عند عودة الاتصال
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataPreloader } from '@/hooks/useDataPreloader';

const QUICK_SYNC_INTERVAL = 3 * 60 * 1000;   // كل 3 دقائق - بيانات حرجة
const FULL_SYNC_INTERVAL = 30 * 60 * 1000;    // كل 30 دقيقة - تحديث كامل
const STARTUP_DELAY = 3000;                    // تأخير 3 ثوانٍ بعد التشغيل

const AutoDataPreloader = () => {
  const { user } = useAuth();
  const { preloadAll, quickSync, loadMeta, isPreloading } = useDataPreloader();
  const hasInitialized = useRef(false);
  const quickSyncTimer = useRef<NodeJS.Timeout | null>(null);
  const fullSyncTimer = useRef<NodeJS.Timeout | null>(null);

  // التهيئة الأولى + إعداد المؤقتات
  useEffect(() => {
    if (!user || hasInitialized.current) return;

    const init = async () => {
      await loadMeta();

      if (navigator.onLine && !isPreloading) {
        hasInitialized.current = true;
        await preloadAll();
      }

      // مؤقت التحديث السريع (بيانات حرجة)
      quickSyncTimer.current = setInterval(() => {
        if (navigator.onLine) {
          quickSync();
        }
      }, QUICK_SYNC_INTERVAL);

      // مؤقت التحديث الكامل
      fullSyncTimer.current = setInterval(() => {
        if (navigator.onLine) {
          preloadAll();
        }
      }, FULL_SYNC_INTERVAL);
    };

    const timer = setTimeout(init, STARTUP_DELAY);
    return () => {
      clearTimeout(timer);
      if (quickSyncTimer.current) clearInterval(quickSyncTimer.current);
      if (fullSyncTimer.current) clearInterval(fullSyncTimer.current);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // تحديث فوري عند عودة الاتصال
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => {
      preloadAll();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, preloadAll]);

  // تحديث عند عودة المستخدم للتطبيق (visibility change)
  useEffect(() => {
    if (!user) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        quickSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, quickSync]);

  return null;
};

export default AutoDataPreloader;
