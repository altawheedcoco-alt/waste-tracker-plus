import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FakeGPSDetector, { SpoofDetectionResult } from '@/lib/fakeGPSDetector';
interface GPSConfig {
  driverId: string;
  enabled: boolean;
  /** Minimum interval between updates in ms when moving */
  movingInterval?: number;
  /** Interval when stationary in ms */
  stationaryInterval?: number;
  /** Speed threshold (m/s) to distinguish moving vs stationary */
  speedThreshold?: number;
}

interface GPSState {
  isTracking: boolean;
  lastPosition: GeolocationPosition | null;
  batteryMode: 'high' | 'balanced' | 'low';
  error: string | null;
  spoofDetection: SpoofDetectionResult | null;
  isBlocked: boolean;
}

/**
 * Adaptive GPS tracking hook that adjusts frequency based on movement
 * to reduce battery consumption significantly.
 * 
 * - Moving fast: updates every 10s (high accuracy)
 * - Moving slow: updates every 30s (balanced)
 * - Stationary: updates every 120s (low power)
 */
export function useAdaptiveGPS(config: GPSConfig) {
  const {
    driverId,
    enabled,
    movingInterval = 10000,
    stationaryInterval = 120000,
    speedThreshold = 2, // 2 m/s ≈ 7.2 km/h
  } = config;

  const [state, setState] = useState<GPSState>({
    isTracking: false,
    lastPosition: null,
    batteryMode: 'balanced',
    error: null,
    spoofDetection: null,
    isBlocked: false,
  });

  const fakeGPSDetectorRef = useRef(new FakeGPSDetector());

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const consecutiveStationaryRef = useRef(0);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const sendLocationUpdate = useCallback(
    async (position: GeolocationPosition) => {
      // Run spoof detection
      const spoofResult = fakeGPSDetectorRef.current.analyze(position);
      if (spoofResult.isSuspicious && (spoofResult.riskLevel === 'high' || spoofResult.riskLevel === 'critical')) {
        console.warn('[AdaptiveGPS] Spoof detected:', spoofResult.reasons);
        setState(prev => ({
          ...prev,
          spoofDetection: spoofResult,
          isBlocked: true,
        }));
        return; // Don't send spoofed location
      }

      setState(prev => ({ ...prev, spoofDetection: spoofResult, isBlocked: false }));

      const now = Date.now();
      const { latitude, longitude, speed, heading, accuracy } = position.coords;

      // Determine if moving
      let isMoving = (speed ?? 0) > speedThreshold;
      if (!isMoving && lastPositionRef.current) {
        const dist = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          latitude,
          longitude
        );
        isMoving = dist > 10; // moved more than 10 meters
      }

      // Adaptive throttling
      const minInterval = isMoving
        ? (speed ?? 0) > 10 ? movingInterval : movingInterval * 3
        : stationaryInterval;

      if (now - lastUpdateRef.current < minInterval) return;

      // Track stationary count for battery mode
      if (!isMoving) {
        consecutiveStationaryRef.current++;
      } else {
        consecutiveStationaryRef.current = 0;
      }

      const batteryMode: GPSState['batteryMode'] =
        consecutiveStationaryRef.current > 5 ? 'low' :
        isMoving ? 'high' : 'balanced';

      lastUpdateRef.current = now;
      lastPositionRef.current = { lat: latitude, lng: longitude };

      setState(prev => ({
        ...prev,
        lastPosition: position,
        batteryMode,
      }));

      // Send to database
      try {
        await supabase.from('driver_location_logs').insert({
          driver_id: driverId,
          latitude,
          longitude,
          speed: speed ?? 0,
          heading: heading ?? 0,
          accuracy: accuracy ?? 0,
        });
      } catch (err) {
        console.error('GPS update failed:', err);
      }
    },
    [driverId, movingInterval, stationaryInterval, speedThreshold]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !enabled) return;

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    // Use watchPosition for continuous tracking with adaptive sending
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        sendLocationUpdate(position);
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }
    );
  }, [enabled, sendLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    if (enabled && driverId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, driverId, startTracking, stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
