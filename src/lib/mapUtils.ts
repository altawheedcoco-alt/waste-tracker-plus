// Map utilities for routing, geocoding and navigation
// Uses OSRM for routing, Google Geocoding for address lookup, and external navigation links

// Google Maps API Key (publishable - used only for geocoding)
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
 * Geocode an address to coordinates using Google Geocoding API
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=eg&language=ar&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        displayName: result.formatted_address,
        success: true,
      };
    }
    return { lat: 0, lng: 0, displayName: '', success: false };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { lat: 0, lng: 0, displayName: '', success: false };
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ar&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]) {
      return data.results[0].formatted_address;
    }
    return '';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '';
  }
};

/**
 * Fetch road route between two points using OSRM (free, no API key needed)
 */
export const fetchRoadRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        success: true,
      };
    }
    return {
      coordinates: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      distance: calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
      duration: 0,
      success: false,
    };
  } catch (error) {
    console.error('OSRM route fetch error:', error);
    return {
      coordinates: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      distance: calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
      duration: 0,
      success: false,
    };
  }
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
 * Generate HERE WeGo navigation URL
 */
export const getHereWeGoNavigationUrl = (
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string => {
  if (origin) {
    return `https://wego.here.com/directions/drive/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
  }
  return `https://wego.here.com/directions/drive/mylocation/${destination.lat},${destination.lng}`;
};

/**
 * Open external navigation app
 */
export const openExternalNavigation = (
  app: 'google' | 'waze' | 'here',
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): void => {
  const urlMap = {
    google: getGoogleMapsNavigationUrl(destination, origin),
    waze: getWazeNavigationUrl(destination, origin),
    here: getHereWeGoNavigationUrl(destination, origin),
  };
  window.open(urlMap[app], '_blank');
};
