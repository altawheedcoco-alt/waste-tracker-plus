import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, ExternalLink, Route, Clock, Truck, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface LeafletRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber?: string;
  driverId?: string;
  shipmentStatus?: string;
}

const geocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=eg&language=ar&limit=1`);
    const data = await res.json();
    if (data.features?.[0]) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (e) { console.error('Geocode error', e); }
  return null;
};

const LeafletRouteDialog = ({
  isOpen, onClose, pickupAddress, deliveryAddress, shipmentNumber,
}: LeafletRouteDialogProps) => {
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [coords, setCoords] = useState<{ origin: { lat: number; lng: number }; dest: { lat: number; lng: number } } | null>(null);

  const calculateRoute = useCallback(async () => {
    if (!pickupAddress || !deliveryAddress) return;
    setIsCalculating(true);
    try {
      const [origin, dest] = await Promise.all([geocode(pickupAddress), geocode(deliveryAddress)]);
      if (!origin || !dest) { toast.error('فشل في تحديد العناوين'); setIsCalculating(false); return; }

      setCoords({ origin, dest });

      // Get distance/duration from OSRM for display
      const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`);
      const routeData = await routeRes.json();

      if (routeData.routes?.[0]) {
        const route = routeData.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        setRouteInfo({ distance: `${distKm} كم`, duration: `${durMin} دقيقة` });
      }
    } catch (e) {
      console.error('Route error:', e);
      toast.error('فشل في حساب المسار');
    } finally {
      setIsCalculating(false);
    }
  }, [pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (isOpen) setTimeout(calculateRoute, 200);
  }, [isOpen, calculateRoute]);

  useEffect(() => {
    if (!isOpen) {
      setRouteInfo(null);
      setCoords(null);
    }
  }, [isOpen]);

  const openInWaze = () => {
    if (coords) {
      window.open(`https://waze.com/ul?ll=${coords.dest.lat},${coords.dest.lng}&navigate=yes&from=ll.${coords.origin.lat},${coords.origin.lng}`, '_blank');
    }
  };

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(deliveryAddress)}&travelmode=driving`, '_blank');
  };

  // Build Waze embed URL
  const wazeEmbedUrl = coords
    ? `https://embed.waze.com/iframe?zoom=12&lat=${(coords.origin.lat + coords.dest.lat) / 2}&lon=${(coords.origin.lng + coords.dest.lng) / 2}&pin=1&from=ll.${coords.origin.lat},${coords.origin.lng}&to=ll.${coords.dest.lat},${coords.dest.lng}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />خريطة المسار
            {shipmentNumber && <Badge variant="outline" className="mr-2">{shipmentNumber}</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-green-500" /><span className="text-muted-foreground">من:</span><span className="font-medium truncate max-w-[200px]">{pickupAddress}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-red-500" /><span className="text-muted-foreground">إلى:</span><span className="font-medium truncate max-w-[200px]">{deliveryAddress}</span></div>
          </div>
          {routeInfo && (
            <div className="flex gap-4">
              <Badge variant="secondary" className="gap-1"><Truck className="w-3 h-3" />{routeInfo.distance}</Badge>
              <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />{routeInfo.duration}</Badge>
            </div>
          )}
          <div className="flex-1 relative rounded-lg overflow-hidden border min-h-[400px]">
            {isCalculating && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1000]">
                <div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" /><p className="text-sm text-muted-foreground">جاري حساب المسار...</p></div>
              </div>
            )}
            {wazeEmbedUrl ? (
              <iframe
                src={wazeEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                loading="lazy"
                allowFullScreen
                title="Waze Route Map"
              />
            ) : (
              !isCalculating && (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">أدخل عنواني الاستلام والتسليم لعرض المسار</p>
                </div>
              )
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
            <Button variant="outline" onClick={openInWaze} className="gap-2" disabled={!coords}>
              <Navigation className="w-4 h-4" />فتح في Waze
            </Button>
            <Button onClick={openInGoogleMaps} className="gap-2"><ExternalLink className="w-4 h-4" />فتح في خرائط جوجل</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeafletRouteDialog;
