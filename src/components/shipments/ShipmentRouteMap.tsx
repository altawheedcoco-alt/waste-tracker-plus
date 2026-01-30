import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, Route } from 'lucide-react';
import { toast } from 'sonner';

interface ShipmentRouteMapProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
}

const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753
};

const ShipmentRouteMap = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
}: ShipmentRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey;

  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const win = window as any;
      if (win.google && win.google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions&language=ar`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }, [apiKey]);

  const initializeMap = useCallback(async () => {
    const win = window as any;
    const mapContainer = document.getElementById('route-map-container');
    if (!mapContainer || !win.google) return;

    const map = new win.google.maps.Map(mapContainer, {
      center: defaultCenter,
      zoom: 8,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
    });

    mapRef.current = map;

    // Create directions renderer
    directionsRendererRef.current = new win.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    // Calculate route
    const directionsService = new win.google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: pickupAddress,
        destination: deliveryAddress,
        travelMode: win.google.maps.TravelMode.DRIVING,
        region: 'SA',
      });

      directionsRendererRef.current.setDirections(result);

      if (result.routes[0]?.legs[0]) {
        setRouteInfo({
          distance: result.routes[0].legs[0].distance?.text || '',
          duration: result.routes[0].legs[0].duration?.text || '',
        });
      }
    } catch (error: any) {
      console.error('Directions error:', error);
      
      // Fallback: Try geocoding both addresses and showing markers
      const geocoder = new win.google.maps.Geocoder();
      
      try {
        const [pickupResult, deliveryResult] = await Promise.all([
          new Promise((resolve) => {
            geocoder.geocode({ address: pickupAddress }, (results: any, status: string) => {
              resolve(status === 'OK' && results?.[0] ? results[0].geometry.location : null);
            });
          }),
          new Promise((resolve) => {
            geocoder.geocode({ address: deliveryAddress }, (results: any, status: string) => {
              resolve(status === 'OK' && results?.[0] ? results[0].geometry.location : null);
            });
          }),
        ]);

        if (pickupResult) {
          new win.google.maps.Marker({
            position: pickupResult,
            map,
            title: 'نقطة الاستلام',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            },
          });
        }

        if (deliveryResult) {
          new win.google.maps.Marker({
            position: deliveryResult,
            map,
            title: 'نقطة التسليم',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            },
          });
        }

        if (pickupResult && deliveryResult) {
          const bounds = new win.google.maps.LatLngBounds();
          bounds.extend(pickupResult);
          bounds.extend(deliveryResult);
          map.fitBounds(bounds);

          // Draw a straight line between points
          new win.google.maps.Polyline({
            path: [pickupResult, deliveryResult],
            geodesic: true,
            strokeColor: '#16a34a',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map,
          });
        }

        toast.info('لم يتمكن من حساب المسار، يتم عرض المواقع فقط');
      } catch (geocodeError) {
        toast.error('فشل في تحديد المواقع على الخريطة');
      }
    }
  }, [pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (isOpen && hasApiKey) {
      setIsLoading(true);
      setRouteInfo(null);

      loadGoogleMapsScript()
        .then(() => {
          setTimeout(() => {
            initializeMap();
            setIsLoading(false);
          }, 100);
        })
        .catch(() => {
          toast.error('فشل تحميل الخريطة');
          setIsLoading(false);
        });
    }
  }, [isOpen, hasApiKey, loadGoogleMapsScript, initializeMap]);

  if (!hasApiKey) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-end">
              <span>خريطة المسار</span>
              <Route className="w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              يرجى إضافة مفتاح Google Maps API لتفعيل الخريطة
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>خريطة مسار الشحنة {shipmentNumber}</span>
            <Route className="w-5 h-5" />
          </DialogTitle>
        </DialogHeader>

        {/* Route Info */}
        {routeInfo && (
          <div className="flex items-center justify-center gap-6 py-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">المسافة:</span>
              <span className="font-semibold">{routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الوقت المتوقع:</span>
              <span className="font-semibold">{routeInfo.duration}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>نقطة الاستلام</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>نقطة التسليم</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
              </div>
            </div>
          )}
          <div
            id="route-map-container"
            className="w-full h-[400px] rounded-lg border"
          />
        </div>

        {/* Address Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-400">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">نقطة الاستلام</span>
            </div>
            <p className="text-muted-foreground">{pickupAddress}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-400">
              <Navigation className="w-4 h-4" />
              <span className="font-medium">نقطة التسليم</span>
            </div>
            <p className="text-muted-foreground">{deliveryAddress}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentRouteMap;
