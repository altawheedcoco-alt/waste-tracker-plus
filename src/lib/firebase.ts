/**
 * Firebase initialization — FCM (Cloud Messaging) + Analytics
 * Project: irecycle-waste-management
 * 
 * Note: apiKey here is a publishable browser key, safe to include in client code.
 */
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDInH3-Fls-ZLK-5_LmI84ZhyahDpteBMg",
  authDomain: "irecycle-waste-management.firebaseapp.com",
  projectId: "irecycle-waste-management",
  storageBucket: "irecycle-waste-management.firebasestorage.app",
  messagingSenderId: "569631447362",
  appId: "1:569631447362:web:84e5002827fdb159b210db",
  measurementId: "G-ZSYKKXBDQZ",
};

export const firebaseApp = initializeApp(firebaseConfig);

// Analytics — lazy init (only in browser)
let _analytics: Analytics | null = null;
export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (!_analytics) {
    try {
      _analytics = getAnalytics(firebaseApp);
    } catch { /* SSR or unsupported */ }
  }
  return _analytics;
}

// Messaging — lazy init with support check
let _messaging: Messaging | null = null;
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (_messaging) return _messaging;
  const supported = await isSupported();
  if (!supported) return null;
  _messaging = getMessaging(firebaseApp);
  return _messaging;
}

export { getToken, onMessage };
