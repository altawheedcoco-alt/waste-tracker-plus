import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Navigation,
  Loader2,
  Circle,
  Clock,
  Satellite,
  MapPinned,
  Send,
  Radio,
  Route,
  History,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import DriverTripTracker from '@/components/driver/DriverTripTracker';
import TripHistoryView from '@/components/driver/TripHistoryView';
import LiveLocationIndicator from '@/components/tracking/LiveLocationIndicator';
import TrackingStatsCard from '@/components/tracking/TrackingStatsCard';
import QuickLocationButton from '@/components/tracking/QuickLocationButton';
import GoogleMapComponent from '@/components/maps/MapboxMapComponent';

const defaultCenter = { lat: 30.0444, lng: 31.2357 }; // Cairo, Egypt

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
      // Fetch driver info using maybeSingle to handle no data gracefully
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
        .maybeSingle();

      if (error) {
        console.error('Error fetching driver info:', error);
        setLoading(false);
        return;
      }

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

  // Map center is now handled inside the Map component

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
        className="space-y-3 sm:space-y-6 pb-20"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header - compact on mobile */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="text-right">
            <h1 className="text-lg sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 justify-end">
              <MapPinned className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
              موقعي والتتبع
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground">عرض موقعك وإدارة رحلات التتبع</p>
          </div>
        </div>

        {/* Tabs for Location vs Trip Tracking */}
        <Tabs defaultValue="location" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger value="location" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">موقعي</span> الحالي
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm">
              <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              تتبع الرحلات
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm">
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              السجل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-2.5 sm:p-4 text-right">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">الحالة</p>
                      <Badge variant={driverInfo.is_available ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                        <Circle className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ml-1 ${driverInfo.is_available ? 'fill-primary' : 'fill-muted-foreground'}`} />
                        {driverInfo.is_available ? 'متاح' : 'في مهمة'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2.5 sm:p-4 text-right">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">آخر تحديث</p>
                      <p className="font-medium text-[10px] sm:text-sm">
                        {currentLocation 
                          ? new Date(currentLocation.recorded_at).toLocaleString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'لم يتم'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2.5 sm:p-4 text-right">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Satellite className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">الدقة</p>
                      <p className="font-medium text-[10px] sm:text-sm">
                        {currentLocation?.accuracy 
                          ? `${Math.round(currentLocation.accuracy)} م`
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
              <CardHeader className="text-right p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      onClick={updateMyLocation}
                      disabled={updating}
                      size="sm"
                      className="gap-1.5 text-xs flex-1 sm:flex-initial"
                    >
                      {updating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      تحديد موقعي
                    </Button>
                    <Button
                      onClick={toggleLiveTracking}
                      size="sm"
                      variant={liveTracking ? 'destructive' : 'outline'}
                      className="gap-1.5 text-xs flex-1 sm:flex-initial"
                    >
                      <Radio className={`h-3.5 w-3.5 ${liveTracking ? 'animate-pulse' : ''}`} />
                      {liveTracking ? 'إيقاف' : 'تتبع مباشر'}
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 justify-end text-sm sm:text-base">
                      خريطة موقعي
                      {liveTracking && (
                        <Badge variant="default" className="bg-primary animate-pulse text-[10px]">
                          <Radio className="w-2.5 h-2.5 ml-1" />
                          مباشر
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-sm">
                      {driverInfo.organization_name || 'شركة النقل'} • {driverInfo.vehicle_plate || 'غير محدد'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <div className="h-[250px] sm:h-[400px] rounded-lg overflow-hidden border">
                  <GoogleMapComponent
                    center={currentLocation 
                      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
                      : defaultCenter
                    }
                    zoom={currentLocation ? 15 : 6}
                    markers={currentLocation ? [{
                      position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
                      title: 'موقعي الحالي',
                      color: 'green',
                    }] : []}
                    height="100%"
                  />
                </div>

                {!currentLocation && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      اضغط على "تحديد موقعي" لإرسال موقعك الحالي
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
          </TabsContent>

          <TabsContent value="tracking" className="mt-4">
            <DriverTripTracker driverId={driverInfo.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <TripHistoryView driverId={driverInfo.id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyLocation;
