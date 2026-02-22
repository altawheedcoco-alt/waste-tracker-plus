import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Building2,
  Truck,
  Activity,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import DriverMiniMap from '@/components/maps/LeafletMiniMap';
import TrackingStatsCard from '@/components/tracking/TrackingStatsCard';

interface OrganizationInfo {
  id: string;
  name: string;
  logo_url: string | null;
  organization_type: string;
  phone: string;
}

interface DriverLocationTrackerProps {
  driverId: string;
  autoStart?: boolean;
  showMap?: boolean;
}

const DriverLocationTracker = ({ driverId, autoStart = true, showMap = true }: DriverLocationTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [trackingDuration, setTrackingDuration] = useState<number>(0);
  const [locationCount, setLocationCount] = useState<number>(0);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);

  // Fetch organization info
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data: driver } = await supabase
          .from('drivers')
          .select(`
            organization:organizations(
              id,
              name,
              logo_url,
              organization_type,
              phone
            )
          `)
          .eq('id', driverId)
          .single();

        if (driver?.organization) {
          setOrganization(driver.organization as unknown as OrganizationInfo);
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
      } finally {
        setLoadingOrg(false);
      }
    };

    if (driverId) {
      fetchOrganization();
    }
  }, [driverId]);

  // Calculate Haversine distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const saveLocationToDb = useCallback(async (position: GeolocationPosition) => {
    try {
      const { error: dbError } = await supabase
        .from('driver_location_logs')
        .insert({
          driver_id: driverId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          recorded_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Calculate distance from last position
      if (lastPosition) {
        const dist = calculateDistance(
          lastPosition.lat, lastPosition.lng,
          newLocation.lat, newLocation.lng
        );
        setTotalDistance(prev => prev + dist);
      }
      setLastPosition(newLocation);
      setLocationCount(prev => prev + 1);

      setCurrentLocation(newLocation);
      setAccuracy(position.coords.accuracy);
      setCurrentSpeed((position.coords.speed || 0) * 3.6); // Convert m/s to km/h
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Error saving location:', err);
      setError('فشل في حفظ الموقع');
    }
  }, [driverId, lastPosition]);

  // Update tracking duration
  useEffect(() => {
    if (!isTracking || !trackingStartTime) return;
    
    const interval = setInterval(() => {
      setTrackingDuration(Math.floor((Date.now() - trackingStartTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTracking, trackingStartTime]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('الموقع الجغرافي غير مدعوم في هذا المتصفح');
      return;
    }

    setIsTracking(true);
    setError(null);
    setTotalDistance(0);
    setLocationCount(0);
    setTrackingStartTime(new Date());
    setLastPosition(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocationToDb(position);
        toast.success('تم تحديد موقعك بنجاح');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(getErrorMessage(err));
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Watch position with throttling
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 30000; // Save every 30 seconds

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSaveTime >= SAVE_INTERVAL) {
          saveLocationToDb(position);
          lastSaveTime = now;
        } else {
          // Update local state without saving to DB
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAccuracy(position.coords.accuracy);
        }
      },
      (err) => {
        console.error('Watch position error:', err);
        setError(getErrorMessage(err));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    setWatchId(id);
  }, [driverId, saveLocationToDb]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setTrackingStartTime(null);
  }, [watchId]);

  const getErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'تم رفض إذن الوصول للموقع. يرجى تفعيل خدمات الموقع.';
      case error.POSITION_UNAVAILABLE:
        return 'معلومات الموقع غير متوفرة.';
      case error.TIMEOUT:
        return 'انتهت مهلة طلب الموقع.';
      default:
        return 'حدث خطأ غير معروف.';
    }
  };

  const getSignalIcon = () => {
    if (!accuracy) return <Signal className="h-4 w-4" />;
    if (accuracy <= 10) return <SignalHigh className="h-4 w-4 text-primary" />;
    if (accuracy <= 50) return <SignalMedium className="h-4 w-4 text-accent-foreground" />;
    return <SignalLow className="h-4 w-4 text-destructive" />;
  };

  const refreshLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocationToDb(position);
        toast.success('تم تحديث الموقع');
      },
      (err) => {
        setError(getErrorMessage(err));
        toast.error('فشل في تحديث الموقع');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [saveLocationToDb]);

  useEffect(() => {
    if (autoStart && driverId) {
      startTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoStart, driverId]);

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'جهة مولدة';
      case 'transporter': return 'جهة ناقلة';
      case 'recycler': return 'جهة مدورة';
      default: return type;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            تتبع الموقع
          </CardTitle>
          <Badge variant={isTracking ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isTracking ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                نشط
              </>
            ) : (
              'متوقف'
            )}
          </Badge>
        </div>
        <CardDescription>
          موقعك الحالي يظهر للنظام والجهات المرتبطة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organization Info Section */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            {loadingOrg ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : organization ? (
              <>
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={organization.logo_url || ''} alt={organization.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {getOrgTypeLabel(organization.organization_type)}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground">{organization.name}</h4>
                  {organization.phone && (
                    <p className="text-xs text-muted-foreground" dir="ltr">{organization.phone}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">لم يتم تحديد الجهة بعد</span>
              </div>
            )}
          </div>
        </div>
        {error ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : currentLocation ? (
          <div className="space-y-3">
            {/* Mini Map */}
            {showMap && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <DriverMiniMap
                  latitude={currentLocation.lat}
                  longitude={currentLocation.lng}
                  accuracy={accuracy || undefined}
                />
              </motion.div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">الموقع الحالي</span>
              </div>
              <div className="text-sm font-mono text-muted-foreground" dir="ltr">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            </div>
            
            {/* Speed display */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-green-600" />
                <span className="font-medium">السرعة الحالية</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {Math.round(currentSpeed)} <span className="text-sm font-normal">كم/س</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getSignalIcon()}
                <span>دقة الموقع</span>
              </div>
              <span className="text-muted-foreground">
                {accuracy ? `± ${Math.round(accuracy)} متر` : '-'}
              </span>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>آخر تحديث</span>
                </div>
                <span className="text-muted-foreground">
                  {lastUpdate.toLocaleTimeString('ar-EG')}
                </span>
              </div>
            )}

            {/* Tracking Stats */}
            {isTracking && (
              <TrackingStatsCard
                distance={totalDistance}
                duration={trackingDuration}
                speed={currentSpeed}
                locations={locationCount}
                isActive={isTracking}
              />
            )}
          </div>
        ) : isTracking ? (
          <div className="flex items-center justify-center gap-2 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">جاري تحديد الموقع...</span>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            اضغط على "بدء التتبع" لتفعيل تتبع الموقع
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1">
              <Navigation className="h-4 w-4 ml-2" />
              بدء التتبع
            </Button>
          ) : (
            <>
              <Button onClick={refreshLocation} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث الموقع
              </Button>
              <Button onClick={stopTracking} variant="destructive" size="icon">
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverLocationTracker;
