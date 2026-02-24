import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, ExternalLink, Route, Clock, Truck, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

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
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=eg&language=ar&limit=1`);
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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const calculateRoute = useCallback(async () => {
    if (!pickupAddress || !deliveryAddress) return;
    setIsCalculating(true);
    try {
      const [origin, dest] = await Promise.all([geocode(pickupAddress), geocode(deliveryAddress)]);
      if (!origin || !dest) { toast.error('فشل في تحديد العناوين'); setIsCalculating(false); return; }
      setCoords({ origin, dest });

      // Get route from OSRM
      const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
      const routeData = await routeRes.json();

      if (routeData.routes?.[0]) {
        const route = routeData.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        setRouteInfo({ distance: `${distKm} كم`, duration: `${durMin} دقيقة` });

        // Draw on map
        requestAnimationFrame(() => {
          if (!mapContainerRef.current) return;

          // Remove old map
          if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: MAPBOX_STYLE,
            center: [(origin.lng + dest.lng) / 2, (origin.lat + dest.lat) / 2],
            zoom: 8,
            maxZoom: MAX_ZOOM,
            minZoom: MIN_ZOOM,
          });

          map.addControl(new mapboxgl.NavigationControl(), 'top-left');

          map.on('load', () => {
            // Route line
            map.addSource('route', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: route.geometry },
            });
            map.addLayer({
              id: 'route-line', type: 'line', source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.85 },
            });
            // Route glow
            map.addLayer({
              id: 'route-glow', type: 'line', source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#3b82f6', 'line-width': 12, 'line-opacity': 0.15 },
            }, 'route-line');

            // Fit bounds
            const bounds = new mapboxgl.LngLatBounds();
            route.geometry.coordinates.forEach((c: [number, number]) => bounds.extend(c));
            map.fitBounds(bounds, { padding: 60 });
          });

          // Markers
          const pickupEl = document.createElement('div');
          pickupEl.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:14px;">A</div>`;
          new mapboxgl.Marker({ element: pickupEl })
            .setLngLat([origin.lng, origin.lat])
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(`<div style="direction:rtl;">📦 <b>نقطة الاستلام</b><br/><span style="font-size:12px;">${pickupAddress}</span></div>`))
            .addTo(map);

          const destEl = document.createElement('div');
          destEl.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:14px;">B</div>`;
          new mapboxgl.Marker({ element: destEl })
            .setLngLat([dest.lng, dest.lat])
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(`<div style="direction:rtl;">🏭 <b>نقطة التسليم</b><br/><span style="font-size:12px;">${deliveryAddress}</span></div>`))
            .addTo(map);

          mapRef.current = map;
        });
      }
    } catch (e) {
      console.error('Route error:', e);
      toast.error('فشل في حساب المسار');
    } finally {
      setIsCalculating(false);
    }
  }, [pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (isOpen) setTimeout(calculateRoute, 300);
  }, [isOpen, calculateRoute]);

  useEffect(() => {
    if (!isOpen) {
      setRouteInfo(null);
      setCoords(null);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
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
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                <div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" /><p className="text-sm text-muted-foreground">جاري حساب المسار...</p></div>
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />
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
