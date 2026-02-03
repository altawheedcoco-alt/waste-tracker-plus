import { useEffect, useState, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Route, 
  Truck, 
  RefreshCw, 
  Clock, 
  Eye,
  Signal,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import GoogleMapsNavigationButton from '@/components/navigation/GoogleMapsNavigationButton';
import MapboxLiveTrackingMap from './MapboxLiveTrackingMap';
import { 
  fetchRoadRoute, 
  geocodeAddress, 
  formatDistance, 
  formatDuration,
  calculateHaversineDistance,
} from '@/lib/mapUtils';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
}

interface DriverInfo {
  id: string;
  full_name: string;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
}

interface LiveTrackingMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
  driverId: string;
  shipmentStatus?: string;
}

const LiveTrackingMapDialog = memo(({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
  driverId,
  shipmentStatus,
}: LiveTrackingMapDialogProps) => {
  const { profile, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; distanceKm: number } | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [driverPath, setDriverPath] = useState<[number, number][]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [centerOnDriver, setCenterOnDriver] = useState(false);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [routeLoadFailed, setRouteLoadFailed] = useState(false);

  // Live tracking presence
  const { isConnected: isPresenceConnected } = useViewerPresence(
    isOpen && driverId ? driverId : '',
    profile?.full_name || 'مستخدم',
    organization?.name
  );

  // Fetch driver info
  const fetchDriverInfo = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_type,
          vehicle_plate,
          profile:profiles!drivers_profile_id_fkey(full_name, phone)
        `)
        .eq('id', driverId)
        .maybeSingle();

      if (!error && driver) {
        setDriverInfo({
          id: driver.id,
          full_name: (driver.profile as any)?.full_name || 'سائق',
          phone: (driver.profile as any)?.phone || null,
          vehicle_type: driver.vehicle_type,
          vehicle_plate: driver.vehicle_plate,
        });
      }
    } catch (err) {
      console.error('Error fetching driver info:', err);
    }
  }, [driverId]);

  // Fetch driver location
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, accuracy, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDriverLocation(data);
        const isOnline = new Date().getTime() - new Date(data.recorded_at).getTime() < 5 * 60 * 1000;
        setIsDriverOnline(isOnline);
      }

      // Fetch driver path (last 50 points)
      const { data: pathData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: true })
        .limit(50);

      if (pathData && pathData.length > 0) {
        setDriverPath(pathData.map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]));
      }
    } catch (err) {
      console.error('Error fetching driver location:', err);
    }
  }, [driverId]);

  const refreshDriverLocation = async () => {
    setIsRefreshing(true);
    await fetchDriverLocation();
    setIsRefreshing(false);
    toast.success('تم تحديث موقع السائق');
  };

  // Initialize map with real routing
  useEffect(() => {
    if (!isOpen) return;

    const initializeMap = async () => {
      setIsLoading(true);
      setMapKey(prev => prev + 1);
      setRouteLoadFailed(false);

      try {
        // Geocode addresses
        const [pickupResult, deliveryResult] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        const pickup = pickupResult ? [pickupResult.lat, pickupResult.lng] as [number, number] : null;
        const delivery = deliveryResult ? [deliveryResult.lat, deliveryResult.lng] as [number, number] : null;

        setPickupCoords(pickup);
        setDeliveryCoords(delivery);

        if (pickup && delivery) {
          // Fetch real road route
          const routeResult = await fetchRoadRoute(
            { lat: pickup[0], lng: pickup[1] },
            { lat: delivery[0], lng: delivery[1] }
          );

          if (routeResult.success) {
            setRouteCoords(routeResult.coordinates);
            setRouteInfo({
              distance: formatDistance(routeResult.distance),
              duration: formatDuration(routeResult.duration),
              distanceKm: routeResult.distance / 1000,
            });
          } else {
            setRouteLoadFailed(true);
            // Fallback to Haversine distance
            const distance = calculateHaversineDistance(pickup[0], pickup[1], delivery[0], delivery[1]);
            setRouteInfo({
              distance: `~${distance.toFixed(1)} كم`,
              duration: `~${Math.round((distance / 50) * 60)} دقيقة`,
              distanceKm: distance,
            });
            setRouteCoords([pickup, delivery]);
          }
        } else {
          toast.info('تعذر تحديد بعض المواقع بدقة');
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        toast.error('خطأ في تحميل الخريطة');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
    fetchDriverInfo();
    fetchDriverLocation();
  }, [isOpen, pickupAddress, deliveryAddress, fetchDriverInfo, fetchDriverLocation]);

  // Real-time driver location updates
  useEffect(() => {
    if (!isOpen || !driverId) return;

    const channel = supabase
      .channel(`live-tracking-${driverId}`)
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
          
          setDriverPath(prev => {
            const newPath = [...prev, [Number(newLocation.latitude), Number(newLocation.longitude)] as [number, number]];
            return newPath.slice(-50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, driverId]);

  // Calculate remaining distance to destination
  const calculateRemainingDistance = (): string | null => {
    if (!driverLocation || !deliveryCoords) return null;
    
    const distance = calculateHaversineDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      deliveryCoords[0],
      deliveryCoords[1]
    );
    
    return distance >= 1 ? `${distance.toFixed(1)} كم` : `${Math.round(distance * 1000)} م`;
  };

  return (
    <>
      <style>{`
        @keyframes driverPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0" dir="rtl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-lg font-bold">التتبع المباشر</span>
                  <p className="text-sm text-muted-foreground font-normal">الشحنة {shipmentNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isPresenceConnected && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Eye className="w-3 h-3 mr-1" />
                    متصل بالسائق
                  </Badge>
                )}
                {/* Google Maps Navigation Button */}
                <GoogleMapsNavigationButton
                  pickupAddress={pickupAddress}
                  deliveryAddress={deliveryAddress}
                  pickupCoords={pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1] } : null}
                  deliveryCoords={deliveryCoords ? { lat: deliveryCoords[0], lng: deliveryCoords[1] } : null}
                  variant="default"
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCenterOnDriver(!centerOnDriver)}
                  className={cn("gap-2", centerOnDriver && "bg-primary text-primary-foreground")}
                >
                  <Truck className="w-4 h-4" />
                  تتبع السائق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshDriverLocation}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[calc(95vh-100px)]">
            {/* Sidebar */}
            <div className="w-full lg:w-80 p-4 border-b lg:border-b-0 lg:border-l overflow-y-auto space-y-4">
              {/* Driver Status Card */}
              {driverInfo && (
                <Card className={cn(
                  "p-4",
                  isDriverOnline 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      isDriverOnline ? "bg-green-500" : "bg-red-500"
                    )}>
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{driverInfo.full_name}</span>
                        {isDriverOnline && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isDriverOnline ? 'متصل الآن' : 'غير متصل'}
                      </p>
                    </div>
                  </div>
                  {driverInfo.vehicle_plate && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="w-4 h-4" />
                      <span>{driverInfo.vehicle_plate}</span>
                    </div>
                  )}
                </Card>
              )}

              {/* Route Info */}
              {routeInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Route className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                      <p className="font-bold text-lg">{routeInfo.distance}</p>
                      {routeLoadFailed && (
                        <p className="text-[10px] text-amber-600">تقريبية</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                      <p className="font-bold text-lg">{routeInfo.duration}</p>
                    </div>
                  </div>

                  {calculateRemainingDistance() && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">المتبقي للوجهة</p>
                        <p className="font-bold text-lg">{calculateRemainingDistance()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Driver Speed & Accuracy */}
              {driverLocation && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">السرعة</p>
                    <p className="font-bold">
                      {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : '--'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">الدقة</p>
                    <p className="font-bold">±{Math.round(driverLocation.accuracy || 0)}م</p>
                  </div>
                </div>
              )}

              {/* Addresses */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Navigation className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">نقطة الاستلام</p>
                      <p className="text-sm font-medium">{pickupAddress}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">نقطة التسليم</p>
                      <p className="text-sm font-medium">{deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">جاري تحميل الخريطة والمسار...</span>
                  </div>
                </div>
              )}

              {routeLoadFailed && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
                    <AlertCircle className="w-3 h-3" />
                    المسار تقريبي - تعذر تحميل مسار الطريق الحقيقي
                  </Badge>
                </div>
              )}
              
              {isOpen && (
                <MapboxLiveTrackingMap
                  key={mapKey}
                  pickupCoords={pickupCoords}
                  deliveryCoords={deliveryCoords}
                  driverLocation={driverLocation}
                  driverPath={driverPath}
                  routeCoords={routeCoords}
                  centerOnDriver={centerOnDriver}
                  isDriverOnline={isDriverOnline}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

LiveTrackingMapDialog.displayName = 'LiveTrackingMapDialog';

export default LiveTrackingMapDialog;
