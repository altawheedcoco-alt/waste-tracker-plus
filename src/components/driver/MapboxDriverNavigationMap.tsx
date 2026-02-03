import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Locate, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteStep } from '@/lib/routingUtils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface MapboxDriverNavigationMapProps {
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

const MapboxDriverNavigationMap = ({
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
}: MapboxDriverNavigationMapProps) => {
  const [isFollowing, setIsFollowing] = useState(true);
  const mapRef = useRef<any>(null);

  const defaultCenter = { lat: 30.0444, lng: 31.2357 };
  const center = driverPosition || (pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1] } : defaultCenter);

  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 16,
  });

  // Follow driver when position updates
  useEffect(() => {
    if (isFollowing && driverPosition && isNavigating) {
      setViewState(prev => ({
        ...prev,
        longitude: driverPosition.lng,
        latitude: driverPosition.lat,
      }));
    }
  }, [driverPosition, isFollowing, isNavigating]);

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

  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 5) }));
  }, []);

  // Convert coordinates to GeoJSON
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: routeCoordinates.map(([lat, lng]) => [lng, lat]),
    },
  };

  const completedGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: completedCoordinates.map(([lat, lng]) => [lng, lat]),
    },
  };

  return (
    <div className={cn("relative h-full w-full", className)}>
      <style>{`
        @keyframes driverNavPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        ref={mapRef}
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

        {/* Remaining route (blue dashed) */}
        {routeCoordinates.length > 1 && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 5,
                'line-opacity': 0.8,
                'line-dasharray': [2, 1],
              }}
            />
          </Source>
        )}

        {/* Completed route (green) */}
        {completedCoordinates.length > 1 && (
          <Source id="completed-route" type="geojson" data={completedGeoJSON}>
            <Layer
              id="completed-line"
              type="line"
              paint={{
                'line-color': '#22c55e',
                'line-width': 6,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker longitude={pickupCoords[1]} latitude={pickupCoords[0]} anchor="center">
            <div className="w-10 h-10 bg-yellow-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Delivery marker */}
        {deliveryCoords && (
          <Marker longitude={deliveryCoords[1]} latitude={deliveryCoords[0]} anchor="center">
            <div className="w-10 h-10 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Driver marker with heading */}
        {driverPosition && (
          <Marker longitude={driverPosition.lng} latitude={driverPosition.lat} anchor="center">
            <div className="relative" style={{ width: '60px', height: '60px' }}>
              {/* Direction indicator */}
              <div
                className="absolute top-0 left-1/2 origin-bottom"
                style={{
                  transform: `translateX(-50%) rotate(${driverHeading || 0}deg)`,
                  transformOrigin: 'center 30px',
                  width: '20px',
                  height: '60px',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '20px solid rgba(99, 102, 241, 0.6)',
                  }}
                />
              </div>

              {/* Pulse ring */}
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '50px',
                  height: '50px',
                  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                }}
              />

              {/* Driver icon */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: '3px solid white',
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                }}
              >
                <span style={{ fontSize: '16px' }}>🚛</span>
              </div>
            </div>
          </Marker>
        )}

        {/* Current step marker */}
        {currentStep && currentStep.maneuver.location && (
          <Marker
            longitude={currentStep.maneuver.location[0]}
            latitude={currentStep.maneuver.location[1]}
            anchor="center"
          >
            <div
              className="rounded-full"
              style={{
                width: '30px',
                height: '30px',
                background: 'rgba(245, 158, 11, 0.5)',
                border: '2px solid #f59e0b',
              }}
            />
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
          onClick={handleZoomIn}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 shadow-lg"
          onClick={handleZoomOut}
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
          <Badge variant="secondary" className="shadow-lg">
            <Compass className="w-3 h-3 mr-1" />
            ±{Math.round(accuracy)}م
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MapboxDriverNavigationMap;
