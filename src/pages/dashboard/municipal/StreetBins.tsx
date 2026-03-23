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
import { toast } from 'sonner';
import { Plus, Trash2 as TrashBin, MapPin, Wifi, WifiOff, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

interface StreetBin {
  id: string;
  bin_code: string;
  bin_type: string;
  capacity_liters: number;
  address: string | null;
  landmark: string | null;
  fill_level_percent: number;
  status: string;
  has_sensor: boolean;
  last_collected_at: string | null;
  zone_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

const BIN_TYPES: Record<string, string> = {
  standard: 'صندوق عادي (1100L)',
  large_container: 'حاوية كبيرة',
  underground: 'حاوية تحت أرضية',
  smart: 'صندوق ذكي (IoT)',
  recycling_station: 'محطة فرز',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  damaged: { label: 'تالف', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  missing: { label: 'مفقود', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  maintenance: { label: 'صيانة', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  decommissioned: { label: 'مُخرج', color: 'bg-gray-100 text-gray-800', icon: TrashBin },
};

const StreetBinsPage = () => {
  const { isRTL } = useLanguage();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    bin_code: '', bin_type: 'standard', capacity_liters: '1100', address: '',
    landmark: '', latitude: '', longitude: '', has_sensor: false, status: 'active', zone_id: '',
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones-list', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name').eq('organization_id', organization!.id).eq('status', 'active');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: bins = [], isLoading } = useQuery({
    queryKey: ['street-bins', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('street_bins').select('*')
        .eq('organization_id', organization!.id)
        .order('bin_code');
      if (error) throw error;
      return data as StreetBin[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('street_bins').insert({
        organization_id: organization!.id,
        bin_code: form.bin_code, bin_type: form.bin_type,
        capacity_liters: parseInt(form.capacity_liters) || 1100,
        address: form.address || null, landmark: form.landmark || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        has_sensor: form.has_sensor, status: form.status,
        zone_id: form.zone_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['street-bins'] });
      toast.success('تم تسجيل الصندوق');
      setDialogOpen(false);
      setForm({ bin_code: '', bin_type: 'standard', capacity_liters: '1100', address: '', landmark: '', latitude: '', longitude: '', has_sensor: false, status: 'active', zone_id: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('street_bins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['street-bins'] });
      toast.success('تم الحذف');
    },
  });

  const activeCount = bins.filter(b => b.status === 'active').length;
  const sensorCount = bins.filter(b => b.has_sensor).length;

  const getFillColor = (pct: number) => {
    if (pct >= 80) return 'bg-red-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <TrashBin className="w-5 h-5 text-primary" />
              سجل الصناديق والحاويات
            </h1>
            <p className="text-sm text-muted-foreground">{activeCount} نشط من {bins.length} • {sensorCount} بحساس IoT</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة صندوق</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>تسجيل صندوق / حاوية جديدة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>كود الصندوق</Label><Input value={form.bin_code} onChange={e => setForm(f => ({ ...f, bin_code: e.target.value }))} placeholder="BIN-001" /></div>
                  <div>
                    <Label>النوع</Label>
                    <Select value={form.bin_type} onValueChange={v => setForm(f => ({ ...f, bin_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(BIN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>المنطقة</Label>
                  <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                    <SelectContent>{zones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.zone_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="شارع ... أمام ..." /></div>
                <div><Label>علامة مميزة</Label><Input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="أمام مسجد / بجوار صيدلية ..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>خط العرض</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
                  <div><Label>خط الطول</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
                </div>
                <div><Label>السعة (لتر)</Label><Input type="number" value={form.capacity_liters} onChange={e => setForm(f => ({ ...f, capacity_liters: e.target.value }))} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="hasSensor" checked={form.has_sensor} onChange={e => setForm(f => ({ ...f, has_sensor: e.target.checked }))} />
                  <Label htmlFor="hasSensor">يحتوي على حساس IoT</Label>
                </div>
                <Button className="w-full" onClick={() => { if (!form.bin_code.trim()) return toast.error('كود الصندوق مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  تسجيل
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(STATUS_CONFIG).slice(0, 3).map(([key, cfg]) => {
            const count = bins.filter(b => b.status === key).length;
            const Icon = cfg.icon;
            return (
              <Card key={key}><CardContent className="p-3 text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
              </CardContent></Card>
            );
          })}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : bins.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <TrashBin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد صناديق مسجلة — ابدأ بتسجيل صناديق وحاويات مناطق الخدمة</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {bins.map(b => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.active;
              return (
                <Card key={b.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <TrashBin className="w-5 h-5" />
                        </div>
                        {b.has_sensor && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Wifi className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{b.bin_code}</span>
                          <span className="text-[10px] text-muted-foreground">{BIN_TYPES[b.bin_type]}</span>
                        </div>
                        {b.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.address}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getFillColor(b.fill_level_percent)}`} style={{ width: `${b.fill_level_percent}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{b.fill_level_percent}%</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)}>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </Button>
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

export default StreetBinsPage;
