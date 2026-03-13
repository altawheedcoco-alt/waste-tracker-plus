import { useMyPermissions, EmployeePermission } from '@/hooks/useMyPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, Lock, ExternalLink, Package, DollarSign, Users, FileText,
  Truck, Settings, Pen, Eye, Trash2, Download, Award, HandshakeIcon, MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PermItem { key: string; label: string; icon: LucideIcon }
interface PermissionSection {
  category: string;
  icon: LucideIcon;
  permissions: PermItem[];
  links: { label: string; path: string }[];
}

const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    category: 'الشحنات',
    icon: Package,
    permissions: [
      { key: 'view_shipments', label: 'عرض', icon: Eye },
      { key: 'create_shipments', label: 'إنشاء', icon: Pen },
      { key: 'edit_shipments', label: 'تعديل', icon: Pen },
      { key: 'approve_shipments', label: 'اعتماد', icon: ShieldCheck },
      { key: 'delete_shipments', label: 'حذف', icon: Trash2 },
    ],
    links: [
      { label: 'إدارة الشحنات', path: '/dashboard/shipments' },
      { label: 'إنشاء شحنة', path: '/dashboard/shipments/new' },
    ],
  },
  {
    category: 'المالية',
    icon: DollarSign,
    permissions: [
      { key: 'view_financials', label: 'عرض المالية', icon: Eye },
      { key: 'manage_deposits', label: 'إدارة الإيداعات', icon: DollarSign },
      { key: 'create_invoices', label: 'إنشاء فواتير', icon: FileText },
      { key: 'approve_payments', label: 'اعتماد مدفوعات', icon: ShieldCheck },
    ],
    links: [
      { label: 'الحسابات', path: '/dashboard/partner-accounts' },
    ],
  },
  {
    category: 'الشركاء',
    icon: Users,
    permissions: [
      { key: 'view_partner_data', label: 'عرض بيانات الشركاء', icon: Eye },
      { key: 'manage_partners', label: 'إدارة الشركاء', icon: HandshakeIcon },
    ],
    links: [
      { label: 'الشركاء', path: '/dashboard/partners' },
    ],
  },
  {
    category: 'السائقين والمركبات',
    icon: Truck,
    permissions: [
      { key: 'manage_drivers', label: 'إدارة السائقين', icon: Users },
      { key: 'assign_drivers', label: 'تعيين سائقين', icon: Pen },
      { key: 'track_vehicles', label: 'تتبع المركبات', icon: MapPin },
    ],
    links: [
      { label: 'السائقين', path: '/dashboard/transporter-drivers' },
      { label: 'التتبع', path: '/dashboard/tracking-center' },
    ],
  },
  {
    category: 'المستندات والتقارير',
    icon: FileText,
    permissions: [
      { key: 'view_reports', label: 'عرض التقارير', icon: Eye },
      { key: 'export_data', label: 'تصدير البيانات', icon: Download },
      { key: 'sign_documents', label: 'توقيع المستندات', icon: Pen },
      { key: 'issue_certificates', label: 'إصدار شهادات', icon: Award },
    ],
    links: [
      { label: 'التقارير', path: '/dashboard/reports' },
      { label: 'مركز المستندات', path: '/dashboard/document-center' },
    ],
  },
  {
    category: 'الإدارة',
    icon: Settings,
    permissions: [
      { key: 'manage_members', label: 'إدارة الأعضاء', icon: Users },
      { key: 'manage_contracts', label: 'إدارة العقود', icon: FileText },
      { key: 'manage_templates', label: 'إدارة القوالب', icon: FileText },
      { key: 'manage_settings', label: 'الإعدادات', icon: Settings },
    ],
    links: [
      { label: 'الإعدادات', path: '/dashboard/settings' },
      { label: 'الهيكل التنظيمي', path: '/dashboard/org-structure' },
    ],
  },
];

const MyPermissionsTab = () => {
  const { permissions, isAdmin, isCompanyAdmin } = useMyPermissions();
  const navigate = useNavigate();

  const hasPermission = (key: string) => {
    if (isAdmin || isCompanyAdmin) return true;
    return permissions.includes(key);
  };

  if (isAdmin || isCompanyAdmin) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold mt-4 mb-2">صلاحيات كاملة</h3>
          <p className="text-muted-foreground">
            {isAdmin ? 'أنت مدير النظام — لديك وصول كامل لجميع الأقسام' : 'أنت مدير المنظمة — لديك وصول كامل لجميع أقسام المنظمة'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const grantedCount = PERMISSION_SECTIONS.flatMap(s => s.permissions).filter(p => hasPermission(p.key)).length;
  const totalCount = PERMISSION_SECTIONS.flatMap(s => s.permissions).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
          <ShieldCheck className="w-4 h-4 text-primary" />
          {grantedCount} / {totalCount} صلاحية ممنوحة
        </Badge>
        <div className="flex-1 bg-muted rounded-full h-2.5 min-w-[100px]">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
            style={{ width: `${(grantedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {PERMISSION_SECTIONS.map((section, si) => {
          const granted = section.permissions.filter(p => hasPermission(p.key));
          const denied = section.permissions.filter(p => !hasPermission(p.key));

          return (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06 }}
            >
              <Card className={`border-border/30 h-full ${granted.length > 0 ? 'hover:border-primary/20' : 'opacity-60'} transition-all`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <section.icon className="w-4 h-4 text-primary" />
                      {section.category}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {granted.length}/{section.permissions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.permissions.map(p => {
                    const isGranted = hasPermission(p.key);
                    return (
                      <div key={p.key} className={`flex items-center gap-2 text-sm ${!isGranted ? 'text-muted-foreground/40' : ''}`}>
                        {isGranted ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className={!isGranted ? 'line-through' : ''}>{p.label}</span>
                      </div>
                    );
                  })}

                  {granted.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                      {section.links.map(link => (
                        <Button
                          key={link.path}
                          size="sm"
                          variant="outline"
                          className="text-[11px] gap-1 h-7 hover:bg-primary/5 hover:border-primary/30"
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MyPermissionsTab;
