import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigation, Map, Car } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { fetchRoadRoute } from '@/lib/mapUtils';
import { toast } from 'sonner';

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
  showNavButtons?: boolean;
  [key: string]: any;
}

const LeafletShipmentTracking = memo(({ 
  pickupCoords, deliveryCoords, collectionPoint, recyclingCenter, 
  driverCoords, driverLocation, routeCoords, className, height = '400px',
  showNavButtons = true,
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const pickup = pickupCoords || collectionPoint;
  const delivery = deliveryCoords || recyclingCenter;
  const driver = driverCoords || (driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null);

  const handleNavigate = (app: 'google' | 'waze' | 'here', target: { lat: number; lng: number }) => {
    let url: string;
    if (app === 'google') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      url = isMobile ? `google.navigation:q=${target.lat},${target.lng}&mode=d` : `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`;
    } else if (app === 'waze') {
      url = `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
    } else {
      url = `https://wego.here.com/directions/drive/mylocation/${target.lat},${target.lng}`;
    }
    window.open(url, '_blank');
    const names = { google: 'Google Maps', waze: 'Waze', here: 'HERE WeGo' };
    toast.success(`جاري فتح ${names[app]}...`);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    mapInstanceRef.current = map;

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

    // Draw road route if both coords available
    if (pickup && delivery && (!routeCoords || routeCoords.length === 0)) {
      fetchRoadRoute(pickup, delivery).then(route => {
        if (route.success && route.coordinates.length > 1 && mapInstanceRef.current) {
          L.polyline(route.coordinates, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(mapInstanceRef.current);
          L.polyline(route.coordinates, { color: '#1e40af', weight: 6, opacity: 0.15 }).addTo(mapInstanceRef.current);
        }
      }).catch(() => {});
    } else if (routeCoords && routeCoords.length > 1) {
      L.polyline(routeCoords, { color: '#3b82f6', weight: 4 }).addTo(map);
    }

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [pickup, delivery, driver, routeCoords]);

  return (
    <div className="relative">
      <div ref={mapRef} className={className} style={{ height }} />
      
      {/* Navigation overlay buttons */}
      {showNavButtons && (pickup || delivery) && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
          {delivery && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1 text-xs bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                  <Navigation className="w-3 h-3" />
                  ملاحة للتسليم
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => handleNavigate('google', delivery)} className="gap-2 cursor-pointer text-xs">
                  <Map className="w-3 h-3" /> Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('waze', delivery)} className="gap-2 cursor-pointer text-xs">
                  <Car className="w-3 h-3" /> Waze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('here', delivery)} className="gap-2 cursor-pointer text-xs">
                  <Navigation className="w-3 h-3" /> HERE WeGo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {pickup && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="h-8 gap-1 text-xs shadow-lg">
                  <Navigation className="w-3 h-3" />
                  ملاحة للاستلام
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => handleNavigate('google', pickup)} className="gap-2 cursor-pointer text-xs">
                  <Map className="w-3 h-3" /> Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('waze', pickup)} className="gap-2 cursor-pointer text-xs">
                  <Car className="w-3 h-3" /> Waze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('here', pickup)} className="gap-2 cursor-pointer text-xs">
                  <Navigation className="w-3 h-3" /> HERE WeGo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
});

LeafletShipmentTracking.displayName = 'LeafletShipmentTracking';
export default LeafletShipmentTracking;
