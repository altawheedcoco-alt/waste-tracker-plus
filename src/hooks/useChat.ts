import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { getCachedProfiles, getCachedProfile } from '@/lib/profileCache';
import { initReadSync, broadcastRead, onReadSync, destroyReadSync } from '@/lib/readSync';
import {
  createOptimisticMessage,
  confirmMessage,
  failMessage,
  getPendingMessages,
  type MessageStatus,
} from '@/lib/optimisticMessages';
import { emitChatSync, onChatSync } from '@/lib/chatSyncBus';
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
  // Optimistic message fields
  _tempId?: string;
  _status?: MessageStatus;
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
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

  // Initialize cross-tab read sync
  useEffect(() => {
    if (!organization?.id) return;
    initReadSync(organization.id);

    const unsub = onReadSync((messageIds) => {
      // Update local messages when another tab marks as read
      setMessages(prev => prev.map(m =>
        messageIds.includes(m.id) ? { ...m, is_read: true } : m
      ));
    });

    return () => {
      unsub();
      destroyReadSync();
    };
  }, [organization?.id]);

  // Listen for cross-widget chat sync events
  useEffect(() => {
    if (!organization?.id) return;
    return onChatSync((event) => {
      if (event.type === 'message-sent' && event.partnerOrgId === currentPartnerId) {
        // Another widget sent a message to the same partner - refresh
        if (currentPartnerId) {
          fetchMessagesForPartner(currentPartnerId);
        }
      }
    });
  }, [organization?.id, currentPartnerId]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [soundEnabled]);

  // Fetch messages with profile caching
  const fetchMessagesForPartner = useCallback(async (partnerOrgId: string) => {
    if (!user || !organization) return;
    
    setLoading(true);
    setCurrentPartnerId(partnerOrgId);
    
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerOrgId}),and(sender_organization_id.eq.${partnerOrgId},receiver_organization_id.eq.${organization.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter expired messages
      const validData = (data || []).filter(m => {
        if (m.expires_at && new Date(m.expires_at) < new Date()) return false;
        return true;
      });

      // Batch profile fetch using cache
      const senderIds = [...new Set(validData.map(m => m.sender_id))];
      const profileMap = await getCachedProfiles(senderIds);

      const messagesWithSenders: ChatMessage[] = validData.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_organization_id: msg.sender_organization_id,
        receiver_organization_id: msg.receiver_organization_id,
        content: msg.content,
        message_type: (msg.message_type || 'text') as ChatMessage['message_type'],
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: profileMap.get(msg.sender_id) 
          ? { full_name: profileMap.get(msg.sender_id)!.full_name, avatar_url: profileMap.get(msg.sender_id)!.avatar_url }
          : undefined,
        _status: msg.is_read ? 'read' : 'delivered',
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, organization]);

  // Unread count
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
    } catch {
      return 0;
    }
  }, [user, organization]);

  // Mark as read + broadcast to other tabs
  const markPartnerAsRead = useCallback(async (partnerOrgId: string) => {
    if (!user || !organization) return;
    try {
      const { data: unread } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('sender_organization_id', partnerOrgId)
        .eq('receiver_organization_id', organization.id)
        .eq('is_read', false);

      if (!unread?.length) return;

      const ids = unread.map(m => m.id);
      
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .in('id', ids);

      // Broadcast to other tabs/devices
      broadcastRead(organization.id, ids);

      // Update local state
      setMessages(prev => prev.map(m =>
        ids.includes(m.id) ? { ...m, is_read: true, _status: 'read' } : m
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user, organization]);

  // Optimistic send message
  const sendMessage = useCallback(async (
    content: string, 
    receiverOrgId: string,
    messageType: ChatMessage['message_type'] = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user || !organization) return;

    setSending(true);

    // Create optimistic message for instant display
    const optimistic = createOptimisticMessage(
      messageType === 'text' ? content : JSON.stringify({ text: content, file_url: fileUrl, file_name: fileName }),
      messageType,
      user.id,
      organization.id,
      receiverOrgId,
      fileUrl,
      fileName,
    );

    const optimisticChatMsg: ChatMessage = {
      id: optimistic.tempId,
      sender_id: user.id,
      sender_organization_id: organization.id,
      receiver_organization_id: receiverOrgId,
      content: optimistic.content,
      message_type: messageType,
      created_at: optimistic.createdAt,
      is_read: false,
      sender: { full_name: user.user_metadata?.full_name || 'أنت', avatar_url: null },
      _tempId: optimistic.tempId,
      _status: 'sending',
    };

    // Add to UI immediately - don't wait for profile fetch
    if (currentPartnerId === receiverOrgId) {
      setMessages(prev => [...prev, optimisticChatMsg]);
    }

    // Emit sync event for other widgets
    emitChatSync({ type: 'message-sent', partnerOrgId: receiverOrgId, message: optimisticChatMsg });

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

      // Confirm optimistic message
      confirmMessage(optimistic.tempId, newMessage.id);

      // Replace optimistic with real message
      if (currentPartnerId === receiverOrgId) {
        setMessages(prev => prev.map(m =>
          m._tempId === optimistic.tempId
            ? { ...m, id: newMessage.id, _tempId: undefined, _status: 'sent', created_at: newMessage.created_at }
            : m
        ));
      }

      // Send server-side push notification to receiver org members
      try {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', receiverOrgId)
          .eq('status', 'active');

        const recipientIds = (members || [])
          .map((m: any) => m.user_id)
          .filter((id: string) => id !== user.id);

        if (recipientIds.length > 0) {
          let pushBody = content;
          if (messageType === 'image') pushBody = '📷 صورة';
          else if (messageType === 'file') pushBody = '📎 ملف';
          else {
            try { pushBody = JSON.parse(content).text || content; } catch { /* use raw */ }
          }

          const senderName = user.user_metadata?.full_name || 'مستخدم';
          supabase.functions.invoke('send-push', {
            body: {
              user_ids: recipientIds,
              title: `💬 رسالة من ${senderName}`,
              body: pushBody,
              tag: `msg-${newMessage.id}`,
              data: { url: '/dashboard/chat', type: 'message' },
            },
          }).catch(err => console.warn('[Chat] Push notification failed:', err));
        }
      } catch (pushErr) {
        console.warn('[Chat] Push lookup failed:', pushErr);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Mark as failed
      const shouldRetry = failMessage(optimistic.tempId);
      
      if (shouldRetry) {
        // Auto-retry
        setTimeout(() => sendMessage(content, receiverOrgId, messageType, fileUrl, fileName), 2000);
      } else {
        // Mark as failed in UI
        setMessages(prev => prev.map(m =>
          m._tempId === optimistic.tempId ? { ...m, _status: 'failed' } : m
        ));
        toast({
          title: 'خطأ',
          description: 'فشل إرسال الرسالة',
          variant: 'destructive',
        });
      }
    } finally {
      setSending(false);
    }
  }, [user, organization, currentPartnerId, toast]);

  // Upload file with progress
  const sendFileMessage = useCallback(async (file: File, receiverOrgId: string) => {
    if (!user || !organization) return;

    setSending(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${organization.id}/${receiverOrgId}/${fileName}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/organization-documents/${filePath}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(file);
      });

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

  // Realtime subscription with reconnection resilience
  useEffect(() => {
    if (!currentPartnerId || !organization || !user) return;

    const channel = supabase
      .channel(getTabChannelName(`dm-${currentPartnerId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          const isRelevant = 
            (newMessage.sender_organization_id === organization.id && newMessage.receiver_organization_id === currentPartnerId) ||
            (newMessage.sender_organization_id === currentPartnerId && newMessage.receiver_organization_id === organization.id);

          if (!isRelevant) return;

          // Skip if expired
          if (newMessage.expires_at && new Date(newMessage.expires_at) < new Date()) return;

          // Skip if already exists (optimistic or duplicate)
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id || (m._tempId && prev.some(x => x.id === newMessage.id)))) {
              return prev;
            }

            // Get profile from cache (sync check)
            const addMessage = async () => {
              const profile = await getCachedProfile(newMessage.sender_id);
              
              const formatted: ChatMessage = {
                id: newMessage.id,
                sender_id: newMessage.sender_id,
                sender_organization_id: newMessage.sender_organization_id,
                receiver_organization_id: newMessage.receiver_organization_id,
                content: newMessage.content,
                message_type: newMessage.message_type as ChatMessage['message_type'],
                created_at: newMessage.created_at,
                is_read: newMessage.is_read,
                sender: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
                _status: 'delivered',
              };

              setMessages(p => {
                if (p.some(m => m.id === newMessage.id)) return p;
                return [...p, formatted];
              });

              // Play sound + auto-mark read for incoming
              if (newMessage.sender_id !== user.id) {
                playNotificationSound();
                await supabase
                  .from('direct_messages')
                  .update({ is_read: true })
                  .eq('id', newMessage.id);
                broadcastRead(organization.id, [newMessage.id]);
              }
            };

            addMessage();
            return prev;
          });
        }
      )
      // Listen for read status updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.is_read) {
            setMessages(prev => prev.map(m =>
              m.id === updated.id ? { ...m, is_read: true, _status: 'read' } : m
            ));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Auto-reconnect after error
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Reconnecting realtime channel...');
            channel.subscribe();
          }, 3000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [currentPartnerId, organization, user, playNotificationSound]);

  // Global notification subscription
  useEffect(() => {
    if (!user || !organization) return;

    const channel = supabase
      .channel(getTabChannelName('global-dm-notify'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id !== user.id && msg.sender_organization_id !== currentPartnerId) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
