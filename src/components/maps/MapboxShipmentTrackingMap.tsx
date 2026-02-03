import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, MapPin, Truck, Route, AlertCircle, Radio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Mapbox Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MapboxShipmentTrackingMapProps {
  collectionPoint: Location;
  recyclingCenter: Location;
  driverLocation?: Location | null;
  driverId?: string;
  showDriverTracking?: boolean;
  onDriverLocationUpdate?: (location: Location) => void;
  className?: string;
}

const MapboxShipmentTrackingMap = ({
  collectionPoint,
  recyclingCenter,
  driverLocation: initialDriverLocation,
  driverId,
  showDriverTracking = false,
  className = '',
}: MapboxShipmentTrackingMapProps) => {
  const [viewState, setViewState] = useState({
    longitude: (collectionPoint.lng + recyclingCenter.lng) / 2,
    latitude: (collectionPoint.lat + recyclingCenter.lat) / 2,
    zoom: 10,
  });

  const [driverLocation, setDriverLocation] = useState<Location | null>(initialDriverLocation || null);
  const [routeData, setRouteData] = useState<{ coordinates: [number, number][]; distance: number; duration: number } | null>(null);
  const [driverPath, setDriverPath] = useState<[number, number][]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [routeLoadFailed, setRouteLoadFailed] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    setRouteLoadFailed(false);

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${collectionPoint.lng},${collectionPoint.lat};${recyclingCenter.lng},${recyclingCenter.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData({
          coordinates: route.geometry.coordinates,
          distance: route.distance / 1000, // km
          duration: route.duration / 60, // minutes
        });

        // Fit bounds
        const coords = route.geometry.coordinates;
        const lngs = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        setViewState({
          longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          zoom: 11,
        });
      } else {
        setRouteLoadFailed(true);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setRouteLoadFailed(true);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [collectionPoint.lat, collectionPoint.lng, recyclingCenter.lat, recyclingCenter.lng]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    if (initialDriverLocation) {
      setDriverLocation(initialDriverLocation);
    }
  }, [initialDriverLocation]);

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
            const newLocation: Location = {
              lat: Number(newLog.latitude),
              lng: Number(newLog.longitude),
            };
            setDriverLocation(newLocation);
            setLastUpdateTime(new Date());

            // Add to path
            setDriverPath(prev => [...prev.slice(-49), [newLog.longitude, newLog.latitude]]);
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
      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setDriverLocation({
          lat: Number(data[0].latitude),
          lng: Number(data[0].longitude),
        });
        setLastUpdateTime(new Date(data[0].recorded_at));
        setDriverPath(data.reverse().map(p => [Number(p.longitude), Number(p.latitude)]));
      }
    };

    fetchLatestLocation();
  }, [driverId, initialDriverLocation]);

  const isDriverOnline = driverLocation && lastUpdateTime
    ? new Date().getTime() - lastUpdateTime.getTime() < 5 * 60 * 1000
    : false;

  // Calculate distance to destination
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const driverToDestination = driverLocation
    ? calculateDistance(driverLocation.lat, driverLocation.lng, recyclingCenter.lat, recyclingCenter.lng)
    : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="p-3 border-b bg-muted/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">خريطة تتبع الشحنة</span>
            {driverLocation && showDriverTracking && (
              <Badge variant="default" className="text-xs animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                تتبع مباشر
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">Mapbox</Badge>
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

        {routeLoadFailed && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            <span>تعذر تحميل مسار الطريق</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
          {routeData && (
            <>
              <span className="flex items-center gap-1">
                <Route className="w-3 h-3" />
                المسافة: {routeData.distance.toFixed(2)} كم
              </span>
              <span>الوقت المتوقع: {Math.round(routeData.duration)} دقيقة</span>
            </>
          )}
          {driverToDestination !== null && (
            <span className="font-medium text-primary">المتبقي للوجهة: {driverToDestination.toFixed(2)} كم</span>
          )}
          {lastUpdateTime && (
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
          <NavigationControl position="top-right" />

          {/* Route line */}
          {routeData && (
            <Source
              id="route"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeData.coordinates,
                },
              }}
            >
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
          {driverPath.length > 1 && (
            <Source
              id="driver-path"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: driverPath,
                },
              }}
            >
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
            <div className="bg-green-500 p-2 rounded-full shadow-lg border-2 border-white">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </Marker>

          {/* Recycling center marker */}
          <Marker longitude={recyclingCenter.lng} latitude={recyclingCenter.lat} anchor="bottom">
            <div className="bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
              <span className="text-white text-sm">🏭</span>
            </div>
          </Marker>

          {/* Driver marker */}
          {driverLocation && (
            <Marker longitude={driverLocation.lng} latitude={driverLocation.lat} anchor="center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" style={{ width: '48px', height: '48px', marginLeft: '-16px', marginTop: '-16px' }} />
                <div className="bg-blue-500 p-2 rounded-full shadow-lg border-2 border-white">
                  <Truck className="h-4 w-4 text-white" />
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </div>
    </Card>
  );
};

export default MapboxShipmentTrackingMap;
