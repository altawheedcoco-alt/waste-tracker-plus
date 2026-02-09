import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const MaintenanceScheduler = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicle_plate: '',
    maintenance_type: '',
    description: '',
    cost: '',
    odometer_km: '',
    next_maintenance_km: '',
    next_maintenance_date: '',
    performed_at: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['vehicle-maintenance', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('performed_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addRecord = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vehicle_maintenance').insert({
        organization_id: organization!.id,
        vehicle_plate: form.vehicle_plate,
        maintenance_type: form.maintenance_type,
        description: form.description || null,
        cost: Number(form.cost) || 0,
        odometer_km: Number(form.odometer_km) || null,
        next_maintenance_km: Number(form.next_maintenance_km) || null,
        next_maintenance_date: form.next_maintenance_date || null,
        performed_at: form.performed_at,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-maintenance'] });
      toast.success('تم تسجيل الصيانة');
      setOpen(false);
      setForm({ vehicle_plate: '', maintenance_type: '', description: '', cost: '', odometer_km: '', next_maintenance_km: '', next_maintenance_date: '', performed_at: new Date().toISOString().split('T')[0], notes: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  // Upcoming maintenance alerts
  const now = new Date();
  const upcoming = records.filter(r => {
    if (!r.next_maintenance_date) return false;
    const days = differenceInDays(new Date(r.next_maintenance_date), now);
    return days >= 0 && days <= 14;
  });

  const overdue = records.filter(r => {
    if (!r.next_maintenance_date) return false;
    return new Date(r.next_maintenance_date) < now;
  });

  const maintenanceTypes = ['تغيير زيت', 'إطارات', 'فرامل', 'فلاتر', 'بطارية', 'فحص دوري', 'كهرباء', 'أخرى'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> تسجيل صيانة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader><DialogTitle>تسجيل صيانة مركبة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>لوحة المركبة</Label><Input value={form.vehicle_plate} onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))} placeholder="أ ب ج 1234" /></div>
                  <div>
                    <Label>نوع الصيانة</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))}>
                      <option value="">اختر</option>
                      {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div><Label>الوصف</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="اختياري" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>التكلفة</Label><Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" /></div>
                  <div><Label>عداد الكيلومترات</Label><Input type="number" value={form.odometer_km} onChange={e => setForm(f => ({ ...f, odometer_km: e.target.value }))} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الصيانة القادمة (كم)</Label><Input type="number" value={form.next_maintenance_km} onChange={e => setForm(f => ({ ...f, next_maintenance_km: e.target.value }))} placeholder="اختياري" /></div>
                  <div><Label>موعد الصيانة القادمة</Label><Input type="date" value={form.next_maintenance_date} onChange={e => setForm(f => ({ ...f, next_maintenance_date: e.target.value }))} /></div>
                </div>
                <div><Label>تاريخ التنفيذ</Label><Input type="date" value={form.performed_at} onChange={e => setForm(f => ({ ...f, performed_at: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => addRecord.mutate()} disabled={addRecord.isPending || !form.vehicle_plate || !form.maintenance_type}>
                  {addRecord.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="w-5 h-5 text-primary" />
            جدولة الصيانة الدورية
            {(overdue.length + upcoming.length) > 0 && (
              <Badge variant="destructive" className="text-xs">{overdue.length + upcoming.length} تنبيه</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alerts */}
        {overdue.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-destructive">صيانة متأخرة</p>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            {overdue.map(r => (
              <p key={r.id} className="text-xs text-muted-foreground">
                {r.vehicle_plate} - {r.maintenance_type} (منذ {Math.abs(differenceInDays(new Date(r.next_maintenance_date!), now))} يوم)
              </p>
            ))}
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">صيانة قادمة</p>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            {upcoming.map(r => (
              <p key={r.id} className="text-xs text-muted-foreground">
                {r.vehicle_plate} - {r.maintenance_type} (خلال {differenceInDays(new Date(r.next_maintenance_date!), now)} يوم)
              </p>
            ))}
          </div>
        )}

        {/* Records list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>
        ) : records.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">لا توجد سجلات صيانة بعد</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {records.map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{Number(rec.cost).toLocaleString()} ج.م</Badge>
                  {rec.next_maintenance_date && (
                    <span className="text-xs text-muted-foreground">
                      القادمة: {format(new Date(rec.next_maintenance_date), 'd MMM', { locale: ar })}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{rec.vehicle_plate} - {rec.maintenance_type}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(rec.performed_at), 'd MMM yyyy', { locale: ar })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceScheduler;
