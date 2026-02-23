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

      const { data, error } = await supabase
        .from('employee_permissions')
        .select('permission_type')
        .eq('profile_id', profile.id);
      
      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      
      return data?.map(p => p.permission_type) || [];
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
