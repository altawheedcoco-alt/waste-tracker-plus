import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { onActionToChat, actionToMessage, type ActionToChatEvent } from '@/lib/actionToChatBus';

/**
 * Hook to listen for action events and automatically send system messages
 * to the relevant chat conversation
 */
export function useActionToChat() {
  const { user, organization } = useAuth();

  const handleAction = useCallback(async (event: ActionToChatEvent) => {
    if (!user || !organization) return;

    const message = actionToMessage(event);
    const targetOrgId = event.targetOrgId;

    if (!targetOrgId) return;

    try {
      // Send as a direct message with system type
      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        sender_organization_id: organization.id,
        receiver_organization_id: targetOrgId,
        content: message,
        message_type: 'system',
        metadata: {
          action_type: event.type,
          resource_id: event.resourceId,
          resource_type: event.resourceType,
          auto_generated: true,
        },
      });

      // Also send to operation room if linked to a shipment
      if (event.resourceType === 'shipment' || event.metadata?.shipmentId) {
        const shipmentId = event.resourceType === 'shipment' ? event.resourceId : event.metadata?.shipmentId;
        
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('shipment_id', shipmentId)
          .eq('type', 'operation_room')
          .limit(1)
          .single();

        if (room) {
          await supabase.from('chat_messages').insert({
            room_id: room.id,
            sender_id: user.id,
            content: message,
            message_type: 'system',
            sender_organization_id: organization.id,
            metadata: {
              action_type: event.type,
              resource_id: event.resourceId,
              resource_type: event.resourceType,
              auto_generated: true,
            },
          });
        }
      }
    } catch (err) {
      console.error('Action-to-Chat error:', err);
    }
  }, [user, organization]);

  useEffect(() => {
    const unsubscribe = onActionToChat(handleAction);
    return unsubscribe;
  }, [handleAction]);
}
