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

export const useMyPermissions = () => {
  const { user, roles } = useAuth();
  
  const isAdmin = roles.includes('admin');
  const isCompanyAdmin = roles.includes('company_admin');
  const isEmployee = roles.includes('employee');

  // Fetch member_role from organization_members to determine management access
  const { data: memberRole } = useQuery({
    queryKey: ['my-member-role', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('organization_members')
        .select('member_role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      return (data?.member_role as string) || null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  // High-level member_roles get management access equivalent to company_admin
  const isManagementMember = !!memberRole && MANAGEMENT_MEMBER_ROLES.includes(memberRole);
  const effectiveCompanyAdmin = isCompanyAdmin || isManagementMember;

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

      // Fetch from employee_permissions table
      const { data: empPerms } = await supabase
        .from('employee_permissions')
        .select('permission_type')
        .eq('profile_id', profile.id);
      
      const empPermsList = empPerms?.map(p => p.permission_type) || [];

      // Also fetch from organization_members.granted_permissions
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('granted_permissions')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const grantedPerms = (memberData?.granted_permissions as string[]) || [];

      // Merge all permissions (both raw and mapped)
      const allPerms = [...new Set([...empPermsList, ...grantedPerms])];
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

  return {
    permissions,
    isLoading,
    isAdmin,
    isCompanyAdmin: effectiveCompanyAdmin,
    isEmployee: isEmployee && !effectiveCompanyAdmin,
    isManagementMember,
    memberRole,
    hasPermission,
    hasAnyPermission,
  };
};
