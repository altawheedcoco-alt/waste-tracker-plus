import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to prevent white screen crashes
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Render first, then handle SW cleanup
const rootElement = document.getElementById("root");
if (rootElement) {
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
