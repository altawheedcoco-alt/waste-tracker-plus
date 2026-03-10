import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressMilestone {
  distance: number; // in km
  label: string;
  logged: boolean;
}

interface UseAutoProgressLoggerOptions {
  shipmentId: string;
  driverId: string;
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  status: string;
  enabled?: boolean;
}

/**
 * Hook that automatically logs progress milestones to shipment_logs
 * based on driver location and distance traveled
 */
export const useAutoProgressLogger = ({
  shipmentId,
  driverId,
  pickupCoords,
  deliveryCoords,
  status,
  enabled = true,
}: UseAutoProgressLoggerOptions) => {
  const { user } = useAuth();
  const loggedMilestonesRef = useRef<Set<string>>(new Set());
  const lastLoggedDistanceRef = useRef<number>(0);
  const totalRouteDistanceRef = useRef<number>(0);

  // Calculate total route distance
  useEffect(() => {
    if (pickupCoords && deliveryCoords) {
      const distance = calculateHaversineDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        deliveryCoords.lat,
        deliveryCoords.lng
      );
      totalRouteDistanceRef.current = distance;
    }
  }, [pickupCoords, deliveryCoords]);

  // Load already logged milestones from DB
  useEffect(() => {
    const loadExistingLogs = async () => {
      if (!shipmentId) return;

      const { data } = await supabase
        .from('shipment_logs')
        .select('notes')
        .eq('shipment_id', shipmentId)
        .like('notes', '%تقدم تلقائي%');

      if (data) {
        data.forEach(log => {
          if (log.notes) {
            // Extract distance from notes like "تقدم تلقائي: 5 كم"
            const match = log.notes.match(/(\d+(?:\.\d+)?)\s*كم/);
            if (match) {
              loggedMilestonesRef.current.add(match[1]);
            }
            // Extract percentage milestones
            const percentMatch = log.notes.match(/(\d+)%/);
            if (percentMatch) {
              loggedMilestonesRef.current.add(`percent_${percentMatch[1]}`);
            }
          }
        });
      }
    };

    loadExistingLogs();
  }, [shipmentId]);

  // Log a milestone to the database
  const logMilestone = useCallback(async (
    type: 'distance' | 'percentage',
    value: number,
    latitude: number,
    longitude: number
  ) => {
    if (!shipmentId || !user?.id) return;

    const key = type === 'distance' ? value.toString() : `percent_${value}`;
    
    // Check if already logged
    if (loggedMilestonesRef.current.has(key)) return;

    const labels: Record<number, string> = {
      25: 'ربع الطريق',
      50: 'منتصف الطريق',
      75: 'ثلاثة أرباع الطريق',
    };

    let notes = '';
    if (type === 'percentage') {
      notes = `تقدم تلقائي: ${labels[value] || `${value}%`} - الشحنة وصلت إلى ${value}% من المسار`;
    } else {
      notes = `تقدم تلقائي: ${value} كم - تم قطع ${value} كيلومتر من نقطة الاستلام`;
    }

    try {
      const { error } = await supabase.from('shipment_logs').insert({
        shipment_id: shipmentId,
        status: status as any,
        changed_by: user.id,
        notes,
        latitude,
        longitude,
      });

      if (!error) {
        loggedMilestonesRef.current.add(key);
        // milestone logged successfully
      }
    } catch (err) {
      console.error('[AutoProgressLogger] Error logging milestone:', err);
    }
  }, [shipmentId, user?.id, status]);

  // Process new driver location
  const processLocation = useCallback((
    latitude: number,
    longitude: number
  ) => {
    if (!enabled || !pickupCoords || !deliveryCoords) return;
    if (status !== 'in_transit' && status !== 'approved') return;

    const totalDistance = totalRouteDistanceRef.current;
    if (totalDistance <= 0) return;

    // Calculate distance from pickup
    const distanceFromPickup = calculateHaversineDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      latitude,
      longitude
    );

    // Calculate progress percentage
    const progressPercent = Math.min(100, (distanceFromPickup / totalDistance) * 100);

    // Log every kilometer
    const fullKm = Math.floor(distanceFromPickup);
    if (fullKm > lastLoggedDistanceRef.current && fullKm > 0) {
      for (let km = lastLoggedDistanceRef.current + 1; km <= fullKm; km++) {
        logMilestone('distance', km, latitude, longitude);
      }
      lastLoggedDistanceRef.current = fullKm;
    }

    // Log percentage milestones (25%, 50%, 75%)
    const percentageMilestones = [25, 50, 75];
    percentageMilestones.forEach(percent => {
      if (progressPercent >= percent && !loggedMilestonesRef.current.has(`percent_${percent}`)) {
        logMilestone('percentage', percent, latitude, longitude);
      }
    });
  }, [enabled, pickupCoords, deliveryCoords, status, logMilestone]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!enabled || !driverId || !shipmentId) return;

    const channel = supabase
      .channel(getTabChannelName(`auto-progress-${shipmentId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const { latitude, longitude } = payload.new as { latitude: number; longitude: number };
          processLocation(latitude, longitude);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, driverId, shipmentId, processLocation]);

  return {
    processLocation,
    loggedMilestones: loggedMilestonesRef.current,
  };
};

export default useAutoProgressLogger;
