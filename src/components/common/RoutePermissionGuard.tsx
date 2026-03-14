import { ReactNode } from 'react';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useLocation, Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Route-to-permission mapping.
 * Routes not listed here are accessible to all authenticated users.
 * If a route is listed, the employee must have at least ONE of the listed permissions.
 */
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Shipments
  '/dashboard/shipments': ['view_shipments', 'create_shipments', 'manage_shipments'],
  '/dashboard/transporter-shipments': ['view_shipments', 'create_shipments', 'manage_shipments'],
  '/dashboard/shipments/new': ['create_shipments'],
  '/dashboard/rejected-shipments': ['view_shipments', 'manage_shipments'],
  '/dashboard/recurring-shipments': ['create_shipments', 'manage_shipments'],
  '/dashboard/tracking-center': ['view_shipments', 'view_drivers'],
  '/dashboard/collection-requests': ['view_shipments', 'manage_shipments'],
  '/dashboard/manual-shipment': ['create_shipments'],
  '/dashboard/manual-shipment-drafts': ['view_shipments'],
  '/dashboard/bulk-weight-entries': ['manage_shipments'],
  '/dashboard/print-center': ['view_shipments', 'export_reports'],
  '/dashboard/shipment-routes': ['view_shipments'],
  
  // Finance
  '/dashboard/erp/accounting': ['view_accounts', 'view_account_details'],
  '/dashboard/erp/inventory': ['view_accounts'],
  '/dashboard/erp/purchasing-sales': ['view_accounts', 'create_deposits'],
  '/dashboard/erp/financial-dashboard': ['view_accounts', 'view_reports'],
  '/dashboard/erp/revenue-expenses': ['view_accounts'],
  '/dashboard/erp/cogs': ['view_accounts'],
  '/dashboard/erp/financial-comparisons': ['view_accounts', 'view_reports'],
  '/dashboard/deposits': ['view_deposits', 'create_deposits', 'manage_deposits'],
  '/dashboard/deposits/new': ['create_deposits'],
  
  // Drivers & Fleet
  '/dashboard/transporter-drivers': ['manage_drivers', 'view_drivers'],
  '/dashboard/driver-tracking': ['view_drivers', 'manage_drivers'],
  '/dashboard/driver-permits': ['manage_drivers'],
  '/dashboard/driver-academy': ['manage_drivers'],
  '/dashboard/driver-rewards': ['manage_drivers'],
  '/dashboard/preventive-maintenance': ['manage_drivers'],
  
  // Partners
  '/dashboard/partners': ['manage_partners', 'view_partners', 'view_partner_data'],
  '/dashboard/partner-accounts': ['manage_partners', 'view_partners'],
  
  // Reports
  '/dashboard/reports': ['view_reports', 'create_reports'],
  '/dashboard/shipment-reports': ['view_reports', 'view_shipments'],
  '/dashboard/aggregate-report': ['view_reports'],
  '/dashboard/non-hazardous-register': ['view_reports', 'view_shipments'],
  '/dashboard/hazardous-register': ['view_reports', 'view_shipments'],
  '/dashboard/data-export': ['export_reports', 'export_accounts'],
  
  // Management
  '/dashboard/org-structure': ['manage_members', 'manage_settings'],
  '/dashboard/employees': ['manage_members'],
  '/dashboard/team-credentials': ['manage_members'],
  '/dashboard/erp/hr': ['manage_members', 'manage_settings'],
  '/dashboard/hr/payroll': ['manage_members', 'manage_settings'],
  '/dashboard/hr/performance': ['manage_members'],
  '/dashboard/hr/shifts': ['manage_members'],
  '/dashboard/hr/end-of-service': ['manage_members', 'manage_settings'],
  '/dashboard/settings': ['manage_settings', 'view_settings'],
  '/dashboard/auto-actions': ['manage_settings'],
  '/dashboard/subscription': ['manage_settings'],
};

interface Props {
  children: ReactNode;
}

export default function RoutePermissionGuard({ children }: Props) {
  const { isAdmin, isCompanyAdmin, isEmployee, hasAnyPermission, permissions, isLoading } = useMyPermissions();
  const location = useLocation();

  // Admins and company admins bypass all permission checks
  if (isAdmin || isCompanyAdmin) return <>{children}</>;
  
  // Still loading permissions
  if (isLoading) return null;
  
  // Not an employee (e.g., company owner) — allow all
  if (!isEmployee) return <>{children}</>;
  
  // Full access employees bypass
  if (permissions.includes('full_access')) return <>{children}</>;

  // Find matching route (check exact first, then prefix)
  const path = location.pathname;
  let requiredPerms: string[] | undefined;
  
  // Exact match
  if (ROUTE_PERMISSIONS[path]) {
    requiredPerms = ROUTE_PERMISSIONS[path];
  } else {
    // Prefix match (for nested routes like /dashboard/shipments/123)
    const matchingRoute = Object.keys(ROUTE_PERMISSIONS)
      .filter(route => path.startsWith(route + '/'))
      .sort((a, b) => b.length - a.length)[0]; // longest match
    if (matchingRoute) {
      requiredPerms = ROUTE_PERMISSIONS[matchingRoute];
    }
  }

  // No permission requirement for this route
  if (!requiredPerms) return <>{children}</>;

  // Check if employee has any of the required permissions
  const hasAccess = requiredPerms.some(p => permissions.includes(p));

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">غير مصرح بالوصول</h2>
            <p className="text-muted-foreground text-sm">
              ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة. يرجى التواصل مع مسؤول الجهة لمنحك الصلاحيات المطلوبة.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              العودة للخلف
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
