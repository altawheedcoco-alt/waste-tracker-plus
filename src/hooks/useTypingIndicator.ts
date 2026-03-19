import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedProfile } from '@/lib/profileCache';

/**
 * Hook for realtime typing indicator using Supabase Realtime Presence
 */
export function useTypingIndicator(conversationId?: string) {
  const { user, organization } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerTypingName, setPartnerTypingName] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId || !user || !organization) return;

    const channelName = `typing:${[organization.id, conversationId].sort().join('-')}`;
    
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let typing = false;
        let name: string | null = null;

        for (const [uid, presences] of Object.entries(state)) {
          if (uid === user.id) continue;
          const latest = (presences as any[])?.[presences.length - 1];
          if (latest?.is_typing) {
            typing = true;
            name = latest.full_name || null;
            break;
          }
        }

        setIsPartnerTyping(typing);
        setPartnerTypingName(name);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            is_typing: false,
            full_name: '',
            org_id: organization.id,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user, organization]);

  const sendTyping = useCallback(async () => {
    if (!channelRef.current || !user || !organization) return;

    const now = Date.now();
    // Throttle: only send every 2 seconds
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    // Get user's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    await channelRef.current.track({
      is_typing: true,
      full_name: profile?.full_name || '',
      org_id: organization.id,
    });

    // Auto-stop after 3 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          is_typing: false,
          full_name: '',
          org_id: organization?.id || '',
        });
      }
    }, 3000);
  }, [user, organization]);

  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !organization) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await channelRef.current.track({
      is_typing: false,
      full_name: '',
      org_id: organization.id,
    });
  }, [organization]);

  return {
    isPartnerTyping,
    partnerTypingName,
    sendTyping,
    stopTyping,
  };
}
