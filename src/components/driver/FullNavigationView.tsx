import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Navigation, 
  Minimize2, 
  Maximize2,
  Volume2,
  VolumeX,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { geocodeAddress } from '@/lib/mapUtils';
import { 
  fetchRouteAlternatives, 
  RouteAlternative,
  calculateETA,
  formatDistanceArabic 
} from '@/lib/routingUtils';
import DriverNavigationPanel from './DriverNavigationPanel';
import DriverNavigationMap from './DriverNavigationMap';
import { calculateHaversineDistance } from '@/lib/mapUtils';

interface FullNavigationViewProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentId: string;
  driverId: string;
}

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
}

const FullNavigationView = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentId,
  driverId,
}: FullNavigationViewProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [route, setRoute] = useState<RouteAlternative | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [distanceToNextStep, setDistanceToNextStep] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingDuration, setRemainingDuration] = useState(0);
  const [completedCoords, setCompletedCoords] = useState<[number, number][]>([]);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Initialize route
  useEffect(() => {
    if (!isOpen) return;

    const initRoute = async () => {
      setIsLoading(true);
      try {
        // Geocode addresses
        const [pickup, delivery] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        if (!pickup || !delivery) {
          toast.error('تعذر تحديد إحداثيات العناوين');
          return;
        }

        setPickupCoords([pickup.lat, pickup.lng]);
        setDeliveryCoords([delivery.lat, delivery.lng]);

        // Fetch route
        const result = await fetchRouteAlternatives(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: delivery.lat, lng: delivery.lng }
        );

        if (result.success && result.alternatives.length > 0) {
          setRoute(result.alternatives[0]);
          setRemainingDistance(result.alternatives[0].distance);
          setRemainingDuration(result.alternatives[0].duration);
        } else {
          toast.error('تعذر تحميل المسار');
        }
      } catch (error) {
        console.error('Route init error:', error);
        toast.error('حدث خطأ في تحميل الملاحة');
      } finally {
        setIsLoading(false);
      }
    };

    initRoute();
  }, [isOpen, pickupAddress, deliveryAddress]);

  // Save location to database
  const saveLocation = useCallback(async (loc: LocationState) => {
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 10000) return; // Throttle to 10 seconds
    lastSaveTimeRef.current = now;

    try {
      await supabase.from('driver_location_logs').insert({
        driver_id: driverId,
        latitude: loc.lat,
        longitude: loc.lng,
        accuracy: loc.accuracy,
        speed: loc.speed,
        heading: loc.heading,
      });
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, [driverId]);

  // Calculate navigation state
  const updateNavigationState = useCallback((loc: LocationState) => {
    if (!route || !route.steps.length) return;

    const currentStep = route.steps[currentStepIndex];
    if (!currentStep) return;

    // Distance to current step's maneuver point
    const stepLocation = currentStep.maneuver.location;
    const distToStep = calculateHaversineDistance(
      loc.lat, loc.lng,
      stepLocation[1], stepLocation[0]
    ) * 1000; // Convert to meters

    setDistanceToNextStep(distToStep);

    // Check if we've completed this step (within 30 meters)
    if (distToStep < 30 && currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      toast.success('✓ ' + currentStep.instruction);
    }

    // Update completed coordinates (for green line)
    setCompletedCoords(prev => {
      const newCoord: [number, number] = [loc.lat, loc.lng];
      if (prev.length === 0) return [newCoord];
      
      const lastCoord = prev[prev.length - 1];
      const dist = calculateHaversineDistance(lastCoord[0], lastCoord[1], loc.lat, loc.lng);
      
      // Only add if moved more than 10 meters
      if (dist > 0.01) {
        return [...prev, newCoord];
      }
      return prev;
    });

    // Update remaining distance/duration
    if (deliveryCoords) {
      const remaining = calculateHaversineDistance(
        loc.lat, loc.lng,
        deliveryCoords[0], deliveryCoords[1]
      ) * 1000;
      setRemainingDistance(remaining);
      
      // Estimate remaining time based on current speed or average
      const avgSpeed = loc.speed > 0 ? loc.speed : 40; // km/h
      setRemainingDuration((remaining / 1000 / avgSpeed) * 3600);
    }
  }, [route, currentStepIndex, deliveryCoords]);

  // Start navigation
  const startNavigation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('الموقع الجغرافي غير مدعوم');
      return;
    }

    setIsNavigating(true);
    setCurrentStepIndex(0);
    setCompletedCoords([]);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc: LocationState = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: (position.coords.speed || 0) * 3.6, // Convert m/s to km/h
          heading: position.coords.heading || 0,
        };
        
        setLocation(loc);
        updateNavigationState(loc);
        saveLocation(loc);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل في تحديد الموقع');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    toast.success('بدأت الملاحة');
  }, [saveLocation, updateNavigationState]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
    toast.info('تم إيقاف الملاحة');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Handle close
  const handleClose = () => {
    if (isNavigating) {
      stopNavigation();
    }
    onClose();
  };

  // Minimized view
  if (isOpen && isMinimized && isNavigating && route) {
    const currentStep = route.steps[currentStepIndex];
    
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50"
        dir="rtl"
      >
        <div 
          className="bg-primary text-white rounded-2xl p-4 shadow-2xl cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Navigation className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{currentStep?.instruction}</p>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>{formatDistanceArabic(distanceToNextStep)}</span>
                <span>•</span>
                <span>{Math.round(location?.speed || 0)} كم/س</span>
              </div>
            </div>
            <Maximize2 className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full max-h-full h-screen w-screen p-0 gap-0" dir="rtl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-gradient-to-b from-background via-background/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-bold">الملاحة</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {deliveryAddress}
                </p>
              </div>
            </div>
            {isNavigating && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="h-[60%]">
          {!isLoading && (
            <DriverNavigationMap
              driverPosition={location}
              driverHeading={location?.heading || null}
              routeCoordinates={route?.coordinates || []}
              completedCoordinates={completedCoords}
              pickupCoords={pickupCoords}
              deliveryCoords={deliveryCoords}
              currentStep={route?.steps[currentStepIndex] || null}
              isNavigating={isNavigating}
              accuracy={location?.accuracy || null}
            />
          )}
        </div>

        {/* Navigation Panel */}
        <div className="h-[40%] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">جاري تحميل المسار...</span>
              </div>
            </div>
          ) : route ? (
            <DriverNavigationPanel
              steps={route.steps}
              currentStepIndex={currentStepIndex}
              distanceToNextStep={distanceToNextStep}
              totalDistance={route.distance}
              totalDuration={route.duration}
              remainingDistance={remainingDistance}
              remainingDuration={remainingDuration}
              currentSpeed={location?.speed || 0}
              isNavigating={isNavigating}
              onStartNavigation={startNavigation}
              onStopNavigation={stopNavigation}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">تعذر تحميل الملاحة</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullNavigationView;
