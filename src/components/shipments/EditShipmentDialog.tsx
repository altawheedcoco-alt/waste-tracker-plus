import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { shipmentTypes, disposalMethods, packagingMethods } from '@/hooks/useCreateShipment';

const wasteTypeOptions = [
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق وكرتون' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'electronic', label: 'إلكترونيات' },
  { value: 'organic', label: 'عضوية' },
  { value: 'chemical', label: 'كيميائية' },
  { value: 'medical', label: 'طبية' },
  { value: 'construction', label: 'مخلفات بناء' },
  { value: 'other', label: 'أخرى' },
];

const hazardLevels = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
  { value: 'critical', label: 'حرج' },
];

const unitOptions = [
  { value: 'kg', label: 'كجم' },
  { value: 'ton', label: 'طن' },
  { value: 'unit', label: 'وحدة' },
  { value: 'bag', label: 'كيس' },
  { value: 'barrel', label: 'برميل' },
  { value: 'container', label: 'حاوية' },
];

interface EditShipmentDialogProps {
  shipment: any;
  onSuccess: () => void;
}

const EditShipmentDialog = ({ shipment, onSuccess }: EditShipmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open && shipment) {
      setForm({
        waste_type: shipment.waste_type || '',
        waste_description: shipment.waste_description || '',
        quantity: shipment.quantity || '',
        unit: shipment.unit || 'kg',
        hazard_level: shipment.hazard_level || 'low',
        packaging_method: shipment.packaging_method || '',
        disposal_method: shipment.disposal_method || '',
        shipment_type: shipment.shipment_type || 'regular',
        pickup_address: shipment.pickup_address || '',
        delivery_address: shipment.delivery_address || '',
        pickup_date: shipment.pickup_date?.split('T')[0] || '',
        expected_delivery_date: shipment.expected_delivery_date?.split('T')[0] || '',
        notes: shipment.notes || '',
        waste_state: shipment.waste_state || '',
        manual_driver_name: shipment.manual_driver_name || '',
        manual_vehicle_plate: shipment.manual_vehicle_plate || '',
      });
    }
  }, [open, shipment]);

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      
      // Only include changed fields
      const editableFields = [
        'waste_type', 'waste_description', 'quantity', 'unit', 'hazard_level',
        'packaging_method', 'disposal_method', 'shipment_type', 'pickup_address',
        'delivery_address', 'pickup_date', 'expected_delivery_date', 'notes',
        'waste_state', 'manual_driver_name', 'manual_vehicle_plate',
      ];

      for (const field of editableFields) {
        const oldVal = shipment[field] ?? '';
        const newVal = form[field] ?? '';
        if (String(oldVal) !== String(newVal)) {
          if (field === 'quantity') {
            updates[field] = parseFloat(newVal) || 0;
          } else if (['pickup_date', 'expected_delivery_date'].includes(field)) {
            updates[field] = newVal || null;
          } else {
            updates[field] = newVal || null;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        toast.info('لم يتم تغيير أي بيانات');
        setOpen(false);
        return;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipment.id);

      if (error) throw error;

      toast.success('تم تحديث بيانات الشحنة بنجاح');
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Update shipment error:', error);
      toast.error('فشل في تحديث الشحنة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Edit className="w-4 h-4" />
        تعديل
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              تعديل بيانات الشحنة {shipment?.shipment_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* نوع المخلفات والكمية */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع المخلفات</Label>
                <Select value={form.waste_type} onValueChange={v => updateField('waste_type', v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {wasteTypeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مستوى الخطورة</Label>
                <Select value={form.hazard_level} onValueChange={v => updateField('hazard_level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {hazardLevels.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input type="number" value={form.quantity} onChange={e => updateField('quantity', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select value={form.unit} onValueChange={v => updateField('unit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>حالة المخلف</Label>
                <Select value={form.waste_state || ''} onValueChange={v => updateField('waste_state', v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">صلب</SelectItem>
                    <SelectItem value="liquid">سائل</SelectItem>
                    <SelectItem value="semi_solid">شبه صلب</SelectItem>
                    <SelectItem value="gas">غاز</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>وصف المخلفات</Label>
              <Textarea value={form.waste_description} onChange={e => updateField('waste_description', e.target.value)} rows={2} />
            </div>

            {/* التعبئة والتخلص */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>طريقة التعبئة</Label>
                <Select value={form.packaging_method || ''} onValueChange={v => updateField('packaging_method', v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {packagingMethods.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>طريقة التخلص</Label>
                <Select value={form.disposal_method || ''} onValueChange={v => updateField('disposal_method', v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {disposalMethods.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع الشحنة</Label>
                <Select value={form.shipment_type || ''} onValueChange={v => updateField('shipment_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {shipmentTypes.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* المواقع */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>عنوان الاستلام</Label>
                <Input value={form.pickup_address} onChange={e => updateField('pickup_address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>عنوان التسليم</Label>
                <Input value={form.delivery_address} onChange={e => updateField('delivery_address', e.target.value)} />
              </div>
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الاستلام</Label>
                <Input type="date" value={form.pickup_date} onChange={e => updateField('pickup_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ التسليم المتوقع</Label>
                <Input type="date" value={form.expected_delivery_date} onChange={e => updateField('expected_delivery_date', e.target.value)} />
              </div>
            </div>

            {/* السائق */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم السائق (يدوي)</Label>
                <Input value={form.manual_driver_name} onChange={e => updateField('manual_driver_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>رقم لوحة المركبة (يدوي)</Label>
                <Input value={form.manual_vehicle_plate} onChange={e => updateField('manual_vehicle_plate', e.target.value)} />
              </div>
            </div>

            {/* ملاحظات */}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditShipmentDialog;
