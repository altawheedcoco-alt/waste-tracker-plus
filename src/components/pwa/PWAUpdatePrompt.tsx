import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';

/**
 * PWA Auto-Updater — يفرض التحديث فورياً بدون تدخل المستخدم
 * يحل مشكلة عرض النسخ القديمة نهائياً
 */
export const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      if (r) {
        // فحص التحديثات كل 30 ثانية
        setInterval(() => r.update(), 30 * 1000);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') r.update();
        });

        window.addEventListener('online', () => r.update());
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // تحديث تلقائي فوري بدون انتظار المستخدم
  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] Auto-updating to new version...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // لا حاجة لواجهة — التحديث تلقائي
};

export default PWAUpdatePrompt;
