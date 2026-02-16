/// <reference types="@types/google.maps" />

import React, { createContext, useContext, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Google Maps API Key (publishable key - safe to include in frontend code)
const GOOGLE_MAPS_API_KEY = 'AIzaSyCIisN0sh-m5-pXvpnSELbCBhFabrEcwrE';

let isScriptLoading = false;
let isScriptLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Lazily load Google Maps script - only when requested
 */
export const loadGoogleMapsScript = (): Promise<void> => {
  if (isScriptLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API Key not found'));
      return;
    }

    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&language=ar&region=EG`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      resolve();
    };

    script.onerror = () => {
      isScriptLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * GoogleMapsProvider - does NOT load the script automatically.
 * Use LazyGoogleMapsProvider to auto-load, or call loadGoogleMapsScript() manually.
 */
export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [isLoaded, setIsLoaded] = React.useState(isScriptLoaded);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  // Just check if already loaded, don't trigger loading
  React.useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      isScriptLoaded = true;
    }
  }, []);

  // Listen for script load events from other components
  React.useEffect(() => {
    if (isLoaded) return;
    const interval = setInterval(() => {
      if (window.google?.maps) {
        setIsLoaded(true);
        isScriptLoaded = true;
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isLoaded]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

/**
 * LazyGoogleMapsProvider - loads Google Maps script on mount.
 * Wrap only pages/components that actually need maps.
 */
export const LazyGoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [isLoaded, setIsLoaded] = React.useState(isScriptLoaded);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch(err => setLoadError(err));
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;
