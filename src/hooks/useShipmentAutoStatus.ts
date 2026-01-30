import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapToDbStatus, mapLegacyStatus } from '@/lib/shipmentStatusConfig';

interface ShipmentForAutoStatus {
  id: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  delivered_at: string | null;
}

// Configuration for auto-status timers
const AUTO_STATUS_CONFIG = {
  autoReceiveMinutes: 2, // Auto-receive after 2 minutes if not received
  autoConfirmHours: 6, // Auto-confirm after 6 hours from shipment creation
};

export const useShipmentAutoStatus = (
  shipments: ShipmentForAutoStatus[],
  onStatusUpdate: () => void,
  enabled: boolean = true
) => {
  const [countdowns, setCountdowns] = useState<Record<string, { minutes: number; seconds: number }>>({});

  const checkAndUpdateStatus = useCallback(async () => {
    if (!enabled || shipments.length === 0) return;

    const now = new Date();

    for (const shipment of shipments) {
      // Map to new status for comparison
      const mappedStatus = mapLegacyStatus(shipment.status);
      
      // Skip completed shipments
      if (mappedStatus === 'completed') continue;

      const createdAt = new Date(shipment.created_at);
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const hoursSinceCreation = minutesSinceCreation / 60;

      // Auto-transition to 'delivered' after 2 minutes if still in transit/delivering
      if (
        (shipment.status === 'in_transit' || mappedStatus === 'in_transit' || mappedStatus === 'delivering') &&
        minutesSinceCreation >= AUTO_STATUS_CONFIG.autoReceiveMinutes
      ) {
        try {
          const { error } = await supabase
            .from('shipments')
            .update({
              status: 'delivered', // Use DB enum value
              delivered_at: now.toISOString(),
            })
            .eq('id', shipment.id);

          if (error) throw error;

          // Log the auto status change
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profile) {
              await supabase.from('shipment_logs').insert({
                shipment_id: shipment.id,
                status: 'delivered' as const,
                notes: `تم التحديث تلقائياً بعد ${AUTO_STATUS_CONFIG.autoReceiveMinutes} دقيقة`,
                changed_by: profile.id,
              });
            }
          }

          toast.success(`تم تحديث حالة الشحنة تلقائياً إلى "تم التسليم" بعد ${AUTO_STATUS_CONFIG.autoReceiveMinutes} دقيقة`);
          onStatusUpdate();
        } catch (error) {
          console.error('Error auto-updating shipment status:', error);
        }
      }

      // Auto-confirm after 6 hours from shipment creation
      if (
        (shipment.status === 'delivered' || mappedStatus === 'received') &&
        hoursSinceCreation >= AUTO_STATUS_CONFIG.autoConfirmHours
      ) {
        try {
          const { error } = await supabase
            .from('shipments')
            .update({
              status: 'confirmed', // Use DB enum value
              confirmed_at: now.toISOString(),
            })
            .eq('id', shipment.id);

          if (error) throw error;

          // Log the auto confirmation
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profile) {
              await supabase.from('shipment_logs').insert({
                shipment_id: shipment.id,
                status: 'confirmed' as const,
                notes: `تم التأكيد تلقائياً بعد ${AUTO_STATUS_CONFIG.autoConfirmHours} ساعات من إنشاء الشحنة`,
                changed_by: profile.id,
              });
            }
          }

          toast.success(`تم تأكيد الشحنة تلقائياً بعد ${AUTO_STATUS_CONFIG.autoConfirmHours} ساعات من إنشاء الشحنة`);
          onStatusUpdate();
        } catch (error) {
          console.error('Error auto-confirming shipment:', error);
        }
      }
    }
  }, [shipments, onStatusUpdate, enabled]);

  // Calculate countdowns for each shipment
  const updateCountdowns = useCallback(() => {
    const now = new Date();
    const newCountdowns: Record<string, { minutes: number; seconds: number }> = {};

    for (const shipment of shipments) {
      const mappedStatus = mapLegacyStatus(shipment.status);
      if (mappedStatus === 'completed') continue;

      const createdAt = new Date(shipment.created_at);
      
      if (shipment.status === 'in_transit' || mappedStatus === 'in_transit' || mappedStatus === 'delivering') {
        // Calculate time until auto-receive
        const autoReceiveTime = new Date(createdAt.getTime() + AUTO_STATUS_CONFIG.autoReceiveMinutes * 60 * 1000);
        const remainingMs = autoReceiveTime.getTime() - now.getTime();
        
        if (remainingMs > 0) {
          const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
          const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
          newCountdowns[shipment.id] = { minutes: remainingMinutes, seconds: remainingSeconds };
        }
      } else if (shipment.status === 'delivered' || mappedStatus === 'received') {
        // Calculate time until auto-confirm
        const autoConfirmTime = new Date(createdAt.getTime() + AUTO_STATUS_CONFIG.autoConfirmHours * 60 * 60 * 1000);
        const remainingMs = autoConfirmTime.getTime() - now.getTime();
        
        if (remainingMs > 0) {
          const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
          const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
          newCountdowns[shipment.id] = { minutes: remainingMinutes, seconds: remainingSeconds };
        }
      }
    }

    setCountdowns(newCountdowns);
  }, [shipments]);

  // Check every 10 seconds for auto status updates and countdown updates
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkAndUpdateStatus();
    updateCountdowns();

    // Set up intervals for periodic checks
    const statusInterval = setInterval(checkAndUpdateStatus, 10000); // Check every 10 seconds
    const countdownInterval = setInterval(updateCountdowns, 1000); // Update countdown every second

    return () => {
      clearInterval(statusInterval);
      clearInterval(countdownInterval);
    };
  }, [checkAndUpdateStatus, updateCountdowns, enabled]);

  // Manual trigger function
  const triggerStatusCheck = useCallback(() => {
    checkAndUpdateStatus();
  }, [checkAndUpdateStatus]);

  return { triggerStatusCheck, countdowns };
};

export default useShipmentAutoStatus;
