// Centralized Leaflet/OSM configuration

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Egypt geographic bounds [[south, west], [north, east]]
export const EGYPT_BOUNDS: [[number, number], [number, number]] = [[22.0, 24.7], [31.7, 37.0]];

export const EGYPT_CENTER: [number, number] = [26.8, 30.8]; // [lat, lng]

export const DEFAULT_ZOOM = 6;
export const TRACKING_ZOOM = 14;
export const MAX_ZOOM = 19;
export const MIN_ZOOM = 5;

// Nominatim (OSM) reverse geocoding - free, no API key
export const reverseGeocodeOSM = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=18`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Nominatim forward geocoding
export const forwardGeocodeOSM = async (query: string, limit = 8): Promise<Array<{
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}>> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=${limit}&accept-language=ar`
    );
    const data = await res.json();
    return (data || []).map((r: any, i: number) => ({
      id: `osm-${r.place_id}-${i}`,
      name: r.display_name?.split(',')[0] || '',
      address: r.display_name || '',
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
};
