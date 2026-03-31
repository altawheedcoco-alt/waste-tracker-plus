/**
 * خريطة الطلب الساخن — للسائق المستقل
 * تظهر مناطق تركز الشحنات غير المُسندة + عروض المهام
 */
import { memo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, MapPin, Package, Navigation, Loader2, Eye } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/leafletConfig';
import { useNearbyShipments, type NearbyShipment } from '@/hooks/useProximityData';
import '@/styles/leaflet.css';
import 'leaflet/dist/leaflet.css';

const driverIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/** Cluster nearby shipments into zones */
function clusterShipments(shipments: NearbyShipment[], clusterRadiusKm = 5): Array<{
  lat: number; lng: number; count: number; shipments: NearbyShipment[];
}> {
  const used = new Set<string>();
  const clusters: Array<{ lat: number; lng: number; count: number; shipments: NearbyShipment[] }> = [];

  shipments.forEach(s => {
    if (used.has(s.id)) return;
    const group = shipments.filter(o => {
      if (used.has(o.id)) return false;
      const dist = Math.sqrt(
        Math.pow((s.pickupLat - o.pickupLat) * 111, 2) +
        Math.pow((s.pickupLng - o.pickupLng) * 111 * Math.cos(s.pickupLat * Math.PI / 180), 2)
      );
      return dist <= clusterRadiusKm;
    });
    group.forEach(g => used.add(g.id));
    const avgLat = group.reduce((a, g) => a + g.pickupLat, 0) / group.length;
    const avgLng = group.reduce((a, g) => a + g.pickupLng, 0) / group.length;
    clusters.push({ lat: avgLat, lng: avgLng, count: group.length, shipments: group });
  });

  return clusters;
}

function getHeatColor(count: number, max: number): string {
  const ratio = Math.min(count / Math.max(max, 1), 1);
  if (ratio < 0.33) return '#facc15'; // yellow
  if (ratio < 0.66) return '#f97316'; // orange
  return '#ef4444'; // red
}

function FitView({ center, shipments }: { center: [number, number]; shipments: NearbyShipment[] }) {
  const map = useMap();
  useEffect(() => {
    if (shipments.length === 0) {
      map.setView(center, 11);
    } else {
      const points: [number, number][] = [center, ...shipments.map(s => [s.pickupLat, s.pickupLng] as [number, number])];
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    }
  }, [center, shipments.length]);
  return null;
}

interface Props {
  driverLat?: number;
  driverLng?: number;
  serviceAreaKm?: number;
}

const DemandHeatmapDriver = memo(({ driverLat, driverLng, serviceAreaKm = 30 }: Props) => {
  // Auto-detect GPS if no coordinates provided
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (driverLat && driverLng) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsCoords({ lat: 30.0444, lng: 31.2357 }), // fallback Cairo
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsCoords({ lat: 30.0444, lng: 31.2357 });
    }
  }, [driverLat, driverLng]);

  const actualLat = driverLat || gpsCoords?.lat || 30.0444;
  const actualLng = driverLng || gpsCoords?.lng || 31.2357;
  const center = { lat: actualLat, lng: actualLng };
  const { data: shipments = [], isLoading } = useNearbyShipments(center, serviceAreaKm);

  const clusters = clusterShipments(shipments);
  const maxCount = Math.max(...clusters.map(c => c.count), 1);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            خريطة الطلب الساخن
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Package className="w-3 h-3" />
              {shipments.length} شحنة قريبة
            </Badge>
            {clusters.length > 0 && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <MapPin className="w-3 h-3" />
                {clusters.length} منطقة
              </Badge>
            )}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> طلب منخفض</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> طلب متوسط</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> طلب مرتفع</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px] bg-muted/20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-[250px]">
            <MapContainer
              center={[driverLat, driverLng]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
              <FitView center={[driverLat, driverLng]} shipments={shipments} />

              {/* Service area circle */}
              <Circle
                center={[driverLat, driverLng]}
                radius={serviceAreaKm * 1000}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.04,
                  weight: 1.5,
                  dashArray: '8 4',
                }}
              />

              {/* Driver position */}
              <Marker position={[driverLat, driverLng]} icon={driverIcon}>
                <Popup>
                  <div className="text-center text-xs font-bold" dir="rtl">📍 موقعك الحالي</div>
                </Popup>
              </Marker>

              {/* Demand clusters */}
              {clusters.map((cluster, i) => {
                const color = getHeatColor(cluster.count, maxCount);
                const radius = Math.max(15, Math.min(40, cluster.count * 12));
                return (
                  <CircleMarker
                    key={`cluster-${i}`}
                    center={[cluster.lat, cluster.lng]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.35,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 min-w-[130px]" dir="rtl">
                        <div className="font-bold text-center">🔥 {cluster.count} شحنة</div>
                        {cluster.shipments.slice(0, 3).map(s => (
                          <div key={s.id} className="border-t pt-1">
                            <div className="font-medium">{s.shipmentNumber}</div>
                            <div className="text-muted-foreground">{s.wasteType} • {s.quantity} {s.unit}</div>
                            <div className="text-muted-foreground">📏 {s.distanceKm} كم</div>
                          </div>
                        ))}
                        {cluster.shipments.length > 3 && (
                          <div className="text-center text-muted-foreground">+{cluster.shipments.length - 3} أخرى</div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DemandHeatmapDriver.displayName = 'DemandHeatmapDriver';
export default DemandHeatmapDriver;
