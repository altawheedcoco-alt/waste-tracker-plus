import { useState, useCallback } from 'react';
import { TrackingMode, TRACKING_MODES, TrackingState } from '@/types/tracking';
import { useRealtimeTracking } from './useRealtimeTracking';
import { useAITracking } from './useAITracking';
import { useAutoProgressLogger } from './useAutoProgressLogger';

interface UseTrackingSystemOptions {
  shipmentId: string;
  driverId: string;
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  currentStatus: string;
  initialMode?: TrackingMode;
}

/**
 * Unified tracking system hook that manages all three tracking modes
 */
export const useTrackingSystem = ({
  shipmentId,
  driverId,
  pickupCoords,
  deliveryCoords,
  currentStatus,
  initialMode = 'manual',
}: UseTrackingSystemOptions) => {
  const [activeMode, setActiveMode] = useState<TrackingMode>(initialMode);

  // Real-time tracking hook
  const realtimeTracking = useRealtimeTracking({
    shipmentId,
    driverId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    enabled: activeMode === 'realtime',
  });

  // AI tracking hook
  const aiTracking = useAITracking({
    shipmentId,
    driverId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    enabled: activeMode === 'ai',
  });

  // Auto progress logger (works with AI mode)
  useAutoProgressLogger({
    shipmentId,
    driverId,
    pickupCoords,
    deliveryCoords,
    status: currentStatus,
    enabled: activeMode === 'ai',
  });

  // Get current state based on active mode
  const getCurrentState = useCallback((): TrackingState | null => {
    switch (activeMode) {
      case 'realtime':
        return realtimeTracking.state;
      case 'ai':
        return aiTracking.state;
      case 'manual':
        return {
          shipmentId,
          mode: 'manual',
          isActive: true,
          lastUpdate: null,
          progress: 0,
          currentLocation: null,
          estimatedArrival: null,
          distanceRemaining: null,
          autoStatusChanges: false,
        };
      default:
        return null;
    }
  }, [activeMode, realtimeTracking.state, aiTracking.state, shipmentId]);

  // Switch tracking mode
  const switchMode = useCallback((newMode: TrackingMode) => {
    console.log(`[TrackingSystem] Switching from ${activeMode} to ${newMode}`);
    setActiveMode(newMode);
  }, [activeMode]);

  // Get mode configuration
  const getModeConfig = useCallback((mode: TrackingMode) => {
    return TRACKING_MODES[mode];
  }, []);

  // Get all available modes
  const getAvailableModes = useCallback(() => {
    return Object.values(TRACKING_MODES);
  }, []);

  return {
    activeMode,
    switchMode,
    getModeConfig,
    getAvailableModes,
    getCurrentState,
    realtimeTracking,
    aiTracking,
    isRealtimeActive: activeMode === 'realtime',
    isAIActive: activeMode === 'ai',
    isManualActive: activeMode === 'manual',
  };
};

export default useTrackingSystem;
