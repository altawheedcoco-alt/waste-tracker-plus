import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Route, Truck, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  fetchRoadRoute,
  geocodeAddress,
  formatDistance,
  formatDuration,
  calculateHaversineDistance,
  pickupMarkerIcon,
  deliveryMarkerIcon,
  createDriverMarkerIcon,
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
  recorded_at: string;
}

interface RouteMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
  driverId?: string | null;
  shipmentStatus?: string;
}

const defaultCenter: [number, number] = [30.0444, 31.2357];

// Map bounds adjuster
const MapBoundsAdjuster = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }, 100);
    }
  }, [bounds, map]);
  
  return null;
};

const RouteMapDialog = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
  driverId,
  shipmentStatus,
}: RouteMapDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoadFailed, setRouteLoadFailed] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Fetch driver location
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDriverLocation(data);
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

  // Initialize geocoding and routing when dialog opens
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

        const pickup: [number, number] | null = pickupResult 
          ? [pickupResult.lat, pickupResult.lng] 
          : null;
        const delivery: [number, number] | null = deliveryResult 
          ? [deliveryResult.lat, deliveryResult.lng] 
          : null;

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
            });
          } else {
            setRouteLoadFailed(true);
            // Fallback
            const distance = calculateHaversineDistance(pickup[0], pickup[1], delivery[0], delivery[1]);
            setRouteInfo({
              distance: `~${distance.toFixed(1)} كم`,
              duration: `~${Math.round((distance / 50) * 60)} دقيقة`,
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
    fetchDriverLocation();
  }, [isOpen, pickupAddress, deliveryAddress, fetchDriverLocation]);

  // Real-time driver location updates
  useEffect(() => {
    if (!isOpen || !driverId) return;

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          setDriverLocation(payload.new as DriverLocation);
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
    
    // Include route points for better bounds
    routeCoords.forEach(coord => points.push(coord));
    
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

  const mapCenter = pickupCoords || deliveryCoords || defaultCenter;
  const isDriverOnline = driverLocation 
    ? new Date().getTime() - new Date(driverLocation.recorded_at).getTime() < 5 * 60 * 1000 
    : false;

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary" />
                <span>خريطة المسار - {shipmentNumber}</span>
              </div>
              {driverId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshDriverLocation}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  تحديث موقع السائق
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Route Load Warning */}
            {routeLoadFailed && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>تعذر تحميل المسار الحقيقي - يتم عرض خط مستقيم تقريبي</span>
              </div>
            )}

            {/* Driver Status */}
            {driverId && driverLocation && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isDriverOnline 
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200" 
                  : "bg-red-50 dark:bg-red-950/20 border-red-200"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isDriverOnline ? "bg-green-500" : "bg-red-500"
                  )}>
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isDriverOnline ? "text-green-700" : "text-red-700"
                    )}>
                      {isDriverOnline ? 'السائق في الطريق' : 'السائق غير متصل'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      السرعة: {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'غير محددة'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  isDriverOnline 
                    ? "bg-green-100 text-green-700 border-green-300" 
                    : "bg-red-100 text-red-700 border-red-300"
                )}>
                  آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
                </Badge>
              </div>
            )}

            {/* Route Info */}
            {routeInfo && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                    <p className="font-bold text-lg">{routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                    <p className="font-bold text-lg">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-sm flex-wrap py-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>نقطة الاستلام</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>نقطة التسليم</span>
              </div>
              {driverId && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    isDriverOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span>موقع السائق</span>
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">جاري تحميل الخريطة والمسار...</span>
                  </div>
                </div>
              )}
              <div className="w-full h-[350px] rounded-lg border overflow-hidden">
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
                    
                    <MapBoundsAdjuster bounds={getBounds()} />
                    
                    {/* Real road route */}
                    {routeCoords.length > 1 && (
                      <Polyline
                        positions={routeCoords}
                        pathOptions={{ 
                          color: '#6366f1', 
                          weight: 5, 
                          opacity: 0.8, 
                          dashArray: routeLoadFailed ? '12, 8' : undefined
                        }}
                      />
                    )}
                    
                    {/* Pickup marker */}
                    {pickupCoords && (
                      <Marker position={pickupCoords} icon={pickupMarkerIcon}>
                        <Popup>
                          <div className="text-right min-w-[150px]" dir="rtl">
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
                          <div className="text-right min-w-[150px]" dir="rtl">
                            <p className="font-bold text-green-600 mb-1">🏁 نقطة التسليم</p>
                            <p className="text-sm">{deliveryAddress}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Driver marker */}
                    {driverLocation && (
                      <Marker 
                        position={[driverLocation.latitude, driverLocation.longitude]} 
                        icon={createDriverMarkerIcon(isDriverOnline)}
                      >
                        <Popup>
                          <div className="text-right min-w-[150px]" dir="rtl">
                            <p className="font-bold text-primary mb-1">🚛 موقع السائق</p>
                            <p className="text-sm">
                              السرعة: {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'غير محددة'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Address cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">نقطة الاستلام</p>
                    <p className="text-sm">{pickupAddress}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">نقطة التسليم</p>
                    <p className="text-sm">{deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteMapDialog;
