import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Locate, Navigation, ZoomIn, ZoomOut, Compass, MapPin, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteStep } from '@/lib/routingUtils';

// Mapbox Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface MapboxNavigationMapProps {
  driverPosition: { lat: number; lng: number } | null;
  driverHeading: number | null;
  routeCoordinates: [number, number][];
  completedCoordinates: [number, number][];
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  currentStep: RouteStep | null;
  isNavigating: boolean;
  accuracy: number | null;
  className?: string;
}

const MapboxNavigationMap = ({
  driverPosition,
  driverHeading,
  routeCoordinates,
  completedCoordinates,
  pickupCoords,
  deliveryCoords,
  currentStep,
  isNavigating,
  accuracy,
  className,
}: MapboxNavigationMapProps) => {
  const [isFollowing, setIsFollowing] = useState(true);
  const mapRef = useRef<any>(null);

  const defaultCenter = { lng: 31.2357, lat: 30.0444 };
  const center = driverPosition
    ? { lng: driverPosition.lng, lat: driverPosition.lat }
    : pickupCoords
    ? { lng: pickupCoords[1], lat: pickupCoords[0] }
    : defaultCenter;

  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 16,
    bearing: driverHeading || 0,
  });

  // Follow driver when navigating
  useEffect(() => {
    if (isFollowing && isNavigating && driverPosition) {
      setViewState(prev => ({
        ...prev,
        longitude: driverPosition.lng,
        latitude: driverPosition.lat,
        bearing: driverHeading || prev.bearing,
      }));
    }
  }, [driverPosition, driverHeading, isFollowing, isNavigating]);

  const handleRecenter = useCallback(() => {
    if (driverPosition) {
      setViewState(prev => ({
        ...prev,
        longitude: driverPosition.lng,
        latitude: driverPosition.lat,
        zoom: 16,
      }));
    }
  }, [driverPosition]);

  // Convert route coordinates from [lat, lng] to [lng, lat] for Mapbox
  const mapboxRouteCoords = routeCoordinates.map(c => [c[1], c[0]]);
  const mapboxCompletedCoords = completedCoordinates.map(c => [c[1], c[0]]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={() => setIsFollowing(false)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        ref={mapRef}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Remaining route (dashed blue) */}
        {mapboxRouteCoords.length > 1 && (
          <Source
            id="remaining-route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: mapboxRouteCoords,
              },
            }}
          >
            <Layer
              id="remaining-route-line"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 6,
                'line-opacity': 0.8,
                'line-dasharray': [2, 1],
              }}
            />
          </Source>
        )}

        {/* Completed route (solid green) */}
        {mapboxCompletedCoords.length > 1 && (
          <Source
            id="completed-route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: mapboxCompletedCoords,
              },
            }}
          >
            <Layer
              id="completed-route-line"
              type="line"
              paint={{
                'line-color': '#22c55e',
                'line-width': 7,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* Accuracy circle */}
        {driverPosition && accuracy && accuracy > 10 && (
          <Source
            id="accuracy-circle"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [driverPosition.lng, driverPosition.lat],
              },
            }}
          >
            <Layer
              id="accuracy-circle-fill"
              type="circle"
              paint={{
                'circle-radius': accuracy / 2,
                'circle-color': '#6366f1',
                'circle-opacity': 0.15,
              }}
            />
          </Source>
        )}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker longitude={pickupCoords[1]} latitude={pickupCoords[0]} anchor="bottom">
            <div className="bg-green-500 p-2 rounded-full shadow-lg border-2 border-white">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </Marker>
        )}

        {/* Delivery marker */}
        {deliveryCoords && (
          <Marker longitude={deliveryCoords[1]} latitude={deliveryCoords[0]} anchor="bottom">
            <div className="bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
              <span className="text-white text-lg">🏭</span>
            </div>
          </Marker>
        )}

        {/* Current step indicator */}
        {currentStep && currentStep.maneuver.location && (
          <Marker
            longitude={currentStep.maneuver.location[0]}
            latitude={currentStep.maneuver.location[1]}
            anchor="center"
          >
            <div className="w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}

        {/* Driver marker with heading */}
        {driverPosition && (
          <Marker longitude={driverPosition.lng} latitude={driverPosition.lat} anchor="center">
            <div className="relative">
              {/* Direction indicator */}
              {driverHeading !== null && (
                <div
                  className="absolute w-0 h-0"
                  style={{
                    top: '-20px',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${driverHeading}deg)`,
                    transformOrigin: 'center bottom',
                    borderLeft: '12px solid transparent',
                    borderRight: '12px solid transparent',
                    borderBottom: '24px solid rgba(99, 102, 241, 0.6)',
                  }}
                />
              )}
              {/* Pulse ring */}
              <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping" style={{ width: '56px', height: '56px', marginLeft: '-20px', marginTop: '-20px' }} />
              {/* Driver icon */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-full shadow-lg border-3 border-white">
                <Truck className="h-5 w-5 text-white" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Map controls */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant={isFollowing ? "default" : "secondary"}
          className="h-10 w-10 shadow-lg"
          onClick={() => setIsFollowing(!isFollowing)}
        >
          <Navigation className={cn("w-5 h-5", isFollowing && "animate-pulse")} />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 shadow-lg"
          onClick={handleRecenter}
        >
          <Locate className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 shadow-lg"
          onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom + 1 }))}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 shadow-lg"
          onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom - 1 }))}
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Status badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {isNavigating && (
          <Badge className="bg-green-500 text-white shadow-lg animate-pulse">
            <Navigation className="w-3 h-3 mr-1" />
            ملاحة نشطة
          </Badge>
        )}
        {accuracy && (
          <Badge variant="secondary" className="shadow-lg bg-background/90">
            <Compass className="w-3 h-3 mr-1" />
            ±{Math.round(accuracy)}م
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px] bg-background/90">
          Mapbox
        </Badge>
      </div>
    </div>
  );
};

export default MapboxNavigationMap;
