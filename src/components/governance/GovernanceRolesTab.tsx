import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useGovernanceRoles, useRoleAssignments } from '@/hooks/useGovernance';
import { Plus, Shield, Trash2, UserPlus, Loader2, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PERMISSION_GROUPS = [
  {
    title: 'الشحنات',
    perms: [
      { key: 'can_approve_shipments', label: 'اعتماد الشحنات' },
    ],
  },
  {
    title: 'المالية',
    perms: [
      { key: 'can_approve_invoices', label: 'اعتماد الفواتير' },
      { key: 'can_approve_payments', label: 'اعتماد المدفوعات' },
      { key: 'can_view_financials', label: 'عرض البيانات المالية' },
    ],
  },
  {
    title: 'العقود',
    perms: [
      { key: 'can_approve_contracts', label: 'اعتماد العقود' },
    ],
  },
  {
    title: 'الإدارة',
    perms: [
      { key: 'can_manage_employees', label: 'إدارة الموظفين' },
      { key: 'can_export_data', label: 'تصدير البيانات' },
      { key: 'can_manage_settings', label: 'إدارة الإعدادات' },
    ],
  },
];

export default function GovernanceRolesTab() {
  const { roles, isLoading, createRole, deleteRole } = useGovernanceRoles();
  const { assignments, assignRole, removeAssignment } = useRoleAssignments();
  const { organization, profile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ role_name: '', role_name_en: '', description: '', hierarchy_level: 0, max_approval_amount: 0 });
  const [newPerms, setNewPerms] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Fetch org employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['org-employees', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('organization_id', organization!.id)
        .order('full_name');
      return data || [];
    },
    enabled: !!organization?.id && !!showAssign,
  });

  const handleCreateRole = () => {
    createRole.mutate({
      ...newRole,
      ...newPerms,
      created_by: profile?.id,
    } as any, {
      onSuccess: () => {
        setShowCreate(false);
        setNewRole({ role_name: '', role_name_en: '', description: '', hierarchy_level: 0, max_approval_amount: 0 });
        setNewPerms({});
      },
    });
  };

  const handleAssign = () => {
    if (!selectedEmployee || !showAssign) return;
    assignRole.mutate({ profile_id: selectedEmployee, role_id: showAssign, assigned_by: profile?.id }, {
      onSuccess: () => { setShowAssign(null); setSelectedEmployee(''); },
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">الأدوار الوظيفية المخصصة</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" /> إنشاء دور جديد</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء دور وظيفي جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>اسم الدور (عربي)*</Label>
                  <Input value={newRole.role_name} onChange={e => setNewRole(p => ({ ...p, role_name: e.target.value }))} placeholder="مثال: مدير مالي" />
                </div>
                <div>
                  <Label>اسم الدور (إنجليزي)</Label>
                  <Input value={newRole.role_name_en} onChange={e => setNewRole(p => ({ ...p, role_name_en: e.target.value }))} placeholder="e.g. Finance Manager" />
                </div>
              </div>
              <div>
                <Label>الوصف</Label>
                <Input value={newRole.description} onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المستوى الهرمي</Label>
                  <Input type="number" value={newRole.hierarchy_level} onChange={e => setNewRole(p => ({ ...p, hierarchy_level: +e.target.value }))} />
                </div>
                <div>
                  <Label>الحد الأقصى للاعتماد المالي</Label>
                  <Input type="number" value={newRole.max_approval_amount} onChange={e => setNewRole(p => ({ ...p, max_approval_amount: +e.target.value }))} />
                </div>
              </div>

              <Separator />
              <h4 className="font-semibold text-sm">الصلاحيات</h4>
              {PERMISSION_GROUPS.map(group => (
                <div key={group.title}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{group.title}</p>
                  {group.perms.map(p => (
                    <div key={p.key} className="flex items-center justify-between py-1.5">
                      <Label className="text-sm">{p.label}</Label>
                      <Switch checked={newPerms[p.key] || false} onCheckedChange={v => setNewPerms(prev => ({ ...prev, [p.key]: v }))} />
                    </div>
                  ))}
                </div>
              ))}

              <Button onClick={handleCreateRole} disabled={!newRole.role_name || createRole.isPending} className="w-full">
                {createRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الدور'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {roles.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">لم يتم إنشاء أدوار بعد. ابدأ بإنشاء دور وظيفي مخصص.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => {
          const roleAssignments = assignments.filter(a => a.role_id === role.id);
          return (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {role.role_name}
                    {role.role_name_en && <span className="text-xs text-muted-foreground">({role.role_name_en})</span>}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setShowAssign(role.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRole.mutate(role.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">المستوى {role.hierarchy_level}</Badge>
                  {role.max_approval_amount > 0 && <Badge variant="outline">حد الاعتماد: {role.max_approval_amount.toLocaleString()}</Badge>}
                  {role.can_approve_shipments && <Badge className="bg-blue-100 text-blue-800">شحنات</Badge>}
                  {role.can_approve_invoices && <Badge className="bg-emerald-100 text-emerald-800">فواتير</Badge>}
                  {role.can_approve_payments && <Badge className="bg-purple-100 text-purple-800">مدفوعات</Badge>}
                  {role.can_manage_employees && <Badge className="bg-amber-100 text-amber-800">موظفين</Badge>}
                </div>
                {roleAssignments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">المعيّنون:</p>
                    {roleAssignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-xs bg-muted/50 p-1.5 rounded">
                        <span>{(a.profile as any)?.full_name || 'موظف'}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removeAssignment.mutate(a.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assign Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعيين موظف للدور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {employees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssign} disabled={!selectedEmployee || assignRole.isPending} className="w-full">
              {assignRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تعيين'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
