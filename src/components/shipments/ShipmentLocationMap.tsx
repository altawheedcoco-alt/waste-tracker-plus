import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { reverseGeocodeOSM } from '@/lib/leafletConfig';
import { fetchRoadRoute, formatDistance, formatDuration } from '@/lib/mapUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, Map, Car, Route, Maximize2, Minimize2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface Coords { lat: number; lng: number; }

interface ShipmentLocationMapProps {
  pickupCoords: Coords | null;
  deliveryCoords: Coords | null;
  onPickupChange: (address: string, coords: Coords) => void;
  onDeliveryChange: (address: string, coords: Coords) => void;
  pickupAddress?: string;
  deliveryAddress?: string;
  driverCoords?: Coords | null;
}

const pickupDivIcon = L.divIcon({
  html: `<div style="background:#22c55e;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">P</div>`,
  iconSize: [28, 28], className: '',
});
const deliveryDivIcon = L.divIcon({
  html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">D</div>`,
  iconSize: [28, 28], className: '',
});
const driverDivIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🚛</div>`,
  iconSize: [30, 30], className: '',
});

const handleNavigate = (app: 'google' | 'waze' | 'here', target: Coords) => {
  let url: string;
  if (app === 'google') {
    url = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`;
  } else if (app === 'waze') {
    url = `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
  } else {
    url = `https://wego.here.com/directions/drive/mylocation/${target.lat},${target.lng}`;
  }
  window.open(url, '_blank');
  const names = { google: 'Google Maps', waze: 'Waze', here: 'HERE WeGo' };
  toast.success(`جاري فتح ${names[app]}...`);
};

const ShipmentLocationMap = memo(({
  pickupCoords, deliveryCoords, onPickupChange, onDeliveryChange,
  pickupAddress, deliveryAddress, driverCoords,
}: ShipmentLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;
    const bounds = L.latLngBounds([]);

    // Pickup marker (draggable)
    if (pickupCoords) {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupDivIcon, draggable: true })
        .addTo(map)
        .bindPopup(`<div style="text-align:right;direction:rtl"><b>📦 نقطة الاستلام</b><br/><small>${pickupAddress || ''}</small></div>`);
      pickupMarkerRef.current.on('dragend', async () => {
        const pos = pickupMarkerRef.current!.getLatLng();
        const addr = await reverseGeocodeOSM(pos.lat, pos.lng);
        onPickupChange(addr, { lat: pos.lat, lng: pos.lng });
      });
      bounds.extend([pickupCoords.lat, pickupCoords.lng]);
    }

    // Delivery marker (draggable)
    if (deliveryCoords) {
      deliveryMarkerRef.current = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryDivIcon, draggable: true })
        .addTo(map)
        .bindPopup(`<div style="text-align:right;direction:rtl"><b>📍 نقطة التسليم</b><br/><small>${deliveryAddress || ''}</small></div>`);
      deliveryMarkerRef.current.on('dragend', async () => {
        const pos = deliveryMarkerRef.current!.getLatLng();
        const addr = await reverseGeocodeOSM(pos.lat, pos.lng);
        onDeliveryChange(addr, { lat: pos.lat, lng: pos.lng });
      });
      bounds.extend([deliveryCoords.lat, deliveryCoords.lng]);
    }

    // Driver marker
    if (driverCoords) {
      L.marker([driverCoords.lat, driverCoords.lng], { icon: driverDivIcon })
        .addTo(map)
        .bindPopup('🚛 موقع السائق');
      bounds.extend([driverCoords.lat, driverCoords.lng]);
    }

    // Draw road route between pickup and delivery
    if (pickupCoords && deliveryCoords) {
      fetchRoadRoute(pickupCoords, deliveryCoords).then(route => {
        if (route.success && route.coordinates.length > 1 && mapInstanceRef.current) {
          // Shadow line
          L.polyline(route.coordinates, { color: '#1e40af', weight: 7, opacity: 0.15 }).addTo(mapInstanceRef.current);
          // Main route line
          L.polyline(route.coordinates, { color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10 6' }).addTo(mapInstanceRef.current);
          
          // Midpoint truck icon
          const midIdx = Math.floor(route.coordinates.length / 2);
          if (midIdx > 0) {
            const truckIcon = L.divIcon({
              html: '<div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;">🚛</div>',
              iconSize: [20, 20], className: '',
            });
            L.marker(route.coordinates[midIdx], { icon: truckIcon, interactive: false }).addTo(mapInstanceRef.current);
          }

          setRouteInfo({
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration),
          });
        }
      }).catch(() => {});
    } else {
      setRouteInfo(null);
    }

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [pickupCoords, deliveryCoords, driverCoords]);

  const hasCoords = pickupCoords || deliveryCoords;

  return (
    <div className="relative">
      {/* Route info bar */}
      {routeInfo && (
        <div className="flex items-center justify-between gap-2 mb-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">المسار المتوقع:</span>
            <Badge variant="secondary" className="text-xs">{routeInfo.distance}</Badge>
            <Badge variant="outline" className="text-xs">{routeInfo.duration}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {deliveryCoords && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="default" className="h-7 text-[10px] gap-1">
                    <Navigation className="w-3 h-3" /> ابدأ الملاحة
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleNavigate('google', deliveryCoords)} className="gap-2 text-xs cursor-pointer">
                    <Map className="w-3 h-3" /> Google Maps
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('waze', deliveryCoords)} className="gap-2 text-xs cursor-pointer">
                    <Car className="w-3 h-3" /> Waze
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('here', deliveryCoords)} className="gap-2 text-xs cursor-pointer">
                    <Navigation className="w-3 h-3" /> HERE WeGo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Map container */}
      <div className="relative rounded-xl border border-border overflow-hidden shadow-sm">
        <div ref={mapRef} style={{ height: expanded ? '600px' : '350px' }} className="transition-all duration-300" />
        
        {/* Expand/collapse button */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 z-[1000] h-8 w-8 shadow-lg"
          onClick={() => {
            setExpanded(!expanded);
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
          }}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>

        {/* Legend */}
        {hasCoords && (
          <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
            <div className="flex items-center gap-3 text-[10px]">
              {pickupCoords && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" />
                  استلام
                </span>
              )}
              {deliveryCoords && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
                  تسليم
                </span>
              )}
              {driverCoords && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
                  سائق
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasCoords && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-[1px] z-[500]">
            <div className="text-center">
              <Map className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">حدد مواقع الاستلام والتسليم لعرضها على الخريطة</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">يمكنك سحب النقاط لتعديل المواقع مباشرة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ShipmentLocationMap.displayName = 'ShipmentLocationMap';
export default ShipmentLocationMap;
