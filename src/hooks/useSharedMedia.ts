import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SharedMediaItem {
  id: string;
  file_url: string;
  file_name: string | null;
  message_type: string;
  created_at: string;
  sender_organization_id: string;
}

export interface SharedLink {
  id: string;
  url: string;
  content: string;
  created_at: string;
}

export function useSharedMedia(partnerOrgId: string | undefined) {
  const { organization } = useAuth();
  const [media, setMedia] = useState<SharedMediaItem[]>([]);
  const [files, setFiles] = useState<SharedMediaItem[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSharedContent = useCallback(async () => {
    if (!organization?.id || !partnerOrgId) return;
    setLoading(true);
    try {
      // Fetch non-text messages (media & files)
      const { data: mediaMessages } = await supabase
        .from('direct_messages')
        .select('id, file_url, file_name, message_type, created_at, sender_organization_id')
        .or(
          `and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerOrgId}),and(sender_organization_id.eq.${partnerOrgId},receiver_organization_id.eq.${organization.id})`
        )
        .in('message_type', ['image', 'video', 'file', 'audio', 'voice'])
        .order('created_at', { ascending: false })
        .limit(100);

      const allMedia = (mediaMessages || []) as SharedMediaItem[];
      setMedia(allMedia.filter(m => ['image', 'video'].includes(m.message_type)));
      setFiles(allMedia.filter(m => ['file', 'audio', 'voice'].includes(m.message_type)));

      // Fetch text messages for link extraction
      const { data: textMessages } = await supabase
        .from('direct_messages')
        .select('id, content, created_at')
        .or(
          `and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerOrgId}),and(sender_organization_id.eq.${partnerOrgId},receiver_organization_id.eq.${organization.id})`
        )
        .eq('message_type', 'text')
        .order('created_at', { ascending: false })
        .limit(500);

      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
      const extractedLinks: SharedLink[] = [];
      (textMessages || []).forEach(msg => {
        const urls = msg.content.match(urlRegex);
        if (urls) {
          urls.forEach(url => {
            extractedLinks.push({ id: `${msg.id}-${url}`, url, content: msg.content, created_at: msg.created_at });
          });
        }
      });
      setLinks(extractedLinks);
    } catch (e) {
      console.error('Error fetching shared media:', e);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, partnerOrgId]);

  useEffect(() => {
    fetchSharedContent();
  }, [fetchSharedContent]);

  return { media, files, links, loading, refetch: fetchSharedContent };
}
