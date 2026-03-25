import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const hasBackendEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
  import.meta.env.VITE_SUPABASE_PROJECT_ID
);

// Keep global listeners lightweight: log only, no forced reloads.
window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    console.error('Resource failed to load:', (target as HTMLScriptElement).src || (target as HTMLLinkElement).href);
    return;
  }

  console.error('Global error:', event.error || event.message);
}, true);

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const renderFatalError = (rootElement: HTMLElement) => {
  rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;direction:rtl;font-family:Cairo,sans-serif;"><div style="text-align:center;"><h2>تعذر تشغيل التطبيق</h2><p>حدث خطأ أثناء تحميل ملفات التطبيق.</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">تحديث</button></div></div>';
};

const bootstrapApp = async () => {

  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const initialLoader = document.getElementById('initial-loader');
  if (initialLoader) {
    initialLoader.remove();
  }

  if (!hasBackendEnv) {
    console.warn('Missing backend environment variables at startup; app will render with graceful fallbacks.');
  }

  try {
    const { default: App } = await import("./App.tsx");
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    (window as any).__APP_BOOTSTRAPPED__ = true;
  } catch (err) {
    console.error('Failed to bootstrap app:', err);
    (window as any).__APP_BOOTSTRAPPED__ = true;
    renderFatalError(rootElement);
  }
};

bootstrapApp();

