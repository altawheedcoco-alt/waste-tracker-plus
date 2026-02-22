import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position { lat: number; lng: number; }

interface LeafletShipmentTrackingProps {
  collectionPoint?: Position;
  recyclingCenter?: Position;
  driverLocation?: Position & { recorded_at?: string };
  driverId?: string;
  showDriverTracking?: boolean;
  className?: string;
  height?: string;
}

const createCircle = (color: string, label: string) => L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">${label}</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const driverIcon = L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LeafletShipmentTracking = memo(({
  collectionPoint,
  recyclingCenter,
  driverLocation,
  showDriverTracking = true,
  className = '',
  height = '400px',
}: LeafletShipmentTrackingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = driverLocation || collectionPoint || recyclingCenter || { lat: 30.0444, lng: 31.2357 };
    const map = L.map(containerRef.current, { center: [center.lat, center.lng], zoom: 12, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    const bounds = L.latLngBounds([]);
    const routePoints: L.LatLng[] = [];

    if (collectionPoint) {
      L.marker([collectionPoint.lat, collectionPoint.lng], { icon: createCircle('#22c55e', '📦') })
        .bindPopup('نقطة الاستلام').addTo(layerRef.current);
      bounds.extend([collectionPoint.lat, collectionPoint.lng]);
      routePoints.push(L.latLng(collectionPoint.lat, collectionPoint.lng));
    }
    if (showDriverTracking && driverLocation) {
      L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon, zIndexOffset: 1000 })
        .bindPopup('موقع السائق').addTo(layerRef.current);
      bounds.extend([driverLocation.lat, driverLocation.lng]);
      routePoints.push(L.latLng(driverLocation.lat, driverLocation.lng));
    }
    if (recyclingCenter) {
      L.marker([recyclingCenter.lat, recyclingCenter.lng], { icon: createCircle('#8b5cf6', '♻️') })
        .bindPopup('مركز التدوير').addTo(layerRef.current);
      bounds.extend([recyclingCenter.lat, recyclingCenter.lng]);
      routePoints.push(L.latLng(recyclingCenter.lat, recyclingCenter.lng));
    }
    if (routePoints.length >= 2) {
      L.polyline(routePoints, { color: '#22c55e', weight: 4, opacity: 0.8 }).addTo(layerRef.current);
    }
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      if (routePoints.length === 1) mapRef.current.setZoom(14);
    }
  }, [collectionPoint, recyclingCenter, driverLocation, showDriverTracking]);

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-xs">
        <div className="flex flex-col gap-1">
          {collectionPoint && <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /><span>نقطة الاستلام</span></div>}
          {showDriverTracking && driverLocation && <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /><span>السائق</span></div>}
          {recyclingCenter && <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /><span>مركز التدوير</span></div>}
        </div>
      </div>
    </div>
  );
});

LeafletShipmentTracking.displayName = 'LeafletShipmentTracking';
export default LeafletShipmentTracking;
