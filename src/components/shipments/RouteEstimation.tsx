import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Route, Clock, Navigation, Maximize2, List, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedRouteMap from '@/components/maps/EnhancedRouteMap';
import { fetchRouteAlternatives, formatDistanceArabic, formatDurationArabic, calculateETA } from '@/lib/routingUtils';
import { geocodeAddress } from '@/lib/mapUtils';

interface RouteEstimationProps {
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber?: string;
  driverId?: string | null;
  className?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceKm: number;
  durationMinutes: number;
  eta: string;
  alternativesCount: number;
}

const RouteEstimation = ({ 
  pickupAddress, 
  deliveryAddress, 
  shipmentNumber = '', 
  driverId,
  className = '' 
}: RouteEstimationProps) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  // Calculate route using enhanced routing
  const calculateRoute = useCallback(async () => {
    if (!pickupAddress || !deliveryAddress) {
      setRouteInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Geocode addresses
      const [pickup, delivery] = await Promise.all([
        geocodeAddress(pickupAddress),
        geocodeAddress(deliveryAddress)
      ]);

      if (!pickup || !delivery) {
        setError('تعذر تحديد إحداثيات العناوين');
        setLoading(false);
        return;
      }

      // Fetch route with alternatives
      const routeResult = await fetchRouteAlternatives(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: delivery.lat, lng: delivery.lng }
      );

      if (routeResult.success && routeResult.alternatives.length > 0) {
        const bestRoute = routeResult.alternatives[0];
        setRouteInfo({
          distance: formatDistanceArabic(bestRoute.distance),
          duration: formatDurationArabic(bestRoute.duration),
          distanceKm: bestRoute.distance / 1000,
          durationMinutes: bestRoute.duration / 60,
          eta: calculateETA(bestRoute.duration),
          alternativesCount: routeResult.alternatives.length,
        });
      } else {
        setError('تعذر حساب المسار');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('تعذر حساب المسار');
    } finally {
      setLoading(false);
    }
  }, [pickupAddress, deliveryAddress]);

  // Debounced route calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRoute();
    }, 500);

    return () => clearTimeout(timer);
  }, [calculateRoute]);

  if (!pickupAddress || !deliveryAddress) {
    return null;
  }

  return (
    <>
      <Card className={`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">تقدير المسار</span>
              {routeInfo && routeInfo.alternativesCount > 1 && (
                <Badge variant="secondary" className="text-[10px]">
                  {routeInfo.alternativesCount} مسارات
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 gap-1"
              onClick={() => setShowFullMap(true)}
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-xs">خريطة تفصيلية</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary ml-2" />
              <span className="text-sm text-muted-foreground">جاري حساب المسار...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-destructive text-center py-4">{error}</div>
          ) : routeInfo ? (
            <div className="space-y-3">
              {/* Route Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2 bg-background/60 rounded-lg">
                  <Navigation className="w-4 h-4 text-primary mb-1" />
                  <p className="font-bold text-sm">{routeInfo.distance}</p>
                  <p className="text-[10px] text-muted-foreground">المسافة</p>
                </div>
                <div className="flex flex-col items-center p-2 bg-background/60 rounded-lg">
                  <Clock className="w-4 h-4 text-primary mb-1" />
                  <p className="font-bold text-sm">{routeInfo.duration}</p>
                  <p className="text-[10px] text-muted-foreground">المدة</p>
                </div>
                <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  <MapPin className="w-4 h-4 text-green-600 mb-1" />
                  <p className="font-bold text-sm text-green-700">{routeInfo.eta}</p>
                  <p className="text-[10px] text-muted-foreground">الوصول</p>
                </div>
              </div>

              {/* Route Summary */}
              <div className="pt-2 border-t border-primary/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="truncate flex-1">{pickupAddress.split(',')[0]}</span>
                  <span className="text-primary font-bold">→</span>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="truncate flex-1">{deliveryAddress.split(',')[0]}</span>
                </div>
              </div>

              {/* View alternatives hint */}
              {routeInfo.alternativesCount > 1 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="w-full text-xs h-6 text-primary"
                  onClick={() => setShowFullMap(true)}
                >
                  <List className="w-3 h-3 ml-1" />
                  عرض {routeInfo.alternativesCount} مسارات بديلة مع تعليمات الملاحة
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Enhanced Route Map Dialog */}
      <EnhancedRouteMap
        isOpen={showFullMap}
        onClose={() => setShowFullMap(false)}
        pickupAddress={pickupAddress}
        deliveryAddress={deliveryAddress}
        shipmentNumber={shipmentNumber}
      />
    </>
  );
};

export default RouteEstimation;
