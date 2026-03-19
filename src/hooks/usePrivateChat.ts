import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { encryptMessage, decryptMessage } from '@/lib/e2e';
import { useE2EKeys } from './useE2EKeys';
import { toast } from 'sonner';

export interface PrivateConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  is_blocked_by_1: boolean;
  is_blocked_by_2: boolean;
  is_muted_by_1: boolean;
  is_muted_by_2: boolean;
  created_at: string;
  partner?: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    organization_id?: string | null;
    organization_name?: string;
  };
  lastDecryptedPreview?: string;
  last_message_type?: string;
  last_message_status?: string;
  last_message_sender_id?: string;
  unread_count?: number;
}

export interface DecryptedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  status: string;
  reply_to_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

type MessageForDecryption = {
  sender_id: string;
  encrypted_content: string | null;
  encrypted_content_for_sender: string | null;
  iv: string;
  message_type?: string | null;
  file_name?: string | null;
  content_preview?: string | null;
  is_deleted?: boolean | null;
};

export function usePrivateChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getPublicKey, getPublicKeys } = useE2EKeys();
  const publicKeyCache = useRef<Map<string, string>>(new Map());
  const publicKeysCache = useRef<Map<string, string[]>>(new Map());

  const clearKeyCaches = useCallback(() => {
    publicKeyCache.current.clear();
    publicKeysCache.current.clear();
  }, []);

  const getCachedPublicKey = useCallback(async (userId: string) => {
    if (publicKeyCache.current.has(userId)) return publicKeyCache.current.get(userId)!;
    const key = await getPublicKey(userId);
    if (key) publicKeyCache.current.set(userId, key);
    return key;
  }, [getPublicKey]);

  const getCachedPublicKeys = useCallback(async (userId: string) => {
    if (publicKeysCache.current.has(userId)) return publicKeysCache.current.get(userId)!;
    const keys = await getPublicKeys(userId);
    publicKeysCache.current.set(userId, keys);
    return keys;
  }, [getPublicKeys]);

  const buildPreviewText = useCallback((messageType?: string | null, fallbackText = '', fileName?: string | null) => {
    switch (messageType) {
      case 'image':
        return '📷 صورة';
      case 'video':
        return '🎥 فيديو';
      case 'voice':
      case 'audio':
        return '🎤 رسالة صوتية';
      case 'file':
        return `📎 ${fileName || 'ملف مرفق'}`;
      default:
        return fallbackText || 'رسالة مشفرة';
    }
  }, []);

  const parseSenderPayload = useCallback((payload: string, fallbackIv: string) => {
    if (!payload.includes('|')) {
      return { iv: fallbackIv, ciphertext: payload };
    }

    const [embeddedIv, ...ciphertextParts] = payload.split('|');
    return {
      iv: embeddedIv || fallbackIv,
      ciphertext: ciphertextParts.join('|'),
    };
  }, []);

  const tryDecryptWithKeys = useCallback(async (candidateKeys: string[], ciphertext?: string | null, iv?: string | null) => {
    if (!user || !ciphertext || !iv) {
      throw new Error('DECRYPT_INPUT_INVALID');
    }

    for (const candidateKey of Array.from(new Set(candidateKeys.filter(Boolean)))) {
      try {
        return await decryptMessage(user.id, candidateKey, { ciphertext, iv });
      } catch {
        continue;
      }
    }

    throw new Error('DECRYPT_FAILED');
  }, [user]);

  const decryptForCurrentUser = useCallback(async (message: MessageForDecryption, partnerId: string) => {
    if (!user) return '[رسالة مشفرة]';
    if (message.is_deleted) return '🚫 تم حذف هذه الرسالة';

    const [partnerPublicKeys, myPublicKeys] = await Promise.all([
      getCachedPublicKeys(partnerId),
      getCachedPublicKeys(user.id),
    ]);

    if (message.sender_id === user.id && message.encrypted_content_for_sender) {
      const senderPayload = parseSenderPayload(message.encrypted_content_for_sender, message.iv);
      return tryDecryptWithKeys(myPublicKeys, senderPayload.ciphertext, senderPayload.iv);
    }

    if (message.sender_id !== user.id && message.encrypted_content) {
      return tryDecryptWithKeys(partnerPublicKeys, message.encrypted_content, message.iv);
    }

    return message.content_preview || message.file_name || '[رسالة مشفرة]';
  }, [user, getCachedPublicKeys, parseSenderPayload, tryDecryptWithKeys]);

  const decryptConversationPreview = useCallback(async (message: MessageForDecryption, partnerId: string) => {
    if (!user) return 'رسالة مشفرة';
    if (message.message_type && message.message_type !== 'text') {
      return buildPreviewText(message.message_type, '', message.file_name);
    }

    try {
      const content = await decryptForCurrentUser(message, partnerId);
      return buildPreviewText(message.message_type, content.slice(0, 120), message.file_name);
    } catch {
      return buildPreviewText(
        message.message_type,
        message.content_preview || message.file_name || 'رسالة مشفرة',
        message.file_name,
      );
    }
  }, [user, decryptForCurrentUser, buildPreviewText]);

  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['private-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('private_conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const partnerIds = (data || []).map((c) =>
        c.participant_1 === user.id ? c.participant_2 : c.participant_1,
      );

      if (!partnerIds.length) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .in('user_id', partnerIds);

      const orgIds = [...new Set((profiles || []).map((p) => p.organization_id).filter(Boolean))];
      let orgMap = new Map<string, string>();

      if (orgIds.length) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgMap = new Map((orgs || []).map((o) => [o.id, o.name]));
      }

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, {
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        organization_id: p.organization_id,
        organization_name: orgMap.get(p.organization_id || ''),
      }]));

      const conversationIds = (data || []).map((c) => c.id);
      const latestMessageMap = new Map<string, MessageForDecryption & { conversation_id: string; status: string | null }>();

      if (conversationIds.length > 0) {
        const { data: latestMessages } = await supabase
          .from('encrypted_messages')
          .select('conversation_id, sender_id, encrypted_content, encrypted_content_for_sender, iv, message_type, file_name, status, created_at, content_preview')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        for (const msg of latestMessages || []) {
          if (!latestMessageMap.has(msg.conversation_id)) {
            latestMessageMap.set(msg.conversation_id, msg);
          }
        }
      }

      const convos = await Promise.all((data || []).map(async (c) => {
        const partnerId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const latestMessage = latestMessageMap.get(c.id);

        const { count } = await supabase
          .from('encrypted_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id)
          .in('status', ['sent', 'delivered']);

        return {
          ...c,
          partner: profileMap.get(partnerId),
          unread_count: count || 0,
          lastDecryptedPreview: latestMessage
            ? await decryptConversationPreview(latestMessage, partnerId)
            : undefined,
          last_message_type: latestMessage?.message_type || undefined,
          last_message_status: latestMessage?.status || undefined,
          last_message_sender_id: latestMessage?.sender_id || undefined,
        } as PrivateConversation;
      }));

      return convos;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('private-messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'encrypted_messages',
      }, async (payload) => {
        const newMessage = payload.new as { id: string; sender_id: string; status?: string | null };

        if (newMessage.sender_id !== user.id) {
          await supabase
            .from('encrypted_messages')
            .update({ status: 'delivered' })
            .eq('id', newMessage.id)
            .eq('status', 'sent');
        }

        clearKeyCaches();
        queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['private-messages'] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'encrypted_messages',
      }, () => {
        clearKeyCaches();
        queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['private-messages'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, clearKeyCaches]);

  const getOrCreateConversation = useCallback(async (partnerId: string): Promise<string | null> => {
    if (!user) return null;

    const [p1, p2] = [user.id, partnerId].sort();

    const { data: existing } = await supabase
      .from('private_conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('private_conversations')
      .insert({ participant_1: p1, participant_2: p2 })
      .select('id')
      .single();

    if (error) {
      toast.error('فشل إنشاء المحادثة');
      return null;
    }

    queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
    return created.id;
  }, [user, queryClient]);

  const fetchMessages = useCallback(async (
    conversationId: string,
    limit = 50,
    before?: string,
  ): Promise<DecryptedMessage[]> => {
    if (!user) return [];

    let query = supabase
      .from('encrypted_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const { data: convo } = await supabase
      .from('private_conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single();

    if (!convo) return [];

    const partnerId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

    const senderIds = [...new Set((data || []).map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', senderIds);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const decrypted: DecryptedMessage[] = [];
    for (const msg of (data || []).reverse()) {
      let content = '[رسالة مشفرة]';
      try {
        content = await decryptForCurrentUser(msg, partnerId);
      } catch {
        content = (msg as any).content_preview || msg.file_name || '[تعذر فك التشفير على هذا الجهاز]';
      }

      const profile = profileMap.get(msg.sender_id);
      decrypted.push({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content,
        message_type: msg.message_type || 'text',
        file_url: msg.file_url || undefined,
        file_name: msg.file_name || undefined,
        status: msg.status || 'sent',
        reply_to_id: msg.reply_to_id || undefined,
        is_edited: msg.is_edited || false,
        is_deleted: msg.is_deleted || false,
        created_at: msg.created_at,
        sender: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
      });
    }

    return decrypted;
  }, [user, decryptForCurrentUser]);

  const sendMessage = useCallback(async (
    conversationId: string,
    plaintext: string,
    messageType = 'text',
    fileUrl?: string,
    fileName?: string,
    replyToId?: string,
  ) => {
    if (!user) return;

    const { data: convo } = await supabase
      .from('private_conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single();

    if (!convo) throw new Error('Conversation not found');

    const partnerId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
    clearKeyCaches();
    const partnerPublicKey = await getPublicKey(partnerId);
    const myPublicKey = await getPublicKey(user.id);

    if (!partnerPublicKey) {
      toast.error('الطرف الآخر لم يُفعّل التشفير بعد');
      return;
    }

    const encrypted = await encryptMessage(user.id, partnerPublicKey, plaintext);
    const senderCopy = await encryptMessage(user.id, myPublicKey || partnerPublicKey, plaintext);
    const senderPayload = `${senderCopy.iv}|${senderCopy.ciphertext}`;
    const contentPreview = messageType === 'text' ? plaintext.slice(0, 120) : (fileName || null);

    const { error } = await supabase.from('encrypted_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      encrypted_content: encrypted.ciphertext,
      encrypted_content_for_sender: senderPayload,
      iv: encrypted.iv,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      reply_to_id: replyToId,
      content_preview: contentPreview,
    } as any);

    if (error) throw error;

    clearKeyCaches();
    queryClient.invalidateQueries({ queryKey: ['private-messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
  }, [user, getPublicKey, queryClient, clearKeyCaches]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    const { data: unread } = await supabase
      .from('encrypted_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .in('status', ['sent', 'delivered']);

    if (!unread?.length) return;

    await supabase
      .from('encrypted_messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .in('status', ['sent', 'delivered']);

    const receipts = unread.map((m) => ({
      message_id: m.id,
      user_id: user.id,
    }));

    await supabase.from('message_read_receipts').upsert(receipts, {
      onConflict: 'message_id,user_id',
      ignoreDuplicates: true,
    });

    queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
  }, [user, queryClient]);

  const exportChatHistory = useCallback(async (
    conversationId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('encrypted_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data: messages } = await query;

    const { data: convo } = await supabase
      .from('private_conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single();

    if (!convo || !messages) throw new Error('No data');

    const partnerId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

    const decryptedExport = [];
    for (const msg of messages) {
      let content = '[مشفر]';
      try {
        content = await decryptForCurrentUser(msg, partnerId);
      } catch {
        content = (msg as any).content_preview || msg.file_name || '[تعذر فك التشفير]';
      }

      decryptedExport.push({
        timestamp: msg.created_at,
        sender: msg.sender_id === user.id ? 'أنت' : 'الطرف الآخر',
        content,
        type: msg.message_type,
      });
    }

    await supabase.from('chat_history_exports').insert({
      user_id: user.id,
      conversation_id: conversationId,
      message_count: decryptedExport.length,
      date_from: dateFrom,
      date_to: dateTo,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    const blob = new Blob([JSON.stringify(decryptedExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${conversationId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`تم تصدير ${decryptedExport.length} رسالة بنجاح`);
    return conversationId;
  }, [user, decryptForCurrentUser]);

  const toggleBlock = useCallback(async (conversationId: string) => {
    if (!user) return;
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const isP1 = conv.participant_1 === user.id;
    const field = isP1 ? 'is_blocked_by_1' : 'is_blocked_by_2';
    const current = isP1 ? conv.is_blocked_by_1 : conv.is_blocked_by_2;

    await supabase
      .from('private_conversations')
      .update({ [field]: !current })
      .eq('id', conversationId);

    queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
    toast.success(current ? 'تم إلغاء الحظر' : 'تم حظر المستخدم');
  }, [user, conversations, queryClient]);

  const toggleMute = useCallback(async (conversationId: string) => {
    if (!user) return;
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const isP1 = conv.participant_1 === user.id;
    const field = isP1 ? 'is_muted_by_1' : 'is_muted_by_2';
    const current = isP1 ? conv.is_muted_by_1 : conv.is_muted_by_2;

    await supabase
      .from('private_conversations')
      .update({ [field]: !current })
      .eq('id', conversationId);

    queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
    toast.success(current ? 'تم إلغاء كتم الصوت' : 'تم كتم المحادثة');
  }, [user, conversations, queryClient]);

  const sendFileMessage = useCallback(async (conversationId: string, file: File) => {
    if (!user) return;

    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `chat/${conversationId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-documents')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      toast.error('فشل رفع الملف');
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('organization-documents')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    let messageType = 'file';
    if (file.type.startsWith('image/')) messageType = 'image';
    else if (file.type.startsWith('video/')) messageType = 'video';
    else if (file.type.startsWith('audio/')) messageType = 'voice';

    const plaintext = file.name;
    await sendMessage(conversationId, plaintext, messageType, fileUrl, file.name);
  }, [user, sendMessage]);

  return {
    conversations,
    conversationsLoading,
    refetchConversations,
    getOrCreateConversation,
    fetchMessages,
    sendMessage,
    sendFileMessage,
    markAsRead,
    exportChatHistory,
    toggleBlock,
    toggleMute,
  };
}
