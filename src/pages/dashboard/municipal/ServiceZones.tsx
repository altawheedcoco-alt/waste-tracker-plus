import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Plus, MapPin, Building2, Users2, Trash2, Edit2, LayoutGrid } from 'lucide-react';

interface ServiceZone {
  id: string;
  zone_name: string;
  zone_code: string | null;
  governorate: string | null;
  city: string | null;
  district: string | null;
  area_km2: number | null;
  population_estimate: number | null;
  bin_count: number;
  status: string;
  contract_reference: string | null;
  notes: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'نشطة', variant: 'default' },
  inactive: { label: 'غير نشطة', variant: 'secondary' },
  suspended: { label: 'موقوفة', variant: 'destructive' },
};

const GOVERNORATES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية', 'القليوبية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مرسى مطروح', 'شمال سيناء', 'جنوب سيناء'];

const ServiceZonesPage = () => {
  const { isRTL } = useLanguage();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [form, setForm] = useState({
    zone_name: '', zone_code: '', governorate: '', city: '', district: '',
    area_km2: '', population_estimate: '', contract_reference: '', notes: '', status: 'active',
  });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['service-zones', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('service_zones').select('*')
        .eq('organization_id', organization!.id)
        .order('zone_name');
      if (error) throw error;
      return data as ServiceZone[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        zone_name: form.zone_name, zone_code: form.zone_code || null,
        governorate: form.governorate || null, city: form.city || null,
        district: form.district || null, area_km2: form.area_km2 ? parseFloat(form.area_km2) : null,
        population_estimate: form.population_estimate ? parseInt(form.population_estimate) : null,
        contract_reference: form.contract_reference || null, notes: form.notes || null,
        status: form.status,
      };
      if (editingZone) {
        const { error } = await (supabase as any).from('service_zones').update(payload).eq('id', editingZone.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('service_zones').insert({ ...payload, organization_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-zones'] });
      toast.success(editingZone ? 'تم التحديث' : 'تمت الإضافة');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('service_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-zones'] });
      toast.success('تم الحذف');
    },
  });

  const resetForm = () => {
    setForm({ zone_name: '', zone_code: '', governorate: '', city: '', district: '', area_km2: '', population_estimate: '', contract_reference: '', notes: '', status: 'active' });
    setEditingZone(null);
    setDialogOpen(false);
  };

  const openEdit = (z: ServiceZone) => {
    setEditingZone(z);
    setForm({
      zone_name: z.zone_name, zone_code: z.zone_code || '', governorate: z.governorate || '',
      city: z.city || '', district: z.district || '', area_km2: z.area_km2?.toString() || '',
      population_estimate: z.population_estimate?.toString() || '', contract_reference: z.contract_reference || '',
      notes: z.notes || '', status: z.status,
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              {isRTL ? 'مناطق الخدمة' : 'Service Zones'}
            </h1>
            <p className="text-sm text-muted-foreground">{zones.length} {isRTL ? 'منطقة مسجلة' : 'zones registered'}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />{isRTL ? 'إضافة منطقة' : 'Add Zone'}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingZone ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>اسم المنطقة / الحي</Label><Input value={form.zone_name} onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))} placeholder="مثال: حي مصر الجديدة" /></div>
                <div><Label>كود المنطقة</Label><Input value={form.zone_code} onChange={e => setForm(f => ({ ...f, zone_code: e.target.value }))} placeholder="Z-001" /></div>
                <div>
                  <Label>المحافظة</Label>
                  <Select value={form.governorate} onValueChange={v => setForm(f => ({ ...f, governorate: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    <SelectContent>{GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>المدينة</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                  <div><Label>الحي / القسم</Label><Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>المساحة (كم²)</Label><Input type="number" value={form.area_km2} onChange={e => setForm(f => ({ ...f, area_km2: e.target.value }))} /></div>
                  <div><Label>عدد السكان التقديري</Label><Input type="number" value={form.population_estimate} onChange={e => setForm(f => ({ ...f, population_estimate: e.target.value }))} /></div>
                </div>
                <div><Label>مرجع العقد</Label><Input value={form.contract_reference} onChange={e => setForm(f => ({ ...f, contract_reference: e.target.value }))} placeholder="عقد رقم ..." /></div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => { if (!form.zone_name.trim()) return toast.error('اسم المنطقة مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  {editingZone ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : zones.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مناطق مسجلة — أضف مناطق الخدمة المتعاقد عليها</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {zones.map(z => (
              <Card key={z.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{z.zone_name}</span>
                          {z.zone_code && <span className="text-xs text-muted-foreground">({z.zone_code})</span>}
                          <Badge variant={STATUS_MAP[z.status]?.variant || 'default'} className="text-[10px]">{STATUS_MAP[z.status]?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[z.district, z.city, z.governorate].filter(Boolean).join(' • ')}
                        </p>
                        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                          {z.area_km2 && <span>{z.area_km2} كم²</span>}
                          {z.population_estimate && <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{z.population_estimate.toLocaleString()}</span>}
                          <span>{z.bin_count} صندوق</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(z)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(z.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default ServiceZonesPage;
