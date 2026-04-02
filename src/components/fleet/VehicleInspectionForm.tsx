import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertTriangle, CheckCircle2, Fuel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface VehicleInspectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehiclePlate?: string;
  driverId?: string;
  onCompleted?: () => void;
}

const INSPECTION_CHECKLIST = [
  { id: 'tires', label: 'الإطارات (حالة وضغط)' },
  { id: 'brakes', label: 'الفرامل' },
  { id: 'lights', label: 'الأنوار (أمامية/خلفية/إشارات)' },
  { id: 'mirrors', label: 'المرايا' },
  { id: 'wipers', label: 'المساحات' },
  { id: 'horn', label: 'البوق (الكلاكس)' },
  { id: 'seatbelt', label: 'حزام الأمان' },
  { id: 'fire_extinguisher', label: 'طفاية الحريق' },
  { id: 'first_aid', label: 'حقيبة الإسعافات' },
  { id: 'reflective_triangle', label: 'مثلث عاكس' },
  { id: 'cargo_area', label: 'منطقة الحمولة (نظافة/سلامة)' },
  { id: 'fluid_levels', label: 'مستويات السوائل (زيت/ماء)' },
] as const;

const VehicleInspectionForm = ({
  isOpen,
  onClose,
  vehiclePlate = '',
  driverId,
  onCompleted,
}: VehicleInspectionFormProps) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehiclePlate,
    inspectionType: 'pre_trip' as string,
    odometerReading: '',
    fuelLevel: 'full' as string,
    notes: '',
  });

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(INSPECTION_CHECKLIST.map(i => [i.id, true]))
  );

  const [defects, setDefects] = useState<Array<{ item: string; severity: string; description: string }>>([]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newVal = !prev[id];
      if (!newVal) {
        // Add defect entry
        const itemLabel = INSPECTION_CHECKLIST.find(i => i.id === id)?.label || id;
        setDefects(d => [...d, { item: itemLabel, severity: 'minor', description: '' }]);
      } else {
        const itemLabel = INSPECTION_CHECKLIST.find(i => i.id === id)?.label || id;
        setDefects(d => d.filter(def => def.item !== itemLabel));
      }
      return { ...prev, [id]: newVal };
    });
  };

  const failedCount = Object.values(checkedItems).filter(v => !v).length;
  const overallStatus = failedCount === 0 ? 'passed' : failedCount <= 2 ? 'needs_repair' : 'failed';

  const handleSubmit = async () => {
    if (!organization?.id || !form.vehiclePlate.trim()) {
      toast.error('يرجى إدخال رقم لوحة المركبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const inspectionItems = INSPECTION_CHECKLIST.map(item => ({
        id: item.id,
        label: item.label,
        passed: checkedItems[item.id],
      }));

      const { error } = await (supabase.from('vehicle_inspections') as any).insert({
        organization_id: organization.id,
        driver_id: driverId || null,
        inspector_user_id: user?.id || null,
        vehicle_plate: form.vehiclePlate.trim(),
        inspection_type: form.inspectionType,
        status: overallStatus,
        odometer_reading: form.odometerReading ? parseFloat(form.odometerReading) : null,
        fuel_level: form.fuelLevel,
        inspection_items: inspectionItems,
        defects_found: defects.length > 0 ? defects : [],
        notes: form.notes || null,
      });

      if (error) throw error;

      toast.success(
        overallStatus === 'passed'
          ? '✅ تم اجتياز الفحص بنجاح'
          : '⚠️ تم تسجيل الفحص مع ملاحظات'
      );

      queryClient.invalidateQueries({ queryKey: ['vehicle-inspections'] });
      onCompleted?.();
      onClose();
    } catch (err) {
      console.error('Vehicle inspection error:', err);
      toast.error('حدث خطأ أثناء حفظ الفحص');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            فحص المركبة (DVIR)
          </DialogTitle>
          <DialogDescription>
            تقرير فحص المركبة قبل/بعد الرحلة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">رقم اللوحة *</Label>
              <Input
                value={form.vehiclePlate}
                onChange={(e) => setForm(f => ({ ...f, vehiclePlate: e.target.value }))}
                placeholder="مثال: أ ب ج ١٢٣٤"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع الفحص</Label>
              <Select value={form.inspectionType} onValueChange={v => setForm(f => ({ ...f, inspectionType: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_trip">قبل الرحلة</SelectItem>
                  <SelectItem value="post_trip">بعد الرحلة</SelectItem>
                  <SelectItem value="periodic">دوري</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">قراءة العداد (كم)</Label>
              <Input
                type="number"
                value={form.odometerReading}
                onChange={(e) => setForm(f => ({ ...f, odometerReading: e.target.value }))}
                placeholder="مثال: 52000"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> مستوى الوقود</Label>
              <Select value={form.fuelLevel} onValueChange={v => setForm(f => ({ ...f, fuelLevel: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">ممتلئ</SelectItem>
                  <SelectItem value="three_quarters">¾</SelectItem>
                  <SelectItem value="half">½</SelectItem>
                  <SelectItem value="quarter">¼</SelectItem>
                  <SelectItem value="empty">فارغ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">قائمة الفحص</Label>
              <Badge variant={overallStatus === 'passed' ? 'default' : 'destructive'} className="text-xs">
                {overallStatus === 'passed' ? 'مجتاز' : overallStatus === 'needs_repair' ? 'يحتاج إصلاح' : 'غير مجتاز'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-1.5 border rounded-lg p-3 bg-muted/30">
              {INSPECTION_CHECKLIST.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors ${
                    checkedItems[item.id] ? 'text-foreground' : 'text-destructive bg-destructive/10'
                  }`}
                >
                  <Checkbox
                    checked={checkedItems[item.id]}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  {checkedItems[item.id] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Defects details */}
          {defects.length > 0 && (
            <div className="space-y-2 border border-destructive/30 rounded-lg p-3 bg-destructive/5">
              <Label className="text-xs text-destructive font-semibold">تفاصيل العيوب المكتشفة</Label>
              {defects.map((def, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="destructive" className="text-[10px] shrink-0">{def.item}</Badge>
                  <Input
                    value={def.description}
                    onChange={(e) => {
                      const newDefects = [...defects];
                      newDefects[i] = { ...newDefects[i], description: e.target.value };
                      setDefects(newDefects);
                    }}
                    placeholder="وصف العيب..."
                    className="text-xs h-7"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات عامة</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="ملاحظات اختيارية"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ تقرير الفحص'}
              <ClipboardCheck className="mr-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleInspectionForm;
