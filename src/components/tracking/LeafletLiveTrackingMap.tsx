import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

interface LeafletLiveTrackingMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  driverLocation: { latitude: number; longitude: number; heading: number | null; } | null;
  driverPath: [number, number][];
  routeCoords: [number, number][];
  centerOnDriver: boolean;
  isDriverOnline: boolean;
}

const createCircleIcon = (color: string, label: string) => L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">${label}</div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14],
});

const createDriverIcon = (online: boolean, heading: number | null) => L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50%;background:${online ? '#22c55e' : '#6b7280'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading || 0}deg);"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});

const LeafletLiveTrackingMap = memo(({
  pickupCoords, deliveryCoords, driverLocation, driverPath, routeCoords, centerOnDriver, isDriverOnline,
}: LeafletLiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { center: [30.0444, 31.2357], zoom: 12, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;
    const pos: L.LatLngExpression = [pickupCoords[0], pickupCoords[1]];
    if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng(pos);
    else { pickupMarkerRef.current = L.marker(pos, { icon: createCircleIcon('#22c55e', 'A') }).addTo(mapRef.current).bindPopup('نقطة الاستلام'); }
  }, [pickupCoords]);

  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;
    const pos: L.LatLngExpression = [deliveryCoords[0], deliveryCoords[1]];
    if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng(pos);
    else { deliveryMarkerRef.current = L.marker(pos, { icon: createCircleIcon('#ef4444', 'B') }).addTo(mapRef.current).bindPopup('نقطة التسليم'); }
  }, [deliveryCoords]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;
    const path: L.LatLngExpression[] = routeCoords.map(c => [c[0], c[1]]);
    if (routeLineRef.current) routeLineRef.current.setLatLngs(path);
    else { routeLineRef.current = L.polyline(path, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(mapRef.current); }
    mapRef.current.fitBounds(L.latLngBounds(path), { padding: [50, 50] });
  }, [routeCoords]);

  useEffect(() => {
    if (!mapRef.current || driverPath.length < 2) return;
    const path: L.LatLngExpression[] = driverPath.map(c => [c[0], c[1]]);
    if (pathLineRef.current) pathLineRef.current.setLatLngs(path);
    else { pathLineRef.current = L.polyline(path, { color: '#22c55e', weight: 3, opacity: 0.9 }).addTo(mapRef.current); }
  }, [driverPath]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    const pos: L.LatLngExpression = [driverLocation.latitude, driverLocation.longitude];
    const icon = createDriverIcon(isDriverOnline, driverLocation.heading);
    if (driverMarkerRef.current) { driverMarkerRef.current.setLatLng(pos); driverMarkerRef.current.setIcon(icon); }
    else { driverMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(mapRef.current).bindPopup('موقع السائق'); }
    if (centerOnDriver) mapRef.current.panTo(pos);
  }, [driverLocation, centerOnDriver, isDriverOnline]);

  return <div ref={containerRef} className="w-full h-full" />;
});

LeafletLiveTrackingMap.displayName = 'LeafletLiveTrackingMap';
export default LeafletLiveTrackingMap;
