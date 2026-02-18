import { usePositionPermissions } from '@/hooks/useOrgMembers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  positionId: string;
  open: boolean;
  onClose: () => void;
}

const permissionGroups = [
  {
    title: 'الشحنات',
    permissions: [
      { key: 'can_create_shipments', label: 'إنشاء شحنات' },
      { key: 'can_edit_shipments', label: 'تعديل شحنات' },
      { key: 'can_delete_shipments', label: 'حذف شحنات' },
      { key: 'can_approve_shipments', label: 'اعتماد شحنات' },
      { key: 'can_change_status', label: 'تغيير الحالة' },
    ],
  },
  {
    title: 'المالية',
    permissions: [
      { key: 'can_view_financials', label: 'عرض البيانات المالية' },
      { key: 'can_create_invoices', label: 'إنشاء فواتير' },
      { key: 'can_approve_payments', label: 'اعتماد مدفوعات' },
      { key: 'can_manage_deposits', label: 'إدارة الإيداعات' },
    ],
  },
  {
    title: 'السائقين والمركبات',
    permissions: [
      { key: 'can_manage_drivers', label: 'إدارة السائقين' },
      { key: 'can_assign_drivers', label: 'تعيين السائقين' },
      { key: 'can_track_vehicles', label: 'تتبع المركبات' },
    ],
  },
  {
    title: 'الإدارة',
    permissions: [
      { key: 'can_manage_users', label: 'إدارة المستخدمين' },
      { key: 'can_manage_settings', label: 'إدارة الإعدادات' },
      { key: 'can_view_reports', label: 'عرض التقارير' },
      { key: 'can_export_data', label: 'تصدير البيانات' },
      { key: 'can_manage_contracts', label: 'إدارة العقود' },
    ],
  },
  {
    title: 'الجهات المرتبطة والمستندات',
    permissions: [
      { key: 'can_manage_partners', label: 'إدارة الجهات المرتبطة' },
      { key: 'can_view_partner_data', label: 'عرض بيانات الجهات المرتبطة' },
      { key: 'can_sign_documents', label: 'توقيع المستندات' },
      { key: 'can_issue_certificates', label: 'إصدار شهادات' },
      { key: 'can_manage_templates', label: 'إدارة القوالب' },
    ],
  },
];

export default function PositionPermissionsEditor({ positionId, open, onClose }: Props) {
  const { permissions, isLoading, updatePermissions } = usePositionPermissions(positionId);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (permissions) {
      const perms: Record<string, boolean> = {};
      permissionGroups.forEach(g => g.permissions.forEach(p => {
        perms[p.key] = (permissions as any)[p.key] || false;
      }));
      setLocalPerms(perms);
    }
  }, [permissions]);

  const togglePerm = (key: string) => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (group: typeof permissionGroups[0], value: boolean) => {
    const updates: Record<string, boolean> = {};
    group.permissions.forEach(p => { updates[p.key] = value; });
    setLocalPerms(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    updatePermissions.mutate(localPerms as any, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            صلاحيات المنصب
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-5 mt-2">
            {permissionGroups.map(group => {
              const allOn = group.permissions.every(p => localPerms[p.key]);
              return (
                <div key={group.title}>
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleGroup(group, !allOn)}>
                      {allOn ? 'إلغاء الكل' : 'تحديد الكل'}
                    </Button>
                    <h4 className="font-semibold text-sm">{group.title}</h4>
                  </div>
                  <div className="space-y-2">
                    {group.permissions.map(perm => (
                      <div key={perm.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <Switch checked={localPerms[perm.key] || false} onCheckedChange={() => togglePerm(perm.key)} />
                        <Label className="text-sm cursor-pointer">{perm.label}</Label>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-3" />
                </div>
              );
            })}

            <Button onClick={handleSave} disabled={updatePermissions.isPending} className="w-full">
              {updatePermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الصلاحيات'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
