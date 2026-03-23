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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, Phone, Clock, MapPin, Edit2, Trash2, UserCheck, HardHat } from 'lucide-react';

const CREW_TYPES: Record<string, string> = {
  manual_sweeping: 'كنس يدوي (مقشات)',
  mechanical_sweeping: 'كنس آلي (مكنسة كهربائية/ديزل)',
  bin_collection: 'جمع صناديق',
  door_to_door: 'جمع باب لباب',
  drain_cleaning: 'تنظيف بالوعات ومصارف',
  tree_trimming: 'تقليم أشجار ونظافة حدائق',
  special_ops: 'مهام خاصة (أعياد/مناسبات)',
  vacuum_sweeping: 'شفط أتربة',
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'نشط', variant: 'default' },
  on_break: { label: 'راحة', variant: 'secondary' },
  off_duty: { label: 'خارج الخدمة', variant: 'secondary' },
  suspended: { label: 'موقوف', variant: 'destructive' },
};

const SweepingCrewsPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<any>(null);
  const [form, setForm] = useState({
    crew_name: '', crew_code: '', crew_type: 'manual_sweeping', zone_id: '',
    supervisor_name: '', supervisor_phone: '', worker_count: '',
    shift_start: '06:00', shift_end: '14:00', equipment_summary: '', notes: '', status: 'active',
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones-crews', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name').eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: crews = [], isLoading } = useQuery({
    queryKey: ['sweeping-crews', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sweeping_crews').select('*, service_zones(zone_name)')
        .eq('organization_id', organization!.id).order('crew_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        crew_name: form.crew_name, crew_code: form.crew_code || null,
        crew_type: form.crew_type, zone_id: form.zone_id || null,
        supervisor_name: form.supervisor_name || null, supervisor_phone: form.supervisor_phone || null,
        worker_count: parseInt(form.worker_count) || 0,
        shift_start: form.shift_start, shift_end: form.shift_end,
        equipment_summary: form.equipment_summary || null, notes: form.notes || null,
        status: form.status,
      };
      if (editingCrew) {
        const { error } = await (supabase as any).from('sweeping_crews').update(payload).eq('id', editingCrew.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('sweeping_crews').insert({ ...payload, organization_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sweeping-crews'] });
      toast.success(editingCrew ? 'تم التحديث' : 'تم إضافة الطاقم');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sweeping_crews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sweeping-crews'] });
      toast.success('تم الحذف');
    },
  });

  const resetForm = () => {
    setForm({ crew_name: '', crew_code: '', crew_type: 'manual_sweeping', zone_id: '', supervisor_name: '', supervisor_phone: '', worker_count: '', shift_start: '06:00', shift_end: '14:00', equipment_summary: '', notes: '', status: 'active' });
    setEditingCrew(null);
    setDialogOpen(false);
  };

  const openEdit = (c: any) => {
    setEditingCrew(c);
    setForm({
      crew_name: c.crew_name, crew_code: c.crew_code || '', crew_type: c.crew_type,
      zone_id: c.zone_id || '', supervisor_name: c.supervisor_name || '',
      supervisor_phone: c.supervisor_phone || '', worker_count: c.worker_count?.toString() || '',
      shift_start: c.shift_start || '06:00', shift_end: c.shift_end || '14:00',
      equipment_summary: c.equipment_summary || '', notes: c.notes || '', status: c.status,
    });
    setDialogOpen(true);
  };

  const totalWorkers = crews.reduce((s: number, c: any) => s + (c.worker_count || 0), 0);
  const activeCrews = crews.filter((c: any) => c.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />
              طواقم الكنس والنظافة
            </h1>
            <p className="text-sm text-muted-foreground">{activeCrews} طاقم نشط • {totalWorkers} عامل</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة طاقم</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingCrew ? 'تعديل الطاقم' : 'إضافة طاقم جديد'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>اسم الطاقم</Label><Input value={form.crew_name} onChange={e => setForm(f => ({ ...f, crew_name: e.target.value }))} placeholder="طاقم كنس حي النزهة" /></div>
                  <div><Label>كود الطاقم</Label><Input value={form.crew_code} onChange={e => setForm(f => ({ ...f, crew_code: e.target.value }))} placeholder="CR-001" /></div>
                </div>
                <div>
                  <Label>نوع العمل</Label>
                  <Select value={form.crew_type} onValueChange={v => setForm(f => ({ ...f, crew_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CREW_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المنطقة</Label>
                  <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                    <SelectContent>{zones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.zone_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>اسم المشرف</Label><Input value={form.supervisor_name} onChange={e => setForm(f => ({ ...f, supervisor_name: e.target.value }))} /></div>
                  <div><Label>هاتف المشرف</Label><Input value={form.supervisor_phone} onChange={e => setForm(f => ({ ...f, supervisor_phone: e.target.value }))} placeholder="01xxxxxxxxx" /></div>
                </div>
                <div><Label>عدد العمال</Label><Input type="number" value={form.worker_count} onChange={e => setForm(f => ({ ...f, worker_count: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>بداية الوردية</Label><Input type="time" value={form.shift_start} onChange={e => setForm(f => ({ ...f, shift_start: e.target.value }))} /></div>
                  <div><Label>نهاية الوردية</Label><Input type="time" value={form.shift_end} onChange={e => setForm(f => ({ ...f, shift_end: e.target.value }))} /></div>
                </div>
                <div><Label>المعدات المتاحة</Label><Textarea value={form.equipment_summary} onChange={e => setForm(f => ({ ...f, equipment_summary: e.target.value }))} placeholder="5 مقشات، 3 عربات يد، 20 كيس بلاستيك..." /></div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => { if (!form.crew_name.trim()) return toast.error('اسم الطاقم مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  {editingCrew ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card><CardContent className="p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{activeCrews}</p>
            <p className="text-[10px] text-muted-foreground">طاقم نشط</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold">{totalWorkers}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي العمال</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{new Set(crews.filter((c: any) => c.zone_id).map((c: any) => c.zone_id)).size}</p>
            <p className="text-[10px] text-muted-foreground">منطقة مغطاة</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : crews.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">لا توجد طواقم مسجلة</p>
            <p className="text-xs mt-1">أضف طواقم الكنس والنظافة المسؤولة عن المناطق</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {crews.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HardHat className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{c.crew_name}</span>
                          {c.crew_code && <span className="text-xs text-muted-foreground">({c.crew_code})</span>}
                          <Badge variant={STATUS_MAP[c.status]?.variant || 'default'} className="text-[10px]">
                            {STATUS_MAP[c.status]?.label}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{CREW_TYPES[c.crew_type]}</Badge>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.worker_count} عامل</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.shift_start?.slice(0, 5)} - {c.shift_end?.slice(0, 5)}</span>
                          {c.service_zones && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.service_zones.zone_name}</span>}
                        </div>
                        {c.supervisor_name && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>مشرف: {c.supervisor_name}</span>
                            {c.supervisor_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.supervisor_phone}</span>}
                          </div>
                        )}
                        {c.equipment_summary && <p className="text-[10px] text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">🧹 {c.equipment_summary}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SweepingCrewsPage;
