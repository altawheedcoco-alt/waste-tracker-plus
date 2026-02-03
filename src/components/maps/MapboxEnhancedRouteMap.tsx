import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Route, Navigation, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { geocodeAddress } from '@/lib/mapUtils';
import NavigationSteps from './NavigationSteps';
import RouteAlternativesSelector from './RouteAlternativesSelector';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface RouteAlternative {
  id: string;
  name: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: any[];
  color: string;
  isRecommended: boolean;
}

interface MapboxEnhancedRouteMapProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
  // Legacy props support
  driverId?: string | null;
  shipmentStatus?: string;
}

const MapboxEnhancedRouteMap = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
}: MapboxEnhancedRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [alternatives, setAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 31.2357,
    latitude: 30.0444,
    zoom: 10,
  });

  const selectedRoute = alternatives.find(r => r.id === selectedRouteId);

  const formatDistanceArabic = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} متر`;
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  const formatDurationArabic = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  };

  const calculateETA = (durationSeconds: number) => {
    const eta = new Date(Date.now() + durationSeconds * 1000);
    return eta.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch routes from Mapbox Directions API
  const fetchRoutes = async (pickup: [number, number], delivery: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?alternatives=true&geometries=geojson&steps=true&language=ar&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const colors = ['#6366f1', '#22c55e', '#f59e0b'];
        const names = ['الأسرع', 'بديل 1', 'بديل 2'];

        const routeAlts: RouteAlternative[] = data.routes.map((route: any, index: number) => ({
          id: `route-${index}`,
          name: names[index] || `مسار ${index + 1}`,
          distance: route.distance,
          duration: route.duration,
          coordinates: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
          steps: route.legs[0]?.steps || [],
          color: colors[index] || '#6366f1',
          isRecommended: index === 0,
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching routes:', err);
      return [];
    }
  };

  // Initialize map
  const initializeMap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Geocode addresses
      const [pickupResult, deliveryResult] = await Promise.all([
        geocodeAddress(pickupAddress),
        geocodeAddress(deliveryAddress),
      ]);

      if (!pickupResult || !deliveryResult) {
        setError('تعذر تحديد إحداثيات العناوين');
        setIsLoading(false);
        return;
      }

      const pickup: [number, number] = [pickupResult.lat, pickupResult.lng];
      const delivery: [number, number] = [deliveryResult.lat, deliveryResult.lng];

      setPickupCoords(pickup);
      setDeliveryCoords(delivery);

      // Center map
      setViewState({
        longitude: (pickup[1] + delivery[1]) / 2,
        latitude: (pickup[0] + delivery[0]) / 2,
        zoom: 10,
      });

      // Fetch routes
      const routes = await fetchRoutes(pickup, delivery);
      if (routes.length > 0) {
        setAlternatives(routes);
        setSelectedRouteId(routes[0].id);
      } else {
        setError('تعذر تحميل المسارات');
      }
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('حدث خطأ في تحميل الخريطة');
    } finally {
      setIsLoading(false);
    }
  }, [pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (isOpen) {
      initializeMap();
    }
  }, [isOpen, initializeMap]);

  // Create GeoJSON for selected route
  const routeGeoJSON = selectedRoute ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: selectedRoute.coordinates.map(c => [c[1], c[0]]),
    },
  } : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0" dir="rtl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Route className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-lg font-bold">خريطة المسار التفصيلية</span>
                <p className="text-sm text-muted-foreground font-normal">الشحنة {shipmentNumber}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={initializeMap}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              تحديث
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(95vh-100px)]">
          {/* Sidebar */}
          <div className="w-full lg:w-96 p-4 border-b lg:border-b-0 lg:border-l overflow-y-auto space-y-4">
            {/* Route Selector */}
            <RouteAlternativesSelector
              alternatives={alternatives}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />

            {/* Navigation Steps */}
            {selectedRoute && (
              <NavigationSteps
                steps={selectedRoute.steps}
                totalDistance={selectedRoute.distance}
                totalDuration={selectedRoute.duration}
                eta={calculateETA(selectedRoute.duration)}
              />
            )}

            {/* Route Summary */}
            {selectedRoute && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المسافة</p>
                    <p className="font-bold">{formatDistanceArabic(selectedRoute.distance)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الوقت</p>
                    <p className="font-bold">{formatDurationArabic(selectedRoute.duration)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">نقطة الاستلام</p>
                    <p className="text-sm">{pickupAddress}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">نقطة التسليم</p>
                    <p className="text-sm">{deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">جاري تحميل المسارات...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </Badge>
              </div>
            )}

            {isOpen && (
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
                        'line-color': selectedRoute?.color || '#6366f1',
                        'line-width': 6,
                        'line-opacity': 0.8,
                      }}
                    />
                  </Source>
                )}

                {/* Pickup marker */}
                {pickupCoords && (
                  <Marker longitude={pickupCoords[1]} latitude={pickupCoords[0]} anchor="bottom">
                    <div className="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white text-lg">📍</span>
                    </div>
                  </Marker>
                )}

                {/* Delivery marker */}
                {deliveryCoords && (
                  <Marker longitude={deliveryCoords[1]} latitude={deliveryCoords[0]} anchor="bottom">
                    <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white text-lg">🏁</span>
                    </div>
                  </Marker>
                )}
              </Map>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapboxEnhancedRouteMap;
