import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Truck } from 'lucide-react';

// Mapbox Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

interface MapboxRouteMapProps {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  driverPosition?: { lat: number; lng: number } | null;
  showProgress?: boolean;
  height?: string;
  onRouteLoad?: (route: { distance: number; duration: number }) => void;
}

const MapboxRouteMap = ({
  start,
  end,
  driverPosition,
  showProgress = false,
  height = '400px',
  onRouteLoad,
}: MapboxRouteMapProps) => {
  const [viewState, setViewState] = useState({
    longitude: (start.lng + end.lng) / 2,
    latitude: (start.lat + end.lat) / 2,
    zoom: 10,
  });
  
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates as [number, number][];
        
        setRouteData({
          coordinates: coords,
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
        });

        if (onRouteLoad) {
          onRouteLoad({
            distance: route.distance / 1000,
            duration: route.duration / 60,
          });
        }

        // Fit bounds to route
        if (coords.length > 0) {
          const lngs = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          
          setViewState({
            longitude: (minLng + maxLng) / 2,
            latitude: (minLat + maxLat) / 2,
            zoom: 11,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  }, [start, end, onRouteLoad]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Route line layer style
  const routeLayer = {
    id: 'route',
    type: 'line' as const,
    paint: {
      'line-color': '#6366f1',
      'line-width': 5,
      'line-opacity': 0.8,
    },
  };

  // Completed route layer (for progress display)
  const completedRouteLayer = {
    id: 'completed-route',
    type: 'line' as const,
    paint: {
      'line-color': '#22c55e',
      'line-width': 6,
      'line-opacity': 1,
    },
  };

  // Get completed route portion based on driver position
  const getCompletedRoute = (): [number, number][] => {
    if (!routeData || !driverPosition || !showProgress) return [];
    
    let closestIndex = 0;
    let minDist = Infinity;
    
    routeData.coordinates.forEach((coord, index) => {
      const dist = Math.sqrt(
        Math.pow(coord[0] - driverPosition.lng, 2) +
        Math.pow(coord[1] - driverPosition.lat, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestIndex = index;
      }
    });
    
    return routeData.coordinates.slice(0, closestIndex + 1);
  };

  const completedCoords = getCompletedRoute();

  return (
    <div className="w-full rounded-lg overflow-hidden border relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Route line */}
        {routeData && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeData.coordinates,
              },
            }}
          >
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Completed route (green) */}
        {showProgress && completedCoords.length > 1 && (
          <Source
            id="completed-route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: completedCoords,
              },
            }}
          >
            <Layer {...completedRouteLayer} />
          </Source>
        )}

        {/* Start marker */}
        <Marker longitude={start.lng} latitude={start.lat} anchor="bottom">
          <div className="bg-green-500 p-2 rounded-full shadow-lg border-2 border-white">
            <Navigation className="h-4 w-4 text-white" />
          </div>
        </Marker>

        {/* End marker */}
        <Marker longitude={end.lng} latitude={end.lat} anchor="bottom">
          <div className="bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </Marker>

        {/* Driver marker */}
        {driverPosition && (
          <Marker longitude={driverPosition.lng} latitude={driverPosition.lat} anchor="center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" style={{ width: '40px', height: '40px', marginLeft: '-12px', marginTop: '-12px' }} />
              <div className="bg-blue-500 p-2 rounded-full shadow-lg border-2 border-white">
                <Truck className="h-4 w-4 text-white" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Route info overlay */}
      {routeData && (
        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg text-sm">
          <div className="flex gap-3">
            <span className="text-muted-foreground">المسافة:</span>
            <span className="font-medium">{routeData.distance.toFixed(1)} كم</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">الوقت:</span>
            <span className="font-medium">{Math.round(routeData.duration)} دقيقة</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxRouteMap;
