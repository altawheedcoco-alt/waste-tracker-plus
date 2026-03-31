/**
 * خريطة الطلب الساخن — للسائق المستقل
 * مُعطّل مؤقتاً بسبب عدم توافق react-leaflet مع React 18
 */
import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, MapPin, Package, Radio } from 'lucide-react';
import { useNearbyShipments, type NearbyShipment } from '@/hooks/useProximityData';

function clusterShipments(shipments: NearbyShipment[], clusterRadiusKm = 5) {
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

interface Props {
  driverLat?: number;
  driverLng?: number;
  serviceAreaKm?: number;
}

const DemandHeatmapDriver = memo(({ driverLat, driverLng, serviceAreaKm = 30 }: Props) => {
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (driverLat && driverLng) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsCoords({ lat: 30.0444, lng: 31.2357 }),
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
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> طلب منخفض</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> طلب متوسط</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> طلب مرتفع</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center h-[250px] bg-muted/10 gap-3">
          <div className="relative">
            <Radio className="w-10 h-10 text-orange-400/50 animate-pulse" />
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">جاري تحليل مناطق الطلب...</p>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {shipments.length} شحنة في {clusters.length} منطقة
              </p>
              {clusters.slice(0, 3).map((c, i) => (
                <p key={i} className="text-[11px] text-muted-foreground">
                  🔥 {c.count} شحنة — {c.shipments[0]?.wasteType || 'متنوع'}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

DemandHeatmapDriver.displayName = 'DemandHeatmapDriver';
export default DemandHeatmapDriver;
