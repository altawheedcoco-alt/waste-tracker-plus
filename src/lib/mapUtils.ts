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
 * Fetch road route between two points using Google Directions API
 */
export const fetchRoadRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&region=eg&language=ar&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes?.[0]) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Decode polyline to coordinates
      const coordinates: [number, number][] = decodePolyline(route.overview_polyline.points);
      
      return {
        coordinates,
        distance: leg.distance.value, // meters
        duration: leg.duration.value, // seconds
        success: true,
      };
    }
    
    // Fallback to straight line
    return {
      coordinates: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      distance: calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
      duration: 0,
      success: false,
    };
  } catch (error) {
    console.error('Route fetch error:', error);
    // Fallback to straight line
    return {
      coordinates: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      distance: calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
      duration: 0,
      success: false,
    };
  }
};

/**
 * Decode Google Maps encoded polyline
 */
export const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
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
