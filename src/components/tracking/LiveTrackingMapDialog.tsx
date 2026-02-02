import { useState, useEffect, useCallback, memo } from 'react';
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
  Maximize2,
  Signal,
  Activity,
  User,
  Phone,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';

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
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border: 4px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="transform: rotate(45deg); color: white; font-size: 16px;">📍</span></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const deliveryIcon = new L.DivIcon({
  className: 'delivery-marker',
  html: `<div style="
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #22c55e, #15803d);
    border: 4px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="transform: rotate(45deg); color: white; font-size: 16px;">🏁</span></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const createDriverIcon = (isOnline: boolean) => new L.DivIcon({
  className: 'driver-marker',
  html: `<div style="
    position: relative;
    width: 52px;
    height: 52px;
  ">
    <div style="
      position: absolute;
      width: 52px;
      height: 52px;
      background: radial-gradient(circle, ${isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.3)'} 0%, transparent 70%);
      border-radius: 50%;
      animation: driverPulse 2s infinite;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, ${isOnline ? '#22c55e' : '#ef4444'}, ${isOnline ? '#15803d' : '#dc2626'});
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 15px ${isOnline ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="color: white; font-size: 16px;">🚛</span></div>
  </div>`,
  iconSize: [52, 52],
  iconAnchor: [26, 26],
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [centerOnDriver, setCenterOnDriver] = useState(false);
  const [isDriverOnline, setIsDriverOnline] = useState(false);

  // Live tracking presence - announce to driver when watching
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
        .single();

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
                distanceKm,
              });
            }
          } catch {
            // Fallback calculation
            const R = 6371;
            const dLat = (delivery[0] - pickup[0]) * Math.PI / 180;
            const dLon = (delivery[1] - pickup[1]) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickup[0] * Math.PI / 180) * Math.cos(delivery[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c * 1.3; // Add 30% for road distance
            
            setRouteInfo({
              distance: `~${distance.toFixed(1)} كم`,
              duration: `~${Math.round((distance / 50) * 60)} دقيقة`,
              distanceKm: distance,
            });
          }
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
          
          // Add to path
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
    
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

  // Calculate remaining distance to destination
  const calculateRemainingDistance = (): string | null => {
    if (!driverLocation || !deliveryCoords) return null;
    
    const R = 6371;
    const dLat = (deliveryCoords[0] - driverLocation.latitude) * Math.PI / 180;
    const dLon = (deliveryCoords[1] - driverLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLocation.latitude * Math.PI / 180) * Math.cos(deliveryCoords[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
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
              <div className="flex items-center gap-2">
                {isPresenceConnected && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Eye className="w-3 h-3 mr-1" />
                    متصل بالسائق
                  </Badge>
                )}
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
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Badge variant="outline">{driverInfo.vehicle_plate}</Badge>
                      <span className="text-muted-foreground">{driverInfo.vehicle_type || 'مركبة'}</span>
                    </div>
                  )}

                  {driverInfo.phone && (
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <a href={`tel:${driverInfo.phone}`}>
                        <Phone className="w-4 h-4 ml-2" />
                        اتصال بالسائق
                      </a>
                    </Button>
                  )}
                </Card>
              )}

              {/* Live Stats */}
              {driverLocation && (
                <Card className="p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    البيانات اللحظية
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">السرعة</p>
                      <p className="font-bold">
                        {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : '-'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">الدقة</p>
                      <p className="font-bold">
                        {driverLocation.accuracy ? `± ${Math.round(driverLocation.accuracy)} م` : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-muted-foreground text-xs">المتبقي للوجهة</p>
                    <p className="font-bold text-primary text-lg">
                      {calculateRemainingDistance() || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}</span>
                  </div>
                </Card>
              )}

              {/* Route Info */}
              {routeInfo && (
                <Card className="p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    معلومات المسار
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">المسافة الكلية</span>
                      <span className="font-bold">{routeInfo.distance}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الوقت المتوقع</span>
                      <span className="font-bold">{routeInfo.duration}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Legend */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-sm">دليل الخريطة</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span>نقطة الاستلام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>نقطة التسليم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    <span>موقع السائق</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-indigo-500 rounded" />
                    <span>المسار المخطط</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-orange-500 rounded" />
                    <span>مسار السائق</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <span className="text-muted-foreground">جاري تحميل الخريطة...</span>
                  </div>
                </div>
              )}
              
              {isOpen && (
                <MapContainer
                  key={mapKey}
                  center={mapCenter}
                  zoom={12}
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
                  
                  {/* Pickup marker */}
                  {pickupCoords && (
                    <Marker position={pickupCoords} icon={pickupIcon}>
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
                    <Marker position={deliveryCoords} icon={deliveryIcon}>
                      <Popup>
                        <div className="text-right min-w-[180px]" dir="rtl">
                          <p className="font-bold text-green-600 mb-1">🏁 نقطة التسليم</p>
                          <p className="text-sm">{deliveryAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Planned route line */}
                  {pickupCoords && deliveryCoords && (
                    <Polyline
                      positions={[pickupCoords, deliveryCoords]}
                      pathOptions={{ 
                        color: '#6366f1', 
                        weight: 4, 
                        opacity: 0.7, 
                        dashArray: '12, 8' 
                      }}
                    />
                  )}

                  {/* Driver path trail */}
                  {driverPath.length > 1 && (
                    <Polyline
                      positions={driverPath}
                      pathOptions={{ 
                        color: '#f97316', 
                        weight: 3, 
                        opacity: 0.8
                      }}
                    />
                  )}
                  
                  {/* Driver marker */}
                  {driverLocation && (
                    <Marker 
                      position={[driverLocation.latitude, driverLocation.longitude]} 
                      icon={createDriverIcon(isDriverOnline)}
                    >
                      <Popup>
                        <div className="text-right min-w-[200px]" dir="rtl">
                          <p className="font-bold text-lg mb-2">
                            🚛 {driverInfo?.full_name || 'السائق'}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>السرعة:</strong>{' '}
                              {driverLocation.speed ? `${Math.round(driverLocation.speed)} كم/س` : 'متوقف'}
                            </p>
                            <p>
                              <strong>الدقة:</strong>{' '}
                              {driverLocation.accuracy ? `± ${Math.round(driverLocation.accuracy)} م` : '-'}
                            </p>
                            <p className="text-muted-foreground pt-2 text-xs">
                              آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
                            </p>
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
