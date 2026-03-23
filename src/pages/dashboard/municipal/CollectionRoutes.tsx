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
import { Plus, Route, Truck, Clock, MapPin, Calendar, User, Trash2 } from 'lucide-react';

interface CollectionRoute {
  id: string;
  route_name: string;
  route_code: string | null;
  route_type: string;
  schedule_days: string[];
  start_time: string | null;
  end_time: string | null;
  estimated_bins: number;
  estimated_distance_km: number | null;
  status: string;
  assigned_driver_id: string | null;
  zone_id: string | null;
  notes: string | null;
}

const ROUTE_TYPES: Record<string, string> = {
  bin_collection: 'جمع من الصناديق',
  street_sweeping: 'كنس شوارع',
  door_to_door: 'جمع منزلي (باب لباب)',
  transfer_station: 'نقل لمحطة الترحيل',
  special: 'مهمة خاصة',
};

const DAYS: Record<string, string> = {
  sat: 'سبت', sun: 'أحد', mon: 'اثنين', tue: 'ثلاثاء', wed: 'أربعاء', thu: 'خميس', fri: 'جمعة',
};

const CollectionRoutesPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    route_name: '', route_code: '', route_type: 'bin_collection', zone_id: '',
    assigned_driver_id: '', schedule_days: [] as string[], start_time: '05:00', end_time: '13:00',
    estimated_bins: '', estimated_distance_km: '', notes: '',
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones-for-routes', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name').eq('organization_id', organization!.id).eq('status', 'active');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-for-routes', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', organization!.id).eq('role', 'driver').eq('is_active', true);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['collection-routes', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('collection_routes').select('*')
        .eq('organization_id', organization!.id).order('route_name');
      if (error) throw error;
      return data as CollectionRoute[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('collection_routes').insert({
        organization_id: organization!.id,
        route_name: form.route_name, route_code: form.route_code || null,
        route_type: form.route_type, zone_id: form.zone_id || null,
        assigned_driver_id: form.assigned_driver_id || null,
        schedule_days: form.schedule_days, start_time: form.start_time, end_time: form.end_time,
        estimated_bins: parseInt(form.estimated_bins) || 0,
        estimated_distance_km: form.estimated_distance_km ? parseFloat(form.estimated_distance_km) : null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-routes'] });
      toast.success('تم إضافة المسار');
      setDialogOpen(false);
      setForm({ route_name: '', route_code: '', route_type: 'bin_collection', zone_id: '', assigned_driver_id: '', schedule_days: [], start_time: '05:00', end_time: '13:00', estimated_bins: '', estimated_distance_km: '', notes: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('collection_routes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-routes'] });
      toast.success('تم الحذف');
    },
  });

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      schedule_days: f.schedule_days.includes(day)
        ? f.schedule_days.filter(d => d !== day)
        : [...f.schedule_days, day],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Route className="w-5 h-5 text-primary" />مسارات الجمع</h1>
            <p className="text-sm text-muted-foreground">{routes.length} مسار مسجل</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة مسار</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>إضافة مسار جمع جديد</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>اسم المسار</Label><Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} placeholder="مسار شارع الهرم" /></div>
                  <div><Label>كود المسار</Label><Input value={form.route_code} onChange={e => setForm(f => ({ ...f, route_code: e.target.value }))} placeholder="R-001" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>النوع</Label>
                    <Select value={form.route_type} onValueChange={v => setForm(f => ({ ...f, route_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ROUTE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المنطقة</Label>
                    <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{zones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.zone_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>السائق المُعيّن</Label>
                  <Select value={form.assigned_driver_id} onValueChange={v => setForm(f => ({ ...f, assigned_driver_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر سائق" /></SelectTrigger>
                    <SelectContent>{drivers.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>أيام التشغيل</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(DAYS).map(([k, v]) => (
                      <Button key={k} type="button" size="sm" variant={form.schedule_days.includes(k) ? 'default' : 'outline'}
                        className="text-xs px-2 py-1 h-7" onClick={() => toggleDay(k)}>{v}</Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>بداية</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
                  <div><Label>نهاية</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>عدد الصناديق المتوقع</Label><Input type="number" value={form.estimated_bins} onChange={e => setForm(f => ({ ...f, estimated_bins: e.target.value }))} /></div>
                  <div><Label>المسافة التقديرية (كم)</Label><Input type="number" value={form.estimated_distance_km} onChange={e => setForm(f => ({ ...f, estimated_distance_km: e.target.value }))} /></div>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => { if (!form.route_name.trim()) return toast.error('اسم المسار مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  إضافة المسار
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : routes.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مسارات — أضف مسارات الجمع والكنس اليومية</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {routes.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {r.route_type === 'street_sweeping' ? <MapPin className="w-5 h-5 text-primary" /> : <Truck className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{r.route_name}</span>
                          {r.route_code && <span className="text-xs text-muted-foreground">({r.route_code})</span>}
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{ROUTE_TYPES[r.route_type]}</Badge>
                        <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                          {r.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.start_time.slice(0, 5)} - {r.end_time?.slice(0, 5)}</span>}
                          {r.estimated_bins > 0 && <span>{r.estimated_bins} صندوق</span>}
                          {r.estimated_distance_km && <span>{r.estimated_distance_km} كم</span>}
                        </div>
                        {r.schedule_days.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {r.schedule_days.map(d => (
                              <span key={d} className="text-[9px] px-1.5 py-0.5 bg-muted rounded">{DAYS[d] || d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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

export default CollectionRoutesPage;
