import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Locate, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createDriverMarkerIcon, pickupMarkerIcon, deliveryMarkerIcon } from '@/lib/mapUtils';
import { RouteStep } from '@/lib/routingUtils';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DriverNavigationMapProps {
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

// Component to follow driver
const FollowDriver = ({ 
  position, 
  heading, 
  shouldFollow 
}: { 
  position: [number, number]; 
  heading: number | null;
  shouldFollow: boolean;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldFollow && position) {
      map.setView(position, map.getZoom(), { animate: true });
      
      // Rotate map based on heading (if supported)
      // Note: Standard Leaflet doesn't support rotation, but we can add visual indicator
    }
  }, [position, shouldFollow, map]);
  
  return null;
};

// Map controls component
const MapControls = ({ 
  onRecenter, 
  onZoomIn, 
  onZoomOut,
  isFollowing,
  onToggleFollow 
}: { 
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) => {
  return (
    <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        variant={isFollowing ? "default" : "secondary"}
        className="h-10 w-10 shadow-lg"
        onClick={onToggleFollow}
      >
        <Navigation className={cn("w-5 h-5", isFollowing && "animate-pulse")} />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 shadow-lg"
        onClick={onRecenter}
      >
        <Locate className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 shadow-lg"
        onClick={onZoomIn}
      >
        <ZoomIn className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 shadow-lg"
        onClick={onZoomOut}
      >
        <ZoomOut className="w-5 h-5" />
      </Button>
    </div>
  );
};

// Custom driver icon with heading indicator
const createNavigatingDriverIcon = (heading: number | null): L.DivIcon => {
  const rotation = heading || 0;
  
  return new L.DivIcon({
    className: 'navigating-driver-icon',
    html: `
      <div style="
        position: relative;
        width: 60px;
        height: 60px;
      ">
        <!-- Direction indicator -->
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(${rotation}deg);
          transform-origin: center 30px;
          width: 20px;
          height: 60px;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 20px solid rgba(99, 102, 241, 0.6);
          "></div>
        </div>
        
        <!-- Pulse ring -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: driverNavPulse 2s infinite;
        "></div>
        
        <!-- Driver icon -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 16px;">🚛</span>
        </div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

const DriverNavigationMap = ({
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
}: DriverNavigationMapProps) => {
  const [isFollowing, setIsFollowing] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = [30.0444, 31.2357];
  const center = driverPosition 
    ? [driverPosition.lat, driverPosition.lng] as [number, number]
    : pickupCoords || defaultCenter;

  const handleRecenter = useCallback(() => {
    if (mapRef.current && driverPosition) {
      mapRef.current.setView([driverPosition.lat, driverPosition.lng], 16, { animate: true });
    }
  }, [driverPosition]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  }, []);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <style>{`
        @keyframes driverNavPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Follow driver component */}
        {driverPosition && (
          <FollowDriver
            position={[driverPosition.lat, driverPosition.lng]}
            heading={driverHeading}
            shouldFollow={isFollowing && isNavigating}
          />
        )}

        {/* Completed route (green) */}
        {completedCoordinates.length > 1 && (
          <Polyline
            positions={completedCoordinates}
            pathOptions={{
              color: '#22c55e',
              weight: 6,
              opacity: 1,
            }}
          />
        )}

        {/* Remaining route (blue dashed) */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#6366f1',
              weight: 5,
              opacity: 0.8,
              dashArray: '12, 8',
            }}
          />
        )}

        {/* Accuracy circle */}
        {driverPosition && accuracy && accuracy > 10 && (
          <Circle
            center={[driverPosition.lat, driverPosition.lng]}
            radius={accuracy}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
        )}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupMarkerIcon} />
        )}

        {/* Delivery marker */}
        {deliveryCoords && (
          <Marker position={deliveryCoords} icon={deliveryMarkerIcon} />
        )}

        {/* Driver marker with heading */}
        {driverPosition && (
          <Marker
            position={[driverPosition.lat, driverPosition.lng]}
            icon={createNavigatingDriverIcon(driverHeading)}
          />
        )}

        {/* Current step marker */}
        {currentStep && currentStep.maneuver.location && (
          <Circle
            center={[currentStep.maneuver.location[1], currentStep.maneuver.location[0]]}
            radius={15}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.5,
              weight: 2,
            }}
          />
        )}
      </MapContainer>

      {/* Map controls */}
      <MapControls
        onRecenter={handleRecenter}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        isFollowing={isFollowing}
        onToggleFollow={() => setIsFollowing(!isFollowing)}
      />

      {/* Status badges */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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

export default DriverNavigationMap;
