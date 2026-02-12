import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedPartners } from './useLinkedPartners';

export interface MentionableUser {
  id: string;        // profile id
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  organization_id: string;
  organization_name: string;
  is_external: boolean;
}

export function useMentionableUsers() {
  const { profile, organization } = useAuth();
  const { data: partners } = useLinkedPartners();

  // Fetch internal org members
  const internalQuery = useQuery({
    queryKey: ['mentionable-internal', organization?.id],
    queryFn: async (): Promise<MentionableUser[]> => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, email, phone, organization_id')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .neq('id', profile?.id || '')
        .order('full_name');
      if (error) throw error;
      return (data || []).map(u => ({
        ...u,
        email: u.email || null,
        phone: u.phone || null,
        organization_name: organization.name || '',
        is_external: false,
      }));
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch partner org members
  const partnerOrgIds = (partners || []).map(p => p.id);

  const externalQuery = useQuery({
    queryKey: ['mentionable-external', organization?.id, partnerOrgIds.join(',')],
    queryFn: async (): Promise<MentionableUser[]> => {
      if (partnerOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, email, phone, organization_id')
        .in('organization_id', partnerOrgIds)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;

      const partnerMap = Object.fromEntries((partners || []).map(p => [p.id, p.name]));
      return (data || []).map(u => ({
        ...u,
        email: u.email || null,
        phone: u.phone || null,
        organization_name: partnerMap[u.organization_id] || '',
        is_external: true,
      }));
    },
    enabled: partnerOrgIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const allUsers: MentionableUser[] = [
    ...(internalQuery.data || []),
    ...(externalQuery.data || []),
  ];

  return {
    users: allUsers,
    isLoading: internalQuery.isLoading || externalQuery.isLoading,
  };
}

// Parse @mentions from text, returns array of user_ids
export function parseMentions(text: string, users: MentionableUser[]): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const userIds: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const userId = match[2];
    if (users.some(u => u.id === userId)) {
      userIds.push(userId);
    }
  }
  return [...new Set(userIds)];
}

// Convert mention markup to display text
export function mentionToDisplay(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
}
