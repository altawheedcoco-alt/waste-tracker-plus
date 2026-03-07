/**
 * Hook لتسجيل وقراءة الآثار المتقاطعة بين الجهات
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ImpactType } from '@/types/commandTypes';

export interface CrossImpactRecord {
  id: string;
  source_organization_id: string;
  source_org_type: string;
  source_command_id: string;
  source_user_id: string;
  target_organization_id: string | null;
  target_org_type: string | null;
  impact_type: string;
  impact_label_ar: string;
  impact_label_en: string | null;
  resource_type: string;
  resource_id: string;
  resource_label: string | null;
  chain_id: string | null;
  node_id: string | null;
  status: string;
  impact_data: Record<string, any>;
  metadata: Record<string, any>;
  financial_amount: number | null;
  financial_currency: string | null;
  created_at: string;
  completed_at: string | null;
}

/** تسجيل أثر متقاطع جديد */
export const useRecordCrossImpact = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      commandId: string;
      impactType: ImpactType;
      impactLabelAr: string;
      impactLabelEn?: string;
      resourceType: string;
      resourceId: string;
      resourceLabel?: string;
      chainId?: string;
      nodeId?: string;
      targetOrganizationId?: string;
      targetOrgType?: string;
      impactData?: Record<string, any>;
      financialAmount?: number;
      metadata?: Record<string, any>;
    }) => {
      if (!organization?.id || !user?.id) throw new Error('No organization or user');

      const { error } = await (supabase as any).from('cross_impact_log').insert({
        source_organization_id: organization.id,
        source_org_type: organization.type || 'unknown',
        source_command_id: params.commandId,
        source_user_id: user.id,
        target_organization_id: params.targetOrganizationId || null,
        target_org_type: params.targetOrgType || null,
        impact_type: params.impactType,
        impact_label_ar: params.impactLabelAr,
        impact_label_en: params.impactLabelEn || null,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        resource_label: params.resourceLabel || null,
        chain_id: params.chainId || null,
        node_id: params.nodeId || null,
        impact_data: params.impactData || {},
        financial_amount: params.financialAmount || null,
        metadata: params.metadata || {},
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-impact-log'] });
      queryClient.invalidateQueries({ queryKey: ['cross-impact-stats'] });
    },
  });
};

/** جلب الآثار المتقاطعة للمنظمة */
export const useCrossImpactLog = (filters?: {
  impactType?: string;
  resourceType?: string;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['cross-impact-log', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = (supabase as any)
        .from('cross_impact_log')
        .select('*')
        .or(`source_organization_id.eq.${organization.id},target_organization_id.eq.${organization.id}`)
        .order('created_at', { ascending: false });

      if (filters?.impactType) {
        query = query.eq('impact_type', filters.impactType);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CrossImpactRecord[];
    },
    enabled: !!organization?.id,
  });
};

/** إحصائيات الآثار المتقاطعة */
export const useCrossImpactStats = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['cross-impact-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await (supabase as any)
        .from('cross_impact_log')
        .select('impact_type, resource_type, status, financial_amount')
        .or(`source_organization_id.eq.${organization.id},target_organization_id.eq.${organization.id}`);

      if (error) throw error;

      const records = data || [];
      const byType: Record<string, number> = {};
      const byResource: Record<string, number> = {};
      let totalFinancial = 0;
      let completedCount = 0;
      let pendingCount = 0;

      records.forEach((r: any) => {
        byType[r.impact_type] = (byType[r.impact_type] || 0) + 1;
        byResource[r.resource_type] = (byResource[r.resource_type] || 0) + 1;
        if (r.financial_amount) totalFinancial += Number(r.financial_amount);
        if (r.status === 'completed') completedCount++;
        else pendingCount++;
      });

      return {
        total: records.length,
        completedCount,
        pendingCount,
        totalFinancial,
        byType,
        byResource,
      };
    },
    enabled: !!organization?.id,
    staleTime: 30_000,
  });
};

/** جلب آثار مورد معين */
export const useResourceCrossImpacts = (resourceType?: string, resourceId?: string) => {
  return useQuery({
    queryKey: ['cross-impact-resource', resourceType, resourceId],
    queryFn: async () => {
      if (!resourceType || !resourceId) return [];
      const { data, error } = await (supabase as any)
        .from('cross_impact_log')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrossImpactRecord[];
    },
    enabled: !!resourceType && !!resourceId,
  });
};
