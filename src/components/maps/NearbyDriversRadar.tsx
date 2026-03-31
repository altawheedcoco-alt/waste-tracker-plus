/**
 * خريطة رادار السائقين القريبين — للناقل
 * مُعطّل مؤقتاً بسبب عدم توافق react-leaflet مع React 18
 */
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Navigation, Radio } from 'lucide-react';
import { useNearbyDrivers } from '@/hooks/useProximityData';

const RADIUS_KM = 50;

interface Props {
  pickupLat: number;
  pickupLng: number;
}

const NearbyDriversRadar = memo(({ pickupLat, pickupLng }: Props) => {
  const center = { lat: pickupLat, lng: pickupLng };
  const { data: drivers = [], isLoading } = useNearbyDrivers(center, RADIUS_KM);

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const arrivingCount = drivers.filter(d => d.status === 'arriving_soon').length;

  return (
    <Card className="overflow-hidden border-primary/20">
      {/* Badge bar */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1 text-[10px]">
            <Truck className="w-3 h-3" />
            {availableCount} متاح
          </Badge>
          {arrivingCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              <Navigation className="w-3 h-3" />
              {arrivingCount} يقترب
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          نطاق {RADIUS_KM} كم
        </span>
      </div>

      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center h-[220px] bg-muted/10 gap-3">
          <div className="relative">
            <Radio className="w-10 h-10 text-primary/40 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">جاري البحث عن سائقين...</p>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {drivers.length} سائق في النطاق
              </p>
              <p className="text-[11px] text-muted-foreground">
                🟢 {availableCount} متاح • 🟠 {arrivingCount} يقترب
              </p>
            </div>
          )}
          {drivers.slice(0, 4).map(driver => (
            <div key={driver.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={driver.status === 'available' ? 'text-emerald-500' : 'text-orange-500'}>●</span>
              <span>{driver.name}</span>
              <span className="text-[10px]">({driver.distanceKm} كم)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

NearbyDriversRadar.displayName = 'NearbyDriversRadar';
export default NearbyDriversRadar;
