/* eslint-disable no-undef */
/**
 * Native Web Push Service Worker — بدون Firebase
 * يستقبل إشعارات Web Push مباشرة عبر VAPID
 */

self.addEventListener('install', (event) => {
  console.log('[NativePush-SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[NativePush-SW] Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[NativePush-SW] Push received');

  let data = { title: 'iRecycle', body: 'إشعار جديد', url: '/dashboard' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    dir: 'rtl',
    lang: 'ar',
    data: { url: data.url || data.data?.url || '/dashboard', ...data.data },
    tag: data.tag || 'native-push-' + Date.now(),
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'dismiss', title: 'تجاهل' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetPath = event.notification.data?.url || '/dashboard';
  const targetUrl = new URL(targetPath, self.location.origin).toString();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === new URL(self.location.origin).origin) {
            return client.focus().then(async (focusedClient) => {
              try {
                focusedClient.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  url: targetPath,
                  data: event.notification.data || {},
                });
              } catch {}

              if ('navigate' in focusedClient) {
                try {
                  return await focusedClient.navigate(targetUrl);
                } catch {}
              }
              return focusedClient;
            });
          }
        } catch {}
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
