import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChainStep {
  step_key: string;
  button_ar: string;
  function_ar: string;
  result_ar: string;
  impact_ar: string;
  icon: string;
  order: number;
}

export interface ChainDefinition {
  id: string;
  chain_key: string;
  chain_name_ar: string;
  chain_name_en: string | null;
  description_ar: string | null;
  category: string;
  is_active: boolean;
  steps: ChainStep[];
}

export interface ImpactEvent {
  id: string;
  organization_id: string;
  chain_key: string;
  step_key: string;
  resource_type: string;
  resource_id: string;
  actor_id: string | null;
  action_label: string;
  result_label: string | null;
  impact_label: string | null;
  impact_data: Record<string, any>;
  cascade_triggered: boolean;
  cascade_targets: any[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface ImpactSummary {
  id: string;
  organization_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  category: string;
  total_events: number;
  total_cascades: number;
  kpi_summary: Record<string, any>;
  financial_summary: Record<string, any>;
  compliance_summary: Record<string, any>;
  esg_summary: Record<string, any>;
}

// ── Fetch all active chain definitions ──
export const useChainDefinitions = () => {
  return useQuery({
    queryKey: ['impact-chain-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impact_chain_definitions')
        .select('*')
        .eq('is_active', true)
        .order('chain_key');
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        steps: (Array.isArray(d.steps) ? d.steps : []) as unknown as ChainStep[],
      })) as ChainDefinition[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// ── Fetch impact events for a specific resource ──
export const useResourceImpactTrail = (resourceType?: string, resourceId?: string) => {
  return useQuery({
    queryKey: ['impact-trail', resourceType, resourceId],
    queryFn: async () => {
      if (!resourceType || !resourceId) return [];
      const { data, error } = await supabase
        .from('impact_events')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ImpactEvent[];
    },
    enabled: !!resourceType && !!resourceId,
  });
};

// ── Fetch impact summaries for the org ──
export const useImpactSummaries = (periodType: string = 'monthly') => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['impact-summaries', organization?.id, periodType],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('impact_summaries')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as ImpactSummary[];
    },
    enabled: !!organization?.id,
  });
};

// ── Record an impact event ──
export const useRecordImpact = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      chainKey: string;
      stepKey: string;
      resourceType: string;
      resourceId: string;
      actionLabel: string;
      resultLabel?: string;
      impactLabel?: string;
      impactData?: Record<string, any>;
      cascadeTriggered?: boolean;
      cascadeTargets?: any[];
      metadata?: Record<string, any>;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      const { error } = await supabase.from('impact_events').insert({
        organization_id: organization.id,
        chain_key: params.chainKey,
        step_key: params.stepKey,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        actor_id: user?.id,
        action_label: params.actionLabel,
        result_label: params.resultLabel || null,
        impact_label: params.impactLabel || null,
        impact_data: params.impactData || {},
        cascade_triggered: params.cascadeTriggered || false,
        cascade_targets: params.cascadeTargets || [],
        metadata: params.metadata || {},
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['impact-trail', vars.resourceType, vars.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['impact-summaries'] });
    },
  });
};

// ── Fetch recent events for dashboard ──
export const useRecentImpactEvents = (limit: number = 20) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['recent-impact-events', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('impact_events')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as ImpactEvent[];
    },
    enabled: !!organization?.id,
  });
};
