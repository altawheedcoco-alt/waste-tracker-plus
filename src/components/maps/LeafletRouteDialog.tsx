import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Loader2 } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { geocodeAddress, fetchRoadRoute, formatDistance, formatDuration } from '@/lib/mapUtils';

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

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Small delay for dialog animation
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

        if (pickup.success && delivery.success) {
          const route = await fetchRoadRoute(
            { lat: pickup.lat, lng: pickup.lng },
            { lat: delivery.lat, lng: delivery.lng }
          );
          if (route.success && route.coordinates.length > 1) {
            L.polyline(route.coordinates, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
          }
          setRouteInfo({ distance: formatDistance(route.distance), duration: formatDuration(route.duration) });
        }

        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
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
          <DialogTitle className="flex items-center gap-2">
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
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeafletRouteDialog;
