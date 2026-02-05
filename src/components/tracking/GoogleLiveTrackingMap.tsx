import { useRef, useEffect, memo } from 'react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { Loader2 } from 'lucide-react';

interface GoogleLiveTrackingMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    heading: number | null;
  } | null;
  driverPath: [number, number][];
  routeCoords: [number, number][];
  centerOnDriver: boolean;
  isDriverOnline: boolean;
}

const GoogleLiveTrackingMap = memo(({
  pickupCoords,
  deliveryCoords,
  driverLocation,
  driverPath,
  routeCoords,
  centerOnDriver,
  isDriverOnline,
}: GoogleLiveTrackingMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const pathPolylineRef = useRef<google.maps.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    const defaultCenter = { lat: 30.0444, lng: 31.2357 }; // Cairo

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
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
          scale: 14,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
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
          scale: 14,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        title: 'نقطة التسليم',
      });
    }
  }, [deliveryCoords]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;

    const path = routeCoords.map(coord => ({ lat: coord[0], lng: coord[1] }));

    if (routePolylineRef.current) {
      routePolylineRef.current.setPath(path);
    } else {
      routePolylineRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
    }

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 50);
  }, [routeCoords]);

  // Update driver path polyline
  useEffect(() => {
    if (!mapRef.current || driverPath.length < 2) return;

    const path = driverPath.map(coord => ({ lat: coord[0], lng: coord[1] }));

    if (pathPolylineRef.current) {
      pathPolylineRef.current.setPath(path);
    } else {
      pathPolylineRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#22c55e',
        strokeOpacity: 0.9,
        strokeWeight: 3,
      });
    }
  }, [driverPath]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const position = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: isDriverOnline ? '#22c55e' : '#6b7280',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          rotation: driverLocation.heading || 0,
        },
        title: 'موقع السائق',
        zIndex: 100,
      });
    }

    // Update icon color based on online status
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: isDriverOnline ? '#22c55e' : '#6b7280',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        rotation: driverLocation.heading || 0,
      });
    }

    // Center on driver if enabled
    if (centerOnDriver) {
      mapRef.current.panTo(position);
    }
  }, [driverLocation, centerOnDriver, isDriverOnline]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
});

GoogleLiveTrackingMap.displayName = 'GoogleLiveTrackingMap';

export default GoogleLiveTrackingMap;
