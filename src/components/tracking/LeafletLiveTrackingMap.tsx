import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/leafletConfig';

interface LeafletLiveTrackingMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  driverLocation: { latitude: number; longitude: number; heading: number | null } | null;
  driverPath: [number, number][];
  routeCoords: [number, number][];
  centerOnDriver: boolean;
  isDriverOnline: boolean;
}

const LeafletLiveTrackingMap = memo(({
  pickupCoords, deliveryCoords, driverLocation, driverPath, routeCoords, centerOnDriver, isDriverOnline,
}: LeafletLiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const pathLayerRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [26.8, 30.8],
      zoom: 6,
      maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
    });
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;
    const latlng: [number, number] = [pickupCoords[0], pickupCoords[1]];
    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">A</div>`,
      className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    });
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng(latlng);
    } else {
      pickupMarkerRef.current = L.marker(latlng, { icon }).bindPopup('نقطة الاستلام').addTo(mapRef.current);
    }
  }, [pickupCoords]);

  // Delivery marker
  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;
    const latlng: [number, number] = [deliveryCoords[0], deliveryCoords[1]];
    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">B</div>`,
      className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    });
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng(latlng);
    } else {
      deliveryMarkerRef.current = L.marker(latlng, { icon }).bindPopup('نقطة التسليم').addTo(mapRef.current);
    }
  }, [deliveryCoords]);

  // Route line
  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;
    const latlngs: L.LatLngExpression[] = routeCoords.map(c => [c[0], c[1]] as [number, number]);
    
    if (routeLayerRef.current) {
      routeLayerRef.current.setLatLngs(latlngs);
    } else {
      routeLayerRef.current = L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
    }
    mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
  }, [routeCoords]);

  // Driver path (completed)
  useEffect(() => {
    if (!mapRef.current || driverPath.length < 2) return;
    const latlngs: L.LatLngExpression[] = driverPath.map(c => [c[0], c[1]] as [number, number]);
    
    if (pathLayerRef.current) {
      pathLayerRef.current.setLatLngs(latlngs);
    } else {
      pathLayerRef.current = L.polyline(latlngs, { color: '#22c55e', weight: 3, opacity: 0.9 }).addTo(mapRef.current);
    }
  }, [driverPath]);

  // Driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    const latlng: [number, number] = [driverLocation.latitude, driverLocation.longitude];
    const color = isDriverOnline ? '#22c55e' : '#6b7280';
    const heading = driverLocation.heading || 0;

    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`,
      className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(latlng).setIcon(icon);
    } else {
      driverMarkerRef.current = L.marker(latlng, { icon }).bindPopup('موقع السائق').addTo(mapRef.current);
    }

    if (centerOnDriver) {
      mapRef.current.panTo(latlng);
    }
  }, [driverLocation, centerOnDriver, isDriverOnline]);

  return <div ref={containerRef} className="w-full h-full" />;
});

LeafletLiveTrackingMap.displayName = 'LeafletLiveTrackingMap';
export default LeafletLiveTrackingMap;
