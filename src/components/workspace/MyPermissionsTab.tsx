import { useMyPermissions, EmployeePermission } from '@/hooks/useMyPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, ExternalLink, Package, DollarSign, Users, FileText, Truck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface PermissionSection {
  category: string;
  icon: LucideIcon;
  permissions: { key: EmployeePermission; label: string }[];
  links: { label: string; path: string }[];
}

const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    category: 'الشحنات',
    icon: Package,
    permissions: [
      { key: 'view_shipments', label: 'عرض الشحنات' },
      { key: 'create_shipments', label: 'إنشاء شحنات' },
      { key: 'manage_shipments', label: 'إدارة الشحنات' },
      { key: 'cancel_shipments', label: 'إلغاء الشحنات' },
    ],
    links: [
      { label: 'إدارة الشحنات', path: '/dashboard/shipments' },
      { label: 'إنشاء شحنة', path: '/dashboard/shipments/new' },
    ],
  },
  {
    category: 'الإيداعات',
    icon: DollarSign,
    permissions: [
      { key: 'view_deposits', label: 'عرض الإيداعات' },
      { key: 'create_deposits', label: 'إنشاء إيداعات' },
      { key: 'manage_deposits', label: 'إدارة الإيداعات' },
    ],
    links: [
      { label: 'الحسابات المالية', path: '/dashboard/partner-accounts' },
    ],
  },
  {
    category: 'الحسابات',
    icon: FileText,
    permissions: [
      { key: 'view_accounts', label: 'عرض الحسابات' },
      { key: 'view_account_details', label: 'تفاصيل الحسابات' },
      { key: 'export_accounts', label: 'تصدير الحسابات' },
    ],
    links: [
      { label: 'الحسابات', path: '/dashboard/partner-accounts' },
    ],
  },
  {
    category: 'الشركاء',
    icon: Users,
    permissions: [
      { key: 'view_partners', label: 'عرض الشركاء' },
      { key: 'manage_partners', label: 'إدارة الشركاء' },
      { key: 'create_external_partners', label: 'إضافة شركاء خارجيين' },
    ],
    links: [
      { label: 'الشركاء', path: '/dashboard/partners' },
    ],
  },
  {
    category: 'السائقين',
    icon: Truck,
    permissions: [
      { key: 'view_drivers', label: 'عرض السائقين' },
      { key: 'manage_drivers', label: 'إدارة السائقين' },
    ],
    links: [
      { label: 'السائقين', path: '/dashboard/transporter-drivers' },
    ],
  },
  {
    category: 'التقارير',
    icon: FileText,
    permissions: [
      { key: 'view_reports', label: 'عرض التقارير' },
      { key: 'create_reports', label: 'إنشاء تقارير' },
      { key: 'export_reports', label: 'تصدير التقارير' },
    ],
    links: [
      { label: 'التقارير', path: '/dashboard/reports' },
    ],
  },
  {
    category: 'الإعدادات',
    icon: Settings,
    permissions: [
      { key: 'view_settings', label: 'عرض الإعدادات' },
      { key: 'manage_settings', label: 'إدارة الإعدادات' },
    ],
    links: [
      { label: 'الإعدادات', path: '/dashboard/settings' },
    ],
  },
];

const MyPermissionsTab = () => {
  const { permissions, hasPermission, isAdmin, isCompanyAdmin } = useMyPermissions();
  const navigate = useNavigate();

  if (isAdmin || isCompanyAdmin) {
    return (
      <Card className="border-emerald-500/20">
        <CardContent className="p-8 text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">صلاحيات كاملة</h3>
          <p className="text-muted-foreground">
            {isAdmin ? 'أنت مدير النظام — لديك وصول كامل لجميع الأقسام' : 'أنت مدير المنظمة — لديك وصول كامل لجميع أقسام المنظمة'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="w-3 h-3" />
          {permissions.length} صلاحية ممنوحة
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PERMISSION_SECTIONS.map(section => {
          const granted = section.permissions.filter(p => hasPermission(p.key));
          const denied = section.permissions.filter(p => !hasPermission(p.key));
          if (granted.length === 0 && denied.length === 0) return null;

          return (
            <Card key={section.category} className="border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <section.icon className="w-4 h-4 text-primary" />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Granted */}
                {granted.map(p => (
                  <div key={p.key} className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{p.label}</span>
                  </div>
                ))}
                {/* Denied */}
                {denied.map(p => (
                  <div key={p.key} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-through">{p.label}</span>
                  </div>
                ))}

                {/* Quick links for granted */}
                {granted.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                    {section.links.map(link => (
                      <Button
                        key={link.path}
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 h-7"
                        onClick={() => navigate(link.path)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyPermissionsTab;
