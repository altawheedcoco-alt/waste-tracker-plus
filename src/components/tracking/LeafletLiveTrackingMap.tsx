import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM, TRACKING_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const pickupIcon = L.divIcon({
  html: '<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">▲</div>',
  iconSize: [24, 24], className: '',
});
const deliveryIcon = L.divIcon({
  html: '<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">●</div>',
  iconSize: [24, 24], className: '',
});
const driverIcon = L.divIcon({
  html: '<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">🚛</div>',
  iconSize: [28, 28], className: '',
});

interface Props {
  pickupCoords?: [number, number] | null;
  deliveryCoords?: [number, number] | null;
  driverLocation?: { latitude: number; longitude: number } | null;
  driverPath?: [number, number][];
  routeCoords?: [number, number][];
  centerOnDriver?: boolean;
  isDriverOnline?: boolean;
}

const LeafletLiveTrackingMap = memo(({
  pickupCoords, deliveryCoords, driverLocation, driverPath = [], routeCoords = [], centerOnDriver, isDriverOnline,
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const driverPathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    mapInstanceRef.current = map;

    const bounds = L.latLngBounds([]);

    if (pickupCoords) {
      L.marker(pickupCoords, { icon: pickupIcon }).addTo(map).bindPopup('📦 نقطة الاستلام');
      bounds.extend(pickupCoords);
    }
    if (deliveryCoords) {
      L.marker(deliveryCoords, { icon: deliveryIcon }).addTo(map).bindPopup('📍 نقطة التسليم');
      bounds.extend(deliveryCoords);
    }
    if (routeCoords.length > 1) {
      L.polyline(routeCoords, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
      routeCoords.forEach(c => bounds.extend(c));
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [pickupCoords, deliveryCoords, routeCoords]);

  // Update driver position
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverLocation) return;

    const pos: [number, number] = [driverLocation.latitude, driverLocation.longitude];

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(pos);
    } else {
      driverMarkerRef.current = L.marker(pos, { icon: driverIcon }).addTo(map).bindPopup('🚛 السائق');
    }

    if (centerOnDriver) map.setView(pos, TRACKING_ZOOM);
  }, [driverLocation, centerOnDriver]);

  // Update driver path
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (driverPathRef.current) map.removeLayer(driverPathRef.current);
    if (driverPath.length > 1) {
      driverPathRef.current = L.polyline(driverPath, { color: '#8b5cf6', weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(map);
    }
  }, [driverPath]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '300px' }} className="rounded-lg" />;
});

LeafletLiveTrackingMap.displayName = 'LeafletLiveTrackingMap';
export default LeafletLiveTrackingMap;
