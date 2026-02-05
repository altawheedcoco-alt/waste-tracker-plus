/// <reference types="@types/google.maps" />

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      isScriptLoaded = true;
      return;
    }

    // Prevent multiple script loads
    if (isScriptLoading) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          isScriptLoaded = true;
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API Key not found');
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
      setIsLoaded(true);
    };

    script.onerror = () => {
      isScriptLoading = false;
      setLoadError(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);

    return () => {
      // Script cleanup is intentionally not done to prevent reloading
    };
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;
