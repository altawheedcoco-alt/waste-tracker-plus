import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Route, Navigation, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { geocodeAddress, pickupMarkerIcon, deliveryMarkerIcon } from '@/lib/mapUtils';
import { 
  fetchRouteAlternatives, 
  RouteAlternative, 
  formatDistanceArabic, 
  formatDurationArabic,
  calculateETA 
} from '@/lib/routingUtils';
import NavigationSteps from './NavigationSteps';
import RouteAlternativesSelector from './RouteAlternativesSelector';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EnhancedRouteMapProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
}

const defaultCenter: [number, number] = [30.0444, 31.2357];

// Map bounds adjuster
const MapBoundsAdjuster = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }, 100);
    }
  }, [bounds, map]);
  
  return null;
};

const EnhancedRouteMap = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
}: EnhancedRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [alternatives, setAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const selectedRoute = alternatives.find(r => r.id === selectedRouteId);

  // Initialize map
  const initializeMap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMapKey(prev => prev + 1);

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

      // Fetch route alternatives
      const routeResult = await fetchRouteAlternatives(
        { lat: pickup[0], lng: pickup[1] },
        { lat: delivery[0], lng: delivery[1] }
      );

      if (routeResult.success && routeResult.alternatives.length > 0) {
        setAlternatives(routeResult.alternatives);
        setSelectedRouteId(routeResult.alternatives[0].id);
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

  // Calculate bounds
  const getBounds = (): L.LatLngBoundsExpression | null => {
    const points: [number, number][] = [];
    if (pickupCoords) points.push(pickupCoords);
    if (deliveryCoords) points.push(deliveryCoords);
    
    // Include selected route points
    if (selectedRoute) {
      selectedRoute.coordinates.forEach(coord => points.push(coord));
    }
    
    return points.length >= 2 ? L.latLngBounds(points) : null;
  };

  const mapCenter = pickupCoords || deliveryCoords || defaultCenter;

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
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </Badge>
              </div>
            )}

            {isOpen && (
              <MapContainer
                key={mapKey}
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
                
                {/* All route alternatives (non-selected shown faded) */}
                {alternatives.map((route) => (
                  <Polyline
                    key={route.id}
                    positions={route.coordinates}
                    pathOptions={{
                      color: route.color,
                      weight: route.id === selectedRouteId ? 6 : 3,
                      opacity: route.id === selectedRouteId ? 1 : 0.4,
                    }}
                    eventHandlers={{
                      click: () => setSelectedRouteId(route.id),
                    }}
                  />
                ))}
                
                {/* Pickup marker */}
                {pickupCoords && (
                  <Marker position={pickupCoords} icon={pickupMarkerIcon}>
                    <Popup>
                      <div className="text-right min-w-[150px]" dir="rtl">
                        <p className="font-bold text-blue-600 mb-1">📍 نقطة الاستلام</p>
                        <p className="text-sm">{pickupAddress}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Delivery marker */}
                {deliveryCoords && (
                  <Marker position={deliveryCoords} icon={deliveryMarkerIcon}>
                    <Popup>
                      <div className="text-right min-w-[150px]" dir="rtl">
                        <p className="font-bold text-green-600 mb-1">🏁 نقطة التسليم</p>
                        <p className="text-sm">{deliveryAddress}</p>
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
  );
};

export default EnhancedRouteMap;
