import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, AlertTriangle, Banknote, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';

const violationTypes = [
  { value: 'missed_collection', label: 'عدم رفع صندوق' },
  { value: 'late_collection', label: 'تأخر عن الموعد' },
  { value: 'scattered_waste', label: 'ترك مخلفات متناثرة' },
  { value: 'unwashed_bin', label: 'عدم غسل الصندوق' },
  { value: 'absent_crew', label: 'غياب طاقم' },
  { value: 'missing_equipment', label: 'نقص معدات السلامة' },
  { value: 'citizen_complaint', label: 'شكوى مواطن مؤكدة' },
  { value: 'other', label: 'أخرى' },
];

const PenaltiesManagement = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    violation_type: 'missed_collection', description: '', amount: '',
    zone_name: '', crew_name: '', penalty_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: penalties = [], isLoading } = useQuery({
    queryKey: ['contract-penalties', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('contract_penalties')
        .select('*').eq('organization_id', organization!.id).order('penalty_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('contract_penalties').insert({
        organization_id: organization!.id,
        penalty_type: form.violation_type,
        description: form.description,
        amount: Number(form.amount) || 0,
        penalty_date: form.penalty_date,
        status: 'pending',
        metadata: { zone_name: form.zone_name, crew_name: form.crew_name },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-penalties'] });
      toast.success('تم تسجيل المخالفة');
      setOpen(false);
    },
    onError: () => toast.error('فشل في تسجيل المخالفة'),
  });

  const totalAmount = penalties.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const pendingCount = penalties.filter((p: any) => p.status === 'pending').length;
  const monthlyPenalties = penalties.filter((p: any) => {
    const d = new Date(p.penalty_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">الغرامات والجزاءات</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive"><Plus className="w-4 h-4 ml-1" />تسجيل مخالفة</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تسجيل مخالفة جديدة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>نوع المخالفة</Label>
                  <Select value={form.violation_type} onValueChange={v => setForm(p => ({ ...p, violation_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{violationTypes.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>المنطقة</Label><Input value={form.zone_name} onChange={e => setForm(p => ({ ...p, zone_name: e.target.value }))} /></div>
                  <div><Label>الطاقم</Label><Input value={form.crew_name} onChange={e => setForm(p => ({ ...p, crew_name: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>قيمة الغرامة (ج.م)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.penalty_date} onChange={e => setForm(p => ({ ...p, penalty_date: e.target.value }))} /></div>
                </div>
                <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <Button className="w-full" variant="destructive" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.amount}>
                  {addMutation.isPending ? 'جاري الحفظ...' : 'تسجيل المخالفة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center">
            <Banknote className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold text-destructive">{totalAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الغرامات</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <FileWarning className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">معلقة</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{monthlyPenalties.length}</p>
            <p className="text-[10px] text-muted-foreground">هذا الشهر</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : penalties.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مخالفات مسجلة</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {penalties.map((p: any) => {
              const vt = violationTypes.find(v => v.value === p.penalty_type);
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{vt?.label || p.penalty_type}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.penalty_date), 'yyyy/MM/dd')}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-destructive">{Number(p.amount).toLocaleString()} ج.م</p>
                      <StatusBadge level={p.status === 'applied' ? 'danger' : p.status === 'waived' ? 'success' : 'warning'}>
                        {p.status === 'applied' ? 'مُطبقة' : p.status === 'waived' ? 'تم التنازل' : 'معلقة'}
                      </StatusBadge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PenaltiesManagement;
