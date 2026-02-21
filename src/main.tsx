import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-reload on chunk load failures (common in production after deployments)
window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement;
  // Detect failed script/link loads (chunk loading errors)
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    console.error('Resource failed to load:', (target as HTMLScriptElement).src || (target as HTMLLinkElement).href);
    // Auto-reload once to get fresh chunks
    const reloadKey = '__chunk_reload';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }
    return;
  }
  console.error('Global error:', event.error);
}, true); // Use capture phase to catch resource load errors

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason);
  // Detect dynamic import failures
  if (reason.includes('Failed to fetch dynamically imported module') || 
      reason.includes('Loading chunk') ||
      reason.includes('error loading dynamically imported module')) {
    console.error('Dynamic import failed, reloading:', event.reason);
    const reloadKey = '__chunk_reload';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
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
  // Remove initial loader immediately
  const initialLoader = document.getElementById('initial-loader');
  if (initialLoader) {
    initialLoader.remove();
  }
  
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Failed to render app:', err);
    rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;direction:rtl;font-family:Cairo,sans-serif;"><div style="text-align:center;"><h2>حدث خطأ في تحميل التطبيق</h2><p>يرجى تحديث الصفحة</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">تحديث</button></div></div>';
  }
}

// Aggressively unregister ALL service workers and clear ALL caches
if ('serviceWorker' in navigator) {
  // Immediately unregister all service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });

  // Clear ALL caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
}
