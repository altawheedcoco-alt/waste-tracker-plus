/**
 * Hook لتتبع موقع السائق المستمر عند التوفر
 * يرسل الموقع كل 15 ثانية إلى driver_location_logs
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GpsStatus {
  isTracking: boolean;
  signal: 'good' | 'weak' | 'offline';
  lastUpdate: Date | null;
  accuracy: number | null;
  speed: number | null;
}

export function useDriverLiveLocation(driverId: string | undefined, isAvailable: boolean) {
  const [status, setStatus] = useState<GpsStatus>({
    isTracking: false, signal: 'offline', lastUpdate: null, accuracy: null, speed: null,
  });
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);

  const sendLocation = useCallback(async (pos: GeolocationPosition) => {
    if (!driverId) return;
    const { latitude, longitude, accuracy, speed, heading } = pos.coords;
    lastPos.current = { lat: latitude, lng: longitude };

    try {
      await supabase.from('driver_location_logs').insert({
        driver_id: driverId,
        latitude, longitude,
        accuracy: accuracy ?? undefined,
        speed: speed ?? undefined,
        heading: heading ?? undefined,
        recorded_at: new Date().toISOString(),
      });

      setStatus({
        isTracking: true,
        signal: (accuracy ?? 100) < 30 ? 'good' : 'weak',
        lastUpdate: new Date(),
        accuracy, speed,
      });
    } catch (e) {
      console.error('Location send failed', e);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId || !isAvailable) {
      // Stop tracking
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStatus(s => ({ ...s, isTracking: false, signal: 'offline' }));
      return;
    }

    // Start watching
    if (!navigator.geolocation) return;

    const sendPos = () => {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {
        setStatus(s => ({ ...s, signal: 'weak' }));
      }, { enableHighAccuracy: true, timeout: 10000 });
    };

    // Send immediately
    sendPos();

    // Then every 15s
    intervalRef.current = setInterval(sendPos, 15000);

    // High-accuracy watch for UI updates
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus(s => ({
          ...s,
          isTracking: true,
          signal: (pos.coords.accuracy ?? 100) < 30 ? 'good' : 'weak',
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        }));
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [driverId, isAvailable, sendLocation]);

  return status;
}
