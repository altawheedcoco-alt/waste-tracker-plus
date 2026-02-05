// Map utilities for routing and geocoding - Google Maps Only
// Note: This project uses Google Maps exclusively for all mapping features.

// Google Maps API Key (publishable)
const GOOGLE_MAPS_API_KEY = 'AIzaSyCIisN0sh-m5-pXvpnSELbCBhFabrEcwrE';

export interface RouteResult {
  coordinates: [number, number][];
  distance: number; // meters
  duration: number; // seconds
  success: boolean;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  success: boolean;
}

/**
 * Calculate Haversine distance between two points in km
 */
export const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display (Arabic)
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} كم`;
  }
  return `${Math.round(meters)} م`;
};

/**
 * Format duration for display (Arabic)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ساعة ${minutes > 0 ? `${minutes} دقيقة` : ''}`;
  }
  return `${minutes} دقيقة`;
};

/**
 * Generate Google Maps navigation URL
 */
export const getGoogleMapsNavigationUrl = (
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string => {
  if (origin) {
    return `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
};

/**
 * Generate Waze navigation URL
 */
export const getWazeNavigationUrl = (
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string => {
  if (origin) {
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes&from=${origin.lat},${origin.lng}`;
  }
  return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
};

/**
 * Open external navigation app
 */
export const openExternalNavigation = (
  app: 'google' | 'waze',
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): void => {
  const url = app === 'google' 
    ? getGoogleMapsNavigationUrl(destination, origin)
    : getWazeNavigationUrl(destination, origin);
  window.open(url, '_blank');
};
