import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface Props {
  pickupCoords?: { lat: number; lng: number } | null;
  deliveryCoords?: { lat: number; lng: number } | null;
  collectionPoint?: { lat: number; lng: number } | null;
  recyclingCenter?: { lat: number; lng: number } | null;
  driverCoords?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number; recorded_at?: string } | null;
  driverId?: string;
  showDriverTracking?: boolean;
  routeCoords?: [number, number][];
  className?: string;
  height?: string;
  [key: string]: any;
}

const LeafletShipmentTracking = memo(({ 
  pickupCoords, deliveryCoords, collectionPoint, recyclingCenter, 
  driverCoords, driverLocation, routeCoords, className, height = '400px' 
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // Normalize coords - support both naming conventions
  const pickup = pickupCoords || collectionPoint;
  const delivery = deliveryCoords || recyclingCenter;
  const driver = driverCoords || (driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    const bounds = L.latLngBounds([]);

    if (pickup) {
      const icon = L.divIcon({
        html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [20, 20], className: '',
      });
      L.marker([pickup.lat, pickup.lng], { icon }).addTo(map).bindPopup('📦 الاستلام');
      bounds.extend([pickup.lat, pickup.lng]);
    }
    if (delivery) {
      const icon = L.divIcon({
        html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [20, 20], className: '',
      });
      L.marker([delivery.lat, delivery.lng], { icon }).addTo(map).bindPopup('📍 التسليم');
      bounds.extend([delivery.lat, delivery.lng]);
    }
    if (driver) {
      const icon = L.divIcon({
        html: '<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">🚛</div>',
        iconSize: [24, 24], className: '',
      });
      L.marker([driver.lat, driver.lng], { icon }).addTo(map).bindPopup('🚛 السائق');
      bounds.extend([driver.lat, driver.lng]);
    }
    if (routeCoords && routeCoords.length > 1) {
      L.polyline(routeCoords, { color: '#3b82f6', weight: 4 }).addTo(map);
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });

    return () => { map.remove(); };
  }, [pickup, delivery, driver, routeCoords]);

  return <div ref={mapRef} className={className} style={{ height }} />;
});

LeafletShipmentTracking.displayName = 'LeafletShipmentTracking';
export default LeafletShipmentTracking;
