/**
 * Cache Buster — تنظيف شامل لكل الكاش القديم عند تحميل التطبيق
 */

const CACHE_VERSION_KEY = 'app-cache-version';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();

export async function bustStaleCaches() {
  try {
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (stored !== CURRENT_VERSION) {
      console.log('[CacheBuster] Version changed, clearing all caches...');
      
      // حذف كل الكاشات
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
        console.log(`[CacheBuster] Cleared ${names.length} caches`);
      }

      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
      
      // إعادة تسجيل الـ SW
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
        if (registrations.length > 0) {
          console.log('[CacheBuster] Unregistered old service workers, reloading...');
          window.location.reload();
          return;
        }
      }
    }
  } catch (e) {
    console.warn('[CacheBuster] Error:', e);
  }
}
