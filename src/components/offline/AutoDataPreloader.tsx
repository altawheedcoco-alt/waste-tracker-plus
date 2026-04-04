/**
 * AutoDataPreloader - يحمّل البيانات تلقائياً عند فتح التطبيق وتوفر الإنترنت
 * يعمل بصمت في الخلفية بدون تدخل المستخدم
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataPreloader } from '@/hooks/useDataPreloader';

const AUTO_PRELOAD_INTERVAL = 4 * 60 * 60 * 1000; // كل 4 ساعات
const STARTUP_DELAY = 5000; // تأخير 5 ثوانٍ بعد التشغيل

const AutoDataPreloader = () => {
  const { user } = useAuth();
  const { preloadAll, loadMeta, lastPreloadAt, isPreloading } = useDataPreloader();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!user || hasTriggered.current) return;

    const runAutoPreload = async () => {
      await loadMeta();
      
      // تحقق: هل مر وقت كافٍ منذ آخر تحميل؟
      const now = Date.now();
      const lastTime = lastPreloadAt ? lastPreloadAt.getTime() : 0;
      const shouldPreload = !lastTime || (now - lastTime > AUTO_PRELOAD_INTERVAL);

      if (shouldPreload && navigator.onLine && !isPreloading) {
        hasTriggered.current = true;
        console.log('[AutoPreloader] بدء التحميل التلقائي للبيانات...');
        await preloadAll();
      }
    };

    // تأخير قليل حتى يكتمل تحميل التطبيق
    const timer = setTimeout(runAutoPreload, STARTUP_DELAY);
    return () => clearTimeout(timer);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // إعادة التحميل تلقائياً عند عودة الاتصال
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => {
      const now = Date.now();
      const lastTime = lastPreloadAt ? lastPreloadAt.getTime() : 0;
      if (!lastTime || (now - lastTime > AUTO_PRELOAD_INTERVAL)) {
        console.log('[AutoPreloader] عودة الاتصال - تحميل تلقائي...');
        preloadAll();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, lastPreloadAt, preloadAll]);

  return null; // مكون صامت بدون واجهة
};

export default AutoDataPreloader;
