/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Route, Calendar, Clock, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed?: number;
}

interface GoogleMapsDriverHistoryProps {
  driverId: string;
  driverName?: string;
  date?: Date;
  className?: string;
  height?: string;
}

const GoogleMapsDriverHistory = memo(({
  driverId,
  driverName,
  date = new Date(),
  className = '',
  height = '500px',
}: GoogleMapsDriverHistoryProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch location history
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('driver_location_logs')
          .select('id, latitude, longitude, recorded_at, speed')
          .eq('driver_id', driverId)
          .gte('recorded_at', startOfDay.toISOString())
          .lte('recorded_at', endOfDay.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching location history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchHistory();
    }
  }, [driverId, date]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 30.0444, lng: 31.2357 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    });
  }, [isLoaded]);

  // Draw route
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || locations.length === 0) return;

    // Clear previous
    polylineRef.current?.setMap(null);
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const path = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));

    // Draw polyline
    polylineRef.current = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstanceRef.current,
    });

    // Start marker
    const startMarker = new window.google.maps.Marker({
      position: path[0],
      map: mapInstanceRef.current,
      title: 'نقطة البداية',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });
    markersRef.current.push(startMarker);

    // End marker
    const endMarker = new window.google.maps.Marker({
      position: path[path.length - 1],
      map: mapInstanceRef.current,
      title: 'نقطة النهاية',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });
    markersRef.current.push(endMarker);

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    mapInstanceRef.current.fitBounds(bounds, 50);
  }, [locations, isLoaded]);

  // Animation playback
  useEffect(() => {
    if (isPlaying && locations.length > 0) {
      animationRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= locations.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500);
    } else if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying, locations.length]);

  // Update current position marker during playback
  useEffect(() => {
    if (!mapInstanceRef.current || locations.length === 0 || currentIndex === 0) return;

    // Remove previous current marker if exists
    if (markersRef.current.length > 2) {
      markersRef.current[2].setMap(null);
      markersRef.current.splice(2, 1);
    }

    const currentLoc = locations[currentIndex];
    const currentMarker = new window.google.maps.Marker({
      position: { lat: currentLoc.latitude, lng: currentLoc.longitude },
      map: mapInstanceRef.current,
      title: 'الموقع الحالي',
      icon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: '#8b5cf6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 2,
        anchor: new window.google.maps.Point(12, 24),
      },
      zIndex: 1000,
    });
    markersRef.current.push(currentMarker);

    mapInstanceRef.current.panTo({ lat: currentLoc.latitude, lng: currentLoc.longitude });
  }, [currentIndex, locations]);

  if (loadError) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', className)} style={{ height }}>
        <div className="text-center text-destructive p-4">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">فشل تحميل الخريطة</p>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            سجل الحركة
            {driverName && <span className="font-normal text-muted-foreground">- {driverName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {format(date, 'yyyy/MM/dd', { locale: ar })}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              {locations.length} نقطة
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">جاري تحميل السجل...</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد بيانات موقع لهذا اليوم</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-1"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'إيقاف' : 'تشغيل'}
              </Button>
              {isPlaying && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(locations[currentIndex].recorded_at), 'HH:mm:ss', { locale: ar })}
                </Badge>
              )}
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border" style={{ height }}>
              <div ref={mapRef} className="w-full h-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

GoogleMapsDriverHistory.displayName = 'GoogleMapsDriverHistory';

export default GoogleMapsDriverHistory;
