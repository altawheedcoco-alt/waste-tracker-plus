import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Note: The app uses Mapbox GL JS exclusively for all mapping features.
// External navigation links are provided for Google Maps and Waze.

// Ensure React is properly initialized
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
