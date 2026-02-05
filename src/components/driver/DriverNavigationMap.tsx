import { useRef, useEffect, memo } from 'react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { Loader2 } from 'lucide-react';

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_before?: number;
    bearing_after?: number;
    location: [number, number];
  };
}

interface DriverNavigationMapProps {
  driverPosition: LocationState | null;
  driverHeading: number | null;
  routeCoordinates: [number, number][];
  completedCoordinates: [number, number][];
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  currentStep: RouteStep | null;
  isNavigating: boolean;
  accuracy: number | null;
}

const DriverNavigationMap = memo(({
  driverPosition,
  driverHeading,
  routeCoordinates,
  completedCoordinates,
  pickupCoords,
  deliveryCoords,
  currentStep,
  isNavigating,
  accuracy,
}: DriverNavigationMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const completedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    const defaultCenter = driverPosition 
      ? { lat: driverPosition.lat, lng: driverPosition.lng }
      : { lat: 30.0444, lng: 31.2357 };

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    });
  }, [isLoaded]);

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;

    const position = { lat: pickupCoords[0], lng: pickupCoords[1] };

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setPosition(position);
    } else {
      pickupMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        label: { text: 'A', color: 'white', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: 'نقطة الاستلام',
      });
    }
  }, [pickupCoords]);

  // Update delivery marker
  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;

    const position = { lat: deliveryCoords[0], lng: deliveryCoords[1] };

    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setPosition(position);
    } else {
      deliveryMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        label: { text: 'B', color: 'white', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: 'نقطة التسليم',
      });
    }
  }, [deliveryCoords]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeCoordinates.length < 2) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    const path = routeCoordinates.map(coord => ({ lat: coord[0], lng: coord[1] }));

    if (routePolylineRef.current) {
      routePolylineRef.current.setPath(path);
    } else {
      routePolylineRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#9ca3af',
        strokeOpacity: 0.6,
        strokeWeight: 5,
      });
    }
  }, [routeCoordinates]);

  // Update completed path polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (completedCoordinates.length < 2) {
      if (completedPolylineRef.current) {
        completedPolylineRef.current.setMap(null);
        completedPolylineRef.current = null;
      }
      return;
    }

    const path = completedCoordinates.map(coord => ({ lat: coord[0], lng: coord[1] }));

    if (completedPolylineRef.current) {
      completedPolylineRef.current.setPath(path);
    } else {
      completedPolylineRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#22c55e',
        strokeOpacity: 1,
        strokeWeight: 5,
      });
    }
  }, [completedCoordinates]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverPosition) return;

    const position = { lat: driverPosition.lat, lng: driverPosition.lng };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
      driverMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        rotation: driverHeading || 0,
      });
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          rotation: driverHeading || 0,
        },
        zIndex: 100,
        title: 'موقعك الحالي',
      });
    }

    // Update accuracy circle
    if (accuracy) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setCenter(position);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = new google.maps.Circle({
          map: mapRef.current,
          center: position,
          radius: accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });
      }
    }

    // Center map on driver when navigating
    if (isNavigating) {
      mapRef.current.panTo(position);
    }
  }, [driverPosition, driverHeading, accuracy, isNavigating]);

  // Fit bounds when not navigating
  useEffect(() => {
    if (!mapRef.current || isNavigating) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (pickupCoords) {
      bounds.extend({ lat: pickupCoords[0], lng: pickupCoords[1] });
      hasPoints = true;
    }
    if (deliveryCoords) {
      bounds.extend({ lat: deliveryCoords[0], lng: deliveryCoords[1] });
      hasPoints = true;
    }
    if (driverPosition) {
      bounds.extend({ lat: driverPosition.lat, lng: driverPosition.lng });
      hasPoints = true;
    }

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [pickupCoords, deliveryCoords, driverPosition, isNavigating]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
});

DriverNavigationMap.displayName = 'DriverNavigationMap';

export default DriverNavigationMap;
