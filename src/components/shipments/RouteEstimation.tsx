import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Route, Clock, MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RouteEstimationProps {
  pickupAddress: string;
  deliveryAddress: string;
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

const RouteEstimation = ({ pickupAddress, deliveryAddress, className = '' }: RouteEstimationProps) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<Coordinates | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const fullMapRef = useRef<HTMLDivElement>(null);

  // Geocode an address to coordinates using Nominatim
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
      setPickupCoords(null);
      setDeliveryCoords(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Geocode both addresses
      const [pickup, delivery] = await Promise.all([
        geocodeAddress(pickupAddress),
        geocodeAddress(deliveryAddress)
      ]);

      if (!pickup || !delivery) {
        setError('تعذر تحديد إحداثيات أحد العناوين');
        setLoading(false);
        return;
      }

      setPickupCoords(pickup);
      setDeliveryCoords(delivery);

      // Use OSRM to calculate the route
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}?overview=false`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = route.distance / 1000;
        const durationMinutes = route.duration / 60;

        // Format distance
        let distanceStr: string;
        if (distanceKm >= 1) {
          distanceStr = `${distanceKm.toFixed(1)} كم`;
        } else {
          distanceStr = `${(route.distance).toFixed(0)} م`;
        }

        // Format duration
        let durationStr: string;
        if (durationMinutes >= 60) {
          const hours = Math.floor(durationMinutes / 60);
          const mins = Math.round(durationMinutes % 60);
          durationStr = mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`;
        } else {
          durationStr = `${Math.round(durationMinutes)} دقيقة`;
        }

        setRouteInfo({
          distance: distanceStr,
          duration: durationStr,
          distanceKm,
          durationMinutes
        });
      } else {
        // Fallback: Calculate straight-line distance
        const R = 6371; // Earth's radius in km
        const dLat = (delivery.lat - pickup.lat) * Math.PI / 180;
        const dLon = (delivery.lng - pickup.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(pickup.lat * Math.PI / 180) * Math.cos(delivery.lat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightLineDistance = R * c;
        
        // Estimate road distance (typically 1.3x straight line)
        const estimatedRoadDistance = straightLineDistance * 1.3;
        // Estimate time at 50 km/h average
        const estimatedMinutes = (estimatedRoadDistance / 50) * 60;

        setRouteInfo({
          distance: `~${estimatedRoadDistance.toFixed(1)} كم (تقريبي)`,
          duration: `~${Math.round(estimatedMinutes)} دقيقة (تقريبي)`,
          distanceKm: estimatedRoadDistance,
          durationMinutes: estimatedMinutes
        });
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('تعذر حساب المسار');
    } finally {
      setLoading(false);
    }
  }, [pickupAddress, deliveryAddress]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!pickupCoords || !deliveryCoords || !mapRef.current) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Clear existing map
      if ((mapRef.current as any)._leaflet_id) {
        (mapRef.current as any)._leaflet_id = null;
        mapRef.current!.innerHTML = '';
      }

      // Create map
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom icons
      const pickupIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="4"/></svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const deliveryIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add markers
      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).addTo(map);
      L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon }).addTo(map);

      // Draw route line
      const routeLine = L.polyline(
        [[pickupCoords.lat, pickupCoords.lng], [deliveryCoords.lat, deliveryCoords.lng]],
        { 
          color: '#6366f1', 
          weight: 3, 
          opacity: 0.8,
          dashArray: '10, 10',
        }
      ).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng]
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    };

    initMap();
  }, [pickupCoords, deliveryCoords]);

  // Initialize full map dialog
  useEffect(() => {
    if (!showFullMap || !pickupCoords || !deliveryCoords || !fullMapRef.current) return;

    const initFullMap = async () => {
      const L = await import('leaflet');
      
      // Wait for dialog to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!fullMapRef.current) return;

      // Clear existing map
      if ((fullMapRef.current as any)._leaflet_id) {
        (fullMapRef.current as any)._leaflet_id = null;
        fullMapRef.current.innerHTML = '';
      }

      // Create map
      const map = L.map(fullMapRef.current, {
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom icons
      const pickupIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="4"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const deliveryIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Add markers with popups
      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
        .bindPopup(`<b>📍 نقطة الاستلام</b><br/>${pickupAddress.split(',')[0]}`)
        .addTo(map);
      
      L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon })
        .bindPopup(`<b>🏁 نقطة التسليم</b><br/>${deliveryAddress.split(',')[0]}`)
        .addTo(map);

      // Draw route line with animation effect
      const routeLine = L.polyline(
        [[pickupCoords.lat, pickupCoords.lng], [deliveryCoords.lat, deliveryCoords.lng]],
        { 
          color: '#6366f1', 
          weight: 4, 
          opacity: 0.8,
          dashArray: '15, 10',
        }
      ).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [deliveryCoords.lat, deliveryCoords.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    };

    initFullMap();
  }, [showFullMap, pickupCoords, deliveryCoords, pickupAddress, deliveryAddress]);

  // Debounced route calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRoute();
    }, 500);

    return () => clearTimeout(timer);
  }, [calculateRoute]);

  // Don't show anything if no addresses
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
                <span className="text-xs">تكبير</span>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary ml-2" />
              <span className="text-sm text-muted-foreground">جاري حساب المسار...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-destructive text-center py-4">
              {error}
            </div>
          ) : routeInfo ? (
            <div className="flex gap-4">
              {/* Mini Map */}
              {pickupCoords && deliveryCoords && (
                <div 
                  ref={mapRef}
                  className="w-32 h-32 rounded-lg overflow-hidden border border-border flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setShowFullMap(true)}
                />
              )}

              {/* Route Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 p-2.5 bg-background/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المسافة</p>
                    <p className="font-bold">{routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-background/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                    <p className="font-bold">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Route Summary */}
          {routeInfo && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="truncate flex-1">{pickupAddress.split(',')[0]}</span>
                <span className="text-primary font-bold">→</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="truncate flex-1">{deliveryAddress.split(',')[0]}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Map Dialog */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
        <DialogContent className="max-w-4xl h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              خريطة المسار
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            <div 
              ref={fullMapRef}
              className="absolute inset-0 rounded-lg overflow-hidden"
            />
            {/* Route info overlay */}
            {routeInfo && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المسافة الكلية</p>
                      <p className="font-bold text-lg">{routeInfo.distance}</p>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الوقت المتوقع للوصول</p>
                      <p className="font-bold text-lg">{routeInfo.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteEstimation;
