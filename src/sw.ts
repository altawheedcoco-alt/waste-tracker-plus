/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching (static assets with revision hashes)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Skip waiting & claim clients immediately — forces new SW to take over
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => !name.includes('workbox-precache'))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Navigation requests (HTML pages) → always network first
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 5,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
    {
      // Don't intercept OAuth callback routes
      denylist: [/^\/~oauth/, /^\/auth\/callback/],
    }
  )
);

// JS/CSS app chunks → network first to always get latest
registerRoute(
  ({ request }) => 
    request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: 'app-assets-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Supabase Storage videos (series-videos) → cache first after first download
registerRoute(
  ({ url }) => url.pathname.includes('/storage/') && (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')),
  new CacheFirst({
    cacheName: 'video-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 days
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      {
        // Use range requests for video seeking support
        cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
          if (cachedResponse && !request.headers.has('range')) return cachedResponse;
          return cachedResponse || null;
        },
      } as any,
    ],
  })
);

// Supabase Storage images (thumbnails, banners) → cache first
registerRoute(
  ({ url }) => url.pathname.includes('/storage/') && (url.pathname.endsWith('.webp') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')),
  new CacheFirst({
    cacheName: 'storage-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Supabase API → always from network
registerRoute(
  /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
  new NetworkOnly()
);

registerRoute(
  /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
  new NetworkOnly()
);

registerRoute(
  /^https:\/\/.*\.supabase\.co\/realtime\/.*/i,
  new NetworkOnly()
);

// Google Fonts (rarely change) → cache first
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ========== Web Push Handling ==========
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; data?: any; tag?: string; silent?: boolean };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'إشعار جديد', body: event.data.text() };
  }

  // Skip silent test pushes (used by auto_cleanup)
  if (payload.silent || (!payload.title && !payload.body)) return;

  const title = payload.title || 'iRecycle';
  const options: Record<string, unknown> = {
    body: payload.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.tag || `push-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: payload.data || {},
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options as NotificationOptions));
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
