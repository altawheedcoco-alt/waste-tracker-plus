import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, Truck, User, ShieldCheck, CalendarDays, StickyNote } from 'lucide-react';
import { usePermits, CreatePermitData } from '@/hooks/usePermits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const PERMIT_TYPES = [
  { value: 'waste_exit', label: 'تصريح خروج مخلفات' },
  { value: 'person_access', label: 'تصريح شخص / سائق' },
  { value: 'transport', label: 'تصريح نقل' },
  { value: 'general', label: 'تصريح عام مخصص' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pt-3 pb-1 border-b border-border/50">
    <Icon className="w-4 h-4 text-primary" />
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
  </div>
);

const CreatePermitDialog = ({ open, onOpenChange }: Props) => {
  const { createPermit } = usePermits();
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const { data: shipments } = useQuery({
    queryKey: ['shipments-for-permit', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, waste_description, quantity, unit, manual_vehicle_plate, manual_driver_name, pickup_date')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
  });

  const [form, setForm] = useState<CreatePermitData>({
    permit_type: 'waste_exit',
    purpose: '',
  });

  const update = (key: keyof CreatePermitData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Auto-fill from shipment
  const handleShipmentChange = (shipmentId: string) => {
    if (shipmentId === '_none') {
      update('shipment_id', undefined);
      return;
    }
    update('shipment_id', shipmentId);
    const shipment = shipments?.find(s => s.id === shipmentId);
    if (!shipment) return;

    setForm(prev => ({
      ...prev,
      shipment_id: shipmentId,
      waste_type: shipment.waste_type || prev.waste_type || '',
      waste_description: shipment.waste_description || prev.waste_description || '',
      estimated_quantity: shipment.quantity ?? prev.estimated_quantity,
      quantity_unit: shipment.unit || prev.quantity_unit || 'ton',
      vehicle_plate: shipment.manual_vehicle_plate || prev.vehicle_plate || '',
      person_name: shipment.manual_driver_name || prev.person_name || '',
      valid_from: shipment.pickup_date ? new Date(shipment.pickup_date).toISOString().slice(0, 16) : prev.valid_from || '',
      purpose: prev.purpose || `تصريح مرتبط بالشحنة ${shipment.shipment_number}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPermit.mutateAsync(form);
    onOpenChange(false);
    setForm({ permit_type: 'waste_exit', purpose: '' });
  };

  const showPersonFields = form.permit_type === 'person_access';
  const showWasteFields = form.permit_type === 'waste_exit' || form.permit_type === 'transport';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء تصريح جديد</DialogTitle>
          <DialogDescription>أنشئ تصريحاً أو إذناً جديداً يمكن توقيعه وختمه من عدة أطراف</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Section: Basic Info */}
          <SectionHeader icon={FileText} title="البيانات الأساسية" />
          <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">نوع التصريح *</Label>
              <Select value={form.permit_type} onValueChange={v => update('permit_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERMIT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الغرض</Label>
              <Input value={form.purpose || ''} onChange={e => update('purpose', e.target.value)} placeholder="غرض التصريح" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ربط بشحنة (اختياري) — يملأ البيانات تلقائياً</Label>
              <Select value={form.shipment_id || '_none'} onValueChange={handleShipmentChange}>
                <SelectTrigger><SelectValue placeholder="بدون ربط بشحنة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">بدون ربط بشحنة</SelectItem>
                  {shipments?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipment_number} - {s.waste_type || 'بدون نوع'} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section: Person / Driver */}
          {showPersonFields && (
            <>
              <SectionHeader icon={User} title="بيانات الشخص / السائق" />
              <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم الشخص</Label>
                    <Input value={form.person_name || ''} onChange={e => update('person_name', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الهوية</Label>
                    <Input value={form.person_id_number || ''} onChange={e => update('person_id_number', e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">الصفة / الدور</Label>
                    <Input value={form.person_role || ''} onChange={e => update('person_role', e.target.value)} placeholder="سائق، مندوب، ..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">لوحة المركبة</Label>
                    <Input value={form.vehicle_plate || ''} onChange={e => update('vehicle_plate', e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section: Waste Info */}
          {showWasteFields && (
            <>
              <SectionHeader icon={Truck} title="بيانات المخلفات" />
              <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">نوع المخلف</Label>
                    <Input value={form.waste_type || ''} onChange={e => update('waste_type', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الكمية التقديرية</Label>
                    <Input type="number" value={form.estimated_quantity || ''} onChange={e => update('estimated_quantity', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">وصف المخلف</Label>
                  <Textarea value={form.waste_description || ''} onChange={e => update('waste_description', e.target.value)} rows={2} />
                </div>
              </div>
            </>
          )}

          {/* Section: Validity */}
          <SectionHeader icon={CalendarDays} title="فترة الصلاحية" />
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">صالح من</Label>
                <Input type="datetime-local" value={form.valid_from || ''} onChange={e => update('valid_from', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">صالح حتى</Label>
                <Input type="datetime-local" value={form.valid_until || ''} onChange={e => update('valid_until', e.target.value)} dir="ltr" />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <SectionHeader icon={StickyNote} title="ملاحظات وتعليمات" />
          <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">تعليمات خاصة</Label>
              <Textarea value={form.special_instructions || ''} onChange={e => update('special_instructions', e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إلغاء</Button>
            <Button type="submit" disabled={createPermit.isPending} className="flex-1">
              {createPermit.isPending ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإنشاء...</> : 'إنشاء التصريح'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePermitDialog;
