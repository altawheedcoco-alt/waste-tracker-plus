import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { shouldEnablePWA } from '@/lib/pwaRuntime';

/**
 * PWA Auto-Updater — يفرض التحديث فورياً بدون تدخل المستخدم
 * يحل مشكلة عرض النسخ القديمة نهائياً
 */
export const PWAUpdatePrompt = () => {
  const pwaEnabled = shouldEnablePWA();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: pwaEnabled,
    onRegisteredSW(swUrl, r) {
      if (!pwaEnabled) return;

      if (r) {
        // فحص التحديثات كل 10 ثوانٍ
        setInterval(() => r.update(), 10 * 1000);

        // فحص فوري عند العودة للتطبيق
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update();
          }
        });

        window.addEventListener('online', () => r.update());
        
        // فحص فوري عند التسجيل
        r.update();
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // تحديث تلقائي فوري بدون انتظار المستخدم
  useEffect(() => {
    if (!pwaEnabled) return;

    if (needRefresh) {
      console.log('[PWA] Auto-updating to new version...');
      updateServiceWorker(true);
    }
  }, [needRefresh, pwaEnabled, updateServiceWorker]);

  return null; // لا حاجة لواجهة — التحديث تلقائي
};

export default PWAUpdatePrompt;
