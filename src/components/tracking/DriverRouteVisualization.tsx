import { useRef, useEffect, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, Route, Clock, Navigation, Truck, MapPin, Activity, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  fetchRoadRoute, 
  geocodeAddress, 
  calculateHaversineDistance,
  formatDistance,
  formatDuration,
} from '@/lib/mapUtils';
import RouteProgressBar from './RouteProgressBar';
import { useAutoProgressLogger } from '@/hooks/useAutoProgressLogger';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
}

interface DriverRouteVisualizationProps {
  shipmentId: string;
  driverId: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  showStats?: boolean;
  height?: number;
  onDriverLocationUpdate?: (location: DriverLocation) => void;
}

const createCircleIcon = (color: string, label: string) => L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">${label}</div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14],
});

const createDriverIcon = (online: boolean, heading: number | null) => L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50%;background:${online ? '#22c55e' : '#6b7280'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading || 0}deg);"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});

const DriverRouteVisualization = memo(({
  shipmentId,
  driverId,
  pickupAddress,
  deliveryAddress,
  status,
  showStats = true,
  height = 400,
  onDriverLocationUpdate,
}: DriverRouteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const plannedRouteRef = useRef<L.Polyline | null>(null);
  const actualRouteRef = useRef<L.Polyline | null>(null);

  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [driverPath, setDriverPath] = useState<[number, number][]>([]);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [totalDistanceTraveled, setTotalDistanceTraveled] = useState<number>(0);
  const [avgSpeed, setAvgSpeed] = useState<number>(0);

  useAutoProgressLogger({
    shipmentId, driverId, pickupCoords, deliveryCoords, status,
    enabled: status === 'in_transit' || status === 'approved',
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [30.0444, 31.2357], zoom: 12, zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Initialize locations and route
  useEffect(() => {
    if (!mapRef.current) return;
    const initializeRoute = async () => {
      setLoading(true);
      try {
        const [pickupResult, deliveryResult] = await Promise.all([
          geocodeAddress(pickupAddress), geocodeAddress(deliveryAddress),
        ]);

        if (pickupResult.success && deliveryResult.success) {
          setPickupCoords({ lat: pickupResult.lat, lng: pickupResult.lng });
          setDeliveryCoords({ lat: deliveryResult.lat, lng: deliveryResult.lng });

          // Pickup marker
          if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([pickupResult.lat, pickupResult.lng]);
          else pickupMarkerRef.current = L.marker([pickupResult.lat, pickupResult.lng], { icon: createCircleIcon('#22c55e', 'A') }).addTo(mapRef.current!).bindPopup('نقطة الاستلام');

          // Delivery marker
          if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng([deliveryResult.lat, deliveryResult.lng]);
          else deliveryMarkerRef.current = L.marker([deliveryResult.lat, deliveryResult.lng], { icon: createCircleIcon('#ef4444', 'B') }).addTo(mapRef.current!).bindPopup('نقطة التسليم');

          // Fetch road route (planned - blue)
          const routeResult = await fetchRoadRoute(
            { lat: pickupResult.lat, lng: pickupResult.lng },
            { lat: deliveryResult.lat, lng: deliveryResult.lng }
          );

          if (routeResult.success) {
            const path: L.LatLngExpression[] = routeResult.coordinates.map((c: [number, number]) => [c[0], c[1]]);
            if (plannedRouteRef.current) plannedRouteRef.current.setLatLngs(path);
            else plannedRouteRef.current = L.polyline(path, { color: '#3b82f6', weight: 5, opacity: 0.7 }).addTo(mapRef.current!);
            setRouteInfo({ distance: routeResult.distance, duration: routeResult.duration });
          }

          // Fit bounds
          const bounds = L.latLngBounds([
            [pickupResult.lat, pickupResult.lng],
            [deliveryResult.lat, deliveryResult.lng],
          ]);
          mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error('Error initializing route:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeRoute();
  }, [pickupAddress, deliveryAddress]);

  // Fetch driver data
  const fetchDriverData = useCallback(async () => {
    if (!driverId) return;
    try {
      const { data: locationData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, accuracy, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1).maybeSingle();

      if (locationData) {
        setDriverLocation(locationData);
        setIsDriverOnline(new Date().getTime() - new Date(locationData.recorded_at).getTime() < 5 * 60 * 1000);
        onDriverLocationUpdate?.(locationData);
      }

      const { data: pathData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: true })
        .limit(100);

      if (pathData && pathData.length > 0) {
        const path: [number, number][] = pathData.map(p => [Number(p.latitude), Number(p.longitude)]);
        setDriverPath(path);
        let totalDist = 0;
        for (let i = 1; i < path.length; i++) {
          totalDist += calculateHaversineDistance(path[i-1][0], path[i-1][1], path[i][0], path[i][1]);
        }
        setTotalDistanceTraveled(totalDist);
        const speeds = pathData.filter(p => p.speed !== null).map(p => p.speed as number);
        if (speeds.length > 0) setAvgSpeed(speeds.reduce((a, b) => a + b, 0) / speeds.length);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    }
  }, [driverId, onDriverLocationUpdate]);

  useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

  // Update actual route (green)
  useEffect(() => {
    if (!mapRef.current || driverPath.length < 2) return;
    const path: L.LatLngExpression[] = driverPath.map(c => [c[0], c[1]]);
    if (actualRouteRef.current) actualRouteRef.current.setLatLngs(path);
    else actualRouteRef.current = L.polyline(path, { color: '#22c55e', weight: 4, opacity: 0.9 }).addTo(mapRef.current);
  }, [driverPath]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    const pos: L.LatLngExpression = [driverLocation.latitude, driverLocation.longitude];
    const icon = createDriverIcon(isDriverOnline, driverLocation.heading);
    if (driverMarkerRef.current) { driverMarkerRef.current.setLatLng(pos); driverMarkerRef.current.setIcon(icon); }
    else driverMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(mapRef.current).bindPopup('موقع السائق');

    if (deliveryCoords && pickupCoords) {
      const remaining = calculateHaversineDistance(driverLocation.latitude, driverLocation.longitude, deliveryCoords.lat, deliveryCoords.lng);
      setRemainingDistance(remaining);
      const totalDistance = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, deliveryCoords.lat, deliveryCoords.lng);
      const traveled = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, driverLocation.latitude, driverLocation.longitude);
      setProgress(Math.min(100, Math.max(0, (traveled / totalDistance) * 100)));
    }
  }, [driverLocation, isDriverOnline, pickupCoords, deliveryCoords]);

  // Real-time updates
  useEffect(() => {
    if (!driverId) return;
    const channel = supabase
      .channel(getTabChannelName(`route-viz-${shipmentId}`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_location_logs', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          const newLocation = payload.new as DriverLocation;
          setDriverLocation(newLocation);
          setIsDriverOnline(true);
          onDriverLocationUpdate?.(newLocation);
          setDriverPath(prev => [...prev, [Number(newLocation.latitude), Number(newLocation.longitude)] as [number, number]].slice(-100));
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driverId, shipmentId, onDriverLocationUpdate]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            تتبع مسار الشحنة
          </CardTitle>
          <div className="flex items-center gap-2">
            {isDriverOnline && (
              <Badge className="bg-green-500 text-white gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                السائق متصل
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchDriverData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs mt-2">
          <div className="flex items-center gap-1"><div className="w-4 h-1 bg-blue-500 rounded" /><span className="text-muted-foreground">المسار المخطط</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-1 bg-green-500 rounded" /><span className="text-muted-foreground">المسار الفعلي</span></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative border-y" style={{ height }}>
          <div ref={containerRef} className="w-full h-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        {showStats && (
          <div className="p-4 space-y-4">
            <RouteProgressBar status={status} pickupAddress={pickupAddress} deliveryAddress={deliveryAddress} progress={progress} remainingDistance={remainingDistance} compact />
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Route className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                <p className="font-bold">{routeInfo ? formatDistance(routeInfo.distance) : '--'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Navigation className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-muted-foreground">المتبقي</p>
                <p className="font-bold">{remainingDistance !== null ? formatDistance(remainingDistance * 1000) : '--'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Gauge className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">السرعة الحالية</p>
                <p className="font-bold">{driverLocation?.speed ? `${Math.round(driverLocation.speed)} كم/س` : '--'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Activity className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">متوسط السرعة</p>
                <p className="font-bold">{avgSpeed > 0 ? `${Math.round(avgSpeed)} كم/س` : '--'}</p>
              </div>
            </div>
            {driverLocation && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>آخر تحديث: {format(new Date(driverLocation.recorded_at), 'hh:mm:ss a', { locale: ar })}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DriverRouteVisualization.displayName = 'DriverRouteVisualization';
export default DriverRouteVisualization;
