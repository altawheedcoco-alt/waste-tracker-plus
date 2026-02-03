import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, Navigation, MapPin, Truck, Route, Eye, Radio, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import { cn } from '@/lib/utils';
import { calculateHaversineDistance } from '@/lib/mapUtils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

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

interface MapboxShipmentTrackingProps {
  collectionPoint: Location;
  recyclingCenter: Location;
  driverLocation?: Location | null;
  driverId?: string;
  showDriverTracking?: boolean;
  onDriverLocationUpdate?: (location: Location) => void;
  className?: string;
}

const MapboxShipmentTracking = ({
  collectionPoint,
  recyclingCenter,
  driverLocation: initialDriverLocation,
  driverId,
  showDriverTracking = false,
  onDriverLocationUpdate,
  className = '',
}: MapboxShipmentTrackingProps) => {
  const { roles, profile, organization } = useAuth();
  const [driverLocation, setDriverLocation] = useState<Location | null>(initialDriverLocation || null);
  const [driverPath, setDriverPath] = useState<LocationLog[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(0);

  const isDriver = roles.includes('driver');

  const [viewState, setViewState] = useState({
    longitude: (collectionPoint.lng + recyclingCenter.lng) / 2,
    latitude: (collectionPoint.lat + recyclingCenter.lat) / 2,
    zoom: 10,
  });

  // Live tracking presence
  const { isConnected: isPresenceConnected } = useViewerPresence(
    isLiveTracking && driverId ? driverId : '',
    profile?.full_name || 'مستخدم',
    organization?.name
  );

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} متر`;
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  };

  // Fetch route from Mapbox
  const fetchRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${collectionPoint.lng},${collectionPoint.lat};${recyclingCenter.lng},${recyclingCenter.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteCoords(route.geometry.coordinates);
        setRouteInfo({ distance: route.distance, duration: route.duration });
      } else {
        // Fallback to straight line
        setRouteCoords([
          [collectionPoint.lng, collectionPoint.lat],
          [recyclingCenter.lng, recyclingCenter.lat],
        ]);
        const distance = calculateHaversineDistance(
          collectionPoint.lat, collectionPoint.lng,
          recyclingCenter.lat, recyclingCenter.lng
        );
        setRouteInfo({ distance: distance * 1000, duration: (distance / 50) * 3600 });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setRouteCoords([
        [collectionPoint.lng, collectionPoint.lat],
        [recyclingCenter.lng, recyclingCenter.lat],
      ]);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [collectionPoint, recyclingCenter]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    if (initialDriverLocation) {
      setDriverLocation(initialDriverLocation);
    }
  }, [initialDriverLocation]);

  // Save location to database
  const saveLocationToDatabase = useCallback(async (location: Location, accuracy?: number, speed?: number, heading?: number) => {
    if (!driverId) return;

    const now = Date.now();
    if (now - lastSavedRef.current < 10000) return;
    lastSavedRef.current = now;

    try {
      await supabase.from('driver_location_logs').insert({
        driver_id: driverId,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
      });
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
        setTrackingError('حدث خطأ في تحديد الموقع');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onDriverLocationUpdate, isDriver, driverId, saveLocationToDatabase]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Subscribe to realtime location updates
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
            setDriverLocation({
              lat: Number(newLog.latitude),
              lng: Number(newLog.longitude),
            });
            setLastUpdateTime(new Date());
            
            setDriverPath(prev => {
              const newPath = [...prev, {
                lat: Number(newLog.latitude),
                lng: Number(newLog.longitude),
                recorded_at: newLog.recorded_at || new Date().toISOString()
              }];
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

  // Fetch latest driver location on mount
  useEffect(() => {
    if (!driverId || initialDriverLocation) return;

    const fetchLatestLocation = async () => {
      const { data: latestData } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestData) {
        setDriverLocation({
          lat: Number(latestData.latitude),
          lng: Number(latestData.longitude),
        });
        setLastUpdateTime(new Date(latestData.recorded_at));
      }

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

  const isDriverOnline = driverLocation && lastUpdateTime
    ? new Date().getTime() - lastUpdateTime.getTime() < 5 * 60 * 1000
    : false;

  const totalDistance = routeInfo ? routeInfo.distance / 1000 : 
    calculateHaversineDistance(
      collectionPoint.lat, collectionPoint.lng,
      recyclingCenter.lat, recyclingCenter.lng
    );

  const driverToDestination = driverLocation
    ? calculateHaversineDistance(driverLocation.lat, driverLocation.lng, recyclingCenter.lat, recyclingCenter.lng)
    : null;

  // GeoJSON for route
  const routeGeoJSON = routeCoords.length > 0 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: routeCoords,
    },
  } : null;

  // GeoJSON for driver path
  const driverPathGeoJSON = driverPath.length > 1 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: driverPath.map(p => [p.lng, p.lat]),
    },
  } : null;

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

        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Route className="w-3 h-3" />
            المسافة: {totalDistance.toFixed(2)} كم
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
        
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <NavigationControl position="top-left" />

          {/* Route line */}
          {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#6366f1',
                  'line-width': 5,
                  'line-opacity': 0.8,
                }}
              />
            </Source>
          )}

          {/* Driver path trail */}
          {driverPathGeoJSON && (
            <Source id="driver-path" type="geojson" data={driverPathGeoJSON}>
              <Layer
                id="driver-path-line"
                type="line"
                paint={{
                  'line-color': '#06b6d4',
                  'line-width': 4,
                  'line-opacity': 0.7,
                }}
              />
            </Source>
          )}

          {/* Collection point marker */}
          <Marker longitude={collectionPoint.lng} latitude={collectionPoint.lat} anchor="bottom">
            <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-lg">📍</span>
            </div>
          </Marker>

          {/* Recycling center marker */}
          <Marker longitude={recyclingCenter.lng} latitude={recyclingCenter.lat} anchor="bottom">
            <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-lg">🏭</span>
            </div>
          </Marker>

          {/* Driver marker */}
          {driverLocation && (
            <Marker longitude={driverLocation.lng} latitude={driverLocation.lat} anchor="center">
              <div className="relative">
                {isDriverOnline && (
                  <div 
                    className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"
                    style={{ width: '40px', height: '40px', marginLeft: '-8px', marginTop: '-8px' }}
                  />
                )}
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center",
                    isDriverOnline ? "bg-blue-500" : "bg-gray-400"
                  )}
                >
                  <Truck className="w-4 h-4 text-white" />
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Tracking Controls */}
      {showDriverTracking && isDriver && (
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant={isTracking ? 'destructive' : 'default'}
              size="sm"
              onClick={isTracking ? stopTracking : startTracking}
              className="gap-2"
            >
              {isTracking ? (
                <>
                  <Radio className="w-4 h-4" />
                  إيقاف التتبع
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  بدء التتبع
                </>
              )}
            </Button>
            {trackingError && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {trackingError}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Watch Controls */}
      {showDriverTracking && !isDriver && driverId && (
        <div className="p-3 border-t bg-muted/30">
          <Button
            variant={isLiveTracking ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsLiveTracking(!isLiveTracking)}
            className="gap-2"
          >
            <Eye className={cn("w-4 h-4", isLiveTracking && "text-primary")} />
            {isLiveTracking ? 'إيقاف المشاهدة المباشرة' : 'مشاهدة مباشرة'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default MapboxShipmentTracking;
