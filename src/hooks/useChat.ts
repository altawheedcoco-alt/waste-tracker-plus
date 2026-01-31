import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_organization_id: string | null;
  receiver_organization_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';
  file_url?: string;
  file_name?: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Notification sound as base64 (short beep)
const NOTIFICATION_SOUND_URL = 'data:audio/mp3;base64,SUQzAwAAAAABEVRJVDIAAAAZAAAAQXVkaW8gTm90aWZpY2F0aW9uIFNvdW5kAAAA//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQxBEAAADSAAAAAAAAANIAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

export const useChat = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);
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

  // Fetch messages for a specific partner (organization)
  const fetchMessagesForPartner = useCallback(async (partnerOrgId: string) => {
    if (!user || !organization) return;
    
    setLoading(true);
    setCurrentPartnerId(partnerOrgId);
    
    try {
      // Query messages between current org and partner org
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerOrgId}),and(sender_organization_id.eq.${partnerOrgId},receiver_organization_id.eq.${organization.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      
      let profileMap = new Map();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', senderIds);

        profileMap = new Map(
          (profiles || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }

      const messagesWithSenders: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_organization_id: msg.sender_organization_id,
        receiver_organization_id: msg.receiver_organization_id,
        content: msg.content,
        message_type: (msg.message_type || 'text') as ChatMessage['message_type'],
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: profileMap.get(msg.sender_id),
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, organization]);

  // Get unread count for a partner
  const getPartnerUnreadCount = useCallback(async (partnerOrgId: string): Promise<number> => {
    if (!user || !organization) return 0;

    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_organization_id', partnerOrgId)
        .eq('receiver_organization_id', organization.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }, [user, organization]);

  // Mark messages from partner as read
  const markPartnerAsRead = useCallback(async (partnerOrgId: string) => {
    if (!user || !organization) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_organization_id', partnerOrgId)
        .eq('receiver_organization_id', organization.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user, organization]);

  // Send a message to a partner
  const sendMessage = useCallback(async (
    content: string, 
    receiverOrgId: string,
    messageType: ChatMessage['message_type'] = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user || !organization) return;

    setSending(true);
    try {
      const messageContent = messageType === 'text' ? content : JSON.stringify({
        text: content,
        file_url: fileUrl,
        file_name: fileName,
      });

      const { data: newMessage, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          sender_organization_id: organization.id,
          receiver_organization_id: receiverOrgId,
          content: messageContent,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages if this is the current conversation
      if (currentPartnerId === receiverOrgId && newMessage) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const formattedMessage: ChatMessage = {
          id: newMessage.id,
          sender_id: newMessage.sender_id,
          sender_organization_id: newMessage.sender_organization_id,
          receiver_organization_id: newMessage.receiver_organization_id,
          content: newMessage.content,
          message_type: newMessage.message_type as ChatMessage['message_type'],
          created_at: newMessage.created_at,
          is_read: newMessage.is_read,
          sender: profile || undefined,
        };

        setMessages(prev => [...prev, formattedMessage]);
      }
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
  }, [user, organization, currentPartnerId, toast]);

  // Upload file and send as message with progress tracking
  const sendFileMessage = useCallback(async (file: File, receiverOrgId: string) => {
    if (!user || !organization) return;

    setSending(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${organization.id}/${receiverOrgId}/${fileName}`;

      // Simulate upload progress using XMLHttpRequest for real progress tracking
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const formData = new FormData();
      formData.append('', file);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/organization-documents/${filePath}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(file);
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);

      const isImage = file.type.startsWith('image/');
      const messageType: ChatMessage['message_type'] = isImage ? 'image' : 'file';

      await sendMessage(file.name, receiverOrgId, messageType, urlData.publicUrl, file.name);
    } catch (error: any) {
      console.error('Error sending file:', error);
      toast({
        title: 'خطأ',
        description: 'فشل رفع الملف',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  }, [user, organization, sendMessage, toast]);

  // Subscribe to realtime messages for current partner
  useEffect(() => {
    if (!currentPartnerId || !organization) return;

    const channel = supabase
      .channel(`direct-messages-${currentPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Check if this message is for the current conversation
          const isRelevant = 
            (newMessage.sender_organization_id === organization.id && newMessage.receiver_organization_id === currentPartnerId) ||
            (newMessage.sender_organization_id === currentPartnerId && newMessage.receiver_organization_id === organization.id);

          if (!isRelevant) return;

          // Don't add if already exists
          if (messages.some(m => m.id === newMessage.id)) return;

          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const formattedMessage: ChatMessage = {
            id: newMessage.id,
            sender_id: newMessage.sender_id,
            sender_organization_id: newMessage.sender_organization_id,
            receiver_organization_id: newMessage.receiver_organization_id,
            content: newMessage.content,
            message_type: newMessage.message_type as ChatMessage['message_type'],
            created_at: newMessage.created_at,
            is_read: newMessage.is_read,
            sender: profile || undefined,
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, formattedMessage];
          });

          // Play notification sound for messages from others
          if (newMessage.sender_id !== user?.id) {
            playNotificationSound();
            // Mark as read immediately if viewing
            await supabase
              .from('direct_messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPartnerId, organization, user?.id, messages, playNotificationSound]);

  // Subscribe to all new messages for notification sounds
  useEffect(() => {
    if (!user || !organization) return;

    const channel = supabase
      .channel('all-direct-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Only play sound if message is not from current user and not in current conversation
          if (newMessage.sender_id !== user.id && newMessage.sender_organization_id !== currentPartnerId) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, organization, currentPartnerId, playNotificationSound]);

  return {
    messages,
    loading,
    sending,
    uploadProgress,
    sendMessage,
    sendFileMessage,
    fetchMessagesForPartner,
    getPartnerUnreadCount,
    markPartnerAsRead,
    soundEnabled,
    setSoundEnabled,
    currentPartnerId,
  };
};
