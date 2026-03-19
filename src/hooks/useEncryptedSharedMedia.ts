import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EncryptedMediaItem {
  id: string;
  file_url: string;
  file_name: string | null;
  message_type: string;
  created_at: string;
  sender_id: string;
}

export interface EncryptedSharedLink {
  id: string;
  url: string;
  content: string;
  created_at: string;
}

type Scope = 'conversation' | 'all';

export function useEncryptedSharedMedia(
  conversationId: string | undefined,
  partnerOrgId: string | undefined,
) {
  const { user, organization } = useAuth();
  const [media, setMedia] = useState<EncryptedMediaItem[]>([]);
  const [files, setFiles] = useState<EncryptedMediaItem[]>([]);
  const [links, setLinks] = useState<EncryptedSharedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<Scope>('conversation');

  const fetchContent = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (scope === 'conversation' && conversationId) {
        // Current conversation only
        const { data: msgs } = await supabase
          .from('encrypted_messages')
          .select('id, file_url, file_name, message_type, created_at, sender_id, content_preview')
          .eq('conversation_id', conversationId)
          .not('file_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        const allItems = (msgs || []) as EncryptedMediaItem[];
        setMedia(allItems.filter(m => ['image', 'video'].includes(m.message_type)));
        setFiles(allItems.filter(m => ['file', 'audio', 'voice'].includes(m.message_type)));

        // Extract links from content_preview
        const { data: textMsgs } = await supabase
          .from('encrypted_messages')
          .select('id, content_preview, created_at')
          .eq('conversation_id', conversationId)
          .eq('message_type', 'text')
          .not('content_preview', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200);

        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
        const extracted: EncryptedSharedLink[] = [];
        (textMsgs || []).forEach((msg: any) => {
          const urls = msg.content_preview?.match(urlRegex);
          if (urls) {
            urls.forEach((url: string) => {
              extracted.push({ id: `${msg.id}-${url}`, url, content: msg.content_preview, created_at: msg.created_at });
            });
          }
        });
        setLinks(extracted);
      } else if (scope === 'all' && organization?.id && partnerOrgId) {
        // All conversations between the two orgs
        // Get all user IDs from both orgs
        const { data: myOrgUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', organization.id);
        const { data: partnerOrgUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', partnerOrgId);

        const myIds = (myOrgUsers || []).map(u => u.user_id);
        const partnerIds = (partnerOrgUsers || []).map(u => u.user_id);

        if (!myIds.length || !partnerIds.length) {
          setMedia([]); setFiles([]); setLinks([]);
          return;
        }

        // Find conversations between any member of both orgs
        const allIds = [...myIds, ...partnerIds];
        const { data: convos } = await supabase
          .from('private_conversations')
          .select('id')
          .or(`and(participant_1.in.(${myIds.join(',')}),participant_2.in.(${partnerIds.join(',')})),and(participant_1.in.(${partnerIds.join(',')}),participant_2.in.(${myIds.join(',')}))`);

        const convoIds = (convos || []).map(c => c.id);
        if (!convoIds.length) {
          setMedia([]); setFiles([]); setLinks([]);
          return;
        }

        const { data: msgs } = await supabase
          .from('encrypted_messages')
          .select('id, file_url, file_name, message_type, created_at, sender_id, content_preview')
          .in('conversation_id', convoIds)
          .not('file_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200);

        const allItems = (msgs || []) as EncryptedMediaItem[];
        setMedia(allItems.filter(m => ['image', 'video'].includes(m.message_type)));
        setFiles(allItems.filter(m => ['file', 'audio', 'voice'].includes(m.message_type)));

        // Links from content_preview
        const { data: textMsgs } = await supabase
          .from('encrypted_messages')
          .select('id, content_preview, created_at')
          .in('conversation_id', convoIds)
          .eq('message_type', 'text')
          .not('content_preview', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
        const extracted: EncryptedSharedLink[] = [];
        (textMsgs || []).forEach((msg: any) => {
          const urls = msg.content_preview?.match(urlRegex);
          if (urls) {
            urls.forEach((url: string) => {
              extracted.push({ id: `${msg.id}-${url}`, url, content: msg.content_preview, created_at: msg.created_at });
            });
          }
        });
        setLinks(extracted);
      }
    } catch (e) {
      console.error('Error fetching encrypted shared media:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, organization?.id, conversationId, partnerOrgId, scope]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { media, files, links, loading, scope, setScope, refetch: fetchContent };
}
