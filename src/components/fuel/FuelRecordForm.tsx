import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MapPin, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FUEL_TYPES = [
  { value: 'diesel', label: 'ديزل (سولار)' },
  { value: 'gasoline', label: 'بنزين' },
  { value: 'gas', label: 'غاز طبيعي' },
  { value: 'electric', label: 'كهرباء' },
];

const FuelRecordForm = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    driver_id: '', vehicle_id: '', fuel_date: format(new Date(), 'yyyy-MM-dd'),
    fuel_type: 'diesel', liters: '', cost_per_liter: '', odometer_reading: '',
    station_name: '', notes: '', vehicle_plate: '',
  });

  // Auto-capture GPS
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsCoords(null),
        { enableHighAccuracy: true }
      );
    }
  }, [open]);

  const { data: drivers = [] } = useQuery({
    queryKey: ['fuel-drivers', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', organization!.id).eq('role', 'driver').eq('is_active', true);
      return data || [];
    },
    enabled: !!organization?.id && open,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['fuel-vehicles', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('fleet_vehicles').select('id, plate_number, vehicle_name').eq('organization_id', organization!.id).eq('status', 'active');
      return data || [];
    },
    enabled: !!organization?.id && open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('fuel_records').insert({
        organization_id: organization!.id,
        driver_id: form.driver_id || null,
        vehicle_id: form.vehicle_id || null,
        fuel_date: form.fuel_date,
        fuel_type: form.fuel_type,
        liters: parseFloat(form.liters),
        cost_per_liter: parseFloat(form.cost_per_liter),
        odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : null,
        station_name: form.station_name || null,
        notes: form.notes || null,
        vehicle_plate: form.vehicle_plate || null,
        latitude: gpsCoords?.lat || null,
        longitude: gpsCoords?.lng || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success('تم تسجيل التعبئة بنجاح');
      setOpen(false);
      setForm({ driver_id: '', vehicle_id: '', fuel_date: format(new Date(), 'yyyy-MM-dd'), fuel_type: 'diesel', liters: '', cost_per_liter: '', odometer_reading: '', station_name: '', notes: '', vehicle_plate: '' });
    },
    onError: () => toast.error('حدث خطأ أثناء التسجيل'),
  });

  const total = form.liters && form.cost_per_liter ? (parseFloat(form.liters) * parseFloat(form.cost_per_liter)).toFixed(2) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 me-1" />تسجيل تعبئة</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسجيل تعبئة وقود</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>السائق</Label>
              <Select value={form.driver_id} onValueChange={v => setForm(f => ({ ...f, driver_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{drivers.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>المركبة</Label>
              <Select value={form.vehicle_id} onValueChange={v => {
                const veh = vehicles.find((ve: any) => ve.id === v);
                setForm(f => ({ ...f, vehicle_id: v, vehicle_plate: veh?.plate_number || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate_number || v.vehicle_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label>التاريخ</Label><Input type="date" value={form.fuel_date} onChange={e => setForm(f => ({ ...f, fuel_date: e.target.value }))} /></div>
            <div>
              <Label>نوع الوقود</Label>
              <Select value={form.fuel_type} onValueChange={v => setForm(f => ({ ...f, fuel_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label>اللترات</Label><Input type="number" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} /></div>
            <div><Label>سعر اللتر</Label><Input type="number" value={form.cost_per_liter} onChange={e => setForm(f => ({ ...f, cost_per_liter: e.target.value }))} /></div>
          </div>

          {total && <p className="text-sm font-bold text-primary">الإجمالي: {total} ج.م</p>}

          <div><Label>عداد الكيلومترات</Label><Input type="number" value={form.odometer_reading} onChange={e => setForm(f => ({ ...f, odometer_reading: e.target.value }))} /></div>
          <div><Label>اسم المحطة</Label><Input value={form.station_name} onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))} /></div>

          {gpsCoords && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <MapPin className="h-3 w-3" />
              <span>تم التقاط الموقع: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</span>
            </div>
          )}

          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.liters || !form.cost_per_liter}>
            تسجيل التعبئة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FuelRecordForm;
