import { memo, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Truck } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
}

interface MapboxLiveTrackingMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  driverLocation: DriverLocation | null;
  driverPath: [number, number][];
  routeCoords: [number, number][];
  centerOnDriver: boolean;
  isDriverOnline: boolean;
  mapKey?: number;
}

const MapboxLiveTrackingMap = memo(({
  pickupCoords,
  deliveryCoords,
  driverLocation,
  driverPath,
  routeCoords,
  centerOnDriver,
  isDriverOnline,
}: MapboxLiveTrackingMapProps) => {
  const defaultCenter = { lat: 30.0444, lng: 31.2357 };

  // Calculate center and zoom
  const viewState = useMemo(() => {
    if (centerOnDriver && driverLocation) {
      return {
        longitude: driverLocation.longitude,
        latitude: driverLocation.latitude,
        zoom: 15,
      };
    }

    // Calculate center from all points
    const points: [number, number][] = [];
    if (pickupCoords) points.push([pickupCoords[1], pickupCoords[0]]);
    if (deliveryCoords) points.push([deliveryCoords[1], deliveryCoords[0]]);
    if (driverLocation) points.push([driverLocation.longitude, driverLocation.latitude]);

    if (points.length > 0) {
      const avgLng = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const avgLat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
      return { longitude: avgLng, latitude: avgLat, zoom: 11 };
    }

    return { longitude: defaultCenter.lng, latitude: defaultCenter.lat, zoom: 10 };
  }, [pickupCoords, deliveryCoords, driverLocation, centerOnDriver]);

  // Route GeoJSON
  const routeGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
    },
  }), [routeCoords]);

  // Driver path GeoJSON
  const driverPathGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: driverPath.map(([lat, lng]) => [lng, lat]),
    },
  }), [driverPath]);

  return (
    <Map
      initialViewState={viewState}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      locale={{
        'NavigationControl.ZoomIn': 'تكبير',
        'NavigationControl.ZoomOut': 'تصغير',
        'NavigationControl.ResetBearing': 'إعادة الاتجاه',
      }}
      onLoad={(e) => {
        const map = e.target;
        const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'airport-label', 'poi-label', 'road-label', 'natural-point-label', 'natural-line-label', 'waterway-label', 'water-point-label', 'water-line-label'];
        arabicLayers.forEach(layer => {
          try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
        });
      }}
    >
      <NavigationControl position="bottom-right" />

      {/* Route line */}
      {routeCoords.length > 1 && (
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#6366f1',
              'line-width': 5,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}

      {/* Driver path (traveled) */}
      {driverPath.length > 1 && (
        <Source id="driver-path" type="geojson" data={driverPathGeoJSON}>
          <Layer
            id="driver-path-line"
            type="line"
            paint={{
              'line-color': '#22c55e',
              'line-width': 4,
              'line-opacity': 0.7,
            }}
          />
        </Source>
      )}

      {/* Pickup marker */}
      {pickupCoords && (
        <Marker longitude={pickupCoords[1]} latitude={pickupCoords[0]} anchor="center">
          <div className="bg-green-500 p-2 rounded-full shadow-lg border-2 border-white">
            <Navigation className="h-4 w-4 text-white" />
          </div>
        </Marker>
      )}

      {/* Delivery marker */}
      {deliveryCoords && (
        <Marker longitude={deliveryCoords[1]} latitude={deliveryCoords[0]} anchor="center">
          <div className="bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </Marker>
      )}

      {/* Driver marker */}
      {driverLocation && (
        <Marker
          longitude={driverLocation.longitude}
          latitude={driverLocation.latitude}
          anchor="center"
        >
          <div className="relative">
            {/* Pulse animation for online driver */}
            {isDriverOnline && (
              <div
                className="absolute rounded-full bg-blue-500/30 animate-ping"
                style={{
                  width: '40px',
                  height: '40px',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            <div
              className="relative flex items-center justify-center rounded-full shadow-lg"
              style={{
                width: '40px',
                height: '40px',
                background: isDriverOnline
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'linear-gradient(135deg, #6b7280, #4b5563)',
                border: '3px solid white',
              }}
            >
              <Truck className="h-5 w-5 text-white" />
            </div>
          </div>
        </Marker>
      )}
    </Map>
  );
});

MapboxLiveTrackingMap.displayName = 'MapboxLiveTrackingMap';

export default MapboxLiveTrackingMap;
