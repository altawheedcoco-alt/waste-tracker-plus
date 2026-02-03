// Map utilities for routing and geocoding
import L from 'leaflet';

// OSRM API for real road routing
export const OSRM_API = 'https://router.project-osrm.org';

// Nominatim API for geocoding
export const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

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
      
      // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
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
 * Geocode an address to coordinates
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
    const url = `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(trimmedAddress)}&countrycodes=${countryCode}&limit=1&accept-language=ar`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
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
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const url = `${NOMINATIM_API}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} كم`;
  }
  return `${Math.round(meters)} م`;
};

/**
 * Format duration for display
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
 * Create custom marker icons
 */
export const createMarkerIcon = (
  color: string,
  emoji: string,
  size: number = 36
): L.DivIcon => {
  return new L.DivIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 4px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: ${size * 0.4}px;">${emoji}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

/**
 * Create driver marker with pulse animation
 */
export const createDriverMarkerIcon = (
  isOnline: boolean,
  size: number = 44
): L.DivIcon => {
  const color = isOnline ? '#22c55e' : '#ef4444';
  const shadowColor = isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.3)';
  
  return new L.DivIcon({
    className: 'driver-marker-icon',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, ${shadowColor} 0%, transparent 70%);
          border-radius: 50%;
          animation: driverPulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.65}px;
          height: ${size * 0.65}px;
          background: linear-gradient(135deg, ${color}, ${isOnline ? '#16a34a' : '#dc2626'});
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: ${size * 0.35}px;">🚛</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Common marker icons
export const pickupMarkerIcon = createMarkerIcon('#3b82f6', '📍');
export const deliveryMarkerIcon = createMarkerIcon('#22c55e', '🏁');
export const warehouseMarkerIcon = createMarkerIcon('#8b5cf6', '🏭');
