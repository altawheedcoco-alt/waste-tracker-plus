/**
 * useWhatsAppNotifications - Hook for triggering WhatsApp notifications from frontend
 * Used as a supplement to the database triggers for manual/UI-driven events
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppEventPayload {
  event_type: string;
  organization_id?: string;
  shipment_id?: string;
  shipment_number?: string;
  phone?: string;
  customer_phone?: string;
  generator_org_id?: string;
  transporter_org_id?: string;
  recycler_org_id?: string;
  driver_name?: string;
  driver_phone?: string;
  otp_code?: string;
  extra?: Record<string, any>;
}

export function useWhatsAppNotifications() {
  const triggerEvent = useCallback(async (payload: WhatsAppEventPayload) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-event', {
        body: payload,
      });
      if (error) {
        console.error('[WhatsApp] Event trigger error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      console.error('[WhatsApp] Event trigger exception:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const sendDirect = useCallback(async (phone: string, message: string, orgId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send',
          to_phone: phone,
          message_text: message,
          organization_id: orgId,
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const notifyShipmentCreated = useCallback((shipmentData: {
    shipment_id: string;
    shipment_number: string;
    generator_org_id?: string;
    transporter_org_id?: string;
    recycler_org_id?: string;
  }) => triggerEvent({ event_type: 'shipment_created', ...shipmentData }), [triggerEvent]);

  const notifyDriverAssigned = useCallback((data: {
    shipment_id: string;
    shipment_number: string;
    driver_name: string;
    driver_phone: string;
    generator_org_id?: string;
    transporter_org_id?: string;
    recycler_org_id?: string;
    extra?: Record<string, any>;
  }) => triggerEvent({ event_type: 'driver_assigned', ...data }), [triggerEvent]);

  const notifyPaymentReceived = useCallback((data: {
    organization_id: string;
    extra: { amount: number; reference: string };
  }) => triggerEvent({ event_type: 'payment_received', ...data }), [triggerEvent]);

  const notifyEmergency = useCallback((data: {
    organization_id: string;
    extra: { message: string };
  }) => triggerEvent({ event_type: 'emergency_alert', ...data }), [triggerEvent]);

  return {
    triggerEvent,
    sendDirect,
    notifyShipmentCreated,
    notifyDriverAssigned,
    notifyPaymentReceived,
    notifyEmergency,
  };
}
