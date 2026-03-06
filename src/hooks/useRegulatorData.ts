import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRegulatorConfig = () => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['regulator-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('regulator_configs')
        .select('*, regulator_levels(*)')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id,
  });
};

// Fetch jurisdiction mappings for the current regulator's level
export const useRegulatorJurisdictions = () => {
  const { data: config } = useRegulatorConfig();
  const levelCode = config?.regulator_level_code;

  return useQuery({
    queryKey: ['regulator-jurisdictions', levelCode],
    queryFn: async () => {
      if (!levelCode) return [];
      // For WMRA (hierarchy_priority=100), fetch all jurisdictions
      // For others, fetch only their own + lower priority overlaps
      const { data } = await supabase
        .from('regulator_jurisdictions')
        .select('*')
        .eq('regulator_level_code', levelCode)
        .order('hierarchy_priority', { ascending: false });
      return data || [];
    },
    enabled: !!levelCode,
  });
};

// Get supervised org types for current regulator
export const useSupervisedOrgTypes = () => {
  const { data: jurisdictions = [] } = useRegulatorJurisdictions();
  return [...new Set(jurisdictions.map((j: any) => j.supervised_org_type))];
};

// Get all regulator levels for reference
export const useAllRegulatorLevels = () => {
  return useQuery({
    queryKey: ['all-regulator-levels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regulator_levels')
        .select('*')
        .order('level_code');
      return data || [];
    },
  });
};

export const useRegulatorStats = () => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['regulator-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const [orgs, inspections, violations, penalties] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }).neq('organization_type', 'regulator'),
        supabase.from('field_inspections').select('id, status', { count: 'exact' }).eq('regulator_organization_id', organization.id),
        supabase.from('regulatory_violations').select('id, status', { count: 'exact' }).eq('regulator_organization_id', organization.id),
        supabase.from('regulatory_penalties').select('id, status, fine_amount, fine_paid', { count: 'exact' }).eq('regulator_organization_id', organization.id),
      ]);

      const violationsData = violations.data || [];
      const penaltiesData = penalties.data || [];
      const inspectionsData = inspections.data || [];

      return {
        totalOrganizations: orgs.count || 0,
        totalInspections: inspections.count || 0,
        completedInspections: inspectionsData.filter((i: any) => i.status === 'completed').length,
        scheduledInspections: inspectionsData.filter((i: any) => i.status === 'scheduled').length,
        totalViolations: violations.count || 0,
        openViolations: violationsData.filter((v: any) => v.status === 'issued').length,
        resolvedViolations: violationsData.filter((v: any) => v.status === 'resolved').length,
        totalPenalties: penalties.count || 0,
        activePenalties: penaltiesData.filter((p: any) => p.status === 'active').length,
        totalFines: penaltiesData.reduce((sum: number, p: any) => sum + (Number(p.fine_amount) || 0), 0),
        collectedFines: penaltiesData.filter((p: any) => p.fine_paid).reduce((sum: number, p: any) => sum + (Number(p.fine_amount) || 0), 0),
      };
    },
    enabled: !!organization?.id,
  });
};

export const useFieldInspections = (limit = 50) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['field-inspections', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('field_inspections')
        .select('*, inspected_org:organizations!inspected_organization_id(id, name, name_en, organization_type)')
        .eq('regulator_organization_id', organization.id)
        .order('inspection_date', { ascending: false })
        .limit(limit);
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

export const useRegulatoryViolations = (limit = 50) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['regulatory-violations', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('regulatory_violations')
        .select('*, violating_org:organizations!violating_organization_id(id, name, name_en, organization_type)')
        .eq('regulator_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

export const useRegulatoryPenalties = (limit = 50) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['regulatory-penalties', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('regulatory_penalties')
        .select('*, violation:regulatory_violations!violation_id(violation_number, violation_type, severity), target_org:organizations!target_organization_id(id, name, name_en)')
        .eq('regulator_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

export const useAllOrganizations = (supervisedTypes?: readonly string[]) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['all-organizations-for-regulator', organization?.id, supervisedTypes],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('id, name, name_en, organization_type, is_verified, governorate, created_at, logo_url')
        .neq('organization_type', 'regulator');
      
      // Filter by supervised types if provided (non-WMRA regulators)
      if (supervisedTypes && supervisedTypes.length > 0) {
        query = query.in('organization_type', supervisedTypes as any);
      }
      
      const { data } = await query.order('name');
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

// Fetch licenses for a specific organization with issuing authority info
export const useOrganizationLicenses = (organizationId?: string) => {
  return useQuery({
    queryKey: ['org-licenses-regulator', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('legal_licenses')
        .select('*')
        .eq('organization_id', organizationId)
        .order('expiry_date', { ascending: true });
      return data || [];
    },
    enabled: !!organizationId,
  });
};
