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

  // If user clicked "dismiss" action, do nothing
  if (event.action === 'dismiss') return;

  // Get the target URL from notification data
  const targetPath = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find an existing tab with our app open
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          const swUrl = new URL(self.location.origin);

          // Check if this tab belongs to our app (same origin)
          if (clientUrl.origin === swUrl.origin) {
            // Focus the existing tab and navigate it to the target path
            return client.focus().then((focusedClient) => {
              // Use postMessage to navigate within the SPA (no page reload)
              focusedClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetPath,
              });
              return focusedClient;
            });
          }
        } catch (e) {
          // URL parsing failed, skip this client
        }
      }

      // 2. No existing tab found → open a new one with full URL
      return self.clients.openWindow(self.location.origin + targetPath);
    })
  );
});
