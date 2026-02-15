import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches IDs of organizations linked via verified_partnerships.
 * This is the CORE rule: users should only see linked partners, never all organizations.
 */
export async function fetchLinkedPartnerIds(
  organizationId: string,
  filterType?: 'generator' | 'transporter' | 'recycler' | 'disposal'
): Promise<string[]> {
  // 1. Get all active verified partnerships
  const { data: partnerships, error } = await supabase
    .from('verified_partnerships')
    .select('requester_org_id, partner_org_id')
    .or(`requester_org_id.eq.${organizationId},partner_org_id.eq.${organizationId}`)
    .eq('status', 'active');

  if (error || !partnerships?.length) return [];

  // 2. Extract partner IDs (the other side of each partnership)
  const partnerIds = partnerships.map(p =>
    p.requester_org_id === organizationId ? p.partner_org_id : p.requester_org_id
  );

  if (!filterType) return partnerIds;

  // 3. Filter by organization type if needed
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .in('id', partnerIds)
    .eq('organization_type', filterType)
    .eq('is_active', true);

  return (orgs || []).map(o => o.id);
}

/**
 * Fetches linked partner organizations with details, filtered by type.
 */
export async function fetchLinkedPartnerOrgs<T extends Record<string, any>>(
  organizationId: string,
  filterType: 'generator' | 'transporter' | 'recycler' | 'disposal',
  selectFields: string = 'id, name, address, city'
): Promise<T[]> {
  const partnerIds = await fetchLinkedPartnerIds(organizationId, filterType);
  if (partnerIds.length === 0) return [];

  const { data, error } = await supabase
    .from('organizations')
    .select(selectFields)
    .in('id', partnerIds)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error(`Error fetching linked ${filterType}s:`, error);
    return [];
  }

  return (data || []) as unknown as T[];
}
