/**
 * Cache Buster — تنظيف شامل لكل الكاش القديم عند تحميل التطبيق
 */

import { isPreviewRuntime, shouldEnablePWA } from './pwaRuntime';

declare const __APP_VERSION__: string;

const CACHE_VERSION_KEY = 'app-cache-version';
const PREVIEW_RESET_KEY = 'preview-cache-reset-done';
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined'
  ? __APP_VERSION__
  : import.meta.env.VITE_APP_VERSION || 'dev';

async function clearAllRuntimeCaches() {
  let clearedSomething = false;

  if ('caches' in window) {
    const names = await caches.keys();
    if (names.length > 0) {
      await Promise.all(names.map((name) => caches.delete(name)));
      clearedSomething = true;
      console.log(`[CacheBuster] Cleared ${names.length} caches`);
    }
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      await Promise.all(registrations.map((reg) => reg.unregister()));
      clearedSomething = true;
      console.log(`[CacheBuster] Unregistered ${registrations.length} service workers`);
    }
  }

  return clearedSomething;
}

export async function bustStaleCaches() {
  try {
    if (isPreviewRuntime()) {
      const alreadyReset = sessionStorage.getItem(PREVIEW_RESET_KEY) === '1';
      const clearedSomething = await clearAllRuntimeCaches();

      if (!alreadyReset && clearedSomething) {
        sessionStorage.setItem(PREVIEW_RESET_KEY, '1');
        console.log('[CacheBuster] Preview runtime detected — reloading once after clearing caches');
        window.location.reload();
        return;
      }

      return;
    }

    if (!shouldEnablePWA()) return;

    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (stored !== CURRENT_VERSION) {
      console.log('[CacheBuster] Version changed, clearing all caches...');

      await clearAllRuntimeCaches();

      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);

      console.log('[CacheBuster] Build version changed — reloading clean app shell...');
      window.location.reload();
      return;
    }
  } catch (e) {
    console.warn('[CacheBuster] Error:', e);
  }
}
