import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type EmployeePermission = 
  | 'create_deposits' | 'view_deposits' | 'manage_deposits'
  | 'create_shipments' | 'view_shipments' | 'manage_shipments' | 'cancel_shipments'
  | 'view_accounts' | 'view_account_details' | 'export_accounts'
  | 'view_partners' | 'manage_partners' | 'create_external_partners'
  | 'view_reports' | 'create_reports' | 'export_reports'
  | 'view_drivers' | 'manage_drivers'
  | 'view_settings' | 'manage_settings'
  | 'full_access';

export const useMyPermissions = () => {
  const { user, roles } = useAuth();
  
  const isAdmin = roles.includes('admin');
  const isCompanyAdmin = roles.includes('company_admin');
  const isEmployee = roles.includes('employee');

  // Mapping from member permissions to employee permissions
  const MEMBER_TO_EMPLOYEE_MAP: Record<string, string[]> = {
    create_shipments: ['create_shipments'],
    view_shipments: ['view_shipments'],
    edit_shipments: ['manage_shipments'],
    delete_shipments: ['manage_shipments'],
    approve_shipments: ['manage_shipments'],
    view_financials: ['view_accounts', 'view_account_details'],
    create_invoices: ['create_deposits'],
    approve_payments: ['manage_deposits'],
    manage_deposits: ['manage_deposits', 'create_deposits', 'view_deposits'],
    manage_drivers: ['manage_drivers', 'view_drivers'],
    assign_drivers: ['manage_drivers'],
    track_vehicles: ['view_drivers'],
    manage_partners: ['manage_partners', 'view_partners', 'create_external_partners'],
    view_partner_data: ['view_partners'],
    manage_members: ['manage_settings'],
    manage_settings: ['manage_settings', 'view_settings'],
    view_reports: ['view_reports', 'create_reports'],
    export_data: ['export_reports', 'export_accounts'],
    sign_documents: ['view_reports'],
    issue_certificates: ['view_reports'],
    manage_templates: ['manage_settings'],
    manage_contracts: ['manage_settings'],
  };

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];
      
      // Get profile id first
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
      
      // Map member permissions to employee permission types
      const mappedPerms: string[] = [];
      for (const perm of grantedPerms) {
        const mapped = MEMBER_TO_EMPLOYEE_MAP[perm];
        if (mapped) {
          mappedPerms.push(...mapped);
        }
        // Also include the raw permission for direct matching
        mappedPerms.push(perm);
      }

      // Merge and deduplicate
      const allPerms = [...new Set([...empPermsList, ...mappedPerms])];
      return allPerms;
    },
    enabled: !!user?.id && isEmployee,
    staleTime: 1000 * 60 * 10,
  });

  const hasPermission = (permission: EmployeePermission): boolean => {
    if (isAdmin || isCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: EmployeePermission[]): boolean => {
    if (isAdmin || isCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return perms.some(p => permissions.includes(p));
  };

  return {
    permissions,
    isLoading,
    isAdmin,
    isCompanyAdmin,
    isEmployee,
    hasPermission,
    hasAnyPermission,
  };
};
