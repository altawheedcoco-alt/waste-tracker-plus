import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Route, Clock, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteMapDialog from '@/components/maps/RouteMapDialog';

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
}

interface Coordinates {
  lat: number;
  lng: number;
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
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<Coordinates | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  // Geocode an address using Nominatim
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  // Calculate route using OSRM
  const calculateRoute = useCallback(async () => {
    if (!pickupAddress || !deliveryAddress) {
      setRouteInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [pickup, delivery] = await Promise.all([
        geocodeAddress(pickupAddress),
        geocodeAddress(deliveryAddress)
      ]);

      if (!pickup || !delivery) {
        setError('تعذر تحديد إحداثيات العناوين');
        setLoading(false);
        return;
      }

      setPickupCoords(pickup);
      setDeliveryCoords(delivery);

      // Try OSRM for route calculation
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}?overview=false`;
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes?.length > 0) {
          const route = data.routes[0];
          const distanceKm = route.distance / 1000;
          const durationMinutes = route.duration / 60;

          setRouteInfo({
            distance: distanceKm >= 1 ? `${distanceKm.toFixed(1)} كم` : `${Math.round(route.distance)} م`,
            duration: durationMinutes >= 60
              ? `${Math.floor(durationMinutes / 60)} ساعة ${Math.round(durationMinutes % 60)} دقيقة`
              : `${Math.round(durationMinutes)} دقيقة`,
            distanceKm,
            durationMinutes
          });
          setLoading(false);
          return;
        }
      } catch {
        // OSRM failed, use fallback
      }

      // Fallback: Calculate straight-line distance
      const R = 6371;
      const dLat = (delivery.lat - pickup.lat) * Math.PI / 180;
      const dLon = (delivery.lng - pickup.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickup.lat * Math.PI / 180) * Math.cos(delivery.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const straightLineDistance = R * c;
      
      const estimatedRoadDistance = straightLineDistance * 1.3;
      const estimatedMinutes = (estimatedRoadDistance / 50) * 60;

      setRouteInfo({
        distance: `~${estimatedRoadDistance.toFixed(1)} كم`,
        duration: estimatedMinutes >= 60
          ? `~${Math.floor(estimatedMinutes / 60)} ساعة ${Math.round(estimatedMinutes % 60)} دقيقة`
          : `~${Math.round(estimatedMinutes)} دقيقة`,
        distanceKm: estimatedRoadDistance,
        durationMinutes: estimatedMinutes
      });
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
            </div>
            {pickupCoords && deliveryCoords && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setShowFullMap(true)}
              >
                <Maximize2 className="w-4 h-4 ml-1" />
                <span className="text-xs">خريطة المسار</span>
              </Button>
            )}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                    <p className="font-bold">{routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الوقت المتوقع للوصول</p>
                    <p className="font-bold">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="truncate flex-1">{pickupAddress.split(',')[0]}</span>
                  <span className="text-primary font-bold">→</span>
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="truncate flex-1">{deliveryAddress.split(',')[0]}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Full Map Dialog */}
      <RouteMapDialog
        isOpen={showFullMap}
        onClose={() => setShowFullMap(false)}
        pickupAddress={pickupAddress}
        deliveryAddress={deliveryAddress}
        shipmentNumber={shipmentNumber}
        driverId={driverId}
      />
    </>
  );
};

export default RouteEstimation;
