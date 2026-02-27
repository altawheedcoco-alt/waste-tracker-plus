import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, MapPin, Loader2, Clock, Ruler } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { fetchRoadRoute, formatDistance, formatDuration } from '@/lib/mapUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface CompletedRouteMapProps {
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  pickupLabel?: string;
  deliveryLabel?: string;
  shipmentNumber?: string;
}

const CompletedRouteMap = memo(({
  pickupCoords,
  deliveryCoords,
  pickupLabel = 'نقطة الاستلام',
  deliveryLabel = 'نقطة التسليم',
  shipmentNumber,
}: CompletedRouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!mapRef.current || !pickupCoords || !deliveryCoords) {
      setLoading(false);
      return;
    }

    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    mapInstanceRef.current = map;

    const bounds = L.latLngBounds([]);

    // Pickup marker (green)
    const pickupIcon = L.divIcon({
      html: `<div style="background:#22c55e;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">📦</div>`,
      iconSize: [28, 28],
      className: '',
    });
    L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="text-align:right"><strong>📦 ${pickupLabel}</strong></div>`);
    bounds.extend([pickupCoords.lat, pickupCoords.lng]);

    // Delivery marker (red)
    const deliveryIcon = L.divIcon({
      html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">✅</div>`,
      iconSize: [28, 28],
      className: '',
    });
    L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="text-align:right"><strong>✅ ${deliveryLabel}</strong></div>`);
    bounds.extend([deliveryCoords.lat, deliveryCoords.lng]);

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });

    // Fetch and draw the road route
    (async () => {
      setLoading(true);
      try {
        const route = await fetchRoadRoute(pickupCoords, deliveryCoords);

        if (route.success && route.coordinates.length > 1) {
          // Animated polyline - draw the route with a nice gradient effect
          const routeLine = L.polyline(route.coordinates, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);

          // Add a dashed shadow for depth
          L.polyline(route.coordinates, {
            color: '#1e40af',
            weight: 7,
            opacity: 0.2,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);

          // Add direction arrows
          const midIdx = Math.floor(route.coordinates.length / 2);
          if (midIdx > 0) {
            const arrowIcon = L.divIcon({
              html: '<div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">🚛</div>',
              iconSize: [20, 20],
              className: '',
            });
            L.marker(route.coordinates[midIdx], { icon: arrowIcon, interactive: false }).addTo(map);
          }

          map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        } else {
          // Fallback: straight dashed line
          L.polyline(
            [[pickupCoords.lat, pickupCoords.lng], [deliveryCoords.lat, deliveryCoords.lng]],
            { color: '#94a3b8', weight: 3, dashArray: '10,8', opacity: 0.6 }
          ).addTo(map);
        }

        setRouteInfo({
          distance: formatDistance(route.distance),
          duration: formatDuration(route.duration),
        });
      } catch (err) {
        console.error('Route fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupCoords, deliveryCoords]);

  if (!pickupCoords || !deliveryCoords) return null;

  return (
    <Card className="border border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Route className="w-5 h-5 text-primary" />
            مسار الشحنة المكتمل
            {shipmentNumber && (
              <span className="text-sm text-muted-foreground font-normal">#{shipmentNumber}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {loading && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                جاري تحميل المسار...
              </Badge>
            )}
            {routeInfo && !loading && (
              <>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Ruler className="w-3 h-3" />
                  {routeInfo.distance}
                </Badge>
                {routeInfo.duration !== '0 دقيقة' && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    {routeInfo.duration}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapRef} style={{ height: '350px', width: '100%' }} className="rounded-b-lg" />
          {/* Legend overlay */}
          <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg border border-border p-2 text-xs space-y-1" dir="rtl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-muted-foreground">{pickupLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="text-muted-foreground">{deliveryLabel}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CompletedRouteMap.displayName = 'CompletedRouteMap';
export default CompletedRouteMap;
