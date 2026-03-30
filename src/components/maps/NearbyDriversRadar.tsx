/**
 * خريطة رادار السائقين القريبين — للناقل
 * نطاق 50 كم مع تحديث لحظي
 */
import { memo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, MapPin, Navigation, Loader2 } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/leafletConfig';
import { useNearbyDrivers, type NearbyDriver } from '@/hooks/useProximityData';
import '@/styles/leaflet.css';
import 'leaflet/dist/leaflet.css';

const RADIUS_KM = 50;

// Custom icons
const createDriverIcon = (status: 'available' | 'arriving_soon') => {
  const color = status === 'available' ? '#22c55e' : '#f97316';
  const emoji = status === 'available' ? '🟢' : '🟠';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);">🚛</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const centerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background:hsl(var(--primary));color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);">📦</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FitBounds({ center, drivers }: { center: [number, number]; drivers: NearbyDriver[] }) {
  const map = useMap();
  useEffect(() => {
    if (drivers.length === 0) {
      map.setView(center, 10);
    } else {
      const bounds = L.latLngBounds([center, ...drivers.map(d => [d.lat, d.lng] as [number, number])]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [center, drivers.length]);
  return null;
}

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
        {isLoading ? (
          <div className="flex items-center justify-center h-[220px] bg-muted/20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-[220px]">
            <MapContainer
              center={[pickupLat, pickupLng]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
              <FitBounds center={[pickupLat, pickupLng]} drivers={drivers} />

              {/* Radius circle */}
              <Circle
                center={[pickupLat, pickupLng]}
                radius={RADIUS_KM * 1000}
                pathOptions={{
                  color: 'hsl(var(--primary))',
                  fillColor: 'hsl(var(--primary))',
                  fillOpacity: 0.06,
                  weight: 1.5,
                  dashArray: '6 4',
                }}
              />

              {/* Pickup center */}
              <Marker position={[pickupLat, pickupLng]} icon={centerIcon}>
                <Popup>
                  <div className="text-center text-xs font-bold" dir="rtl">📦 موقع الاستلام</div>
                </Popup>
              </Marker>

              {/* Driver markers */}
              {drivers.map(driver => (
                <Marker
                  key={driver.id}
                  position={[driver.lat, driver.lng]}
                  icon={createDriverIcon(driver.status)}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[140px]" dir="rtl">
                      <div className="font-bold">{driver.name}</div>
                      {driver.vehiclePlate && (
                        <div className="text-muted-foreground">🚛 {driver.vehiclePlate}</div>
                      )}
                      <div>⭐ {driver.rating.toFixed(1)} • {driver.totalTrips} رحلة</div>
                      <div>📏 {driver.distanceKm} كم</div>
                      {driver.status === 'arriving_soon' && driver.etaMinutes && (
                        <div className="text-orange-600">⏱ يصل خلال ~{driver.etaMinutes} دقيقة</div>
                      )}
                      <div className={driver.status === 'available' ? 'text-emerald-600 font-medium' : 'text-orange-600 font-medium'}>
                        {driver.status === 'available' ? '🟢 متاح الآن' : '🟠 يقترب من الانتهاء'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NearbyDriversRadar.displayName = 'NearbyDriversRadar';
export default NearbyDriversRadar;
