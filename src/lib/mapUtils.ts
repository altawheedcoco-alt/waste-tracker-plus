// Map utilities for routing and geocoding - Mapbox Only
// Note: This project uses Mapbox GL JS exclusively for all mapping features.

// OSRM API for real road routing
export const OSRM_API = 'https://router.project-osrm.org';

// Mapbox API for geocoding
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';
const MAPBOX_GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

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
 * Fetch actual road route between two points using OSRM
 * Returns coordinates in [lat, lng] format for consistency
 */
export const fetchRoadRoute = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResult> => {
  try {
    // OSRM expects lng,lat format
    const url = `${OSRM_API}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Convert GeoJSON coordinates [lng, lat] to [lat, lng] format
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        success: true,
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('OSRM routing error:', error);
    
    // Fallback: straight line
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng) * 1000,
      duration: (calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng) / 50) * 3600, // Assume 50km/h average
      success: false,
    };
  }
};

/**
 * Fetch route with multiple waypoints (driver path)
 */
export const fetchMultiPointRoute = async (
  points: { lat: number; lng: number }[]
): Promise<RouteResult> => {
  if (points.length < 2) {
    return { coordinates: [], distance: 0, duration: 0, success: false };
  }
  
  try {
    // Build coordinates string: lng,lat;lng,lat;...
    const coordsString = points
      .map(p => `${p.lng},${p.lat}`)
      .join(';');
    
    const url = `${OSRM_API}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        success: true,
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('Multi-point routing error:', error);
    
    // Fallback: connect points directly
    return {
      coordinates: points.map(p => [p.lat, p.lng] as [number, number]),
      distance: 0,
      duration: 0,
      success: false,
    };
  }
};

/**
 * Geocode an address to coordinates using Mapbox
 */
export const geocodeAddress = async (
  address: string,
  countryCode = 'eg'
): Promise<GeocodingResult | null> => {
  // Guard against empty or placeholder addresses
  const invalidAddresses = ['غير محدد', 'undefined', 'null', '', '-'];
  const trimmedAddress = address?.trim();
  
  if (!trimmedAddress || invalidAddresses.includes(trimmedAddress.toLowerCase())) {
    console.warn('Geocoding skipped: invalid or placeholder address provided:', address);
    return null;
  }
  
  try {
    const url = `${MAPBOX_GEOCODING_API}/${encodeURIComponent(trimmedAddress)}.json?access_token=${MAPBOX_TOKEN}&country=${countryCode}&limit=1&language=ar&types=address,place,locality,neighborhood,poi`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Mapbox error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        lat: feature.center[1],
        lng: feature.center[0],
        displayName: feature.place_name,
        success: true,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address using Mapbox
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const url = `${MAPBOX_GEOCODING_API}/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Mapbox error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

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
