import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OperationRoom {
  id: string;
  name: string;
  type: string;
  shipment_id: string | null;
  description: string | null;
  created_by: string | null;
  organization_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_archived: boolean | null;
  metadata: any;
  created_at: string;
  participant_count?: number;
  shipment_number?: string;
}

export function useOperationRooms() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['operation-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: participations } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (!participations?.length) return [];

      const roomIds = participations.map(p => p.room_id);

      const { data: roomsData } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .eq('type', 'operation_room')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (!roomsData?.length) return [];

      // Get participant counts + shipment numbers
      const enriched = await Promise.all(
        roomsData.map(async (room) => {
          const { count } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          let shipment_number: string | undefined;
          if (room.shipment_id) {
            const { data: shipment } = await supabase
              .from('shipments')
              .select('shipment_number')
              .eq('id', room.shipment_id)
              .single();
            shipment_number = shipment?.shipment_number;
          }

          return { ...room, participant_count: count || 0, shipment_number } as OperationRoom;
        })
      );

      return enriched;
    },
    enabled: !!user,
  });

  const createRoom = useMutation({
    mutationFn: async ({ shipmentId, shipmentNumber, parties }: {
      shipmentId: string;
      shipmentNumber: string;
      parties: { userId: string; orgId?: string; role?: string }[];
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');

      // Check if room already exists for this shipment
      const { data: existing } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('shipment_id', shipmentId)
        .eq('type', 'operation_room')
        .limit(1);

      if (existing?.length) return existing[0];

      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: `غرفة عمليات ${shipmentNumber}`,
          type: 'operation_room',
          shipment_id: shipmentId,
          created_by: user.id,
          organization_id: organization.id,
          description: `غرفة عمليات مرتبطة بالشحنة ${shipmentNumber}`,
          metadata: { shipment_number: shipmentNumber },
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator
      await supabase.from('chat_participants').insert({
        room_id: room.id,
        user_id: user.id,
        organization_id: organization.id,
        role: 'admin',
      });

      // Add parties
      for (const party of parties) {
        if (party.userId === user.id) continue;
        await supabase.from('chat_participants').insert({
          room_id: room.id,
          user_id: party.userId,
          organization_id: party.orgId,
          role: party.role || 'member',
        });
      }

      // System message
      await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: user.id,
        content: `🏗️ تم إنشاء غرفة عمليات للشحنة ${shipmentNumber}`,
        message_type: 'system',
        sender_organization_id: organization.id,
      });

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation-rooms'] });
      toast.success('تم إنشاء غرفة العمليات');
    },
    onError: () => toast.error('فشل إنشاء غرفة العمليات'),
  });

  const sendSystemMessage = useCallback(async (roomId: string, content: string) => {
    if (!user || !organization) return;
    await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      content,
      message_type: 'system',
      sender_organization_id: organization.id,
    });
  }, [user, organization]);

  return {
    rooms,
    isLoading,
    createRoom: createRoom.mutate,
    isCreating: createRoom.isPending,
    sendSystemMessage,
  };
}
