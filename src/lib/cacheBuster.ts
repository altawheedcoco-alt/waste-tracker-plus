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
      console.log('[CacheBuster] Version changed, clearing outdated caches...');

      // Only clear outdated workbox caches, keep API/storage caches for offline use
      if ('caches' in window) {
        const names = await caches.keys();
        const outdatedCaches = names.filter(n => 
          n.startsWith('workbox-precache') || n.startsWith('workbox-runtime')
        );
        await Promise.all(outdatedCaches.map(n => caches.delete(n)));
        console.log(`[CacheBuster] Cleared ${outdatedCaches.length} outdated caches, kept ${names.length - outdatedCaches.length} API caches`);
      }

      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);

      // Only reload if online — offline users keep using cached version
      if (navigator.onLine) {
        console.log('[CacheBuster] Online — reloading for new version...');
        window.location.reload();
        return;
      }
      console.log('[CacheBuster] Offline — will update on next online visit');
    }
  } catch (e) {
    console.warn('[CacheBuster] Error:', e);
  }
}
