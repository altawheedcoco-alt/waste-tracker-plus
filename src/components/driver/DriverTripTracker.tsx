import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  MapPin,
  Navigation,
  Loader2,
  Clock,
  Route,
} from 'lucide-react';

interface DriverTripTrackerProps {
  driverId: string;
}

const DriverTripTracker = ({ driverId }: DriverTripTrackerProps) => {
  const { isLoaded } = useGoogleMaps();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 30.0444, lng: 31.2357 },
      zoom: 14,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    });

    polylineRef.current = new google.maps.Polyline({
      map: mapRef.current,
      strokeColor: '#22c55e',
      strokeOpacity: 1,
      strokeWeight: 4,
    });
  }, [isLoaded]);

  // Update duration timer
  useEffect(() => {
    if (!isTracking || !startTime) return;

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Calculate Haversine distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    const newLoc = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    // Calculate distance from last point
    if (path.length > 0) {
      const lastPoint = path[path.length - 1];
      const dist = calculateDistance(lastPoint.lat, lastPoint.lng, newLoc.lat, newLoc.lng);
      setDistance(prev => prev + dist);
    }

    setCurrentLocation(newLoc);
    setPath(prev => [...prev, newLoc]);

    // Update map
    if (mapRef.current) {
      mapRef.current.panTo(newLoc);

      if (markerRef.current) {
        markerRef.current.setPosition(newLoc);
      } else {
        markerRef.current = new google.maps.Marker({
          position: newLoc,
          map: mapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3,
          },
        });
      }

      if (polylineRef.current) {
        polylineRef.current.setPath([...path, newLoc]);
      }
    }

    // Save to database
    try {
      await supabase.from('driver_location_logs').insert({
        driver_id: driverId,
        latitude: newLoc.lat,
        longitude: newLoc.lng,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        recorded_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, [driverId, path]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('الموقع الجغرافي غير مدعوم');
      return;
    }

    setIsTracking(true);
    setStartTime(new Date());
    setPath([]);
    setDistance(0);
    setDuration(0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position);
        toast.success('تم بدء تتبع الرحلة');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل في تحديد الموقع');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error('Watch error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.success('تم إنهاء الرحلة');
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          تتبع الرحلة
          {isTracking && (
            <Badge variant="default" className="mr-2">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              نشط
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{distance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">كم</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{formatDuration(duration)}</p>
            <p className="text-xs text-muted-foreground">الوقت</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{path.length}</p>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </div>
        </div>

        {/* Map */}
        <div className="h-64 rounded-lg overflow-hidden border">
          {isLoaded ? (
            <div ref={containerRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1 gap-2">
              <Play className="h-4 w-4" />
              بدء الرحلة
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="flex-1 gap-2">
              <Pause className="h-4 w-4" />
              إنهاء الرحلة
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverTripTracker;
