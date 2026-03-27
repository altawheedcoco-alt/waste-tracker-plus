import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  employee_type: string;
  is_active: boolean;
  access_all_partners: boolean;
  access_all_waste_types: boolean;
  invitation_date?: string;
  created_at: string;
  permissions?: string[];
  partner_access?: {
    partner_organization_id?: string;
    external_partner_id?: string;
    partner_name?: string;
  }[];
  waste_access?: string[];
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  employeeType: string;
  permissions: string[];
  accessAllPartners: boolean;
  accessAllWasteTypes: boolean;
  partnerIds?: string[];
  externalPartnerIds?: string[];
  wasteTypes?: string[];
}

export const PERMISSION_CATEGORIES = {
  deposits: {
    label: 'الإيداعات',
    permissions: [
      { value: 'create_deposits', label: 'إنشاء الإيداعات' },
      { value: 'view_deposits', label: 'عرض الإيداعات' },
      { value: 'manage_deposits', label: 'إدارة الإيداعات' },
    ],
  },
  shipments: {
    label: 'الشحنات',
    permissions: [
      { value: 'create_shipments', label: 'إنشاء الشحنات' },
      { value: 'view_shipments', label: 'عرض الشحنات' },
      { value: 'manage_shipments', label: 'إدارة الشحنات' },
      { value: 'cancel_shipments', label: 'إلغاء الشحنات' },
    ],
  },
  accounts: {
    label: 'الحسابات',
    permissions: [
      { value: 'view_accounts', label: 'عرض الحسابات' },
      { value: 'view_account_details', label: 'عرض تفاصيل الحسابات' },
      { value: 'export_accounts', label: 'تصدير الحسابات' },
    ],
  },
  partners: {
    label: 'الجهات المرتبطة',
    permissions: [
      { value: 'view_partners', label: 'عرض الجهات المرتبطة' },
      { value: 'manage_partners', label: 'إدارة الجهات المرتبطة' },
      { value: 'create_external_partners', label: 'إضافة جهات خارجية' },
    ],
  },
  reports: {
    label: 'التقارير',
    permissions: [
      { value: 'view_reports', label: 'عرض التقارير' },
      { value: 'create_reports', label: 'إنشاء التقارير' },
      { value: 'export_reports', label: 'تصدير التقارير' },
    ],
  },
  drivers: {
    label: 'السائقين',
    permissions: [
      { value: 'view_drivers', label: 'عرض السائقين' },
      { value: 'manage_drivers', label: 'إدارة السائقين' },
    ],
  },
  settings: {
    label: 'الإعدادات',
    permissions: [
      { value: 'view_settings', label: 'عرض الإعدادات' },
      { value: 'manage_settings', label: 'تعديل الإعدادات' },
    ],
  },
};

export function useEmployeeManagement() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch employees for the organization
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data: employeeProfiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          employee_type,
          is_active,
          access_all_partners,
          access_all_waste_types,
          invitation_date,
          created_at
        `)
        .eq('organization_id', profile.organization_id)
        .neq('user_id', profile.user_id) // Exclude self
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch permissions for each employee
      const employeesWithDetails: Employee[] = await Promise.all(
        (employeeProfiles || []).map(async (emp) => {
          // Get permissions
          const { data: perms } = await supabase
            .from('employee_permissions')
            .select('permission_type')
            .eq('profile_id', emp.id);

          // Get partner access
          const { data: partnerAccess } = await supabase
            .from('employee_partner_access')
            .select(`
              partner_organization_id,
              external_partner_id
            `)
            .eq('profile_id', emp.id);

          // Get waste access
          const { data: wasteAccess } = await supabase
            .from('employee_waste_access')
            .select('waste_type')
            .eq('profile_id', emp.id);

          return {
            ...emp,
            permissions: perms?.map((p) => p.permission_type) || [],
            partner_access: partnerAccess || [],
            waste_access: wasteAccess?.map((w) => w.waste_type) || [],
          };
        })
      );

      return employeesWithDetails;
    },
    enabled: !!profile?.organization_id,
  });

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      setIsCreating(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مصرح');
      }

      const response = await supabase.functions.invoke('register-employee', {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في إنشاء الموظف');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('تم إنشاء حساب الموظف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreating(false);

      // Fire employee_invitation notification
      try {
        import('@/services/notificationTriggers').then(({ notifyMemberEvent }) => {
          if (data?.userId) {
            notifyMemberEvent({
              type: 'employee_invitation',
              targetUserId: data.userId,
              memberName: variables.fullName,
              orgId: profile?.organization_id || '',
            });
          }
        });
      } catch {}
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إنشاء الموظف');
      setIsCreating(false);
    },
  });

  // Update employee permissions
  const updatePermissions = useMutation({
    mutationFn: async ({
      profileId,
      permissions,
    }: {
      profileId: string;
      permissions: string[];
    }) => {
      // Delete existing permissions
      await supabase
        .from('employee_permissions')
        .delete()
        .eq('profile_id', profileId);

      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('employee_permissions')
          .insert(permissions.map((perm) => ({
            profile_id: profileId,
            permission_type: perm,
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('تم تحديث الصلاحيات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => {
      toast.error('فشل في تحديث الصلاحيات');
    },
  });

  // Toggle employee active status
  const toggleActive = useMutation({
    mutationFn: async ({ profileId, isActive }: { profileId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'تم تفعيل الموظف' : 'تم تعطيل الموظف');
      queryClient.invalidateQueries({ queryKey: ['employees'] });

      // Notify the employee about activation/deactivation
      try {
        const emp = employees?.find(e => e.id === variables.profileId);
        if (emp) {
          import('@/services/notificationTriggers').then(({ notifyMemberEvent }) => {
            notifyMemberEvent({
              type: variables.isActive ? 'employee_activated' : 'employee_deactivated',
              targetUserId: emp.user_id,
              memberName: emp.full_name,
              orgId: profile?.organization_id || '',
            });
          });
        }
      } catch {}
    },
    onError: () => {
      toast.error('فشل في تحديث حالة الموظف');
    },
  });

  return {
    employees: employees || [],
    isLoading,
    isCreating,
    createEmployee,
    updatePermissions,
    toggleActive,
  };
}
