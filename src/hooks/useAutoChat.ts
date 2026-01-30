import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentParties {
  shipmentId: string;
  shipmentNumber: string;
  generatorId: string;
  transporterId: string;
  recyclerId: string;
}

export const useAutoChat = () => {
  // Create or get a shipment chat room with all parties
  const createShipmentChatRoom = useCallback(async (parties: ShipmentParties) => {
    try {
      // Check if room already exists for this shipment
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('shipment_id', parties.shipmentId)
        .maybeSingle();

      if (existingRoom) {
        return existingRoom.id;
      }

      // Create new chat room for the shipment
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `شحنة #${parties.shipmentNumber}`,
          type: 'shipment',
          shipment_id: parties.shipmentId,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Get admin users from each organization
      const organizationIds = [parties.generatorId, parties.transporterId, parties.recyclerId];
      
      // Get all profiles from the involved organizations
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, organization_id')
        .in('organization_id', organizationIds)
        .eq('is_active', true);

      if (profiles && profiles.length > 0) {
        // Add all users from involved organizations as participants
        const participants = profiles.map(profile => ({
          room_id: room.id,
          user_id: profile.user_id,
        }));

        // Insert participants (using upsert to handle duplicates)
        await supabase
          .from('chat_participants')
          .upsert(participants, { 
            onConflict: 'room_id,user_id',
            ignoreDuplicates: true 
          });
      }

      // Send system message
      await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          sender_id: profiles?.[0]?.user_id || parties.generatorId,
          content: `تم إنشاء غرفة الدردشة للشحنة #${parties.shipmentNumber} تلقائياً. يمكن لجميع الأطراف التواصل هنا.`,
          message_type: 'system',
        });

      return room.id;
    } catch (error) {
      console.error('Error creating shipment chat room:', error);
      return null;
    }
  }, []);

  // Create direct chat between two organizations
  const createDirectChatRoom = useCallback(async (
    currentUserId: string,
    targetOrganizationId: string,
    targetOrganizationName: string
  ) => {
    try {
      // Get current user's organization
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', currentUserId)
        .single();

      if (!currentProfile?.organization_id) return null;

      // Check if direct room already exists between these organizations
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          chat_participants (
            user_id
          )
        `)
        .eq('type', 'direct');

      // Find existing room with users from both organizations
      for (const room of existingRooms || []) {
        const participantUserIds = room.chat_participants.map((p: any) => p.user_id);
        
        // Check if both organizations have users in this room
        const { data: participantProfiles } = await supabase
          .from('profiles')
          .select('organization_id')
          .in('user_id', participantUserIds);

        const orgIds = [...new Set(participantProfiles?.map(p => p.organization_id))];
        
        if (orgIds.includes(currentProfile.organization_id) && orgIds.includes(targetOrganizationId)) {
          return room.id;
        }
      }

      // Create new direct chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `محادثة مع ${targetOrganizationName}`,
          type: 'direct',
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add current user as participant
      await supabase
        .from('chat_participants')
        .insert({
          room_id: room.id,
          user_id: currentUserId,
        });

      // Get users from target organization and add them
      const { data: targetProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', targetOrganizationId)
        .eq('is_active', true);

      if (targetProfiles) {
        for (const profile of targetProfiles) {
          await supabase
            .from('chat_participants')
            .insert({
              room_id: room.id,
              user_id: profile.user_id,
            });
        }
      }

      return room.id;
    } catch (error) {
      console.error('Error creating direct chat room:', error);
      return null;
    }
  }, []);

  return {
    createShipmentChatRoom,
    createDirectChatRoom,
  };
};
