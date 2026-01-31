import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Navigation,
  Loader2,
  RefreshCcw,
  Circle,
  Clock,
  Satellite,
  MapPinned,
  Send,
  Radio,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom driver marker icon
const createDriverIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 -z-10"></div>
      </div>
    `,
    className: 'custom-driver-marker',
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -56],
  });
};

interface MapUpdaterProps {
  center: [number, number];
}

const MapUpdater = ({ center }: MapUpdaterProps) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MyLocation = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [driverInfo, setDriverInfo] = useState<{
    id: string;
    vehicle_plate: string | null;
    vehicle_type: string | null;
    is_available: boolean;
    organization_name: string | null;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    recorded_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [liveIntervalId, setLiveIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchDriverInfo();
    }
  }, [profile?.id]);

  const fetchDriverInfo = async () => {
    try {
      // Fetch driver info
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_plate,
          vehicle_type,
          is_available,
          organization:organizations(name)
        `)
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;

      if (driver) {
        setDriverInfo({
          id: driver.id,
          vehicle_plate: driver.vehicle_plate,
          vehicle_type: driver.vehicle_type,
          is_available: driver.is_available ?? true,
          organization_name: (driver.organization as any)?.name || null,
        });

        // Fetch latest location
        await fetchLatestLocation(driver.id);
      }
    } catch (error) {
      console.error('Error fetching driver info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestLocation = async (driverId: string) => {
    const { data, error } = await supabase
      .from('driver_location_logs')
      .select('latitude, longitude, accuracy, recorded_at')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setCurrentLocation({
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        accuracy: data.accuracy ? Number(data.accuracy) : undefined,
        recorded_at: data.recorded_at,
      });
    }
  };

  const updateMyLocation = async () => {
    if (!driverInfo?.id) return;

    setUpdating(true);
    try {
      // Get current position from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Save to database
      const { error } = await supabase.from('driver_location_logs').insert({
        driver_id: driverInfo.id,
        latitude,
        longitude,
        accuracy,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      setCurrentLocation({
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        recorded_at: new Date().toISOString(),
      });

      toast({
        title: 'تم تحديث الموقع',
        description: 'تم إرسال موقعك الحالي بنجاح',
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: 'خطأ في تحديد الموقع',
        description: error.message === 'User denied Geolocation' 
          ? 'يرجى السماح بالوصول إلى موقعك من إعدادات المتصفح'
          : 'فشل في الحصول على الموقع الحالي',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleLiveTracking = () => {
    if (liveTracking) {
      // Stop live tracking
      if (liveIntervalId) {
        clearInterval(liveIntervalId);
        setLiveIntervalId(null);
      }
      setLiveTracking(false);
      toast({
        title: 'تم إيقاف التتبع المباشر',
        description: 'لن يتم تحديث موقعك تلقائياً',
      });
    } else {
      // Start live tracking
      setLiveTracking(true);
      updateMyLocation(); // Update immediately
      const intervalId = setInterval(() => {
        updateMyLocation();
      }, 30000); // Update every 30 seconds
      setLiveIntervalId(intervalId);
      toast({
        title: 'تم تفعيل التتبع المباشر',
        description: 'سيتم تحديث موقعك تلقائياً كل 30 ثانية',
      });
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (liveIntervalId) {
        clearInterval(liveIntervalId);
      }
    };
  }, [liveIntervalId]);

  const mapCenter: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude] 
    : [30.0444, 31.2357]; // Cairo default

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!driverInfo) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">لم يتم العثور على بيانات السائق</h2>
          <p className="text-muted-foreground">يرجى التواصل مع الدعم الفني</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-end">
              <MapPinned className="h-8 w-8 text-primary" />
              موقعي الحالي
            </h1>
            <p className="text-muted-foreground">عرض وتحديث موقعك على الخريطة</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge variant={driverInfo.is_available ? 'default' : 'secondary'}>
                    <Circle className={`w-2 h-2 ml-1 ${driverInfo.is_available ? 'fill-green-400' : 'fill-amber-400'}`} />
                    {driverInfo.is_available ? 'متاح' : 'في مهمة'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">آخر تحديث</p>
                  <p className="font-medium">
                    {currentLocation 
                      ? new Date(currentLocation.recorded_at).toLocaleString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'لم يتم التحديد بعد'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Satellite className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الدقة</p>
                  <p className="font-medium">
                    {currentLocation?.accuracy 
                      ? `${Math.round(currentLocation.accuracy)} متر`
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader className="text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={updateMyLocation}
                  disabled={updating}
                  size="sm"
                  className="gap-2"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  تحديد موقعي
                </Button>
                <Button
                  onClick={toggleLiveTracking}
                  size="sm"
                  variant={liveTracking ? 'destructive' : 'outline'}
                  className="gap-2"
                >
                  <Radio className={`h-4 w-4 ${liveTracking ? 'animate-pulse' : ''}`} />
                  {liveTracking ? 'إيقاف التتبع' : 'تتبع مباشر'}
                </Button>
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 justify-end">
                  خريطة موقعي
                  {liveTracking && (
                    <Badge variant="default" className="bg-green-500 animate-pulse">
                      <Radio className="w-3 h-3 ml-1" />
                      مباشر
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {driverInfo.organization_name || 'شركة النقل'} • {driverInfo.vehicle_plate || 'غير محدد'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <MapContainer
                center={mapCenter}
                zoom={currentLocation ? 15 : 6}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapUpdater center={mapCenter} />

                {currentLocation && (
                  <Marker
                    position={[currentLocation.latitude, currentLocation.longitude]}
                    icon={createDriverIcon()}
                  >
                    <Popup>
                      <div className="text-right p-2">
                        <p className="font-bold">{profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {driverInfo.vehicle_plate}
                        </p>
                        <p className="text-xs mt-1">
                          آخر تحديث: {new Date(currentLocation.recorded_at).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {!currentLocation && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  اضغط على "تحديث موقعي" لإرسال موقعك الحالي
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coordinates Info */}
        {currentLocation && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">خط العرض</p>
                  <p className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">خط الطول</p>
                  <p className="font-mono text-sm">{currentLocation.longitude.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MyLocation;
