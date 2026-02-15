import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear outdated service worker caches on load
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      // Clear all workbox precache and old caches
      if (name.includes('precache') || name.includes('static-assets') || name.includes('images-cache')) {
        caches.delete(name);
      }
    });
  });
}

// Register service worker with forced update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
