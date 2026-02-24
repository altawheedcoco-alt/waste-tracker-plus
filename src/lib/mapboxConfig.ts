// Centralized Mapbox configuration
// Public access token - safe to include in client code

export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Egypt geographic bounds [sw, ne]
export const EGYPT_BOUNDS: [number, number, number, number] = [24.7, 22.0, 37.0, 31.7]; // [west, south, east, north]

export const EGYPT_CENTER: [number, number] = [30.8, 26.8]; // [lng, lat]

export const DEFAULT_ZOOM = 6;
export const TRACKING_ZOOM = 14;
export const MAX_ZOOM = 19;
export const MIN_ZOOM = 5;
