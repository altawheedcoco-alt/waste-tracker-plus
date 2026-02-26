import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const hasBackendEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
  import.meta.env.VITE_SUPABASE_PROJECT_ID
);

// Time-based reload guard: allow retry after 30 seconds (prevents infinite loop but allows recovery)
const canAutoReload = () => {
  const reloadKey = '__chunk_reload_ts';
  const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
  const now = Date.now();
  if (now - lastReload > 30000) {
    sessionStorage.setItem(reloadKey, String(now));
    return true;
  }
  return false;
};

const isChunkError = (message: string) =>
  message.includes('Failed to fetch dynamically imported module') ||
  message.includes('Loading chunk') ||
  message.includes('error loading dynamically imported module') ||
  message.includes('Failed to load module script') ||
  message.includes('Importing a module script failed') ||
  message.includes('ChunkLoadError');

// Auto-reload on chunk load failures
window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    console.error('Resource failed to load:', (target as HTMLScriptElement).src || (target as HTMLLinkElement).href);
    if (canAutoReload()) {
      window.location.reload();
    }
    return;
  }
  console.error('Global error:', event.error);
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason);
  if (isChunkError(reason)) {
    console.error('Dynamic import failed, reloading:', event.reason);
    if (canAutoReload()) {
      window.location.reload();
    }
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Render first, then handle SW cleanup
const rootElement = document.getElementById("root");
if (rootElement) {
  const initialLoader = document.getElementById('initial-loader');
  if (initialLoader) {
    initialLoader.remove();
  }

  if (!hasBackendEnv) {
    console.error('Missing required backend environment variables (URL, publishable key, project id).');
    rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;direction:rtl;font-family:Cairo,sans-serif;"><div style="text-align:center;"><h2>خطأ في إعدادات الاتصال</h2><p>تحقق من إعدادات البيئة ثم أعد التحميل.</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">تحديث</button></div></div>';
  } else {
    try {
      createRoot(rootElement).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } catch (err) {
      console.error('Failed to render app:', err);
      // If it's a chunk error, try reload
      if (err instanceof Error && isChunkError(err.message) && canAutoReload()) {
        window.location.reload();
      } else {
        rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;direction:rtl;font-family:Cairo,sans-serif;"><div style="text-align:center;"><h2>حدث خطأ في تحميل التطبيق</h2><p>يرجى تحديث الصفحة</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">تحديث</button></div></div>';
      }
    }
  }
}

// Keep startup non-blocking: avoid aggressive cache/service-worker cleanup at bootstrap.
