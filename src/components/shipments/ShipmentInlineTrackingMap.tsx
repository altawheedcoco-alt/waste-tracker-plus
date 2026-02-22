import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Loader2, Maximize2, Minimize2, RefreshCw, Truck, Route, Clock, Signal } from 'lucide-react';
import { geocodeAddress, calculateHaversineDistance, formatDistance } from '@/lib/mapUtils';

interface DriverLocation { latitude: number; longitude: number; speed: number | null; heading: number | null; recorded_at: string; }

interface ShipmentInlineTrackingMapProps {
  shipmentId: string; pickupAddress: string; deliveryAddress: string; driverId?: string | null;
  status: string; collapsible?: boolean; defaultExpanded?: boolean; height?: number; onExpandClick?: () => void;
}

const createIcon = (color: string) => L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
});

const createDriverIcon = (online: boolean, heading: number | null) => L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${online ? '#3b82f6' : '#6b7280'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading || 0}deg);"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
});

const ShipmentInlineTrackingMap = memo(({
  shipmentId, pickupAddress, deliveryAddress, driverId, status,
  collapsible = true, defaultExpanded = true, height = 200, onExpandClick,
}: ShipmentInlineTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !isExpanded) return;
    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;
      mapRef.current = L.map(containerRef.current, { center: [30.0444, 31.2357], zoom: 12, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 19 }).addTo(mapRef.current);
    }, 100);
    return () => { clearTimeout(timer); };
  }, [isExpanded]);

  useEffect(() => {
    if (!mapRef.current || !isExpanded) return;
    const init = async () => {
      setLoading(true);
      try {
        const [pR, dR] = await Promise.all([geocodeAddress(pickupAddress), geocodeAddress(deliveryAddress)]);
        if (pR.success) {
          setPickupCoords({ lat: pR.lat, lng: pR.lng });
          if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([pR.lat, pR.lng]);
          else pickupMarkerRef.current = L.marker([pR.lat, pR.lng], { icon: createIcon('#22c55e') }).addTo(mapRef.current!).bindPopup('نقطة الاستلام');
        }
        if (dR.success) {
          setDeliveryCoords({ lat: dR.lat, lng: dR.lng });
          if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng([dR.lat, dR.lng]);
          else deliveryMarkerRef.current = L.marker([dR.lat, dR.lng], { icon: createIcon('#ef4444') }).addTo(mapRef.current!).bindPopup('نقطة التسليم');
        }
        if (pR.success && dR.success) {
          const path: L.LatLngExpression[] = [[pR.lat, pR.lng], [dR.lat, dR.lng]];
          if (routeLineRef.current) routeLineRef.current.setLatLngs(path);
          else routeLineRef.current = L.polyline(path, { color: '#3b82f6', weight: 3, opacity: 0.6 }).addTo(mapRef.current!);
          mapRef.current?.fitBounds(L.latLngBounds(path), { padding: [30, 30] });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, [pickupAddress, deliveryAddress, isExpanded]);

  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;
    try {
      const { data } = await supabase.from('driver_location_logs').select('latitude, longitude, speed, heading, recorded_at')
        .eq('driver_id', driverId).order('recorded_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setDriverLocation(data); setIsDriverOnline(Date.now() - new Date(data.recorded_at).getTime() < 5 * 60 * 1000);
        if (deliveryCoords) setRemainingDistance(calculateHaversineDistance(data.latitude, data.longitude, deliveryCoords.lat, deliveryCoords.lng));
      }
    } catch (e) { console.error(e); }
  }, [driverId, deliveryCoords]);

  useEffect(() => { if (driverId && isExpanded) fetchDriverLocation(); }, [driverId, isExpanded, fetchDriverLocation]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation || !isExpanded) return;
    const pos: L.LatLngExpression = [driverLocation.latitude, driverLocation.longitude];
    const icon = createDriverIcon(isDriverOnline, driverLocation.heading);
    if (driverMarkerRef.current) { driverMarkerRef.current.setLatLng(pos); driverMarkerRef.current.setIcon(icon); }
    else driverMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(mapRef.current).bindPopup('موقع السائق');
    if (pickupCoords && deliveryCoords) {
      mapRef.current.fitBounds(L.latLngBounds([
        [pickupCoords.lat, pickupCoords.lng], [deliveryCoords.lat, deliveryCoords.lng], pos
      ]), { padding: [30, 30] });
    }
  }, [driverLocation, isDriverOnline, pickupCoords, deliveryCoords, isExpanded]);

  useEffect(() => {
    if (!driverId || !isExpanded) return;
    const channel = supabase.channel(getTabChannelName(`inline-tracking-${shipmentId}`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_location_logs', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          const nl = payload.new as DriverLocation;
          setDriverLocation(nl); setIsDriverOnline(true);
          if (deliveryCoords) setRemainingDistance(calculateHaversineDistance(nl.latitude, nl.longitude, deliveryCoords.lat, deliveryCoords.lng));
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driverId, shipmentId, deliveryCoords, isExpanded]);

  useEffect(() => { return () => { mapRef.current?.remove(); mapRef.current = null; }; }, []);

  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-card">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">خريطة التتبع</span>
          {driverId && isDriverOnline && (
            <Badge variant="default" className="bg-green-500 text-white text-xs gap-1">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span></span>
              متصل
            </Badge>
          )}
          {driverId && !isDriverOnline && driverLocation && <Badge variant="secondary" className="text-xs">غير متصل</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {driverId && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDriverLocation}><RefreshCw className="h-3.5 w-3.5" /></Button>}
          {collapsible && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}</Button>}
          {onExpandClick && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpandClick}><Maximize2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="relative">
            <div ref={containerRef} className="w-full" style={{ height }} />
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {remainingDistance !== null && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-lg border text-xs z-[1000]">
                <div className="flex items-center gap-2"><Route className="h-3.5 w-3.5 text-primary" /><span className="font-medium">المتبقي: {formatDistance(remainingDistance * 1000)}</span></div>
                {driverLocation?.speed && <div className="flex items-center gap-1 text-muted-foreground"><Truck className="h-3.5 w-3.5" /><span>{Math.round(driverLocation.speed)} كم/س</span></div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ShipmentInlineTrackingMap.displayName = 'ShipmentInlineTrackingMap';
export default ShipmentInlineTrackingMap;
