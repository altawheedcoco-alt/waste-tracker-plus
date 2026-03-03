import { useMemo } from 'react';
import { useMentionableUsers, type MentionableUser } from './useMentionableUsers';
import { useLinkedPartners, type LinkedPartner } from './useLinkedPartners';
import type { MentionableEntity } from '@/components/ui/mentionable-field';

/**
 * Combined hook that provides both users and linked organizations
 * as a unified list of mentionable entities for @mention fields.
 */
export function useMentionableEntities() {
  const { users, isLoading: usersLoading } = useMentionableUsers();
  const { data: partners, isLoading: partnersLoading } = useLinkedPartners();

  const entities = useMemo<MentionableEntity[]>(() => {
    const result: MentionableEntity[] = [];

    // Add linked organizations
    (partners || []).forEach((p: LinkedPartner) => {
      result.push({
        id: p.id,
        type: 'organization',
        name: p.name,
        subtitle: p.organization_type === 'transporter' ? 'ناقل' 
          : p.organization_type === 'generator' ? 'مولّد'
          : p.organization_type === 'recycler' ? 'مدوّر'
          : p.organization_type === 'disposal' ? 'تخلص'
          : p.organization_type,
        avatar_url: p.logo_url,
        is_external: true,
      });
    });

    // Add users
    users.forEach((u: MentionableUser) => {
      result.push({
        id: u.id,
        type: 'user',
        name: u.full_name,
        subtitle: u.organization_name,
        avatar_url: u.avatar_url,
        is_external: u.is_external,
      });
    });

    return result;
  }, [users, partners]);

  // Convenience filters
  const organizationEntities = useMemo(() => entities.filter(e => e.type === 'organization'), [entities]);
  const userEntities = useMemo(() => entities.filter(e => e.type === 'user'), [entities]);

  return {
    entities,
    organizationEntities,
    userEntities,
    isLoading: usersLoading || partnersLoading,
  };
}
