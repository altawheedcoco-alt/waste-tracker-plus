import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: any;
  onSaved: () => void;
}

const FleetVehicleDialog = ({ open, onOpenChange, vehicle, onSaved }: Props) => {
  const { organization } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plate_number: '',
    vehicle_type: 'truck',
    capacity_tons: '',
    brand: '',
    model: '',
    year: '',
    daily_rate: '',
    per_trip_rate: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    is_available: true,
    status: 'active',
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        plate_number: vehicle.plate_number || '',
        vehicle_type: vehicle.vehicle_type || 'truck',
        capacity_tons: vehicle.capacity_tons?.toString() || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        daily_rate: vehicle.daily_rate?.toString() || '',
        per_trip_rate: vehicle.per_trip_rate?.toString() || '',
        driver_name: vehicle.driver_name || '',
        driver_phone: vehicle.driver_phone || '',
        notes: vehicle.notes || '',
        is_available: vehicle.is_available ?? true,
        status: vehicle.status || 'active',
      });
    } else {
      setForm({
        plate_number: '', vehicle_type: 'truck', capacity_tons: '', brand: '', model: '', year: '',
        daily_rate: '', per_trip_rate: '', driver_name: '', driver_phone: '', notes: '', is_available: true, status: 'active',
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async () => {
    if (!form.plate_number) { toast.error('رقم اللوحة مطلوب'); return; }
    if (!organization?.id) return;
    setSaving(true);
    try {
      const payload = {
        organization_id: organization.id,
        plate_number: form.plate_number,
        vehicle_type: form.vehicle_type,
        capacity_tons: form.capacity_tons ? parseFloat(form.capacity_tons) : null,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
        per_trip_rate: form.per_trip_rate ? parseFloat(form.per_trip_rate) : null,
        driver_name: form.driver_name || null,
        driver_phone: form.driver_phone || null,
        notes: form.notes || null,
        is_available: form.is_available,
        status: form.status,
      };

      if (vehicle?.id) {
        const { error } = await supabase.from('fleet_vehicles').update(payload).eq('id', vehicle.id);
        if (error) throw error;
        toast.success('تم تحديث المركبة');
      } else {
        const { error } = await supabase.from('fleet_vehicles').insert(payload);
        if (error) throw error;
        toast.success('تمت إضافة المركبة');
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'تعديل مركبة' : 'إضافة مركبة جديدة'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رقم اللوحة *</Label>
              <Input value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))} />
            </div>
            <div>
              <Label>نوع المركبة</Label>
              <Select value={form.vehicle_type} onValueChange={v => setForm(p => ({ ...p, vehicle_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">شاحنة</SelectItem>
                  <SelectItem value="pickup">بيك أب</SelectItem>
                  <SelectItem value="tanker">صهريج</SelectItem>
                  <SelectItem value="trailer">مقطورة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>الماركة</Label><Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} /></div>
            <div><Label>الموديل</Label><Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} /></div>
            <div><Label>السنة</Label><Input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>الحمولة (طن)</Label><Input type="number" value={form.capacity_tons} onChange={e => setForm(p => ({ ...p, capacity_tons: e.target.value }))} /></div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="rented">مؤجرة</SelectItem>
                  <SelectItem value="inactive">غير نشطة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>سعر الرحلة (ج.م)</Label><Input type="number" value={form.per_trip_rate} onChange={e => setForm(p => ({ ...p, per_trip_rate: e.target.value }))} /></div>
            <div><Label>السعر اليومي (ج.م)</Label><Input type="number" value={form.daily_rate} onChange={e => setForm(p => ({ ...p, daily_rate: e.target.value }))} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>اسم السائق</Label><Input value={form.driver_name} onChange={e => setForm(p => ({ ...p, driver_name: e.target.value }))} /></div>
            <div><Label>هاتف السائق</Label><Input value={form.driver_phone} onChange={e => setForm(p => ({ ...p, driver_phone: e.target.value }))} /></div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_available} onCheckedChange={v => setForm(p => ({ ...p, is_available: v }))} />
            <Label>متاحة للحجز</Label>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {vehicle ? 'حفظ التعديلات' : 'إضافة المركبة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FleetVehicleDialog;
