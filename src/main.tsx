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
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Defer all service worker operations to after render
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Aggressively clean ALL old caches to prevent stale content
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          // Clean all workbox/precache caches to force fresh content
          if (name.includes('precache') || name.includes('static-assets') || 
              name.includes('images-cache') || name.includes('pages-cache') ||
              name.includes('workbox')) {
            caches.delete(name);
          }
        });
      });
    }

    // Force SW update and activation
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    });

    // Listen for new SW and reload
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
