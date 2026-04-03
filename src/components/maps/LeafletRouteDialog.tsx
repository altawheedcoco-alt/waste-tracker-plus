import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Route, Loader2, Navigation, Map, Car, ChevronDown, ExternalLink } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { geocodeAddress, fetchRoadRoute, formatDistance, formatDuration } from '@/lib/mapUtils';
import { toast } from 'sonner';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface LeafletRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber?: string;
  driverId?: string;
  shipmentStatus?: string;
}

const LeafletRouteDialog = ({ isOpen, onClose, pickupAddress, deliveryAddress, shipmentNumber }: LeafletRouteDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [coords, setCoords] = useState<{ pickup: { lat: number; lng: number } | null; delivery: { lat: number; lng: number } | null }>({ pickup: null, delivery: null });

  const handleNavigate = (app: 'google' | 'waze' | 'here', type: 'pickup' | 'delivery' | 'route') => {
    const pickup = coords.pickup;
    const delivery = coords.delivery;

    if (type === 'route') {
      const origin = pickup ? `${pickup.lat},${pickup.lng}` : encodeURIComponent(pickupAddress);
      const dest = delivery ? `${delivery.lat},${delivery.lng}` : encodeURIComponent(deliveryAddress);
      let url: string;
      if (app === 'google') {
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
      } else if (app === 'waze') {
        url = delivery ? `https://waze.com/ul?ll=${delivery.lat},${delivery.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(deliveryAddress)}&navigate=yes`;
      } else {
        url = `https://wego.here.com/directions/drive/${origin}/${dest}`;
      }
      window.open(url, '_blank');
    } else {
      const target = type === 'pickup' ? (pickup || pickupAddress) : (delivery || deliveryAddress);
      let url: string;
      if (typeof target === 'string') {
        if (app === 'google') url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}&travelmode=driving`;
        else if (app === 'waze') url = `https://waze.com/ul?q=${encodeURIComponent(target)}&navigate=yes`;
        else url = `https://wego.here.com/directions/drive/mylocation/${encodeURIComponent(target)}`;
      } else {
        if (app === 'google') url = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`;
        else if (app === 'waze') url = `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
        else url = `https://wego.here.com/directions/drive/mylocation/${target.lat},${target.lng}`;
      }
      window.open(url, '_blank');
    }
    const appNames = { google: 'Google Maps', waze: 'Waze', here: 'HERE WeGo' };
    toast.success(`جاري فتح ${appNames[app]}...`);
  };

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const timeout = setTimeout(async () => {
      if (!mapRef.current) return;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();

      const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
      L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
      mapInstanceRef.current = map;

      setLoading(true);
      try {
        const [pickup, delivery] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        const bounds = L.latLngBounds([]);

        if (pickup.success) {
          const pickupIcon = L.divIcon({
            html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [20, 20], className: '',
          });
          L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map).bindPopup(`📦 ${pickupAddress}`);
          bounds.extend([pickup.lat, pickup.lng]);
        }
        if (delivery.success) {
          const deliveryIcon = L.divIcon({
            html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [20, 20], className: '',
          });
          L.marker([delivery.lat, delivery.lng], { icon: deliveryIcon }).addTo(map).bindPopup(`📍 ${deliveryAddress}`);
          bounds.extend([delivery.lat, delivery.lng]);
        }

        setCoords({
          pickup: pickup.success ? { lat: pickup.lat, lng: pickup.lng } : null,
          delivery: delivery.success ? { lat: delivery.lat, lng: delivery.lng } : null,
        });

        if (pickup.success && delivery.success) {
          const route = await fetchRoadRoute(
            { lat: pickup.lat, lng: pickup.lng },
            { lat: delivery.lat, lng: delivery.lng }
          );
          if (route.success && route.coordinates.length > 1) {
            L.polyline(route.coordinates, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
            // Shadow line
            L.polyline(route.coordinates, { color: '#1e40af', weight: 6, opacity: 0.15 }).addTo(map);
            // Truck icon at midpoint
            const midIdx = Math.floor(route.coordinates.length / 2);
            if (midIdx > 0) {
              const truckIcon = L.divIcon({
                html: '<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:9px;">🚛</div>',
                iconSize: [18, 18], className: '',
              });
              L.marker(route.coordinates[midIdx], { icon: truckIcon, interactive: false }).addTo(map);
            }
          }
          setRouteInfo({ distance: formatDistance(route.distance), duration: formatDuration(route.duration) });
        }

        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
        // Fix grey tiles inside dialog
        setTimeout(() => map.invalidateSize(), 200);
        setTimeout(() => map.invalidateSize(), 500);
      } catch (err) {
        console.error('Route load error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [isOpen, pickupAddress, deliveryAddress]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Route className="w-5 h-5 text-primary" />
            خريطة المسار {shipmentNumber && `- ${shipmentNumber}`}
            {routeInfo && (
              <div className="flex gap-2 mr-auto">
                <Badge variant="secondary">{routeInfo.distance}</Badge>
                <Badge variant="outline">{routeInfo.duration}</Badge>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative rounded-lg overflow-hidden border">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="mr-2 text-sm text-muted-foreground">جاري تحميل المسار...</span>
            </div>
          )}
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Navigation dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700">
                <Navigation className="w-4 h-4" />
                ابدأ الملاحة
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="p-2 border-b text-xs font-medium">المسار الكامل</div>
              <DropdownMenuItem onClick={() => handleNavigate('google', 'route')} className="gap-2 cursor-pointer">
                <Map className="w-4 h-4 text-red-500" /> Google Maps
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('waze', 'route')} className="gap-2 cursor-pointer">
                <Car className="w-4 h-4 text-cyan-500" /> Waze
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('here', 'route')} className="gap-2 cursor-pointer">
                <Navigation className="w-4 h-4 text-emerald-500" /> HERE WeGo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeafletRouteDialog;
