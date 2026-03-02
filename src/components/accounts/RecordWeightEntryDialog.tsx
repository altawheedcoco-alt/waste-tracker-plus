import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Scale, Loader2, CalendarIcon } from 'lucide-react';

interface RecordWeightEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  isExternal?: boolean;
  onSuccess?: () => void;
}

const wasteTypes = [
  'ورق وكرتون', 'بلاستيك', 'حديد وصلب', 'ألومنيوم', 'نحاس',
  'زجاج', 'خشب', 'مخلفات عضوية', 'مخلفات إلكترونية', 'مخلفات طبية',
  'مخلفات بناء', 'إطارات', 'زيوت مستعملة', 'مخلفات نسيج', 'أخرى',
];

export default function RecordWeightEntryDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  isExternal = false,
  onSuccess,
}: RecordWeightEntryDialogProps) {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    waste_type: '',
    quantity: '',
    unit: 'طن',
    price_per_unit: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const totalAmount = (Number(form.quantity) || 0) * (Number(form.price_per_unit) || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('لم يتم تحديد المنظمة');
      if (!form.waste_type) throw new Error('يرجى تحديد نوع المخلف');
      if (!form.quantity || Number(form.quantity) <= 0) throw new Error('يرجى إدخال الكمية');
      if (!form.price_per_unit || Number(form.price_per_unit) <= 0) throw new Error('يرجى إدخال سعر الوحدة');

      const description = `وزنة مباشرة - ${form.waste_type} | ${form.quantity} ${form.unit} × ${form.price_per_unit} ج.م`;

      const entry: Record<string, any> = {
        organization_id: organization.id,
        entry_type: 'credit',
        entry_category: 'weight_entry',
        amount: totalAmount,
        description,
        entry_date: form.entry_date,
        created_by: profile?.id,
        reference_number: `WE-${Date.now().toString(36).toUpperCase()}`,
      };

      if (isExternal) {
        entry.external_partner_id = partnerId;
      } else {
        entry.partner_organization_id = partnerId;
      }

      const { error } = await supabase
        .from('accounting_ledger')
        .insert([entry as any]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تسجيل الوزنة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['partner-weight-entries'] });
      queryClient.invalidateQueries({ queryKey: ['partner-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['partner-ledger-entries'] });
      setForm({
        waste_type: '', quantity: '', unit: 'طن',
        price_per_unit: '', entry_date: new Date().toISOString().split('T')[0], notes: '',
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            تسجيل وزنة - {partnerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Waste Type */}
          <div className="space-y-2">
            <Label>نوع المخلف *</Label>
            <Select value={form.waste_type} onValueChange={(v) => setForm(f => ({ ...f, waste_type: v }))}>
              <SelectTrigger><SelectValue placeholder="اختر نوع المخلف" /></SelectTrigger>
              <SelectContent>
                {wasteTypes.map(wt => (
                  <SelectItem key={wt} value={wt}>{wt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>الكمية (الوزن) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.quantity}
                onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select value={form.unit} onValueChange={(v) => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="طن">طن</SelectItem>
                  <SelectItem value="كجم">كجم</SelectItem>
                  <SelectItem value="قطعة">قطعة</SelectItem>
                  <SelectItem value="متر مكعب">م³</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price per Unit */}
          <div className="space-y-2">
            <Label>سعر الوحدة (ج.م) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.price_per_unit}
              onChange={(e) => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
            />
          </div>

          {/* Total - Calculated */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الإجمالي</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US').format(totalAmount)} <span className="text-sm font-normal">ج.م</span>
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              التاريخ
            </Label>
            <Input
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm(f => ({ ...f, entry_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              placeholder="ملاحظات إضافية (اختياري)..."
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.waste_type || !form.quantity || !form.price_per_unit}
            className="gap-2"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            تسجيل الوزنة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
