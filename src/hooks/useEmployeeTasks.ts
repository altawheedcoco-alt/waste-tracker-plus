import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TaskAssignment {
  id: string;
  organization_id: string;
  member_id: string;
  template_id: string | null;
  permission_key: string;
  scoped_partner_ids: string[];
  scoped_department_ids: string[];
  is_active: boolean;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  organization_id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  task_permissions: { permission: string; scoped_partner_ids?: string[] }[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

/** All available permission keys that can be assigned as tasks */
export const ASSIGNABLE_PERMISSIONS = [
  // الشحنات
  { key: 'view_shipments', label: 'عرض الشحنات', category: 'shipments' },
  { key: 'create_shipments', label: 'إنشاء شحنات', category: 'shipments' },
  { key: 'manage_shipments', label: 'إدارة الشحنات', category: 'shipments' },
  { key: 'cancel_shipments', label: 'إلغاء الشحنات', category: 'shipments' },
  // المالية
  { key: 'view_deposits', label: 'عرض الإيداعات', category: 'finance' },
  { key: 'create_deposits', label: 'إنشاء إيداعات', category: 'finance' },
  { key: 'manage_deposits', label: 'إدارة الإيداعات', category: 'finance' },
  { key: 'view_accounts', label: 'عرض الحسابات', category: 'finance' },
  { key: 'view_account_details', label: 'تفاصيل الحسابات', category: 'finance' },
  { key: 'export_accounts', label: 'تصدير الحسابات', category: 'finance' },
  // الجهات المرتبطة
  { key: 'view_partners', label: 'عرض الجهات', category: 'partners' },
  { key: 'manage_partners', label: 'إدارة الجهات', category: 'partners' },
  { key: 'view_partner_data', label: 'بيانات الجهات', category: 'partners' },
  { key: 'create_external_partners', label: 'إنشاء جهات خارجية', category: 'partners' },
  // التقارير
  { key: 'view_reports', label: 'عرض التقارير', category: 'reports' },
  { key: 'create_reports', label: 'إنشاء تقارير', category: 'reports' },
  { key: 'export_reports', label: 'تصدير التقارير', category: 'reports' },
  // السائقين
  { key: 'view_drivers', label: 'عرض السائقين', category: 'drivers' },
  { key: 'manage_drivers', label: 'إدارة السائقين', category: 'drivers' },
  // المستندات
  { key: 'print_documents', label: 'طباعة المستندات', category: 'documents' },
  { key: 'share_documents', label: 'مشاركة المستندات', category: 'documents' },
] as const;

export const PERMISSION_CATEGORIES = {
  shipments: 'الشحنات',
  finance: 'المالية',
  partners: 'الجهات المرتبطة',
  reports: 'التقارير',
  drivers: 'السائقين والمركبات',
  documents: 'المستندات',
};

export function useEmployeeTasks(memberId?: string) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  // Fetch tasks for a specific employee
  const tasksQuery = useQuery({
    queryKey: ['employee-tasks', memberId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('employee_task_assignments')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TaskAssignment[];
    },
    enabled: !!memberId,
  });

  // Assign a single task
  const assignTask = useMutation({
    mutationFn: async (task: {
      member_id: string;
      permission_key: string;
      scoped_partner_ids?: string[];
      scoped_department_ids?: string[];
      template_id?: string;
      notes?: string;
    }) => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase
        .from('employee_task_assignments')
        .insert({
          organization_id: orgId,
          member_id: task.member_id,
          permission_key: task.permission_key,
          scoped_partner_ids: task.scoped_partner_ids || [],
          scoped_department_ids: task.scoped_department_ids || [],
          template_id: task.template_id || null,
          assigned_by: user?.id,
          notes: task.notes || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks', memberId] });
      toast.success('تم تعيين المهمة بنجاح');
    },
    onError: () => toast.error('فشل تعيين المهمة'),
  });

  // Assign from template (bulk)
  const assignFromTemplate = useMutation({
    mutationFn: async ({ member_id, template }: { member_id: string; template: TaskTemplate }) => {
      if (!orgId) throw new Error('No organization');
      const rows = template.task_permissions.map((tp: any) => ({
        organization_id: orgId,
        member_id,
        permission_key: tp.permission,
        scoped_partner_ids: tp.scoped_partner_ids || [],
        scoped_department_ids: [],
        template_id: template.id,
        assigned_by: user?.id,
      }));
      const { error } = await supabase
        .from('employee_task_assignments')
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks', memberId] });
      toast.success('تم تطبيق القالب بنجاح');
    },
    onError: () => toast.error('فشل تطبيق القالب'),
  });

  // Remove a task
  const removeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('employee_task_assignments')
        .update({ is_active: false } as any)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks', memberId] });
      toast.success('تم إزالة المهمة');
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    assignTask,
    assignFromTemplate,
    removeTask,
  };
}

export function useTaskTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const templatesQuery = useQuery({
    queryKey: ['task-templates', orgId],
    queryFn: async (): Promise<TaskTemplate[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('employee_task_templates')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TaskTemplate[];
    },
    enabled: !!orgId,
  });

  const createTemplate = useMutation({
    mutationFn: async (tpl: Partial<TaskTemplate>) => {
      if (!orgId) throw new Error('No org');
      const { error } = await supabase
        .from('employee_task_templates')
        .insert({ ...tpl, organization_id: orgId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates', orgId] });
      toast.success('تم إنشاء القالب بنجاح');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_task_templates')
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates', orgId] });
      toast.success('تم حذف القالب');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    deleteTemplate,
  };
}
