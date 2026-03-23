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
import { Plus, Building, Phone, MapPin, Scale, Clock, Edit2, Trash2, CheckCircle2, Wrench } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const STATION_TYPES: Record<string, string> = {
  primary: 'محطة ترحيل رئيسية',
  secondary: 'محطة ترحيل فرعية',
  sorting: 'محطة فرز وتدوير',
  compaction: 'محطة ضغط وكبس',
  composting: 'محطة تسميد (كمبوست)',
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'تعمل', variant: 'default' },
  maintenance: { label: 'صيانة', variant: 'secondary' },
  closed: { label: 'مغلقة', variant: 'destructive' },
  over_capacity: { label: 'فوق الطاقة', variant: 'destructive' },
};

const TransferStationsPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [form, setForm] = useState({
    station_name: '', station_code: '', station_type: 'primary',
    address: '', governorate: '', city: '', latitude: '', longitude: '',
    capacity_tons_per_day: '', operating_hours_start: '06:00', operating_hours_end: '22:00',
    contact_person: '', contact_phone: '', has_weighbridge: false, has_sorting_line: false,
    status: 'active', notes: '',
  });

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['transfer-stations', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transfer_stations').select('*')
        .eq('organization_id', organization!.id).order('station_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        station_name: form.station_name, station_code: form.station_code || null,
        station_type: form.station_type, address: form.address || null,
        governorate: form.governorate || null, city: form.city || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        capacity_tons_per_day: form.capacity_tons_per_day ? parseFloat(form.capacity_tons_per_day) : null,
        operating_hours_start: form.operating_hours_start, operating_hours_end: form.operating_hours_end,
        contact_person: form.contact_person || null, contact_phone: form.contact_phone || null,
        has_weighbridge: form.has_weighbridge, has_sorting_line: form.has_sorting_line,
        status: form.status, notes: form.notes || null,
      };
      if (editingStation) {
        const { error } = await (supabase as any).from('transfer_stations').update(payload).eq('id', editingStation.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('transfer_stations').insert({ ...payload, organization_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-stations'] });
      toast.success(editingStation ? 'تم التحديث' : 'تمت الإضافة');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('transfer_stations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-stations'] });
      toast.success('تم الحذف');
    },
  });

  const resetForm = () => {
    setForm({ station_name: '', station_code: '', station_type: 'primary', address: '', governorate: '', city: '', latitude: '', longitude: '', capacity_tons_per_day: '', operating_hours_start: '06:00', operating_hours_end: '22:00', contact_person: '', contact_phone: '', has_weighbridge: false, has_sorting_line: false, status: 'active', notes: '' });
    setEditingStation(null);
    setDialogOpen(false);
  };

  const openEdit = (s: any) => {
    setEditingStation(s);
    setForm({
      station_name: s.station_name, station_code: s.station_code || '', station_type: s.station_type,
      address: s.address || '', governorate: s.governorate || '', city: s.city || '',
      latitude: s.latitude?.toString() || '', longitude: s.longitude?.toString() || '',
      capacity_tons_per_day: s.capacity_tons_per_day?.toString() || '',
      operating_hours_start: s.operating_hours_start || '06:00', operating_hours_end: s.operating_hours_end || '22:00',
      contact_person: s.contact_person || '', contact_phone: s.contact_phone || '',
      has_weighbridge: s.has_weighbridge, has_sorting_line: s.has_sorting_line,
      status: s.status, notes: s.notes || '',
    });
    setDialogOpen(true);
  };

  const totalCapacity = stations.reduce((s: number, st: any) => s + (st.capacity_tons_per_day || 0), 0);
  const totalLoad = stations.reduce((s: number, st: any) => s + (st.current_load_tons || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Building className="w-5 h-5 text-primary" />محطات الترحيل</h1>
            <p className="text-sm text-muted-foreground">{stations.length} محطة • طاقة {totalCapacity} طن/يوم</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة محطة</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingStation ? 'تعديل المحطة' : 'إضافة محطة ترحيل'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>اسم المحطة</Label><Input value={form.station_name} onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))} placeholder="محطة ترحيل 15 مايو" /></div>
                  <div><Label>الكود</Label><Input value={form.station_code} onChange={e => setForm(f => ({ ...f, station_code: e.target.value }))} placeholder="TS-001" /></div>
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.station_type} onValueChange={v => setForm(f => ({ ...f, station_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>المحافظة</Label><Input value={form.governorate} onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))} /></div>
                  <div><Label>المدينة</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>خط العرض</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
                  <div><Label>خط الطول</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
                </div>
                <div><Label>الطاقة الاستيعابية (طن/يوم)</Label><Input type="number" value={form.capacity_tons_per_day} onChange={e => setForm(f => ({ ...f, capacity_tons_per_day: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>بداية العمل</Label><Input type="time" value={form.operating_hours_start} onChange={e => setForm(f => ({ ...f, operating_hours_start: e.target.value }))} /></div>
                  <div><Label>نهاية العمل</Label><Input type="time" value={form.operating_hours_end} onChange={e => setForm(f => ({ ...f, operating_hours_end: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>مسؤول التواصل</Label><Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} /></div>
                  <div><Label>الهاتف</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="weighbridge" checked={form.has_weighbridge} onChange={e => setForm(f => ({ ...f, has_weighbridge: e.target.checked }))} />
                    <Label htmlFor="weighbridge">بها ميزان (بسكولة)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="sorting" checked={form.has_sorting_line} onChange={e => setForm(f => ({ ...f, has_sorting_line: e.target.checked }))} />
                    <Label htmlFor="sorting">بها خط فرز</Label>
                  </div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => { if (!form.station_name.trim()) return toast.error('اسم المحطة مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  {editingStation ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : stations.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">لا توجد محطات ترحيل مسجلة</p>
            <p className="text-xs mt-1">أضف محطات الترحيل التي تُفرغ فيها سيارات الجمع حمولتها</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {stations.map((s: any) => {
              const loadPct = s.capacity_tons_per_day > 0 ? Math.round((s.current_load_tons / s.capacity_tons_per_day) * 100) : 0;
              return (
                <Card key={s.id} className={loadPct >= 90 ? 'border-destructive/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{s.station_name}</span>
                            {s.station_code && <span className="text-xs text-muted-foreground">({s.station_code})</span>}
                            <Badge variant={STATUS_MAP[s.status]?.variant || 'default'} className="text-[10px]">
                              {STATUS_MAP[s.status]?.label}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{STATION_TYPES[s.station_type]}</Badge>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                            {s.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.operating_hours_start?.slice(0, 5)} - {s.operating_hours_end?.slice(0, 5)}</span>
                          </div>
                          {s.capacity_tons_per_day > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground"><Scale className="w-3 h-3 inline me-1" />{s.current_load_tons || 0} / {s.capacity_tons_per_day} طن</span>
                                <span className={`font-bold ${loadPct >= 90 ? 'text-destructive' : loadPct >= 70 ? 'text-amber-600' : 'text-primary'}`}>{loadPct}%</span>
                              </div>
                              <Progress value={loadPct} className="h-2" />
                            </div>
                          )}
                          <div className="flex gap-2 mt-1.5 text-[10px]">
                            {s.has_weighbridge && <Badge variant="outline" className="text-[10px]">⚖️ بسكولة</Badge>}
                            {s.has_sorting_line && <Badge variant="outline" className="text-[10px]">♻️ خط فرز</Badge>}
                          </div>
                          {s.contact_person && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              {s.contact_person}
                              {s.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.contact_phone}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default TransferStationsPage;
