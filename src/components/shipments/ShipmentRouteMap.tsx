import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Route, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const deliveryIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const driverIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:20px solid #ef4444;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

interface ShipmentRouteMapProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
  driverId?: string | null;
  shipmentStatus?: string;
}

const defaultCenter: [number, number] = [30.0444, 31.2357];

// Map bounds adjuster component
const MapBoundsAdjuster = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

// Egyptian cities geocoding (simple lookup)
const egyptianCities: { [key: string]: [number, number] } = {
  'القاهرة': [30.0444, 31.2357],
  'الجيزة': [30.0131, 31.2089],
  'الإسكندرية': [31.2001, 29.9187],
  'بورسعيد': [31.2653, 32.3019],
  'السويس': [29.9668, 32.5498],
  'الأقصر': [25.6872, 32.6396],
  'أسوان': [24.0889, 32.8998],
  'المنصورة': [31.0409, 31.3785],
  'طنطا': [30.7865, 31.0004],
  'الزقازيق': [30.5877, 31.5020],
  'دمياط': [31.4165, 31.8133],
  'المنيا': [28.1099, 30.7503],
  'أسيوط': [27.1809, 31.1837],
  'سوهاج': [26.5591, 31.6948],
  'قنا': [26.1551, 32.7160],
  'بني سويف': [29.0661, 31.0994],
  'الفيوم': [29.3084, 30.8428],
  'شرم الشيخ': [27.9158, 34.3300],
  'الغردقة': [27.2579, 33.8116],
  'مرسى مطروح': [31.3543, 27.2373],
  '6 أكتوبر': [29.9285, 30.9188],
  'العاشر من رمضان': [30.2833, 31.7333],
  'المعادي': [29.9602, 31.2569],
  'مدينة نصر': [30.0511, 31.3656],
  'حلوان': [29.8419, 31.3034],
  'العبور': [30.1833, 31.4833],
  'الشروق': [30.1167, 31.6167],
  'cairo': [30.0444, 31.2357],
  'giza': [30.0131, 31.2089],
  'alexandria': [31.2001, 29.9187],
};

// Simple geocoding function
const geocodeAddress = (address: string): [number, number] | null => {
  const lowerAddress = address.toLowerCase();
  
  // Check for coordinates in the address
  const coordMatch = address.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
  }
  
  // Check Egyptian cities
  for (const [city, coords] of Object.entries(egyptianCities)) {
    if (address.includes(city) || lowerAddress.includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
};

const ShipmentRouteMap = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
  driverId,
  shipmentStatus,
}: ShipmentRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);

  // Fetch driver's latest location
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

      if (error) {
        console.error('Error fetching driver location:', error);
        return;
      }

      if (data) {
        setDriverLocation(data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, [driverId]);

  const refreshDriverLocation = async () => {
    setIsRefreshing(true);
    await fetchDriverLocation();
    setIsRefreshing(false);
    toast.success('تم تحديث موقع السائق');
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize geocoding
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      const pickup = geocodeAddress(pickupAddress);
      const delivery = geocodeAddress(deliveryAddress);
      
      setPickupCoords(pickup);
      setDeliveryCoords(delivery);
      
      if (pickup && delivery) {
        const distance = calculateDistance(pickup[0], pickup[1], delivery[0], delivery[1]);
        // Estimate duration (assuming average speed of 50 km/h in Egypt with traffic)
        const durationHours = distance / 50;
        const hours = Math.floor(durationHours);
        const minutes = Math.round((durationHours - hours) * 60);
        
        setRouteInfo({
          distance: `${distance.toFixed(1)} كم`,
          duration: hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`,
        });
      } else {
        toast.info('لم يتمكن من تحديد المواقع بدقة، يتم عرض العناوين فقط');
      }
      
      setIsLoading(false);
    }
  }, [isOpen, pickupAddress, deliveryAddress]);

  // Fetch driver location when dialog opens
  useEffect(() => {
    if (isOpen && driverId) {
      fetchDriverLocation();
    }
  }, [isOpen, driverId, fetchDriverLocation]);

  // Real-time subscription for driver location
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
          const newLocation = payload.new as DriverLocation;
          setDriverLocation(newLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, driverId]);

  // Calculate map bounds
  const getBounds = (): L.LatLngBoundsExpression | null => {
    const points: [number, number][] = [];
    if (pickupCoords) points.push(pickupCoords);
    if (deliveryCoords) points.push(deliveryCoords);
    if (driverLocation) points.push([driverLocation.latitude, driverLocation.longitude]);
    
    if (points.length >= 2) {
      return L.latLngBounds(points);
    }
    return null;
  };

  const mapCenter = pickupCoords || deliveryCoords || defaultCenter;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              <span>تتبع الشحنة {shipmentNumber}</span>
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
                  السرعة: {driverLocation.speed ? Math.round(driverLocation.speed) + ' كم/س' : 'غير محددة'}
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
          <div className="flex items-center justify-center gap-6 py-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">المسافة:</span>
              <span className="font-semibold">{routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الوقت المتوقع:</span>
              <span className="font-semibold">{routeInfo.duration}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>نقطة الاستلام</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>نقطة التسليم</span>
          </div>
          {driverId && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>موقع السائق</span>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
              </div>
            </div>
          )}
          <div className="w-full h-[400px] rounded-lg border overflow-hidden">
            <MapContainer
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
                    <div className="text-right" dir="rtl">
                      <p className="font-medium text-blue-600">نقطة الاستلام</p>
                      <p className="text-sm">{pickupAddress}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Delivery marker */}
              {deliveryCoords && (
                <Marker position={deliveryCoords} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-right" dir="rtl">
                      <p className="font-medium text-green-600">نقطة التسليم</p>
                      <p className="text-sm">{deliveryAddress}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Route line */}
              {pickupCoords && deliveryCoords && (
                <Polyline
                  positions={[pickupCoords, deliveryCoords]}
                  pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8, dashArray: '10, 10' }}
                />
              )}
              
              {/* Driver marker */}
              {driverLocation && (
                <Marker 
                  position={[driverLocation.latitude, driverLocation.longitude]} 
                  icon={driverIcon}
                >
                  <Popup>
                    <div className="text-right" dir="rtl">
                      <p className="font-medium text-red-600">🚛 السائق</p>
                      <p className="text-sm">السرعة: {driverLocation.speed ? Math.round(driverLocation.speed) + ' كم/س' : 'غير محددة'}</p>
                      <p className="text-xs text-gray-500">
                        آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Address Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-400">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">نقطة الاستلام</span>
            </div>
            <p className="text-muted-foreground">{pickupAddress}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-400">
              <Navigation className="w-4 h-4" />
              <span className="font-medium">نقطة التسليم</span>
            </div>
            <p className="text-muted-foreground">{deliveryAddress}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentRouteMap;