import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation, MapPin, Truck, Route, Eye, Radio, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import { cn } from '@/lib/utils';
import {
  fetchRoadRoute,
  formatDistance,
  formatDuration,
  calculateHaversineDistance,
  createMarkerIcon,
  createDriverMarkerIcon,
} from '@/lib/mapUtils';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const collectionIcon = createMarkerIcon('#22c55e', '📍', 40);
const recyclerIcon = createMarkerIcon('#ef4444', '🏭', 40);

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationLog {
  lat: number;
  lng: number;
  recorded_at: string;
}

interface ShipmentTrackingMapProps {
  collectionPoint: Location;
  recyclingCenter: Location;
  driverLocation?: Location | null;
  driverId?: string;
  showDriverTracking?: boolean;
  onDriverLocationUpdate?: (location: Location) => void;
  className?: string;
}

// Component to fit bounds
const FitBounds = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  
  return null;
};

// Component to center on driver
const CenterOnDriver = ({ position, shouldCenter }: { position: L.LatLngExpression; shouldCenter: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldCenter) {
      map.setView(position, 14, { animate: true });
    }
  }, [map, position, shouldCenter]);
  
  return null;
};

const ShipmentTrackingMap = ({
  collectionPoint,
  recyclingCenter,
  driverLocation: initialDriverLocation,
  driverId,
  showDriverTracking = false,
  onDriverLocationUpdate,
  className = '',
}: ShipmentTrackingMapProps) => {
  const { roles, profile, organization } = useAuth();
  const [driverLocation, setDriverLocation] = useState<Location | null>(initialDriverLocation || null);
  const [driverPath, setDriverPath] = useState<LocationLog[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [centerOnDriver, setCenterOnDriver] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [routeLoadFailed, setRouteLoadFailed] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(0);

  const isDriver = roles.includes('driver');

  // Live tracking presence - announce to driver when watching
  const { isConnected: isPresenceConnected } = useViewerPresence(
    isLiveTracking && driverId ? driverId : '',
    profile?.full_name || 'مستخدم',
    organization?.name
  );

  // Fetch real road route from OSRM
  const fetchRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    setRouteLoadFailed(false);
    
    try {
      const result = await fetchRoadRoute(
        { lat: collectionPoint.lat, lng: collectionPoint.lng },
        { lat: recyclingCenter.lat, lng: recyclingCenter.lng }
      );
      
      if (result.success) {
        setRouteCoords(result.coordinates);
        setRouteInfo({ distance: result.distance, duration: result.duration });
      } else {
        setRouteLoadFailed(true);
        // Fallback to straight line
        setRouteCoords([
          [collectionPoint.lat, collectionPoint.lng],
          [recyclingCenter.lat, recyclingCenter.lng],
        ]);
        const distance = calculateHaversineDistance(
          collectionPoint.lat, collectionPoint.lng,
          recyclingCenter.lat, recyclingCenter.lng
        );
        setRouteInfo({ distance: distance * 1000, duration: (distance / 50) * 3600 });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setRouteLoadFailed(true);
      setRouteCoords([
        [collectionPoint.lat, collectionPoint.lng],
        [recyclingCenter.lat, recyclingCenter.lng],
      ]);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [collectionPoint.lat, collectionPoint.lng, recyclingCenter.lat, recyclingCenter.lng]);

  // Fetch route on mount
  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Update driver location when prop changes
  useEffect(() => {
    if (initialDriverLocation) {
      setDriverLocation(initialDriverLocation);
    }
  }, [initialDriverLocation]);

  // Save location to database
  const saveLocationToDatabase = useCallback(async (location: Location, accuracy?: number, speed?: number, heading?: number) => {
    if (!driverId) return;

    // Throttle saves to max once every 10 seconds
    const now = Date.now();
    if (now - lastSavedRef.current < 10000) return;
    lastSavedRef.current = now;

    try {
      const { error } = await supabase
        .from('driver_location_logs')
        .insert({
          driver_id: driverId,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
        });

      if (error) {
        console.error('Error saving location:', error);
      }
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  }, [driverId]);

  // Start real-time tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError('الموقع الجغرافي غير مدعوم في هذا المتصفح');
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(newLocation);
        onDriverLocationUpdate?.(newLocation);
        
        // Save to database if driver
        if (isDriver && driverId) {
          saveLocationToDatabase(
            newLocation,
            position.coords.accuracy,
            position.coords.speed || undefined,
            position.coords.heading || undefined
          );
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setTrackingError('تم رفض إذن الموقع');
            break;
          case error.POSITION_UNAVAILABLE:
            setTrackingError('معلومات الموقع غير متوفرة');
            break;
          case error.TIMEOUT:
            setTrackingError('انتهت مهلة طلب الموقع');
            break;
          default:
            setTrackingError('حدث خطأ غير معروف');
        }
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onDriverLocationUpdate, isDriver, driverId, saveLocationToDatabase]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Subscribe to realtime location updates from database
  useEffect(() => {
    if (!driverId) return;

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
          const newLog = payload.new as any;
          if (newLog.latitude && newLog.longitude) {
            const newLocation: Location = {
              lat: Number(newLog.latitude),
              lng: Number(newLog.longitude),
            };
            setDriverLocation(newLocation);
            setLastUpdateTime(new Date());
            
            // Add to driver path for trail visualization
            setDriverPath(prev => {
              const newPath = [...prev, {
                lat: Number(newLog.latitude),
                lng: Number(newLog.longitude),
                recorded_at: newLog.recorded_at || new Date().toISOString()
              }];
              // Keep only last 50 points
              return newPath.slice(-50);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  // Fetch latest driver location and path on mount
  useEffect(() => {
    if (!driverId || initialDriverLocation) return;

    const fetchLatestLocation = async () => {
      // Fetch latest location
      const { data: latestData, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestData && !error) {
        setDriverLocation({
          lat: Number(latestData.latitude),
          lng: Number(latestData.longitude),
        });
        setLastUpdateTime(new Date(latestData.recorded_at));
      }

      // Fetch recent path (last 50 points)
      const { data: pathData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: true })
        .limit(50);

      if (pathData && pathData.length > 0) {
        setDriverPath(pathData.map(p => ({
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          recorded_at: p.recorded_at
        })));
      }
    };

    fetchLatestLocation();
  }, [driverId, initialDriverLocation]);

  // Calculate bounds
  const bounds = L.latLngBounds([
    [collectionPoint.lat, collectionPoint.lng],
    [recyclingCenter.lat, recyclingCenter.lng],
  ]);

  if (driverLocation) {
    bounds.extend([driverLocation.lat, driverLocation.lng]);
  }

  // Extend bounds to include route
  routeCoords.forEach(coord => bounds.extend(coord));

  const isDriverOnline = driverLocation && lastUpdateTime
    ? new Date().getTime() - lastUpdateTime.getTime() < 5 * 60 * 1000
    : false;

  // Distance calculations
  const totalDistance = routeInfo ? routeInfo.distance / 1000 : 
    calculateHaversineDistance(
      collectionPoint.lat, collectionPoint.lng,
      recyclingCenter.lat, recyclingCenter.lng
    );

  const driverToDestination = driverLocation
    ? calculateHaversineDistance(driverLocation.lat, driverLocation.lng, recyclingCenter.lat, recyclingCenter.lng)
    : null;

  // Driver path positions for trail visualization
  const driverPathPositions: [number, number][] = driverPath.map(p => [p.lat, p.lng]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with stats */}
      <div className="p-3 border-b bg-muted/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">خريطة تتبع الشحنة</span>
            {driverLocation && showDriverTracking && (
              <Badge variant="default" className="text-xs animate-pulse">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                تتبع مباشر
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1 inline-block" />
              نقطة الجمع
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1 inline-block" />
              مركز التدوير
            </Badge>
            {driverLocation && (
              <Badge variant="outline" className="text-xs">
                <span className={cn(
                  "w-2 h-2 rounded-full mr-1 inline-block",
                  isDriverOnline ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                )} />
                السائق
              </Badge>
            )}
          </div>
        </div>

        {/* Route warning */}
        {routeLoadFailed && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            <span>المسار تقريبي - تعذر تحميل مسار الطريق الحقيقي</span>
          </div>
        )}

        {/* Distance and duration info */}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Route className="w-3 h-3" />
            المسافة: {totalDistance.toFixed(2)} كم
            {!routeLoadFailed && <span className="text-green-600">(مسار حقيقي)</span>}
          </span>
          {routeInfo && (
            <span>الوقت المتوقع: {formatDuration(routeInfo.duration)}</span>
          )}
          {driverToDestination !== null && (
            <span className="font-medium text-primary">المتبقي للوجهة: {driverToDestination.toFixed(2)} كم</span>
          )}
          {lastUpdateTime && driverLocation && (
            <span className="flex items-center gap-1 text-blue-600">
              آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA')}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[400px]">
        {isLoadingRoute && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">جاري تحميل المسار...</span>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[collectionPoint.lat, collectionPoint.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds bounds={bounds} />
          
          {driverLocation && (
            <CenterOnDriver
              position={[driverLocation.lat, driverLocation.lng]}
              shouldCenter={centerOnDriver}
            />
          )}

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
          {driverPathPositions.length > 1 && (
            <Polyline
              positions={driverPathPositions}
              pathOptions={{
                color: '#06b6d4',
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}

          {/* Collection point marker */}
          <Marker position={[collectionPoint.lat, collectionPoint.lng]} icon={collectionIcon}>
            <Popup>
              <div className="text-right" dir="rtl">
                <strong>نقطة الجمع</strong>
                {collectionPoint.address && <p className="text-sm mt-1">{collectionPoint.address}</p>}
              </div>
            </Popup>
          </Marker>

          {/* Recycling center marker */}
          <Marker position={[recyclingCenter.lat, recyclingCenter.lng]} icon={recyclerIcon}>
            <Popup>
              <div className="text-right" dir="rtl">
                <strong>مركز التدوير</strong>
                {recyclingCenter.address && <p className="text-sm mt-1">{recyclingCenter.address}</p>}
              </div>
            </Popup>
          </Marker>

          {/* Driver marker */}
          {driverLocation && (
            <Marker 
              position={[driverLocation.lat, driverLocation.lng]} 
              icon={createDriverMarkerIcon(isDriverOnline || false)}
            >
              <Popup>
                <div className="text-right" dir="rtl">
                  <strong>{isDriverOnline ? 'السائق (متصل)' : 'السائق (غير متصل)'}</strong>
                  {lastUpdateTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA')}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Controls */}
      {showDriverTracking && (
        <div className="p-3 border-t flex items-center justify-between gap-2">
          {isDriver && (
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={isTracking ? stopTracking : startTracking}
              className="gap-2"
            >
              <Radio className="w-4 h-4" />
              {isTracking ? 'إيقاف البث' : 'بدء البث'}
            </Button>
          )}
          
          {driverLocation && (
            <Button
              size="sm"
              variant={centerOnDriver ? 'default' : 'outline'}
              onClick={() => setCenterOnDriver(!centerOnDriver)}
              className="gap-2"
            >
              <Truck className="w-4 h-4" />
              {centerOnDriver ? 'إلغاء التتبع' : 'تتبع السائق'}
            </Button>
          )}

          {trackingError && (
            <span className="text-xs text-destructive">{trackingError}</span>
          )}
          
          {isPresenceConnected && (
            <Badge variant="outline" className="text-xs gap-1">
              <Eye className="w-3 h-3" />
              متصل
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};

export default ShipmentTrackingMap;
