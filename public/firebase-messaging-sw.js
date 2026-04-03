/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications from FCM
 * 
 * CRITICAL: notificationclick focuses existing tab instead of opening new one
 */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDInH3-Fls-ZLK-5_LmI84ZhyahDpteBMg",
  authDomain: "irecycle-waste-management.firebaseapp.com",
  projectId: "irecycle-waste-management",
  storageBucket: "irecycle-waste-management.firebasestorage.app",
  messagingSenderId: "569631447362",
  appId: "1:569631447362:web:84e5002827fdb159b210db",
  measurementId: "G-ZSYKKXBDQZ",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message:', payload);
  const notificationTitle = payload.notification?.title || 'iRecycle';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    dir: 'rtl',
    lang: 'ar',
    data: payload.data || {},
    tag: payload.data?.tag || 'fcm-' + Date.now(),
    // Show action buttons for quick access
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'dismiss', title: 'تجاهل' },
    ],
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetPath = event.notification.data?.url || '/dashboard';
  const targetUrl = new URL(targetPath, self.location.origin).toString();
  const payload = {
    type: 'NOTIFICATION_CLICK',
    url: targetPath,
    data: event.notification.data || {},
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          const swUrl = new URL(self.location.origin);

          if (clientUrl.origin === swUrl.origin) {
            const shouldHardNavigate = !clientUrl.pathname.startsWith('/dashboard');

            return client.focus().then(async (focusedClient) => {
              try {
                focusedClient.postMessage(payload);
              } catch (e) {
                // ignore postMessage failure
              }

              if (shouldHardNavigate && 'navigate' in focusedClient) {
                try {
                  return await focusedClient.navigate(targetUrl);
                } catch (e) {
                  // ignore navigation failure and fall back to focused tab
                }
              }

              return focusedClient;
            });
          }
        } catch (e) {
          // skip invalid clients
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
