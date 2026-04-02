/**
 * Firebase initialization — FCM (Cloud Messaging) + Analytics
 * Project: irecycle-waste-management
 * 
 * FULLY LAZY — Firebase SDK is only loaded when actually needed (push notifications).
 * This saves ~33MB of node_modules from being parsed on startup.
 * Note: apiKey here is a publishable browser key, safe to include in client code.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDInH3-Fls-ZLK-5_LmI84ZhyahDpteBMg",
  authDomain: "irecycle-waste-management.firebaseapp.com",
  projectId: "irecycle-waste-management",
  storageBucket: "irecycle-waste-management.firebasestorage.app",
  messagingSenderId: "569631447362",
  appId: "1:569631447362:web:84e5002827fdb159b210db",
  measurementId: "G-ZSYKKXBDQZ",
};

let _app: any = null;

async function getApp() {
  if (_app) return _app;
  const { initializeApp } = await import('firebase/app');
  _app = initializeApp(firebaseConfig);
  return _app;
}

// Analytics — lazy init (only when explicitly requested)
let _analytics: any = null;
export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  if (_analytics) return _analytics;
  try {
    const app = await getApp();
    const { getAnalytics } = await import('firebase/analytics');
    _analytics = getAnalytics(app);
    return _analytics;
  } catch { return null; }
}

// Messaging — lazy init with support check
let _messaging: any = null;
export async function getFirebaseMessaging() {
  if (_messaging) return _messaging;
  try {
    const { isSupported, getMessaging } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) return null;
    const app = await getApp();
    _messaging = getMessaging(app);
    return _messaging;
  } catch { return null; }
}

// Re-export getToken and onMessage as lazy functions
export async function getToken(messaging: any, options?: any) {
  const mod = await import('firebase/messaging');
  return mod.getToken(messaging, options);
}

export async function onMessage(messaging: any, callback: (payload: any) => void) {
  const mod = await import('firebase/messaging');
  return mod.onMessage(messaging, callback);
}

// Legacy: export a getter instead of direct app reference
export const firebaseApp = { get: getApp };
