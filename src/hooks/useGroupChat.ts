import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description?: string;
  avatar_url?: string;
  organization_id?: string;
  created_by?: string;
  shipment_id?: string;
  last_message_at?: string;
  last_message_preview?: string;
  is_archived?: boolean;
  participant_count?: number;
  unread_count?: number;
}

export interface GroupMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  sender_organization_id?: string;
  reply_to_id?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  is_pinned?: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    organization_name?: string;
  };
}

export function useGroupChat() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch rooms the user participates in
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get rooms user is in
      const { data: participations } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (!participations?.length) return [];

      const roomIds = participations.map(p => p.room_id);

      const { data: roomsData, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get participant counts
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return { ...room, participant_count: count || 0 } as ChatRoom;
        })
      );

      return roomsWithCounts;
    },
    enabled: !!user,
  });

  // Fetch messages for a specific room
  const fetchRoomMessages = useCallback(async (roomId: string): Promise<GroupMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    // Get sender profiles
    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    let profileMap = new Map();
    
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .in('user_id', senderIds);

      if (profiles) {
        const orgIds = [...new Set(profiles.map(p => p.organization_id).filter(Boolean))];
        let orgMap = new Map();
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', orgIds);
          orgMap = new Map((orgs || []).map(o => [o.id, o.name]));
        }

        profileMap = new Map(profiles.map(p => [p.user_id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          organization_name: orgMap.get(p.organization_id),
        }]));
      }
    }

    return (data || []).map(msg => ({
      ...msg,
      sender: profileMap.get(msg.sender_id),
    })) as GroupMessage[];
  }, []);

  // Create group
  const createGroup = useMutation({
    mutationFn: async ({ name, description, memberUserIds }: {
      name: string;
      description?: string;
      memberUserIds: string[];
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          type: 'group',
          description,
          created_by: user.id,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as admin
      await supabase.from('chat_participants').insert({
        room_id: room.id,
        user_id: user.id,
        organization_id: organization.id,
        role: 'admin',
      });

      // Add members
      for (const memberId of memberUserIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', memberId)
          .single();

        await supabase.from('chat_participants').insert({
          room_id: room.id,
          user_id: memberId,
          organization_id: profile?.organization_id,
          role: 'member',
        });
      }

      // System message
      await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: user.id,
        content: `تم إنشاء المجموعة "${name}"`,
        message_type: 'system',
        sender_organization_id: organization.id,
      });

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      toast.success('تم إنشاء المجموعة بنجاح');
    },
    onError: () => toast.error('فشل إنشاء المجموعة'),
  });

  // Send message to room
  const sendRoomMessage = useCallback(async (
    roomId: string,
    content: string,
    messageType: string = 'text',
    fileUrl?: string,
    fileName?: string,
    replyToId?: string,
  ) => {
    if (!user || !organization) return;

    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      sender_organization_id: organization.id,
      content,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      reply_to_id: replyToId,
    });

    if (error) throw error;
  }, [user, organization]);

  // Send broadcast
  const sendBroadcast = useMutation({
    mutationFn: async ({ message, targetType, targetOrgIds }: {
      message: string;
      targetType: 'all' | 'generators' | 'transporters' | 'recyclers' | 'custom';
      targetOrgIds?: string[];
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');

      let orgFilter: any = supabase.from('organizations').select('id, name');
      
      if (targetType === 'custom' && targetOrgIds?.length) {
        orgFilter = orgFilter.in('id', targetOrgIds);
      } else if (targetType !== 'all') {
        orgFilter = orgFilter.eq('organization_type', targetType === 'generators' ? 'generator' : targetType === 'transporters' ? 'transporter' : 'recycler');
      }

      const { data: targetOrgs } = await orgFilter;
      if (!targetOrgs?.length) throw new Error('لا توجد جهات مستهدفة');

      // Send direct message to each org
      const results = [];
      for (const org of targetOrgs) {
        if (org.id === organization.id) continue;
        
        const { error } = await supabase.from('direct_messages').insert({
          sender_id: user.id,
          sender_organization_id: organization.id,
          receiver_organization_id: org.id,
          content: `📢 بث رسمي: ${message}`,
          message_type: 'text',
        });

        results.push({ org_id: org.id, success: !error });
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`تم إرسال البث لـ ${successCount} جهة`);
    },
    onError: () => toast.error('فشل إرسال البث'),
  });

  return {
    rooms,
    roomsLoading,
    fetchRoomMessages,
    createGroup: createGroup.mutate,
    isCreatingGroup: createGroup.isPending,
    sendRoomMessage,
    sendBroadcast: sendBroadcast.mutate,
    isSendingBroadcast: sendBroadcast.isPending,
  };
}
