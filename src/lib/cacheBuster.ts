/**
 * Cache Buster — تنظيف خلفي للكاش القديم بدون reload
 */

import { isPreviewRuntime } from './pwaRuntime';

/** Non-blocking background cache cleanup. Never reloads the page. */
export async function bustStaleCaches() {
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      // Clear old workbox/runtime caches that may hold stale JS chunks
      const staleCaches = names.filter(n => 
        n.includes('workbox-precache') || n.includes('runtime') || n.includes('pages')
      );
      if (staleCaches.length > 0) {
        await Promise.all(staleCaches.map((name) => caches.delete(name)));
        console.log(`[CacheBuster] Cleared ${staleCaches.length} stale caches`);
      }
    }

    // Unregister stale service workers that serve old chunks
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }
  } catch (e) {
    console.warn('[CacheBuster] Error:', e);
  }
}
