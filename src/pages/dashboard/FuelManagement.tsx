import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Fuel, TrendingUp, Calendar, Gauge, Receipt, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FuelRecord {
  id: string;
  fuel_date: string;
  fuel_type: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  odometer_reading: number | null;
  station_name: string | null;
  driver_id: string | null;
  notes: string | null;
  driver?: { full_name: string } | null;
}

const FUEL_TYPES: Record<string, { label: string; labelEn: string }> = {
  diesel: { label: 'ديزل (سولار)', labelEn: 'Diesel' },
  gasoline: { label: 'بنزين', labelEn: 'Gasoline' },
  gas: { label: 'غاز طبيعي', labelEn: 'Natural Gas' },
  electric: { label: 'كهرباء', labelEn: 'Electric' },
};

const FuelManagement = () => {
  const { isRTL } = useLanguage();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ driver_id: '', fuel_date: format(new Date(), 'yyyy-MM-dd'), fuel_type: 'diesel', liters: '', cost_per_liter: '', odometer_reading: '', station_name: '', notes: '' });

  const { data: drivers = [] } = useQuery({
    queryKey: ['org-drivers-fuel', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', organization!.id).eq('role', 'driver').eq('is_active', true);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['fuel-records', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('fuel_records' as any)
        .select('*')
        .eq('organization_id', organization!.id)
        .order('fuel_date', { ascending: false })
        .limit(100) as any);
      if (error) throw error;
      const driverIds = [...new Set((data || []).map((r: any) => r.driver_id).filter(Boolean))] as string[];
      let driverMap: Record<string, string> = {};
      if (driverIds.length) {
        const { data: drvs } = await supabase.from('profiles').select('id, full_name').in('id', driverIds as string[]);
        driverMap = Object.fromEntries((drvs || []).map(d => [d.id, d.full_name]));
      }
      return (data || []).map(r => ({ ...r, driver: r.driver_id ? { full_name: driverMap[r.driver_id] || '—' } : null })) as FuelRecord[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('fuel_records').insert({
        organization_id: organization!.id,
        driver_id: form.driver_id || null,
        fuel_date: form.fuel_date,
        fuel_type: form.fuel_type,
        liters: parseFloat(form.liters),
        cost_per_liter: parseFloat(form.cost_per_liter),
        odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : null,
        station_name: form.station_name || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success(isRTL ? 'تم تسجيل التعبئة' : 'Fuel record saved');
      setDialogOpen(false);
      setForm({ driver_id: '', fuel_date: format(new Date(), 'yyyy-MM-dd'), fuel_type: 'diesel', liters: '', cost_per_liter: '', odometer_reading: '', station_name: '', notes: '' });
    },
    onError: () => toast.error(isRTL ? 'حدث خطأ' : 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fuel_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    },
  });

  const totalCost = records.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalLiters = records.reduce((s, r) => s + r.liters, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{isRTL ? 'إدارة الوقود' : 'Fuel Management'}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />{isRTL ? 'تسجيل تعبئة' : 'Add Record'}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{isRTL ? 'تسجيل تعبئة وقود' : 'Record Fuel Fill'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{isRTL ? 'السائق' : 'Driver'}</Label>
                  <Select value={form.driver_id} onValueChange={v => setForm(f => ({ ...f, driver_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                    <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{isRTL ? 'التاريخ' : 'Date'}</Label><Input type="date" value={form.fuel_date} onChange={e => setForm(f => ({ ...f, fuel_date: e.target.value }))} /></div>
                <div>
                  <Label>{isRTL ? 'نوع الوقود' : 'Fuel Type'}</Label>
                  <Select value={form.fuel_type} onValueChange={v => setForm(f => ({ ...f, fuel_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(FUEL_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{isRTL ? v.label : v.labelEn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>{isRTL ? 'اللترات' : 'Liters'}</Label><Input type="number" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} /></div>
                  <div><Label>{isRTL ? 'سعر اللتر' : 'Cost/L'}</Label><Input type="number" value={form.cost_per_liter} onChange={e => setForm(f => ({ ...f, cost_per_liter: e.target.value }))} /></div>
                </div>
                {form.liters && form.cost_per_liter && (
                  <p className="text-sm font-semibold text-primary">{isRTL ? 'الإجمالي:' : 'Total:'} {(parseFloat(form.liters) * parseFloat(form.cost_per_liter)).toFixed(2)} {isRTL ? 'ج.م' : 'EGP'}</p>
                )}
                <div><Label>{isRTL ? 'عداد الكيلومترات' : 'Odometer'}</Label><Input type="number" value={form.odometer_reading} onChange={e => setForm(f => ({ ...f, odometer_reading: e.target.value }))} /></div>
                <div><Label>{isRTL ? 'اسم المحطة' : 'Station'}</Label><Input value={form.station_name} onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.liters || !form.cost_per_liter}>
                  {isRTL ? 'تسجيل' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4 text-center">
            <Fuel className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{totalLiters.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'لتر إجمالي' : 'Total Liters'}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{totalCost.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'ج.م إجمالي' : 'Total EGP'}</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : records.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Fuel className="w-12 h-12 mx-auto mb-3 opacity-30" />{isRTL ? 'لا توجد سجلات وقود' : 'No fuel records'}</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {records.map(r => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fuel className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span>{r.liters}L</span>
                        <span className="text-muted-foreground">×</span>
                        <span>{r.cost_per_liter}</span>
                        <span className="text-primary">= {r.total_cost?.toFixed(1)} {isRTL ? 'ج.م' : 'EGP'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.fuel_date}</span>
                        {r.driver && <span>• {r.driver.full_name}</span>}
                        {r.station_name && <span>• {r.station_name}</span>}
                        {r.odometer_reading && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{r.odometer_reading} km</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FuelManagement;
