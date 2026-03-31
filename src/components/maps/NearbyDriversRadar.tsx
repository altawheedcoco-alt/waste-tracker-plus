/**
 * خريطة رادار السائقين القريبين — للناقل
 * تستخدم Leaflet الأصلي (بدون react-leaflet) لتوافق React 18
 */
import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Navigation } from 'lucide-react';
import { useNearbyDrivers } from '@/hooks/useProximityData';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const RADIUS_KM = 50;

interface Props {
  pickupLat: number;
  pickupLng: number;
}

const NearbyDriversRadar = memo(({ pickupLat, pickupLng }: Props) => {
  const center = { lat: pickupLat, lng: pickupLng };
  const { data: drivers = [], isLoading } = useNearbyDrivers(center, RADIUS_KM);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const arrivingCount = drivers.filter(d => d.status === 'arriving_soon').length;

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([pickupLat, pickupLng], 10);

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    // Radius circle
    circleRef.current = L.circle([pickupLat, pickupLng], {
      radius: RADIUS_KM * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map);

    // Center marker
    L.circleMarker([pickupLat, pickupLng], {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map).bindPopup('📍 موقع الاستلام');

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [pickupLat, pickupLng]);

  // Update driver markers when data changes
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;
    markersRef.current.clearLayers();

    drivers.forEach(driver => {
      const isAvailable = driver.status === 'available';
      const color = isAvailable ? '#10b981' : '#f59e0b';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;color:white;
        ">🚛</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([driver.lat, driver.lng], { icon })
        .addTo(markersRef.current!)
        .bindPopup(`
          <div style="text-align:right;direction:rtl;min-width:140px">
            <b>${driver.name}</b><br/>
            <span style="color:${color}">● ${isAvailable ? 'متاح' : 'يقترب'}</span><br/>
            📏 ${driver.distanceKm} كم<br/>
            ⭐ ${driver.rating || 0} — ${driver.totalTrips || 0} رحلة
            ${driver.vehiclePlate ? `<br/>🚗 ${driver.vehiclePlate}` : ''}
            ${driver.etaMinutes ? `<br/>⏱ وصول خلال ~${driver.etaMinutes} دقيقة` : ''}
          </div>
        `);
    });
  }, [drivers]);

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

      <CardContent className="p-0 relative">
        <div ref={mapRef} style={{ height: '250px', width: '100%' }} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-[500]">
            <p className="text-xs text-muted-foreground animate-pulse">جاري البحث عن سائقين...</p>
          </div>
        )}
        {!isLoading && drivers.length === 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-background/80 rounded-lg p-2 text-center z-[500]">
            <p className="text-xs text-muted-foreground">لا يوجد سائقين في النطاق حالياً</p>
          </div>
        )}
        {!isLoading && drivers.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 text-center z-[500]">
            <p className="text-[11px] text-foreground font-medium">
              🟢 {availableCount} متاح • 🟠 {arrivingCount} يقترب — إجمالي {drivers.length} سائق
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NearbyDriversRadar.displayName = 'NearbyDriversRadar';
export default NearbyDriversRadar;
