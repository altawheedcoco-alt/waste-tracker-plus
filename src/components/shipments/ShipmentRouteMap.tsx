import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Route, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

interface ShipmentRouteMapProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber: string;
  driverId?: string | null;
  shipmentStatus?: string;
}

const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357
};

const ShipmentRouteMap = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
  driverId,
  shipmentStatus,
}: ShipmentRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey;

  // Fetch driver's latest location
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching driver location:', error);
        return;
      }

      if (data) {
        setDriverLocation(data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, [driverId]);

  const refreshDriverLocation = async () => {
    setIsRefreshing(true);
    await fetchDriverLocation();
    setIsRefreshing(false);
    toast.success('تم تحديث موقع السائق');
  };

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

  const updateDriverMarker = useCallback(() => {
    const win = window as any;
    if (!mapRef.current || !win.google || !driverLocation) return;

    const position = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
    } else {
      driverMarkerRef.current = new win.google.maps.Marker({
        position,
        map: mapRef.current,
        title: 'موقع السائق الحالي',
        icon: {
          path: win.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
          rotation: driverLocation.heading || 0,
        },
        zIndex: 1000,
      });

      // Add info window for driver
      const infoWindow = new win.google.maps.InfoWindow({
        content: `
          <div style="text-align: right; direction: rtl; padding: 8px;">
            <strong>🚛 السائق</strong><br/>
            <span>السرعة: ${driverLocation.speed ? Math.round(driverLocation.speed) + ' كم/س' : 'غير محددة'}</span><br/>
            <span style="font-size: 12px; color: #666;">
              آخر تحديث: ${new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
            </span>
          </div>
        `,
      });

      driverMarkerRef.current.addListener('click', () => {
        infoWindow.open(mapRef.current, driverMarkerRef.current);
      });
    }

    // Pan to driver location
    mapRef.current.panTo(position);
  }, [driverLocation]);

  const initializeMap = useCallback(async () => {
    const win = window as any;
    const mapContainer = document.getElementById('route-map-container');
    if (!mapContainer || !win.google) return;

    const map = new win.google.maps.Map(mapContainer, {
      center: defaultCenter,
      zoom: 10,
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
        region: 'EG',
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

    // Update driver marker if location exists
    if (driverLocation) {
      updateDriverMarker();
    }
  }, [pickupAddress, deliveryAddress, driverLocation, updateDriverMarker]);

  // Fetch driver location when dialog opens
  useEffect(() => {
    if (isOpen && driverId) {
      fetchDriverLocation();
    }
  }, [isOpen, driverId, fetchDriverLocation]);

  // Update driver marker when location changes
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      updateDriverMarker();
    }
  }, [driverLocation, updateDriverMarker]);

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

  // Real-time subscription for driver location
  useEffect(() => {
    if (!isOpen || !driverId) return;

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
          const newLocation = payload.new as DriverLocation;
          setDriverLocation(newLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, driverId]);

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

  const isDriverTracking = shipmentStatus === 'collecting' || shipmentStatus === 'in_transit';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              <span>تتبع الشحنة {shipmentNumber}</span>
            </div>
            {driverId && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDriverLocation}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                تحديث موقع السائق
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Driver Status */}
        {driverId && driverLocation && (
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-full">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">السائق في الطريق</p>
                <p className="text-sm text-muted-foreground">
                  السرعة: {driverLocation.speed ? Math.round(driverLocation.speed) + ' كم/س' : 'غير محددة'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              آخر تحديث: {new Date(driverLocation.recorded_at).toLocaleTimeString('ar-SA')}
            </Badge>
          </div>
        )}

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
        <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>نقطة الاستلام</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>نقطة التسليم</span>
          </div>
          {driverId && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>موقع السائق</span>
            </div>
          )}
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
