import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, UserCheck, UserX, Clock, Calendar, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const WORKER_ROLES: Record<string, string> = {
  sweeper: 'عامل كنس',
  collector: 'عامل جمع',
  driver: 'سائق',
  loader: 'عامل تحميل',
  supervisor: 'مشرف',
  mechanic: 'ميكانيكي',
  guard: 'حارس',
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  present: { label: 'حاضر', color: 'bg-emerald-100 text-emerald-800', icon: UserCheck },
  absent: { label: 'غائب', color: 'bg-red-100 text-red-800', icon: UserX },
  late: { label: 'متأخر', color: 'bg-amber-100 text-amber-800', icon: Clock },
  sick_leave: { label: 'إجازة مرضية', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  annual_leave: { label: 'إجازة سنوية', color: 'bg-purple-100 text-purple-800', icon: Calendar },
  excused: { label: 'إذن', color: 'bg-gray-100 text-gray-800', icon: UserCheck },
};

const DailyAttendancePage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    worker_name: '', worker_code: '', worker_role: 'sweeper', crew_id: '',
    status: 'present', check_in_time: '', check_out_time: '',
    daily_rate: '', overtime_hours: '0', deductions: '0', bonus: '0', notes: '',
  });

  const { data: crews = [] } = useQuery({
    queryKey: ['crews-attendance', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('sweeping_crews').select('id, crew_name').eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['daily-attendance', organization?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('daily_attendance').select('*, sweeping_crews(crew_name)')
        .eq('organization_id', organization!.id).eq('attendance_date', selectedDate)
        .order('worker_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('daily_attendance').insert({
        organization_id: organization!.id,
        attendance_date: selectedDate,
        worker_name: form.worker_name, worker_code: form.worker_code || null,
        worker_role: form.worker_role, crew_id: form.crew_id || null,
        status: form.status,
        check_in_time: form.check_in_time ? new Date(`${selectedDate}T${form.check_in_time}`).toISOString() : null,
        check_out_time: form.check_out_time ? new Date(`${selectedDate}T${form.check_out_time}`).toISOString() : null,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
        overtime_hours: parseFloat(form.overtime_hours) || 0,
        deductions: parseFloat(form.deductions) || 0,
        bonus: parseFloat(form.bonus) || 0,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      toast.success('تم تسجيل الحضور');
      setDialogOpen(false);
      setForm({ worker_name: '', worker_code: '', worker_role: 'sweeper', crew_id: '', status: 'present', check_in_time: '', check_out_time: '', daily_rate: '', overtime_hours: '0', deductions: '0', bonus: '0', notes: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const quickMark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'present' && !records.find((r: any) => r.id === id)?.check_in_time) {
        updates.check_in_time = new Date().toISOString();
      }
      const { error } = await (supabase as any).from('daily_attendance').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      toast.success('تم التحديث');
    },
  });

  const presentCount = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
  const absentCount = records.filter((r: any) => r.status === 'absent').length;
  const totalCost = records.reduce((s: number, r: any) => {
    if (r.status === 'absent') return s;
    return s + (r.daily_rate || 0) + ((r.overtime_hours || 0) * ((r.daily_rate || 0) / 8) * 1.5) + (r.bonus || 0) - (r.deductions || 0);
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" />حضور وانصراف العمال</h1>
            <p className="text-sm text-muted-foreground">{records.length} عامل مسجل لهذا اليوم</p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-36" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 me-1" />تسجيل عامل</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>تسجيل حضور عامل</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>اسم العامل</Label><Input value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} placeholder="محمد أحمد" /></div>
                    <div><Label>كود العامل</Label><Input value={form.worker_code} onChange={e => setForm(f => ({ ...f, worker_code: e.target.value }))} placeholder="W-001" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>الوظيفة</Label>
                      <Select value={form.worker_role} onValueChange={v => setForm(f => ({ ...f, worker_role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(WORKER_ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الطاقم</Label>
                      <Select value={form.crew_id} onValueChange={v => setForm(f => ({ ...f, crew_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                        <SelectContent>{crews.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.crew_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>الحالة</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>وقت الحضور</Label><Input type="time" value={form.check_in_time} onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} /></div>
                    <div><Label>وقت الانصراف</Label><Input type="time" value={form.check_out_time} onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>اليومية (ج.م)</Label><Input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="200" /></div>
                    <div><Label>ساعات إضافية</Label><Input type="number" step="0.5" value={form.overtime_hours} onChange={e => setForm(f => ({ ...f, overtime_hours: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>خصومات (ج.م)</Label><Input type="number" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} /></div>
                    <div><Label>مكافأة (ج.م)</Label><Input type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} /></div>
                  </div>
                  <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => { if (!form.worker_name.trim()) return toast.error('اسم العامل مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                    تسجيل
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card><CardContent className="p-3 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold">{presentCount}</p>
            <p className="text-[10px] text-muted-foreground">حاضر</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <UserX className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold">{absentCount}</p>
            <p className="text-[10px] text-muted-foreground">غائب</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalCost.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">تكلفة اليوم (ج.م)</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : records.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">لا يوجد سجلات حضور لهذا اليوم</p>
            <p className="text-xs mt-1">ابدأ بتسجيل حضور العمال</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {records.map((r: any) => {
              const sCfg = STATUS_MAP[r.status] || STATUS_MAP.present;
              const Icon = sCfg.icon;
              return (
                <Card key={r.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${sCfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{r.worker_name}</span>
                            {r.worker_code && <span className="text-[10px] text-muted-foreground">({r.worker_code})</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{WORKER_ROLES[r.worker_role]}</span>
                            {r.sweeping_crews && <span>• {r.sweeping_crews.crew_name}</span>}
                            {r.check_in_time && <span>• ⏰ {format(new Date(r.check_in_time), 'HH:mm')}</span>}
                            {r.check_out_time && <span>→ {format(new Date(r.check_out_time), 'HH:mm')}</span>}
                          </div>
                          {r.daily_rate && <span className="text-[10px] text-muted-foreground">{r.daily_rate} ج.م {r.overtime_hours > 0 ? `+ ${r.overtime_hours}س إضافي` : ''}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {r.status === 'absent' && (
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => quickMark.mutate({ id: r.id, status: 'present' })}>
                            حضر
                          </Button>
                        )}
                        {r.status === 'present' && !r.check_out_time && (
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => {
                            (supabase as any).from('daily_attendance').update({ check_out_time: new Date().toISOString() }).eq('id', r.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
                              toast.success('تم تسجيل الانصراف');
                            });
                          }}>
                            انصراف
                          </Button>
                        )}
                      </div>
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

export default DailyAttendancePage;
