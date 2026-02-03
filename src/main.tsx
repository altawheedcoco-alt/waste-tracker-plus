import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Note: Google Maps API is no longer loaded automatically.
// The app now uses free OpenStreetMap-based alternatives for all mapping features.
// If you need Google Maps for external navigation, users can still open links in Google Maps/Waze.

// Ensure React is properly initialized
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
