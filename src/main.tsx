import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load Google Maps API dynamically with Places library
const loadGoogleMapsAPI = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key not found. Google Places search will be unavailable.');
    return;
  }

  // Check if already loaded
  if (typeof google !== 'undefined' && google.maps?.places) {
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&region=EG`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

// Load Google Maps API
loadGoogleMapsAPI();

// Ensure React is properly initialized
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
