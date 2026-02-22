import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';
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

const createCircleIcon = (color: string, label: string) => L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">${label}</div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14],
});

const createDriverIcon = (heading: number | null) => L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading || 0}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14],
});

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = driverPosition
      ? [driverPosition.lat, driverPosition.lng]
      : [30.0444, 31.2357];

    mapRef.current = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;
    const pos: L.LatLngExpression = [pickupCoords[0], pickupCoords[1]];
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng(pos);
    } else {
      pickupMarkerRef.current = L.marker(pos, { icon: createCircleIcon('#22c55e', 'A') })
        .addTo(mapRef.current).bindPopup('نقطة الاستلام');
    }
  }, [pickupCoords]);

  // Update delivery marker
  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;
    const pos: L.LatLngExpression = [deliveryCoords[0], deliveryCoords[1]];
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng(pos);
    } else {
      deliveryMarkerRef.current = L.marker(pos, { icon: createCircleIcon('#ef4444', 'B') })
        .addTo(mapRef.current).bindPopup('نقطة التسليم');
    }
  }, [deliveryCoords]);

  // Update route polyline (remaining - gray)
  useEffect(() => {
    if (!mapRef.current) return;
    if (routeCoordinates.length < 2) {
      if (routePolylineRef.current) { routePolylineRef.current.remove(); routePolylineRef.current = null; }
      return;
    }
    const path: L.LatLngExpression[] = routeCoordinates.map(c => [c[0], c[1]]);
    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(path);
    } else {
      routePolylineRef.current = L.polyline(path, { color: '#9ca3af', weight: 5, opacity: 0.6 }).addTo(mapRef.current);
    }
  }, [routeCoordinates]);

  // Update completed path (green)
  useEffect(() => {
    if (!mapRef.current) return;
    if (completedCoordinates.length < 2) {
      if (completedPolylineRef.current) { completedPolylineRef.current.remove(); completedPolylineRef.current = null; }
      return;
    }
    const path: L.LatLngExpression[] = completedCoordinates.map(c => [c[0], c[1]]);
    if (completedPolylineRef.current) {
      completedPolylineRef.current.setLatLngs(path);
    } else {
      completedPolylineRef.current = L.polyline(path, { color: '#22c55e', weight: 5, opacity: 1 }).addTo(mapRef.current);
    }
  }, [completedCoordinates]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverPosition) return;
    const pos: L.LatLngExpression = [driverPosition.lat, driverPosition.lng];
    const icon = createDriverIcon(driverHeading);

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(pos);
      driverMarkerRef.current.setIcon(icon);
    } else {
      driverMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 })
        .addTo(mapRef.current).bindPopup('موقعك الحالي');
    }

    // Update accuracy circle
    if (accuracy && accuracy > 0) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(pos);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(pos, {
          radius: accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          color: '#3b82f6',
          opacity: 0.3,
          weight: 1,
        }).addTo(mapRef.current);
      }
    }

    if (isNavigating) {
      mapRef.current.panTo(pos);
    }
  }, [driverPosition, driverHeading, accuracy, isNavigating]);

  // Fit bounds when not navigating
  useEffect(() => {
    if (!mapRef.current || isNavigating) return;
    const bounds = L.latLngBounds([]);
    if (pickupCoords) bounds.extend([pickupCoords[0], pickupCoords[1]]);
    if (deliveryCoords) bounds.extend([deliveryCoords[0], deliveryCoords[1]]);
    if (driverPosition) bounds.extend([driverPosition.lat, driverPosition.lng]);
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickupCoords, deliveryCoords, driverPosition, isNavigating]);

  return <div ref={containerRef} className="w-full h-full" />;
});

DriverNavigationMap.displayName = 'DriverNavigationMap';

export default DriverNavigationMap;
