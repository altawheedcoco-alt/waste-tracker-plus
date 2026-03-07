import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Types ──
export interface GovernanceRole {
  id: string;
  organization_id: string;
  role_name: string;
  role_name_en?: string;
  description?: string;
  is_system_role: boolean;
  permissions: Record<string, boolean>;
  max_approval_amount: number;
  can_approve_shipments: boolean;
  can_approve_invoices: boolean;
  can_approve_contracts: boolean;
  can_approve_payments: boolean;
  can_manage_employees: boolean;
  can_view_financials: boolean;
  can_export_data: boolean;
  can_manage_settings: boolean;
  hierarchy_level: number;
  created_at: string;
  assignments_count?: number;
}

export interface RoleAssignment {
  id: string;
  profile_id: string;
  role_id: string;
  is_active: boolean;
  assigned_at: string;
  profile?: { full_name: string; email: string };
  role?: { role_name: string };
}

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  workflow_name: string;
  workflow_name_en?: string;
  resource_type: string;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
  enforce_segregation: boolean;
  steps?: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  approver_role_id?: string;
  approver_profile_id?: string;
  required_count: number;
  auto_approve_after_hours?: number;
}

export interface ApprovalInstance {
  id: string;
  workflow_id: string;
  resource_type: string;
  resource_id: string;
  resource_title?: string;
  requested_by: string;
  current_step: number;
  status: string;
  amount?: number;
  created_at: string;
  completed_at?: string;
  requester?: { full_name: string };
  actions?: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  instance_id: string;
  step_order: number;
  action: string;
  acted_by: string;
  comments?: string;
  acted_at: string;
  actor?: { full_name: string };
}

export interface AuditEntry {
  id: string;
  user_name?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  resource_title?: string;
  severity: string;
  created_at: string;
}

export interface GovernanceAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string;
  is_resolved: boolean;
  created_at: string;
}

// ── Hooks ──

export function useGovernanceRoles() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['governance-roles', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_roles')
        .select('*')
        .eq('organization_id', orgId!)
        .order('hierarchy_level', { ascending: true });
      if (error) throw error;
      return data as GovernanceRole[];
    },
    enabled: !!orgId,
  });

  const createRole = useMutation({
    mutationFn: async (role: Partial<GovernanceRole>) => {
      const { error } = await supabase.from('governance_roles').insert([{ ...role, organization_id: orgId! } as any]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم إنشاء الدور بنجاح'); qc.invalidateQueries({ queryKey: ['governance-roles'] }); },
    onError: () => toast.error('فشل في إنشاء الدور'),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GovernanceRole> & { id: string }) => {
      const { error } = await supabase.from('governance_roles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم تحديث الدور'); qc.invalidateQueries({ queryKey: ['governance-roles'] }); },
    onError: () => toast.error('فشل في تحديث الدور'),
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم حذف الدور'); qc.invalidateQueries({ queryKey: ['governance-roles'] }); },
    onError: () => toast.error('فشل في حذف الدور'),
  });

  return { roles, isLoading, createRole, updateRole, deleteRole };
}

export function useRoleAssignments() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['governance-assignments', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_role_assignments')
        .select('*, profile:profiles(full_name, email), role:governance_roles(role_name)')
        .eq('organization_id', orgId!);
      if (error) throw error;
      return data as unknown as RoleAssignment[];
    },
    enabled: !!orgId,
  });

  const assignRole = useMutation({
    mutationFn: async (params: { profile_id: string; role_id: string; assigned_by?: string }) => {
      const { error } = await supabase.from('governance_role_assignments').insert({ ...params, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم تعيين الدور'); qc.invalidateQueries({ queryKey: ['governance-assignments'] }); },
    onError: () => toast.error('فشل في تعيين الدور'),
  });

  const removeAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_role_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم إزالة التعيين'); qc.invalidateQueries({ queryKey: ['governance-assignments'] }); },
    onError: () => toast.error('فشل في إزالة التعيين'),
  });

  return { assignments, isLoading, assignRole, removeAssignment };
}

export function useApprovalWorkflows() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['governance-workflows', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_approval_workflows')
        .select('*, steps:governance_approval_steps(*)')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ApprovalWorkflow[];
    },
    enabled: !!orgId,
  });

  const createWorkflow = useMutation({
    mutationFn: async (wf: Partial<ApprovalWorkflow> & { steps?: Partial<ApprovalStep>[] }) => {
      const { steps, ...wfData } = wf;
      const { data, error } = await supabase.from('governance_approval_workflows')
        .insert([{ ...wfData, organization_id: orgId! } as any])
        .select('id')
        .single();
      if (error) throw error;

      if (steps?.length) {
        const { error: stepErr } = await supabase.from('governance_approval_steps')
          .insert(steps.map((s, i) => ({ ...s, workflow_id: data.id, step_order: i + 1 })));
        if (stepErr) throw stepErr;
      }
    },
    onSuccess: () => { toast.success('تم إنشاء سلسلة الموافقات'); qc.invalidateQueries({ queryKey: ['governance-workflows'] }); },
    onError: () => toast.error('فشل في إنشاء السلسلة'),
  });

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('governance_approval_workflows').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['governance-workflows'] }); },
  });

  return { workflows, isLoading, createWorkflow, toggleWorkflow };
}

export function useApprovalInstances() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['governance-instances', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_approval_instances')
        .select('*, requester:profiles!governance_approval_instances_requested_by_fkey(full_name)')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as ApprovalInstance[];
    },
    enabled: !!orgId,
  });

  return { instances, isLoading };
}

export function useGovernanceAudit() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['governance-audit', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_audit_trail')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AuditEntry[];
    },
    enabled: !!orgId,
  });

  return { entries, isLoading };
}

export function useGovernanceAlerts() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['governance-alerts', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_alerts')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as GovernanceAlert[];
    },
    enabled: !!orgId,
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('تم حل التنبيه'); qc.invalidateQueries({ queryKey: ['governance-alerts'] }); },
  });

  return { alerts, isLoading, resolveAlert };
}

// ── Stats ──
export function useGovernanceStats() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['governance-stats', orgId],
    queryFn: async () => {
      const [rolesRes, workflowsRes, pendingRes, alertsRes, auditRes] = await Promise.all([
        supabase.from('governance_roles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        supabase.from('governance_approval_workflows').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('is_active', true),
        supabase.from('governance_approval_instances').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'pending'),
        supabase.from('governance_alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('is_resolved', false),
        supabase.from('governance_audit_trail').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
      ]);
      return {
        totalRoles: rolesRes.count || 0,
        activeWorkflows: workflowsRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
        unresolvedAlerts: alertsRes.count || 0,
        totalAuditEntries: auditRes.count || 0,
      };
    },
    enabled: !!orgId,
  });
}
