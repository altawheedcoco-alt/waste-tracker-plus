/**
 * نظام تتبع موقع السائق الذكي
 * - تشغيل/إيقاف يدوي (بدون شحنة)
 * - إجباري أثناء الشحنة النشطة
 * - تخزين مؤقت offline + مزامنة عند عودة الشبكة
 * - إرسال كل 15 ثانية
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SEND_INTERVAL = 15_000;
const BUFFER_KEY = 'driver_location_buffer';

interface LocationPoint {
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recorded_at: string;
}

export interface SmartLocationStatus {
  isSharing: boolean;
  isForcedByShipment: boolean;
  signal: 'good' | 'weak' | 'offline';
  lastUpdate: Date | null;
  accuracy: number | null;
  speed: number | null;
  bufferedCount: number;
  isOnline: boolean;
}

export function useDriverSmartLocation(
  driverId: string | undefined,
  hasActiveShipment: boolean
) {
  const [manualOn, setManualOn] = useState(false);
  const [status, setStatus] = useState<SmartLocationStatus>({
    isSharing: false,
    isForcedByShipment: false,
    signal: 'offline',
    lastUpdate: null,
    accuracy: null,
    speed: null,
    bufferedCount: 0,
    isOnline: navigator.onLine,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const bufferRef = useRef<LocationPoint[]>([]);

  // Load buffered points from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUFFER_KEY);
      if (saved) {
        bufferRef.current = JSON.parse(saved);
        setStatus(s => ({ ...s, bufferedCount: bufferRef.current.length }));
      }
    } catch { /* ignore */ }
  }, []);

  // The effective sharing state
  const shouldShare = hasActiveShipment || manualOn;

  // Monitor online/offline
  useEffect(() => {
    const onOnline = () => {
      setStatus(s => ({ ...s, isOnline: true }));
      flushBuffer();
    };
    const onOffline = () => setStatus(s => ({ ...s, isOnline: false }));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [driverId]);

  // Save buffer to localStorage
  const persistBuffer = useCallback(() => {
    try {
      localStorage.setItem(BUFFER_KEY, JSON.stringify(bufferRef.current));
      setStatus(s => ({ ...s, bufferedCount: bufferRef.current.length }));
    } catch { /* storage full, drop oldest */ }
  }, []);

  // Flush buffered points to DB
  const flushBuffer = useCallback(async () => {
    if (!driverId || bufferRef.current.length === 0) return;
    const toSend = [...bufferRef.current];
    try {
      const { error } = await supabase.from('driver_location_logs').insert(toSend);
      if (!error) {
        bufferRef.current = [];
        persistBuffer();
      }
    } catch { /* will retry next cycle */ }
  }, [driverId, persistBuffer]);

  // Send or buffer a single position
  const sendLocation = useCallback(async (pos: GeolocationPosition) => {
    if (!driverId) return;
    const { latitude, longitude, accuracy, speed, heading } = pos.coords;
    const point: LocationPoint = {
      driver_id: driverId,
      latitude,
      longitude,
      accuracy: accuracy ?? undefined,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
      recorded_at: new Date().toISOString(),
    };

    const sigQuality: 'good' | 'weak' = (accuracy ?? 100) < 30 ? 'good' : 'weak';

    if (navigator.onLine) {
      try {
        await supabase.from('driver_location_logs').insert(point);
        // Also flush any buffered points
        if (bufferRef.current.length > 0) flushBuffer();
        setStatus(s => ({
          ...s,
          isSharing: true,
          signal: sigQuality,
          lastUpdate: new Date(),
          accuracy,
          speed,
          isOnline: true,
        }));
      } catch {
        // Failed to send, buffer it
        bufferRef.current.push(point);
        persistBuffer();
        setStatus(s => ({
          ...s,
          isSharing: true,
          signal: 'weak',
          accuracy,
          speed,
        }));
      }
    } else {
      // Offline — buffer
      bufferRef.current.push(point);
      persistBuffer();
      setStatus(s => ({
        ...s,
        isSharing: true,
        signal: 'offline',
        accuracy,
        speed,
        isOnline: false,
      }));
    }
  }, [driverId, flushBuffer, persistBuffer]);

  // Main tracking effect
  useEffect(() => {
    if (!driverId || !shouldShare) {
      // Stop tracking
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStatus(s => ({
        ...s,
        isSharing: false,
        isForcedByShipment: hasActiveShipment,
        signal: 'offline',
      }));
      return;
    }

    if (!navigator.geolocation) return;

    setStatus(s => ({
      ...s,
      isForcedByShipment: hasActiveShipment,
    }));

    const getPos = () => {
      navigator.geolocation.getCurrentPosition(
        sendLocation,
        () => setStatus(s => ({ ...s, signal: 'weak' })),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Send immediately
    getPos();
    // Then every 15s
    intervalRef.current = setInterval(getPos, SEND_INTERVAL);

    // Watch for UI speed/accuracy updates
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const sig: 'good' | 'weak' = (pos.coords.accuracy ?? 100) < 30 ? 'good' : 'weak';
        setStatus(s => ({
          ...s,
          isSharing: true,
          signal: sig,
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
  }, [driverId, shouldShare, hasActiveShipment, sendLocation]);

  // Toggle manual sharing
  const toggleSharing = useCallback(() => {
    if (hasActiveShipment) return; // Can't turn off during active shipment
    setManualOn(prev => !prev);
  }, [hasActiveShipment]);

  return {
    ...status,
    shouldShare,
    toggleSharing,
    manualOn,
  };
}
