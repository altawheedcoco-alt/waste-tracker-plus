import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundTrackingConfig {
  driverId: string;
  enabled: boolean;
  /** Interval between location sends in ms (default: 60000 = 1 min) */
  intervalMs?: number;
  /** Signal loss timeout in ms before marking offline (default: 180000 = 3 min) */
  signalLossTimeout?: number;
}

interface BackgroundTrackingState {
  isTracking: boolean;
  lastSentAt: Date | null;
  error: string | null;
  consecutiveFailures: number;
  isOnline: boolean;
}

/**
 * Background GPS tracking hook that sends location every minute.
 * Uses Page Visibility API + periodic getCurrentPosition for PWA background support.
 * Detects signal loss and notifies admin automatically.
 */
export function useBackgroundTracking(config: BackgroundTrackingConfig) {
  const {
    driverId,
    enabled,
    intervalMs = 60000,
    signalLossTimeout = 180000,
  } = config;

  const [state, setState] = useState<BackgroundTrackingState>({
    isTracking: false,
    lastSentAt: null,
    error: null,
    consecutiveFailures: 0,
    isOnline: true,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Request wake lock to prevent sleep
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current?.addEventListener('release', () => {
        });
      }
    } catch (err) {
      console.warn('[BackgroundTracking] Wake lock not available:', err);
    }
  }, []);

  // Send current position to server
  const sendPosition = useCallback(async () => {
    if (!navigator.geolocation || !driverId) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;

        try {
          const { error } = await supabase.from('driver_location_logs').insert({
            driver_id: driverId,
            latitude,
            longitude,
            speed: speed ?? 0,
            heading: heading ?? 0,
            accuracy: accuracy ?? 0,
          });

          if (error) throw error;

          setState(prev => ({
            ...prev,
            lastSentAt: new Date(),
            consecutiveFailures: 0,
            isOnline: true,
            error: null,
          }));
        } catch (err: any) {
          console.error('[BackgroundTracking] Send failed:', err);
          setState(prev => ({
            ...prev,
            consecutiveFailures: prev.consecutiveFailures + 1,
            error: err.message || 'فشل إرسال الموقع',
          }));
        }
      },
      (geoError) => {
        console.error('[BackgroundTracking] GPS error:', geoError);
        setState(prev => ({
          ...prev,
          consecutiveFailures: prev.consecutiveFailures + 1,
          error: geoError.message,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }
    );
  }, [driverId]);

  // Check for signal loss and notify admin
  const checkSignalLoss = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data } = await supabase.rpc('check_driver_signal_loss', {
        timeout_minutes: Math.ceil(signalLossTimeout / 60000),
      });

      if (data && data.length > 0) {
        for (const driver of data) {
          // Get admin users for this org
          const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', driver.organization_id);

          if (admins) {
            const notifications = admins.map((admin: any) => ({
              user_id: admin.id,
              title: '⚠️ انقطاع إشارة سائق',
              message: `السائق ${driver.driver_name} غير متصل منذ ${Math.round(driver.minutes_offline)} دقيقة`,
              type: 'signal_lost',
            }));
            await supabase.from('notifications').insert(notifications);
          }

          await supabase
            .from('driver_signal_status')
            .update({ signal_lost_notified: true })
            .eq('driver_id', driver.driver_id);
        }
      }
    } catch (err) {
      console.error('[BackgroundTracking] Signal check failed:', err);
    }
  }, [driverId, signalLossTimeout]);

  // Start background tracking
  const startTracking = useCallback(() => {
    if (!enabled || !driverId) return;

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    // Send immediately
    sendPosition();

    // Set up periodic sending
    intervalRef.current = setInterval(sendPosition, intervalMs);

    // Check signal loss every 2 minutes
    signalCheckRef.current = setInterval(checkSignalLoss, 120000);

    // Request wake lock
    requestWakeLock();

    // Re-acquire wake lock on visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, driverId, intervalMs, sendPosition, checkSignalLoss, requestWakeLock]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && enabled) {
      requestWakeLock();
      // Send position immediately when app comes back
      sendPosition();
    }
  }, [enabled, requestWakeLock, sendPosition]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (signalCheckRef.current) {
      clearInterval(signalCheckRef.current);
      signalCheckRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    setState(prev => ({ ...prev, isTracking: false }));
  }, [handleVisibilityChange]);

  useEffect(() => {
    if (enabled && driverId) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [enabled, driverId, startTracking, stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    sendPosition,
  };
}
