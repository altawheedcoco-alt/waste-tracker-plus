import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type EmployeePermission = 
  | 'create_deposits' | 'view_deposits' | 'manage_deposits'
  | 'create_shipments' | 'view_shipments' | 'manage_shipments' | 'cancel_shipments'
  | 'view_accounts' | 'view_account_details' | 'export_accounts'
  | 'view_partners' | 'manage_partners' | 'create_external_partners' | 'view_partner_data'
  | 'view_reports' | 'create_reports' | 'export_reports'
  | 'view_drivers' | 'manage_drivers'
  | 'view_settings' | 'manage_settings'
  | 'manage_members'
  | 'print_documents' | 'share_documents'
  | 'full_access';

/** High-level member_roles that get management-level access */
const MANAGEMENT_MEMBER_ROLES = ['entity_head', 'assistant', 'deputy_assistant'];

export interface ScopedPermission {
  permission_key: string;
  scoped_partner_ids: string[];
}

export const useMyPermissions = () => {
  const { user, roles } = useAuth();
  
  const isAdmin = roles.includes('admin');
  const isCompanyAdmin = roles.includes('company_admin');
  const isEmployee = roles.includes('employee');

  // Fetch member info (role + type)
  const { data: memberInfo } = useQuery({
    queryKey: ['my-member-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('organization_members')
        .select('id, member_role, member_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      return data as { id: string; member_role: string; member_type: string } | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  const memberRole = memberInfo?.member_role || null;
  const memberType = (memberInfo?.member_type as string) || 'board_member';
  const isBoardMember = memberType === 'board_member';
  const isOperationalEmployee = memberType === 'employee';

  // High-level member_roles get management access equivalent to company_admin
  const isManagementMember = !!memberRole && MANAGEMENT_MEMBER_ROLES.includes(memberRole);
  const effectiveCompanyAdmin = isCompanyAdmin || (isManagementMember && isBoardMember);

  // Fetch scoped task assignments for employees
  const { data: taskAssignments = [] } = useQuery({
    queryKey: ['my-task-assignments', memberInfo?.id],
    queryFn: async (): Promise<ScopedPermission[]> => {
      if (!memberInfo?.id) return [];
      const { data } = await supabase
        .from('employee_task_assignments')
        .select('permission_key, scoped_partner_ids')
        .eq('member_id', memberInfo.id)
        .eq('is_active', true);
      return (data || []) as unknown as ScopedPermission[];
    },
    enabled: !!memberInfo?.id && isOperationalEmployee,
    staleTime: 1000 * 60 * 10,
  });

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return [];

      const { data: empPerms } = await supabase
        .from('employee_permissions')
        .select('permission_type')
        .eq('profile_id', profile.id);
      
      const empPermsList = empPerms?.map(p => p.permission_type) || [];

      const { data: memberData } = await supabase
        .from('organization_members')
        .select('granted_permissions')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const grantedPerms = (memberData?.granted_permissions as string[]) || [];

      // For operational employees, also include task-based permissions
      const taskPerms = taskAssignments.map(t => t.permission_key);

      const allPerms = [...new Set([...empPermsList, ...grantedPerms, ...taskPerms])];
      return allPerms;
    },
    enabled: !!user?.id && (isEmployee || isManagementMember),
    staleTime: 1000 * 60 * 10,
  });

  const hasPermission = (permission: EmployeePermission): boolean => {
    if (isAdmin || effectiveCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: EmployeePermission[]): boolean => {
    if (isAdmin || effectiveCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return perms.some(p => permissions.includes(p));
  };

  /**
   * Check if permission is scoped to specific partners.
   * Returns true if allowed for the given partnerId.
   * If no scoping (empty array), permission applies to ALL partners.
   */
  const hasPermissionForPartner = (permission: EmployeePermission, partnerId: string): boolean => {
    if (isAdmin || effectiveCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    
    // Board members with the permission have access to all partners
    if (isBoardMember && permissions.includes(permission)) return true;

    // For operational employees, check scoped assignments
    const assignment = taskAssignments.find(t => t.permission_key === permission);
    if (!assignment) return false;
    
    // Empty scoped_partner_ids means all partners
    if (!assignment.scoped_partner_ids?.length) return true;
    return assignment.scoped_partner_ids.includes(partnerId);
  };

  return {
    permissions,
    taskAssignments,
    isLoading,
    isAdmin,
    isCompanyAdmin: effectiveCompanyAdmin,
    isEmployee: isEmployee && !effectiveCompanyAdmin,
    isManagementMember,
    isBoardMember,
    isOperationalEmployee,
    memberRole,
    memberType,
    hasPermission,
    hasAnyPermission,
    hasPermissionForPartner,
  };
};
