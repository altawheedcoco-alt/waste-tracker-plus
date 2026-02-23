import { ReactNode } from 'react';
import { useMyPermissions, EmployeePermission } from '@/hooks/useMyPermissions';

interface PermissionGateProps {
  children: ReactNode;
  permissions: EmployeePermission[];
  /** If true, user needs ALL listed permissions. Default: false (any one suffices). */
  requireAll?: boolean;
  /** What to render when access is denied */
  fallback?: ReactNode;
}

const PermissionGate = ({ children, permissions, requireAll = false, fallback = null }: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, isAdmin, isCompanyAdmin } = useMyPermissions();

  // Admins always pass
  if (isAdmin || isCompanyAdmin) return <>{children}</>;

  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : hasAnyPermission(...permissions);

  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
};

export default PermissionGate;
