import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedPartners } from '@/hooks/useLinkedPartners';
import { toast } from 'sonner';

export interface SafetyPartnerPermission {
  id: string;
  organization_id: string;
  partner_organization_id: string;
  can_view_hazards: boolean;
  can_report_hazards: boolean;
  can_view_inspections: boolean;
  can_request_inspection: boolean;
  can_view_ppe: boolean;
  can_view_jsa: boolean;
  can_view_toolbox_talks: boolean;
  can_attend_toolbox_talks: boolean;
  can_view_certificates: boolean;
  can_receive_certificates: boolean;
  can_view_incidents: boolean;
  can_report_incidents: boolean;
  can_view_emergency_plans: boolean;
  can_view_safety_team: boolean;
  restricted_to_user_ids: string[] | null;
  notes: string | null;
  is_active: boolean;
}

export function useSafetyPartnerPermissions() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-partner-permissions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('safety_partner_permissions' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SafetyPartnerPermission[];
    },
    enabled: !!orgId,
  });

  const upsert = useMutation({
    mutationFn: async (perm: Partial<SafetyPartnerPermission> & { partner_organization_id: string }) => {
      const { error } = await supabase
        .from('safety_partner_permissions' as any)
        .upsert({
          ...perm,
          organization_id: orgId,
        }, { onConflict: 'organization_id,partner_organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety-partner-permissions', orgId] });
      toast.success('تم تحديث صلاحيات السيفتي');
    },
    onError: () => toast.error('فشل في التحديث'),
  });

  const getPermissionsForPartner = (partnerOrgId: string) => {
    return query.data?.find(p => p.partner_organization_id === partnerOrgId) || null;
  };

  return {
    permissions: query.data || [],
    isLoading: query.isLoading,
    upsert,
    getPermissionsForPartner,
  };
}

// Hook to check what safety modules current org can access from a specific partner
export function useMyPartnerSafetyAccess() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['my-safety-access', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('safety_partner_permissions' as any)
        .select('*')
        .eq('partner_organization_id', orgId)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as unknown as SafetyPartnerPermission[];
    },
    enabled: !!orgId,
  });
}

// Hook for external safety links
export function useSafetyExternalLinks() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-external-links', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('safety_external_links' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (link: any) => {
      const { error } = await supabase
        .from('safety_external_links' as any)
        .insert({ ...link, organization_id: orgId, created_by: profile?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety-external-links', orgId] });
      toast.success('تم إنشاء رابط السيفتي');
    },
    onError: () => toast.error('فشل في الإنشاء'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('safety_external_links' as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety-external-links', orgId] });
      toast.success('تم التحديث');
    },
  });

  return { links: query.data || [], isLoading: query.isLoading, create, toggle };
}
