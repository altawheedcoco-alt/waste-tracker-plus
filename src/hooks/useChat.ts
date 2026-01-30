import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'group' | 'shipment';
  shipment_id: string | null;
  created_at: string;
  participants?: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    organization?: {
      name: string;
      organization_type: string;
    } | null;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Notification sound as base64 (short beep)
const NOTIFICATION_SOUND_URL = 'data:audio/mp3;base64,SUQzAwAAAAABEVRJVDIAAAAZAAAAQXVkaW8gTm90aWZpY2F0aW9uIFNvdW5kAAAA//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQxBEAAADSAAAAAAAAANIAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [soundEnabled]);

  // Fetch user's chat rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get rooms where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData?.length) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = participantData.map(p => p.room_id);

      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get last message and unread count for each room
      const roomsWithDetails = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get participants with last_read_at
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('*')
            .eq('room_id', room.id);

          // Get current user's last read time
          const userParticipant = participants?.find(p => p.user_id === user.id);
          const lastReadAt = userParticipant?.last_read_at;

          // Count unread messages
          let unreadCount = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .neq('sender_id', user.id)
              .gt('created_at', lastReadAt);
            unreadCount = count || 0;
          } else {
            // If never read, count all messages not from current user
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .neq('sender_id', user.id);
            unreadCount = count || 0;
          }

          return {
            ...room,
            type: room.type as ChatRoom['type'],
            lastMessage: lastMsg as ChatMessage | undefined,
            participants: participants as ChatParticipant[] | undefined,
            unreadCount,
          };
        })
      );

      setRooms(roomsWithDetails);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a room
  const fetchMessages = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      );

      const messagesWithSenders = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as ChatMessage['message_type'],
        sender: profileMap.get(msg.sender_id),
      }));

      setMessages(messagesWithSenders);

      // Update last read
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    messageType: ChatMessage['message_type'] = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user || !currentRoom) return;

    setSending(true);
    try {
      // For file/image messages, content will contain file metadata
      const messageContent = messageType === 'text' ? content : JSON.stringify({
        text: content,
        file_url: fileUrl,
        file_name: fileName,
      });

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: currentRoom.id,
          sender_id: user.id,
          content: messageContent,
          message_type: messageType,
        });

      if (error) throw error;

      // Update room's updated_at
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentRoom.id);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }, [user, currentRoom, toast]);

  // Upload file and send as message
  const sendFileMessage = useCallback(async (file: File) => {
    if (!user || !currentRoom) return;

    setSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${currentRoom.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);

      const isImage = file.type.startsWith('image/');
      const messageType: ChatMessage['message_type'] = isImage ? 'image' : 'file';

      await sendMessage(file.name, messageType, urlData.publicUrl, file.name);

    } catch (error: any) {
      console.error('Error sending file:', error);
      toast({
        title: 'خطأ',
        description: 'فشل رفع الملف',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }, [user, currentRoom, sendMessage, toast]);

  // Create a new chat room
  const createRoom = useCallback(async (
    name: string,
    type: ChatRoom['type'],
    participantIds: string[],
    shipmentId?: string
  ) => {
    if (!user) return null;

    try {
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          type,
          shipment_id: shipmentId || null,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as participant
      await supabase
        .from('chat_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== user.id) {
          await supabase
            .from('chat_participants')
            .insert({
              room_id: room.id,
              user_id: participantId,
            });
        }
      }

      await fetchRooms();
      return { ...room, type: room.type as ChatRoom['type'], unreadCount: 0 } as ChatRoom;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء المحادثة',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, fetchRooms, toast]);

  // Create or get general chat room
  const getOrCreateGeneralRoom = useCallback(async () => {
    if (!user) return null;

    // Check if general room exists
    const existingRoom = rooms.find(r => r.type === 'group' && r.name === 'المحادثة العامة');
    if (existingRoom) return existingRoom;

    // Create general room
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: 'المحادثة العامة',
        type: 'group',
      })
      .select()
      .single();

    if (error) {
      // Room might already exist, try to join
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('name', 'المحادثة العامة')
        .eq('type', 'group')
        .limit(1);

      if (existingRooms?.length) {
        const generalRoom = existingRooms[0];
        
        // Check if already a participant
        const { data: participation } = await supabase
          .from('chat_participants')
          .select('id')
          .eq('room_id', generalRoom.id)
          .eq('user_id', user.id)
          .single();

        if (!participation) {
          await supabase
            .from('chat_participants')
            .insert({
              room_id: generalRoom.id,
              user_id: user.id,
            });
        }

        await fetchRooms();
        return { ...generalRoom, type: generalRoom.type as ChatRoom['type'], unreadCount: 0 } as ChatRoom;
      }
      return null;
    }

    // Add user as participant
    await supabase
      .from('chat_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
      });

    await fetchRooms();
    return { ...room, type: room.type as ChatRoom['type'], unreadCount: 0 } as ChatRoom;
  }, [user, rooms, fetchRooms]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            sender: profile || undefined,
          }]);

          // Play notification sound for messages from others
          if (newMessage.sender_id !== user?.id) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoom, user?.id, playNotificationSound]);

  // Subscribe to all rooms for notification sounds (when not in current room)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('all-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Only play sound if:
          // 1. Message is not from current user
          // 2. Message is not from current room (already handled above)
          // 3. User is a participant in that room
          if (newMessage.sender_id !== user.id && newMessage.room_id !== currentRoom?.id) {
            const isParticipant = rooms.some(r => r.id === newMessage.room_id);
            if (isParticipant) {
              playNotificationSound();
              // Update unread count
              setRooms(prev => prev.map(room => 
                room.id === newMessage.room_id 
                  ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
                  : room
              ));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentRoom?.id, rooms, playNotificationSound]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Fetch messages when room changes
  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom.id);
    } else {
      setMessages([]);
    }
  }, [currentRoom, fetchMessages]);

  // Mark room as read when entering
  const markRoomAsRead = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      ));
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  }, [user]);

  // When current room changes, mark it as read
  useEffect(() => {
    if (currentRoom) {
      markRoomAsRead(currentRoom.id);
    }
  }, [currentRoom, markRoomAsRead]);

  return {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    loading,
    sending,
    sendMessage,
    sendFileMessage,
    createRoom,
    getOrCreateGeneralRoom,
    fetchRooms,
    fetchMessages,
    soundEnabled,
    setSoundEnabled,
    markRoomAsRead,
  };
};
