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
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import GoogleMapsNavigationButton from '@/components/navigation/GoogleMapsNavigationButton';
import { 
  fetchRoadRoute, 
  geocodeAddress, 
  formatDistance, 
  formatDuration,
  calculateHaversineDistance,
  pickupMarkerIcon,
  deliveryMarkerIcon,
  createDriverMarkerIcon,
  RouteResult
} from '@/lib/mapUtils';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

const defaultCenter: [number, number] = [30.0444, 31.2357];

// Map bounds adjuster
const MapBoundsAdjuster = ({ bounds, centerOnDriver, driverPosition }: { 
  bounds: L.LatLngBoundsExpression | null;
  centerOnDriver: boolean;
  driverPosition: [number, number] | null;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (centerOnDriver && driverPosition) {
      map.setView(driverPosition, 15, { animate: true });
    } else if (bounds) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }, 100);
    }
  }, [bounds, centerOnDriver, driverPosition, map]);
  
  return null;
};

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

  // Calculate bounds
  const getBounds = (): L.LatLngBoundsExpression | null => {
    const points: [number, number][] = [];
    if (pickupCoords) points.push(pickupCoords);
    if (deliveryCoords) points.push(deliveryCoords);
    if (driverLocation) points.push([driverLocation.latitude, driverLocation.longitude]);
    
    // Add route points for better bounds
    if (routeCoords.length > 0) {
      routeCoords.forEach(coord => points.push(coord));
    }
    
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

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

  const mapCenter = pickupCoords || deliveryCoords || defaultCenter;
  const driverPosition: [number, number] | null = driverLocation 
    ? [driverLocation.latitude, driverLocation.longitude] 
    : null;

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
                <Card className="p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {driverLocation.speed ? Math.round(driverLocation.speed) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">كم/س</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {driverLocation.accuracy ? `±${Math.round(driverLocation.accuracy)}` : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">متر دقة</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
                  </p>
                </Card>
              )}

              {/* Legend */}
              <div className="text-xs space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">دليل الخريطة</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>نقطة الاستلام</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>نقطة التسليم</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span>موقع السائق</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-indigo-500" style={{ borderStyle: 'dashed' }} />
                  <span>المسار المخطط</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-cyan-500" />
                  <span>مسار السائق</span>
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
                    <AlertCircle className="w-3 h-3" />
                    المسار تقريبي - تعذر تحميل مسار الطريق الحقيقي
                  </Badge>
                </div>
              )}
              
              {isOpen && (
                <MapContainer
                  key={mapKey}
                  center={mapCenter}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapBoundsAdjuster 
                    bounds={getBounds()} 
                    centerOnDriver={centerOnDriver}
                    driverPosition={driverPosition}
                  />
                  
                  {/* Real road route */}
                  {routeCoords.length > 1 && (
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{
                        color: '#6366f1',
                        weight: 5,
                        opacity: 0.8,
                        dashArray: routeLoadFailed ? '12, 8' : undefined,
                      }}
                    />
                  )}
                  
                  {/* Driver path trail */}
                  {driverPath.length > 1 && (
                    <Polyline
                      positions={driverPath}
                      pathOptions={{
                        color: '#06b6d4',
                        weight: 4,
                        opacity: 0.9,
                      }}
                    />
                  )}
                  
                  {/* Pickup marker */}
                  {pickupCoords && (
                    <Marker position={pickupCoords} icon={pickupMarkerIcon}>
                      <Popup>
                        <div className="text-right min-w-[180px]" dir="rtl">
                          <p className="font-bold text-blue-600 mb-1">📍 نقطة الاستلام</p>
                          <p className="text-sm">{pickupAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Delivery marker */}
                  {deliveryCoords && (
                    <Marker position={deliveryCoords} icon={deliveryMarkerIcon}>
                      <Popup>
                        <div className="text-right min-w-[180px]" dir="rtl">
                          <p className="font-bold text-green-600 mb-1">🏁 نقطة التسليم</p>
                          <p className="text-sm">{deliveryAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Driver marker */}
                  {driverPosition && (
                    <Marker 
                      position={driverPosition} 
                      icon={createDriverMarkerIcon(isDriverOnline)}
                    >
                      <Popup>
                        <div className="text-right min-w-[180px]" dir="rtl">
                          <p className="font-bold text-primary mb-1">
                            🚛 {driverInfo?.full_name || 'السائق'}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>السرعة: {driverLocation?.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'غير محددة'}</p>
                            <p>الدقة: ±{Math.round(driverLocation?.accuracy || 0)} متر</p>
                            {driverInfo?.vehicle_plate && (
                              <p>اللوحة: {driverInfo.vehicle_plate}</p>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
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
