import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Crown, Plus, Shield, CheckCircle2 } from 'lucide-react';
import { useSovereignGovernance, SOVEREIGN_ROLE_LABELS } from '@/hooks/useSovereignGovernance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SovereignRolesPanel = () => {
  const { roles, assignRole } = useSovereignGovernance();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [notes, setNotes] = useState('');

  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users-for-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .limit(100);
      return data || [];
    },
  });

  const handleAssign = () => {
    if (!selectedUser || !selectedRole) return;
    assignRole.mutate({ user_id: selectedUser, role: selectedRole, notes }, {
      onSuccess: () => { setOpen(false); setSelectedRole(''); setSelectedUser(''); setNotes(''); },
    });
  };

  const roleStats = Object.keys(SOVEREIGN_ROLE_LABELS).map(role => ({
    role,
    ...SOVEREIGN_ROLE_LABELS[role],
    count: roles.filter(r => r.role === role).length,
  }));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">الأدوار السيادية</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />تعيين دور</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>تعيين دور سيادي جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOVEREIGN_ROLE_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.icon} {val.ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="اختر المستخدم" /></SelectTrigger>
                <SelectContent>
                  {(adminUsers || []).map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} />
              <Button onClick={handleAssign} disabled={assignRole.isPending} className="w-full">
                {assignRole.isPending ? 'جاري التعيين...' : 'تأكيد التعيين'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {roleStats.map(rs => (
          <Card key={rs.role} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{rs.icon}</div>
              <div className={`text-xl font-bold ${rs.color}`}>{rs.count}</div>
              <div className="text-xs text-muted-foreground">{rs.ar}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Roles List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            الأدوار المعيّنة حالياً ({roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لم يتم تعيين أي أدوار سيادية بعد</p>
          ) : (
            <div className="space-y-2">
              {roles.map(r => {
                const label = SOVEREIGN_ROLE_LABELS[r.role];
                const user = adminUsers?.find(u => u.user_id === r.user_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{label?.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{user?.full_name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">{label?.ar}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />
                        نشط
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SovereignRolesPanel;
