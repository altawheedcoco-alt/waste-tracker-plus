/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications from FCM
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
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
