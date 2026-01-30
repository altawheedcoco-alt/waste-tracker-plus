import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation, MapPin, Truck, Route } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, iconSvg: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const collectionIcon = createCustomIcon(
  '#22c55e',
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
);

const recyclerIcon = createCustomIcon(
  '#ef4444',
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>'
);

const truckIcon = createCustomIcon(
  '#3b82f6',
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>'
);

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

interface OSRMRoute {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
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
  const { roles } = useAuth();
  const [driverLocation, setDriverLocation] = useState<Location | null>(initialDriverLocation || null);
  const [driverPath, setDriverPath] = useState<LocationLog[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [centerOnDriver, setCenterOnDriver] = useState(false);
  const [routeData, setRouteData] = useState<OSRMRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(0);

  const isDriver = roles.includes('driver');

  // Fetch route from OSRM
  const fetchRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    try {
      // OSRM expects coordinates as lng,lat
      const start = `${collectionPoint.lng},${collectionPoint.lat}`;
      const end = `${recyclingCenter.lng},${recyclingCenter.lat}`;
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        
        setRouteData({
          coordinates,
          distance: route.distance, // meters
          duration: route.duration, // seconds
        });
      }
    } catch (error) {
      console.error('Error fetching route from OSRM:', error);
      // Fallback to straight line if OSRM fails
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [collectionPoint.lat, collectionPoint.lng, recyclingCenter.lat, recyclingCenter.lng]);

  // Fetch route on mount and when points change
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

  // Extend bounds to include route if available
  if (routeData) {
    routeData.coordinates.forEach(coord => {
      bounds.extend(coord);
    });
  }

  // Route line - use OSRM route or fallback to straight line
  const routePositions: [number, number][] = routeData
    ? routeData.coordinates
    : [
        [collectionPoint.lat, collectionPoint.lng],
        [recyclingCenter.lat, recyclingCenter.lng],
      ];

  // Calculate distance - use OSRM distance or Haversine formula
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

  // Use OSRM distance if available, otherwise calculate using Haversine
  const totalDistance = routeData
    ? routeData.distance / 1000 // Convert meters to km
    : calculateDistance(
        collectionPoint.lat,
        collectionPoint.lng,
        recyclingCenter.lat,
        recyclingCenter.lng
      );

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  const driverToDestination = driverLocation
    ? calculateDistance(driverLocation.lat, driverLocation.lng, recyclingCenter.lat, recyclingCenter.lng)
    : null;

  // Driver path positions for trail visualization
  const driverPathPositions: [number, number][] = driverPath.map(p => [p.lat, p.lng]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header with stats */}
      <div className="p-3 border-b bg-muted/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">خريطة تتبع الشحنة</span>
            {driverLocation && showDriverTracking && (
              <Badge variant="default" className="text-xs animate-pulse bg-green-500 text-white">
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
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1 inline-block animate-pulse" />
                السائق
              </Badge>
            )}
          </div>
        </div>

        {/* Distance and duration info */}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Route className="w-3 h-3" />
            المسافة: {totalDistance.toFixed(2)} كم
            {routeData && <span className="text-green-600">(مسار حقيقي)</span>}
          </span>
          {routeData && (
            <span>الوقت المتوقع: {formatDuration(routeData.duration)}</span>
          )}
          {driverToDestination !== null && (
            <span className="font-medium text-primary">المتبقي للوجهة: {driverToDestination.toFixed(2)} كم</span>
          )}
          {lastUpdateTime && driverLocation && (
            <span className="flex items-center gap-1 text-blue-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-EG')}
            </span>
          )}
          {isLoadingRoute && (
            <span className="flex items-center gap-1 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              جاري تحميل المسار...
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
        <MapContainer
          center={[
            (collectionPoint.lat + recyclingCenter.lat) / 2,
            (collectionPoint.lng + recyclingCenter.lng) / 2,
          ]}
          zoom={10}
          className="h-full w-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds bounds={bounds} />

          {centerOnDriver && driverLocation && (
            <CenterOnDriver
              position={[driverLocation.lat, driverLocation.lng]}
              shouldCenter={centerOnDriver}
            />
          )}

          {/* Route Line - Real road path from OSRM or fallback to straight line */}
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: routeData ? '#22c55e' : '#3b82f6',
              weight: routeData ? 5 : 4,
              opacity: 0.8,
              dashArray: routeData ? undefined : '10, 10',
            }}
          />

          {/* Collection Point Marker */}
          <Marker position={[collectionPoint.lat, collectionPoint.lng]} icon={collectionIcon}>
            <Popup>
              <div className="text-right p-1" dir="rtl">
                <div className="font-bold text-green-600 mb-1">نقطة الجمع</div>
                {collectionPoint.address && (
                  <div className="text-xs text-gray-600">{collectionPoint.address}</div>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Recycling Center Marker */}
          <Marker position={[recyclingCenter.lat, recyclingCenter.lng]} icon={recyclerIcon}>
            <Popup>
              <div className="text-right p-1" dir="rtl">
                <div className="font-bold text-red-600 mb-1">مركز التدوير</div>
                {recyclingCenter.address && (
                  <div className="text-xs text-gray-600">{recyclingCenter.address}</div>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Driver Path Trail - shows where driver has been */}
          {driverPathPositions.length > 1 && (
            <Polyline
              positions={driverPathPositions}
              pathOptions={{
                color: '#3b82f6',
                weight: 3,
                opacity: 0.6,
              }}
            />
          )}

          {/* Driver Marker */}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={truckIcon}>
              <Popup>
                <div className="text-right p-1" dir="rtl">
                  <div className="font-bold text-blue-600 mb-1">موقع السائق</div>
                  <div className="text-xs text-gray-600">
                    {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                  </div>
                  {lastUpdateTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-EG')}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Controls overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          {showDriverTracking && isDriver && (
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={isTracking ? stopTracking : startTracking}
              className="shadow-lg"
            >
              {isTracking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  إيقاف التتبع
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-1" />
                  بدء التتبع
                </>
              )}
            </Button>
          )}

          {driverLocation && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCenterOnDriver(!centerOnDriver)}
              className="shadow-lg bg-background"
            >
              <Truck className="w-4 h-4 mr-1" />
              تتبع السائق
            </Button>
          )}
        </div>

        {/* Error message */}
        {trackingError && (
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg text-sm text-center">
            {trackingError}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShipmentTrackingMap;
