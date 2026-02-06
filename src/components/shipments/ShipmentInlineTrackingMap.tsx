import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Truck,
  Route,
  Clock,
  Signal,
} from 'lucide-react';
import { geocodeAddress, calculateHaversineDistance, formatDistance } from '@/lib/mapUtils';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

interface ShipmentInlineTrackingMapProps {
  shipmentId: string;
  pickupAddress: string;
  deliveryAddress: string;
  driverId?: string | null;
  status: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  height?: number;
  onExpandClick?: () => void;
}

const ShipmentInlineTrackingMap = memo(({
  shipmentId,
  pickupAddress,
  deliveryAddress,
  driverId,
  status,
  collapsible = true,
  defaultExpanded = true,
  height = 200,
  onExpandClick,
}: ShipmentInlineTrackingMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const deliveryMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !isExpanded) return;

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const defaultCenter = { lat: 30.0444, lng: 31.2357 };
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoaded, isExpanded]);

  // Geocode addresses and setup markers
  useEffect(() => {
    if (!mapRef.current || !isExpanded) return;

    const initializeLocations = async () => {
      setLoading(true);
      try {
        const [pickupResult, deliveryResult] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        if (pickupResult.success) {
          setPickupCoords({ lat: pickupResult.lat, lng: pickupResult.lng });
          
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setPosition({ lat: pickupResult.lat, lng: pickupResult.lng });
          } else {
            pickupMarkerRef.current = new google.maps.Marker({
              position: { lat: pickupResult.lat, lng: pickupResult.lng },
              map: mapRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#22c55e',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
              title: 'نقطة الاستلام',
            });
          }
        }

        if (deliveryResult.success) {
          setDeliveryCoords({ lat: deliveryResult.lat, lng: deliveryResult.lng });
          
          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setPosition({ lat: deliveryResult.lat, lng: deliveryResult.lng });
          } else {
            deliveryMarkerRef.current = new google.maps.Marker({
              position: { lat: deliveryResult.lat, lng: deliveryResult.lng },
              map: mapRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#ef4444',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
              title: 'نقطة التسليم',
            });
          }
        }

        // Draw route line
        if (pickupResult.success && deliveryResult.success) {
          const path = [
            { lat: pickupResult.lat, lng: pickupResult.lng },
            { lat: deliveryResult.lat, lng: deliveryResult.lng },
          ];

          if (routePolylineRef.current) {
            routePolylineRef.current.setPath(path);
          } else {
            routePolylineRef.current = new google.maps.Polyline({
              path,
              map: mapRef.current,
              strokeColor: '#3b82f6',
              strokeOpacity: 0.6,
              strokeWeight: 3,
              geodesic: true,
            });
          }

          // Fit bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickupResult.lat, lng: pickupResult.lng });
          bounds.extend({ lat: deliveryResult.lat, lng: deliveryResult.lng });
          mapRef.current?.fitBounds(bounds, 30);
        }
      } catch (error) {
        console.error('Error initializing locations:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeLocations();
  }, [pickupAddress, deliveryAddress, isExpanded]);

  // Fetch driver location
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude, speed, heading, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDriverLocation(data);
        const isOnline = new Date().getTime() - new Date(data.recorded_at).getTime() < 5 * 60 * 1000;
        setIsDriverOnline(isOnline);

        // Calculate remaining distance
        if (deliveryCoords) {
          const dist = calculateHaversineDistance(
            data.latitude,
            data.longitude,
            deliveryCoords.lat,
            deliveryCoords.lng
          );
          setRemainingDistance(dist);
        }
      }
    } catch (error) {
      console.error('Error fetching driver location:', error);
    }
  }, [driverId, deliveryCoords]);

  // Initial driver location fetch
  useEffect(() => {
    if (driverId && isExpanded) {
      fetchDriverLocation();
    }
  }, [driverId, isExpanded, fetchDriverLocation]);

  // Update driver marker on map
  useEffect(() => {
    if (!mapRef.current || !driverLocation || !isExpanded) return;

    const position = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
      driverMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: isDriverOnline ? '#3b82f6' : '#6b7280',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        rotation: driverLocation.heading || 0,
      });
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: isDriverOnline ? '#3b82f6' : '#6b7280',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          rotation: driverLocation.heading || 0,
        },
        title: 'موقع السائق',
        zIndex: 100,
      });
    }

    // Extend bounds to include driver
    if (pickupCoords && deliveryCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupCoords);
      bounds.extend(deliveryCoords);
      bounds.extend(position);
      mapRef.current.fitBounds(bounds, 30);
    }
  }, [driverLocation, isDriverOnline, pickupCoords, deliveryCoords, isExpanded]);

  // Real-time driver location updates
  useEffect(() => {
    if (!driverId || !isExpanded) return;

    const channel = supabase
      .channel(`inline-tracking-${shipmentId}`)
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
          setIsDriverOnline(true);

          // Update remaining distance
          if (deliveryCoords) {
            const dist = calculateHaversineDistance(
              newLocation.latitude,
              newLocation.longitude,
              deliveryCoords.lat,
              deliveryCoords.lng
            );
            setRemainingDistance(dist);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, shipmentId, deliveryCoords, isExpanded]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      pickupMarkerRef.current?.setMap(null);
      deliveryMarkerRef.current?.setMap(null);
      driverMarkerRef.current?.setMap(null);
      routePolylineRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isLoaded) {
    return (
      <div 
        className="w-full bg-muted/50 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-card">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">خريطة التتبع</span>
          {driverId && isDriverOnline && (
            <Badge variant="default" className="bg-green-500 text-white text-xs gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              متصل
            </Badge>
          )}
          {driverId && !isDriverOnline && driverLocation && (
            <Badge variant="secondary" className="text-xs">غير متصل</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {driverId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchDriverLocation}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleToggle}
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {onExpandClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExpandClick}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Map container */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div 
              ref={containerRef} 
              className="w-full"
              style={{ height }}
            />
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Info overlay */}
            {remainingDistance !== null && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-lg border text-xs">
                <div className="flex items-center gap-2">
                  <Route className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">
                    المتبقي: {formatDistance(remainingDistance * 1000)}
                  </span>
                </div>
                {driverLocation?.speed && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>{Math.round(driverLocation.speed)} كم/س</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ShipmentInlineTrackingMap.displayName = 'ShipmentInlineTrackingMap';

export default ShipmentInlineTrackingMap;
