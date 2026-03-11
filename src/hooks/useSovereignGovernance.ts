import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface SovereignRole {
  id: string;
  user_id: string;
  role: string;
  granted_by: string | null;
  permissions: any;
  is_active: boolean;
  notes: string | null;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface SovereignDelegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  scope: string[];
  reason: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  audit_trail: any;
  created_at: string;
}

export interface EarlyWarningAlert {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  affected_entity_id: string | null;
  affected_entity_type: string | null;
  affected_organization_id: string | null;
  detection_method: string;
  suggested_actions: any;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  auto_action_taken: any;
  metadata: any;
  created_at: string;
}

export interface AISovereignDecision {
  id: string;
  decision_type: string;
  title: string;
  analysis: string | null;
  risk_level: string;
  recommendations: any;
  data_sources: any;
  accepted_by: string | null;
  accepted_at: string | null;
  status: string;
  outcome_notes: string | null;
  created_at: string;
}

export const SOVEREIGN_ROLE_LABELS: Record<string, { ar: string; en: string; icon: string; color: string }> = {
  super_admin: { ar: 'المدير العام', en: 'Super Admin', icon: '👑', color: 'text-amber-500' },
  financial_auditor: { ar: 'المراقب المالي', en: 'Financial Auditor', icon: '💰', color: 'text-emerald-500' },
  compliance_officer: { ar: 'مدقق الامتثال', en: 'Compliance Officer', icon: '🛡️', color: 'text-blue-500' },
  technical_supervisor: { ar: 'المشرف التقني', en: 'Technical Supervisor', icon: '⚙️', color: 'text-purple-500' },
  operations_monitor: { ar: 'مراقب العمليات', en: 'Operations Monitor', icon: '📊', color: 'text-orange-500' },
};

export const DELEGATION_SCOPES = [
  { value: 'view_all_entities', ar: 'عرض جميع الكيانات' },
  { value: 'manage_users', ar: 'إدارة المستخدمين' },
  { value: 'view_financials', ar: 'عرض البيانات المالية' },
  { value: 'approve_requests', ar: 'اعتماد الطلبات' },
  { value: 'manage_compliance', ar: 'إدارة الامتثال' },
  { value: 'view_security_logs', ar: 'عرض سجلات الأمان' },
  { value: 'manage_system_settings', ar: 'إدارة إعدادات النظام' },
  { value: 'generate_reports', ar: 'توليد التقارير' },
  { value: 'manage_licenses', ar: 'إدارة التراخيص' },
  { value: 'audit_operations', ar: 'تدقيق العمليات' },
];

export function useSovereignGovernance() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['sovereign-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_sovereign_roles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SovereignRole[];
    },
  });

  const delegationsQuery = useQuery({
    queryKey: ['sovereign-delegations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sovereign_delegations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SovereignDelegation[];
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['early-warnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('early_warning_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as EarlyWarningAlert[];
    },
    refetchInterval: 30_000,
  });

  const decisionsQuery = useQuery({
    queryKey: ['ai-decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_sovereign_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as AISovereignDecision[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async (params: { user_id: string; role: string; notes?: string }) => {
      const { error } = await supabase.from('admin_sovereign_roles').insert({
        user_id: params.user_id,
        role: params.role,
        granted_by: user?.id,
        notes: params.notes,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sovereign-roles'] });
      toast.success('تم تعيين الدور السيادي بنجاح');
    },
    onError: () => toast.error('فشل تعيين الدور'),
  });

  const createDelegation = useMutation({
    mutationFn: async (params: { delegate_id: string; scope: string[]; reason?: string; expires_at?: string }) => {
      const { error } = await supabase.from('sovereign_delegations').insert({
        delegator_id: user?.id,
        delegate_id: params.delegate_id,
        scope: params.scope,
        reason: params.reason,
        expires_at: params.expires_at,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sovereign-delegations'] });
      toast.success('تم إنشاء التفويض بنجاح');
    },
    onError: () => toast.error('فشل إنشاء التفويض'),
  });

  const revokeDelegation = useMutation({
    mutationFn: async (params: { id: string; reason: string }) => {
      const { error } = await supabase.from('sovereign_delegations').update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: params.reason,
      } as any).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sovereign-delegations'] });
      toast.success('تم سحب التفويض');
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (params: { id: string; notes: string }) => {
      const { error } = await supabase.from('early_warning_alerts').update({
        is_resolved: true,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: params.notes,
      } as any).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['early-warnings'] });
      toast.success('تم معالجة التنبيه');
    },
  });

  const unresolvedAlerts = (alertsQuery.data || []).filter(a => !a.is_resolved);
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');

  return {
    roles: rolesQuery.data || [],
    delegations: delegationsQuery.data || [],
    alerts: alertsQuery.data || [],
    decisions: decisionsQuery.data || [],
    unresolvedAlerts,
    criticalAlerts,
    isLoading: rolesQuery.isLoading || alertsQuery.isLoading,
    assignRole,
    createDelegation,
    revokeDelegation,
    resolveAlert,
    refetch: () => {
      rolesQuery.refetch();
      delegationsQuery.refetch();
      alertsQuery.refetch();
      decisionsQuery.refetch();
    },
  };
}
