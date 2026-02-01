import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Route, Truck, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.DivIcon({
  className: 'pickup-marker',
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border: 4px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="transform: rotate(45deg); color: white; font-size: 14px;">📍</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const deliveryIcon = new L.DivIcon({
  className: 'delivery-marker',
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #22c55e, #15803d);
    border: 4px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="transform: rotate(45deg); color: white; font-size: 14px;">🏁</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const driverIcon = new L.DivIcon({
  className: 'driver-marker',
  html: `<div style="
    position: relative;
    width: 44px;
    height: 44px;
  ">
    <div style="
      position: absolute;
      width: 44px;
      height: 44px;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      animation: driverPulse 2s infinite;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="color: white; font-size: 14px;">🚛</span></div>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
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

// Geocode address to coordinates
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ar`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
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
  const [mapKey, setMapKey] = useState(0);

  // Calculate distance (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
        .single();

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

  // Initialize geocoding when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const initializeMap = async () => {
      setIsLoading(true);
      setMapKey(prev => prev + 1);

      try {
        const [pickup, delivery] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        setPickupCoords(pickup);
        setDeliveryCoords(delivery);

        if (pickup && delivery) {
          // Use OSRM for route calculation
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?overview=false`;
            const response = await fetch(osrmUrl);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes?.length > 0) {
              const route = data.routes[0];
              const distanceKm = route.distance / 1000;
              const durationMinutes = route.duration / 60;

              setRouteInfo({
                distance: distanceKm >= 1 
                  ? `${distanceKm.toFixed(1)} كم` 
                  : `${Math.round(route.distance)} م`,
                duration: durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)} ساعة ${Math.round(durationMinutes % 60)} دقيقة`
                  : `${Math.round(durationMinutes)} دقيقة`,
              });
            } else {
              throw new Error('OSRM failed');
            }
          } catch {
            // Fallback to straight-line calculation
            const distance = calculateDistance(pickup[0], pickup[1], delivery[0], delivery[1]);
            const estimatedTime = (distance / 50) * 60;
            
            setRouteInfo({
              distance: `${distance.toFixed(1)} كم`,
              duration: estimatedTime >= 60
                ? `${Math.floor(estimatedTime / 60)} ساعة ${Math.round(estimatedTime % 60)} دقيقة`
                : `${Math.round(estimatedTime)} دقيقة`,
            });
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
    
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

  const mapCenter = pickupCoords || deliveryCoords || defaultCenter;

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
            {/* Driver Status */}
            {driverId && driverLocation && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-full">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">السائق في الطريق</p>
                    <p className="text-sm text-muted-foreground">
                      السرعة: {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'غير محددة'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
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
                  <div className="w-4 h-4 rounded-full bg-red-500" />
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
                    <span className="text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
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
                    
                    {/* Pickup marker */}
                    {pickupCoords && (
                      <Marker position={pickupCoords} icon={pickupIcon}>
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
                      <Marker position={deliveryCoords} icon={deliveryIcon}>
                        <Popup>
                          <div className="text-right min-w-[150px]" dir="rtl">
                            <p className="font-bold text-green-600 mb-1">🏁 نقطة التسليم</p>
                            <p className="text-sm">{deliveryAddress}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Route line */}
                    {pickupCoords && deliveryCoords && (
                      <Polyline
                        positions={[pickupCoords, deliveryCoords]}
                        pathOptions={{ 
                          color: '#6366f1', 
                          weight: 4, 
                          opacity: 0.8, 
                          dashArray: '12, 8' 
                        }}
                      />
                    )}
                    
                    {/* Driver marker */}
                    {driverLocation && (
                      <Marker 
                        position={[driverLocation.latitude, driverLocation.longitude]} 
                        icon={driverIcon}
                      >
                        <Popup>
                          <div className="text-right min-w-[150px]" dir="rtl">
                            <p className="font-bold text-red-600 mb-1">🚛 موقع السائق</p>
                            <p className="text-sm">السرعة: {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'غير محددة'}</p>
                            <p className="text-xs text-gray-500 mt-1">
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

            {/* Address Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">نقطة الاستلام</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{pickupAddress}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                  <Navigation className="w-4 h-4" />
                  <span className="font-medium text-sm">نقطة التسليم</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{deliveryAddress}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteMapDialog;
