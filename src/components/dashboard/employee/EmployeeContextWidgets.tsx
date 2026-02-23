import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PermissionGate from '@/components/common/PermissionGate';
import {
  Package, Truck, Recycle, Factory, Briefcase,
  FileCheck, Scale, MapPin, ClipboardList
} from 'lucide-react';

interface Props {
  orgType: string;
}

/** Contextual quick actions that adapt based on the parent org type */
const EmployeeContextWidgets = ({ orgType }: Props) => {
  const navigate = useNavigate();

  const contextActions: Record<string, Array<{ label: string; icon: React.ElementType; path: string; permission: string[] }>> = {
    generator: [
      { label: 'طلب شحنة جديدة', icon: Package, path: '/dashboard/shipments', permission: ['create_shipments'] },
      { label: 'المستندات البيئية', icon: FileCheck, path: '/dashboard/documents', permission: ['view_reports'] },
      { label: 'الجهات المرتبطة', icon: Briefcase, path: '/dashboard/partners', permission: ['view_partners'] },
    ],
    transporter: [
      { label: 'إدارة الشحنات', icon: Truck, path: '/dashboard/shipments', permission: ['view_shipments'] },
      { label: 'تتبع السائقين', icon: MapPin, path: '/dashboard/fleet', permission: ['view_drivers'] },
      { label: 'الموافقات المعلقة', icon: ClipboardList, path: '/dashboard/approvals', permission: ['manage_shipments'] },
    ],
    recycler: [
      { label: 'الشحنات الواردة', icon: Package, path: '/dashboard/shipments', permission: ['view_shipments'] },
      { label: 'إدارة المخزون', icon: Scale, path: '/dashboard/inventory', permission: ['view_reports'] },
      { label: 'شهادات التدوير', icon: FileCheck, path: '/dashboard/certificates', permission: ['view_reports'] },
    ],
    disposal: [
      { label: 'العمليات الواردة', icon: Factory, path: '/dashboard/operations', permission: ['view_shipments'] },
      { label: 'سجل الموازين', icon: Scale, path: '/dashboard/weighbridge', permission: ['view_reports'] },
      { label: 'تقارير الامتثال', icon: FileCheck, path: '/dashboard/compliance', permission: ['view_reports'] },
    ],
    transport_office: [
      { label: 'إدارة الأسطول', icon: Truck, path: '/dashboard/fleet', permission: ['view_drivers'] },
      { label: 'الحجوزات', icon: ClipboardList, path: '/dashboard/bookings', permission: ['view_shipments'] },
      { label: 'صيانة المركبات', icon: Recycle, path: '/dashboard/maintenance', permission: ['manage_drivers'] },
    ],
    consultant: [
      { label: 'عملائي', icon: Briefcase, path: '/dashboard/clients', permission: ['view_partners'] },
      { label: 'التقارير الاستشارية', icon: FileCheck, path: '/dashboard/reports', permission: ['view_reports'] },
    ],
    consulting_office: [
      { label: 'فريق الاستشاريين', icon: Briefcase, path: '/dashboard/team', permission: ['view_partners'] },
      { label: 'المشاريع النشطة', icon: ClipboardList, path: '/dashboard/projects', permission: ['view_reports'] },
    ],
    iso_body: [
      { label: 'جلسات التدقيق', icon: FileCheck, path: '/dashboard/audits', permission: ['view_reports'] },
      { label: 'الشهادات', icon: Scale, path: '/dashboard/certificates', permission: ['view_reports'] },
    ],
  };

  const actions = contextActions[orgType] || [];

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {actions.map((action, i) => (
            <PermissionGate key={i} permissions={action.permission as any}>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </PermissionGate>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeContextWidgets;
