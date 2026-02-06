import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { TrackingMode, TrackingState, GeofenceZone } from '@/types/tracking';

interface UseRealtimeTrackingOptions {
  shipmentId: string;
  driverId: string;
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  currentStatus: string;
  enabled?: boolean;
  geofenceRadius?: number; // in meters
}

/**
 * Hook for real-time GPS-based automatic status tracking
 * Changes shipment status automatically based on driver location
 */
export const useRealtimeTracking = ({
  shipmentId,
  driverId,
  pickupCoords,
  deliveryCoords,
  currentStatus,
  enabled = true,
  geofenceRadius = 200, // 200 meters default
}: UseRealtimeTrackingOptions) => {
  const { user } = useAuth();
  const [state, setState] = useState<TrackingState>({
    shipmentId,
    mode: 'realtime',
    isActive: false,
    lastUpdate: null,
    progress: 0,
    currentLocation: null,
    estimatedArrival: null,
    distanceRemaining: null,
    autoStatusChanges: true,
  });

  const hasEnteredPickupRef = useRef(false);
  const hasExitedPickupRef = useRef(false);
  const hasEnteredDeliveryRef = useRef(false);

  // Define geofence zones
  const zones: GeofenceZone[] = [
    ...(pickupCoords ? [{
      id: 'pickup',
      name: 'منطقة الاستلام',
      center: pickupCoords,
      radius: geofenceRadius,
      type: 'pickup' as const,
    }] : []),
    ...(deliveryCoords ? [{
      id: 'delivery',
      name: 'منطقة التسليم',
      center: deliveryCoords,
      radius: geofenceRadius,
      type: 'delivery' as const,
    }] : []),
  ];

  // Check if location is within a geofence
  const isInGeofence = useCallback((
    location: { lat: number; lng: number },
    zone: GeofenceZone
  ): boolean => {
    const distance = calculateHaversineDistance(
      location.lat,
      location.lng,
      zone.center.lat,
      zone.center.lng
    ) * 1000; // Convert to meters
    return distance <= zone.radius;
  }, []);

  // Update shipment status
  const updateStatus = useCallback(async (
    newStatus: string,
    notes: string,
    latitude?: number,
    longitude?: number
  ) => {
    if (!user?.id || !shipmentId) return false;

    try {
      // Update status in shipments table
      const timestampFields: Record<string, string> = {
        'approved': 'approved_at',
        'in_transit': 'in_transit_at',
        'delivered': 'delivered_at',
        'confirmed': 'confirmed_at',
      };

      const updates: Record<string, any> = { status: newStatus };
      if (timestampFields[newStatus]) {
        updates[timestampFields[newStatus]] = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipmentId);

      if (updateError) throw updateError;

      // Log the change
      await supabase.from('shipment_logs').insert({
        shipment_id: shipmentId,
        status: newStatus as any,
        changed_by: user.id,
        notes: `[تتبع فعلي] ${notes}`,
        latitude,
        longitude,
      });

      console.log(`[RealtimeTracking] Auto status change: ${newStatus} - ${notes}`);
      return true;
    } catch (error) {
      console.error('[RealtimeTracking] Error updating status:', error);
      return false;
    }
  }, [shipmentId, user?.id]);

  // Process location update
  const processLocation = useCallback(async (
    latitude: number,
    longitude: number
  ) => {
    if (!enabled || !state.autoStatusChanges) return;

    const location = { lat: latitude, lng: longitude };
    
    // Update state
    setState(prev => ({
      ...prev,
      currentLocation: location,
      lastUpdate: new Date(),
      isActive: true,
    }));

    // Calculate progress if we have both coords
    if (pickupCoords && deliveryCoords) {
      const totalDistance = calculateHaversineDistance(
        pickupCoords.lat, pickupCoords.lng,
        deliveryCoords.lat, deliveryCoords.lng
      );
      const remainingDistance = calculateHaversineDistance(
        latitude, longitude,
        deliveryCoords.lat, deliveryCoords.lng
      );
      const progress = Math.min(100, Math.max(0, ((totalDistance - remainingDistance) / totalDistance) * 100));
      
      setState(prev => ({
        ...prev,
        progress,
        distanceRemaining: remainingDistance,
      }));
    }

    // Check geofences for automatic status changes
    const pickupZone = zones.find(z => z.type === 'pickup');
    const deliveryZone = zones.find(z => z.type === 'delivery');

    // Pickup zone logic
    if (pickupZone && currentStatus === 'approved') {
      const inPickup = isInGeofence(location, pickupZone);
      
      if (inPickup && !hasEnteredPickupRef.current) {
        hasEnteredPickupRef.current = true;
        await supabase.from('shipment_logs').insert({
          shipment_id: shipmentId,
          status: currentStatus as any,
          changed_by: user?.id,
          notes: '[تتبع فعلي] السائق وصل لمنطقة الاستلام',
          latitude,
          longitude,
        });
      }
      
      if (!inPickup && hasEnteredPickupRef.current && !hasExitedPickupRef.current) {
        hasExitedPickupRef.current = true;
        // Auto change to in_transit when leaving pickup zone
        await updateStatus('in_transit', 'السائق غادر منطقة الاستلام - بدء النقل تلقائياً', latitude, longitude);
      }
    }

    // Delivery zone logic
    if (deliveryZone && currentStatus === 'in_transit') {
      const inDelivery = isInGeofence(location, deliveryZone);
      
      if (inDelivery && !hasEnteredDeliveryRef.current) {
        hasEnteredDeliveryRef.current = true;
        // Auto change to delivered when entering delivery zone
        await updateStatus('delivered', 'السائق وصل لمنطقة التسليم - تم التسليم تلقائياً', latitude, longitude);
      }
    }
  }, [enabled, state.autoStatusChanges, pickupCoords, deliveryCoords, currentStatus, zones, isInGeofence, updateStatus, shipmentId, user?.id]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!enabled || !driverId) return;

    const channel = supabase
      .channel(`realtime-tracking-${shipmentId}`)
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

  // Toggle auto status changes
  const toggleAutoStatus = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoStatusChanges: !prev.autoStatusChanges,
    }));
  }, []);

  return {
    state,
    zones,
    processLocation,
    toggleAutoStatus,
    isInGeofence,
  };
};

export default useRealtimeTracking;
