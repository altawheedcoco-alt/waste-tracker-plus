import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { TrackingMode, TrackingState, GeofenceZone } from '@/types/tracking';
import { getTabChannelName } from '@/lib/tabSession';

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

      

      // Auto-create declarations and receipts based on status (all parties)
      try {
        const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration, autoCreateTransporterDeclaration, autoCreateDisposalReceptionDeclaration, autoCreateDisposalCertificate, autoCreateRecyclingCertificate, autoCreateDriverConfirmation, autoCreateTransporterDeliveryDeclaration, autoCreateDriverDeliveryDeclaration } = await import('@/utils/autoDeclarationCreator');
        const { autoCreateReceipt } = await import('@/utils/autoReceiptCreator');
        const { withTagline, SHIPMENT_STATUS_LABELS } = await import('@/utils/platformTaglines');

        // Fetch shipment details for org IDs
        const { data: shipmentData } = await supabase
          .from('shipments')
          .select('generator_id, transporter_id, recycler_id, shipment_number')
          .eq('id', shipmentId)
          .single();

        if (shipmentData) {
          // === Send status change notifications to all parties ===
          const statusLabel = SHIPMENT_STATUS_LABELS[newStatus] || newStatus;
          const allOrgIds = [shipmentData.generator_id, shipmentData.transporter_id, shipmentData.recycler_id].filter(Boolean);
          
          try {
            const { data: allUsers } = await supabase
              .from('profiles')
              .select('user_id, organization_id')
              .in('organization_id', allOrgIds)
              .limit(50);

            if (allUsers && allUsers.length > 0) {
              const userIds = allUsers
                .filter((u: any) => u.user_id !== user.id)
                .map((u: any) => u.user_id);

              if (userIds.length > 0) {
                const { sendBulkDualNotification } = await import('@/services/unifiedNotifier');
                await sendBulkDualNotification({
                  user_ids: userIds,
                  title: `📦 تحديث حالة الشحنة ${shipmentData.shipment_number}`,
                  message: withTagline(`تم تغيير حالة الشحنة ${shipmentData.shipment_number} إلى: ${statusLabel}`),
                  type: 'status_update',
                  reference_id: shipmentId,
                  reference_type: 'shipment',
                });
              }
            }
          } catch (notifErr) {
            console.error('[RealtimeTracking] Status notification failed (non-blocking):', notifErr);
          }

          // Generator declaration on approved/registered
          if (['approved', 'registered'].includes(newStatus) && shipmentData.generator_id) {
            await autoCreateGeneratorDeclaration(shipmentId, shipmentData.generator_id, user.id);
          }

          // Driver confirmation on picked_up/loading
          if (['picked_up', 'loading'].includes(newStatus) && shipmentData.transporter_id) {
            await autoCreateDriverConfirmation(shipmentId, shipmentData.transporter_id, user.id);
          }

          // Transporter declaration + receipt on in_transit
          if (newStatus === 'in_transit' && shipmentData.transporter_id) {
            await autoCreateTransporterDeclaration(shipmentId, shipmentData.transporter_id, user.id);
            await autoCreateReceipt(shipmentId, shipmentData.transporter_id, user.id);
          }

          // Transporter & Driver delivery declarations on delivered
          if (['delivered', 'confirmed'].includes(newStatus) && shipmentData.transporter_id) {
            await autoCreateTransporterDeliveryDeclaration(shipmentId, shipmentData.transporter_id, user.id);
            await autoCreateDriverDeliveryDeclaration(shipmentId, shipmentData.transporter_id, user.id);
          }

          // Recycler declaration on delivered/confirmed
          if (['delivered', 'confirmed'].includes(newStatus) && shipmentData.recycler_id) {
            await autoCreateRecyclerDeclaration(shipmentId, shipmentData.recycler_id, user.id);
          }

          // Receipt on delivered
          if (newStatus === 'delivered' && shipmentData.transporter_id) {
            await autoCreateReceipt(shipmentId, shipmentData.transporter_id, user.id);
          }

          // Disposal reception on delivered
          if (['delivered', 'confirmed'].includes(newStatus) && shipmentData.recycler_id) {
            await autoCreateDisposalReceptionDeclaration(shipmentId, shipmentData.recycler_id, user.id);
          }

          // Disposal certificate on disposal stages
          if (['disposal_treatment', 'disposal_final', 'disposal_completed'].includes(newStatus) && shipmentData.recycler_id) {
            await autoCreateDisposalCertificate(shipmentId, shipmentData.recycler_id, user.id);
          }

          // Recycling certificate on recycling complete
          if (['recycling_complete', 'processing_complete', 'completed'].includes(newStatus) && shipmentData.recycler_id) {
            await autoCreateRecyclingCertificate(shipmentId, shipmentData.recycler_id, user.id);
          }
        }
      } catch (autoErr) {
        console.error('[RealtimeTracking] Auto document creation failed (non-blocking):', autoErr);
      }

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

    // Handle pickup zone - auto transition to in_transit
    if (pickupZone && (currentStatus === 'approved' || currentStatus === 'new')) {
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

    // Handle delivery zone - auto transition to delivered AND confirmed together
    if (deliveryZone && (currentStatus === 'in_transit' || currentStatus === 'approved')) {
      const inDelivery = isInGeofence(location, deliveryZone);
      
      if (inDelivery && !hasEnteredDeliveryRef.current) {
        hasEnteredDeliveryRef.current = true;
        // Auto change to delivered first
        await updateStatus('delivered', 'السائق وصل لمنطقة التسليم - تم التسليم تلقائياً', latitude, longitude);
        
        // Then immediately confirm (complete the shipment)
        setTimeout(async () => {
          await updateStatus('confirmed', 'تم تأكيد التسليم تلقائياً - الشحنة مكتملة', latitude, longitude);
        }, 1000); // Small delay to ensure proper ordering
      }
    }
  }, [enabled, state.autoStatusChanges, pickupCoords, deliveryCoords, currentStatus, zones, isInGeofence, updateStatus, shipmentId, user?.id]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!enabled || !driverId) return;

    const channel = supabase
      .channel(getTabChannelName(`realtime-tracking-${shipmentId}`))
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
