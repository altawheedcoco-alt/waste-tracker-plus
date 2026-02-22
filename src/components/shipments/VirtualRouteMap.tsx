import { useRef, useEffect, memo, useState } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation } from 'lucide-react';

interface VirtualRouteMapProps {
  pickupLocation: { lat: number; lng: number } | null;
  deliveryLocation: { lat: number; lng: number } | null;
  pickupLabel?: string;
  deliveryLabel?: string;
  shipmentNumber?: string;
}

const createCircleIcon = (color: string, label: string) => L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">${label}</div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14],
});

function generateCurvedPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number
): L.LatLngExpression[] {
  const points: L.LatLngExpression[] = [];
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * 0.1;
  const perpLat = midLat + (dx / dist) * offset;
  const perpLng = midLng - (dy / dist) * offset;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * perpLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * perpLng + t * t * end.lng;
    points.push([lat, lng]);
  }
  return points;
}

const VirtualRouteMap = memo(({
  pickupLocation,
  deliveryLocation,
  pickupLabel = 'نقطة الاستلام',
  deliveryLabel = 'نقطة التسليم',
  shipmentNumber,
}: VirtualRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !pickupLocation || !deliveryLocation) return;

    // Clean previous map
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const center: L.LatLngExpression = [
      (pickupLocation.lat + deliveryLocation.lat) / 2,
      (pickupLocation.lng + deliveryLocation.lng) / 2,
    ];

    const map = L.map(containerRef.current, { center, zoom: 11, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    mapRef.current = map;

    // Markers
    L.marker([pickupLocation.lat, pickupLocation.lng], { icon: createCircleIcon('#f97316', 'A') }).addTo(map).bindPopup(pickupLabel);
    L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: createCircleIcon('#10b981', 'B') }).addTo(map).bindPopup(deliveryLabel);

    // Curved path
    const path = generateCurvedPath(pickupLocation, deliveryLocation, 50);
    L.polyline(path, { color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '10, 6' }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([
      [pickupLocation.lat, pickupLocation.lng],
      [deliveryLocation.lat, deliveryLocation.lng],
    ]);
    map.fitBounds(bounds, { padding: [60, 60] });

    // Distance
    const R = 6371;
    const dLat = ((deliveryLocation.lat - pickupLocation.lat) * Math.PI) / 180;
    const dLng = ((deliveryLocation.lng - pickupLocation.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((pickupLocation.lat * Math.PI) / 180) * Math.cos((deliveryLocation.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistance((R * c).toFixed(1));

    return () => { map.remove(); mapRef.current = null; };
  }, [pickupLocation, deliveryLocation]);

  if (!pickupLocation || !deliveryLocation) return null;

  return (
    <Card className="border border-indigo-200 dark:border-indigo-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2" dir="rtl">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-5 h-5 text-indigo-500" />
            تتبع مسار الشحنة
          </CardTitle>
          <div className="flex items-center gap-2">
            {distance && (
              <Badge variant="outline" className="gap-1 text-xs border-indigo-300 dark:border-indigo-700">
                <Navigation className="w-3 h-3" />
                {distance} كم (تقديري)
              </Badge>
            )}
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs">مسار افتراضي</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">عرض تقريبي لمسار الشحنة بين نقطتي الاستلام والتسليم</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div ref={containerRef} className="w-full h-[300px]" />
          <div className="absolute bottom-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-xs" dir="rtl">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /><span>{pickupLabel}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span>{deliveryLabel}</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VirtualRouteMap.displayName = 'VirtualRouteMap';
export default VirtualRouteMap;
