import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { supabase } from '@/integrations/supabase/client';
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
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const plannedRouteRef = useRef<google.maps.Polyline | null>(null);
  const actualRouteRef = useRef<google.maps.Polyline | null>(null);

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

  // Auto progress logger - logs milestones automatically
  useAutoProgressLogger({
    shipmentId,
    driverId,
    pickupCoords,
    deliveryCoords,
    status,
    enabled: status === 'in_transit' || status === 'approved',
  });

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 30.0444, lng: 31.2357 },
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    });
  }, [isLoaded]);

  // Initialize locations and route
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeRoute = async () => {
      setLoading(true);
      try {
        const [pickupResult, deliveryResult] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        if (pickupResult.success && deliveryResult.success) {
          setPickupCoords({ lat: pickupResult.lat, lng: pickupResult.lng });
          setDeliveryCoords({ lat: deliveryResult.lat, lng: deliveryResult.lng });

          // Pickup marker
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setPosition({ lat: pickupResult.lat, lng: pickupResult.lng });
          } else {
            pickupMarkerRef.current = new google.maps.Marker({
              position: { lat: pickupResult.lat, lng: pickupResult.lng },
              map: mapRef.current,
              label: { text: 'A', color: 'white', fontWeight: 'bold' },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#22c55e',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3,
              },
              title: 'نقطة الاستلام',
            });
          }

          // Delivery marker
          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setPosition({ lat: deliveryResult.lat, lng: deliveryResult.lng });
          } else {
            deliveryMarkerRef.current = new google.maps.Marker({
              position: { lat: deliveryResult.lat, lng: deliveryResult.lng },
              map: mapRef.current,
              label: { text: 'B', color: 'white', fontWeight: 'bold' },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#ef4444',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3,
              },
              title: 'نقطة التسليم',
            });
          }

          // Fetch road route (planned route - blue)
          const routeResult = await fetchRoadRoute(
            { lat: pickupResult.lat, lng: pickupResult.lng },
            { lat: deliveryResult.lat, lng: deliveryResult.lng }
          );

          if (routeResult.success) {
            const path = routeResult.coordinates.map(c => ({ lat: c[0], lng: c[1] }));
            
            if (plannedRouteRef.current) {
              plannedRouteRef.current.setPath(path);
            } else {
              plannedRouteRef.current = new google.maps.Polyline({
                path,
                map: mapRef.current,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.7,
                strokeWeight: 5,
              });
            }

            setRouteInfo({
              distance: routeResult.distance,
              duration: routeResult.duration,
            });
          }

          // Fit bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickupResult.lat, lng: pickupResult.lng });
          bounds.extend({ lat: deliveryResult.lat, lng: deliveryResult.lng });
          mapRef.current?.fitBounds(bounds, 50);
        }
      } catch (error) {
        console.error('Error initializing route:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeRoute();
  }, [pickupAddress, deliveryAddress]);

  // Fetch driver location and path
  const fetchDriverData = useCallback(async () => {
    if (!driverId) return;

    try {
      // Fetch current location
      const { data: locationData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, accuracy, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (locationData) {
        setDriverLocation(locationData);
        const isOnline = new Date().getTime() - new Date(locationData.recorded_at).getTime() < 5 * 60 * 1000;
        setIsDriverOnline(isOnline);
        onDriverLocationUpdate?.(locationData);
      }

      // Fetch driver path (last 100 points for better visualization)
      const { data: pathData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: true })
        .limit(100);

      if (pathData && pathData.length > 0) {
        const path: [number, number][] = pathData.map(p => [Number(p.latitude), Number(p.longitude)]);
        setDriverPath(path);

        // Calculate total distance traveled
        let totalDist = 0;
        for (let i = 1; i < path.length; i++) {
          totalDist += calculateHaversineDistance(path[i-1][0], path[i-1][1], path[i][0], path[i][1]);
        }
        setTotalDistanceTraveled(totalDist);

        // Calculate average speed
        const speeds = pathData.filter(p => p.speed !== null).map(p => p.speed as number);
        if (speeds.length > 0) {
          setAvgSpeed(speeds.reduce((a, b) => a + b, 0) / speeds.length);
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    }
  }, [driverId, onDriverLocationUpdate]);

  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  // Update actual route (driver path - green)
  useEffect(() => {
    if (!mapRef.current || driverPath.length < 2) return;

    const path = driverPath.map(c => ({ lat: c[0], lng: c[1] }));

    if (actualRouteRef.current) {
      actualRouteRef.current.setPath(path);
    } else {
      actualRouteRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#22c55e',
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
    }
  }, [driverPath]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const position = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
      driverMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: isDriverOnline ? '#22c55e' : '#6b7280',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        rotation: driverLocation.heading || 0,
      });
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: isDriverOnline ? '#22c55e' : '#6b7280',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          rotation: driverLocation.heading || 0,
        },
        title: 'موقع السائق',
        zIndex: 100,
      });
    }

    // Calculate remaining distance and progress
    if (deliveryCoords && pickupCoords) {
      const remaining = calculateHaversineDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        deliveryCoords.lat,
        deliveryCoords.lng
      );
      setRemainingDistance(remaining);

      const totalDistance = calculateHaversineDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        deliveryCoords.lat,
        deliveryCoords.lng
      );
      const traveled = calculateHaversineDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        driverLocation.latitude,
        driverLocation.longitude
      );
      const progressPercent = Math.min(100, Math.max(0, (traveled / totalDistance) * 100));
      setProgress(progressPercent);
    }
  }, [driverLocation, isDriverOnline, pickupCoords, deliveryCoords]);

  // Real-time updates
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel(`route-viz-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const newLocation = payload.new as DriverLocation;
          setDriverLocation(newLocation);
          setIsDriverOnline(true);
          onDriverLocationUpdate?.(newLocation);

          setDriverPath(prev => {
            const newPath = [...prev, [Number(newLocation.latitude), Number(newLocation.longitude)] as [number, number]];
            return newPath.slice(-100);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, shipmentId, onDriverLocationUpdate]);

  // Cleanup
  useEffect(() => {
    return () => {
      pickupMarkerRef.current?.setMap(null);
      deliveryMarkerRef.current?.setMap(null);
      driverMarkerRef.current?.setMap(null);
      plannedRouteRef.current?.setMap(null);
      actualRouteRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

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

        {/* Route legend */}
        <div className="flex items-center gap-4 text-xs mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-1 bg-blue-500 rounded" />
            <span className="text-muted-foreground">المسار المخطط</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-1 bg-green-500 rounded" />
            <span className="text-muted-foreground">المسار الفعلي</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Map */}
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
            {/* Progress bar */}
            <RouteProgressBar
              status={status}
              pickupAddress={pickupAddress}
              deliveryAddress={deliveryAddress}
              progress={progress}
              remainingDistance={remainingDistance}
              compact
            />

            <Separator />

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Route className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                <p className="font-bold">
                  {routeInfo ? formatDistance(routeInfo.distance) : '--'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Navigation className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-muted-foreground">المتبقي</p>
                <p className="font-bold">
                  {remainingDistance !== null 
                    ? formatDistance(remainingDistance * 1000) 
                    : '--'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Gauge className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">السرعة الحالية</p>
                <p className="font-bold">
                  {driverLocation?.speed 
                    ? `${Math.round(driverLocation.speed)} كم/س` 
                    : '--'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Activity className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">متوسط السرعة</p>
                <p className="font-bold">
                  {avgSpeed > 0 ? `${Math.round(avgSpeed)} كم/س` : '--'}
                </p>
              </div>
            </div>

            {/* Last update */}
            {driverLocation && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  آخر تحديث: {format(new Date(driverLocation.recorded_at), 'HH:mm:ss dd/MM', { locale: ar })}
                </span>
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
