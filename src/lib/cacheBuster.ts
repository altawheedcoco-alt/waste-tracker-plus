/**
 * Cache Buster — تنظيف خلفي للكاش القديم بدون reload
 */

import { isPreviewRuntime } from './pwaRuntime';

/** Non-blocking background cache cleanup. Never reloads the page. */
export async function bustStaleCaches() {
  try {
    // Only clear caches in preview/dev — never for installed PWA users
    if (isPreviewRuntime()) {
      if ('caches' in window) {
        const names = await caches.keys();
        if (names.length > 0) {
          await Promise.all(names.map((name) => caches.delete(name)));
          console.log(`[CacheBuster] Cleared ${names.length} caches in background`);
        }
      }
    }
  } catch (e) {
    console.warn('[CacheBuster] Error:', e);
  }
}
