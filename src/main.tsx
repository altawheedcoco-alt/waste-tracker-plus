import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
    // Clean old caches in background
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('precache') || name.includes('static-assets') || name.includes('images-cache')) {
            caches.delete(name);
          }
        });
      });
    }

    // Update SW
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    });
  });
}
