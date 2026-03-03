import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  CalendarClock, Plus, Trash2, Loader2, RefreshCw, Pause, Play,
  CalendarDays, Clock, Truck, Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLinkedTransporters } from '@/hooks/useLinkedPartners';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'يومياً' },
  { value: 'weekly', label: 'أسبوعياً' },
  { value: 'biweekly', label: 'كل أسبوعين' },
  { value: 'monthly', label: 'شهرياً' },
];

const DAY_OPTIONS = [
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الاثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
];

const WASTE_TYPES = [
  'بلاستيك', 'ورق وكرتون', 'معادن', 'زجاج', 'خشب',
  'مخلفات عضوية', 'مخلفات إلكترونية', 'مخلفات خطرة',
  'مخلفات بناء وهدم', 'مخلفات طبية', 'إطارات', 'زيوت مستعملة', 'أخرى'
];

const ScheduledCollections = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const { data: transporters } = useLinkedTransporters();

  const [form, setForm] = useState({
    title: '',
    waste_type: '',
    estimated_quantity: '',
    unit: 'طن',
    frequency: 'weekly',
    preferred_day: 'sunday',
    preferred_time_from: '08:00',
    preferred_time_to: '14:00',
    transporter_id: '',
    pickup_address: '',
    auto_create_shipment: true,
    notes: '',
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['scheduled-collections', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_collections')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('scheduled_collections').insert({
        organization_id: organization!.id,
        title: form.title,
        waste_type: form.waste_type,
        estimated_quantity: parseFloat(form.estimated_quantity) || 0,
        unit: form.unit,
        frequency: form.frequency,
        preferred_day: form.preferred_day,
        preferred_time_from: form.preferred_time_from,
        preferred_time_to: form.preferred_time_to,
        transporter_id: form.transporter_id || null,
        pickup_address: form.pickup_address || null,
        auto_create_shipment: form.auto_create_shipment,
        notes: form.notes || null,
        next_collection_date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء جدولة الجمع بنجاح');
      queryClient.invalidateQueries({ queryKey: ['scheduled-collections'] });
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('حدث خطأ في إنشاء الجدولة'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('scheduled_collections')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-collections'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-collections'] });
      toast.success('تم حذف الجدولة');
    },
  });

  const resetForm = () => setForm({
    title: '', waste_type: '', estimated_quantity: '', unit: 'طن',
    frequency: 'weekly', preferred_day: 'sunday', preferred_time_from: '08:00',
    preferred_time_to: '14:00', transporter_id: '', pickup_address: '',
    auto_create_shipment: true, notes: '',
  });

  const getFrequencyLabel = (f: string) => FREQUENCY_OPTIONS.find(o => o.value === f)?.label || f;
  const getDayLabel = (d: string) => DAY_OPTIONS.find(o => o.value === d)?.label || d;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            جدولة الجمع الدورية
          </h3>
          <p className="text-sm text-muted-foreground">إنشاء مواعيد جمع متكررة تلقائياً</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> جدولة جديدة
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !schedules?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">لا توجد جداول جمع دورية</p>
            <Button variant="outline" className="mt-3 gap-2" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4" /> إنشاء أول جدولة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {schedules.map((s: any) => (
            <Card key={s.id} className={`transition-opacity ${!s.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {s.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {s.waste_type} • {s.estimated_quantity} {s.unit}
                    </CardDescription>
                  </div>
                  <Badge variant={s.is_active ? 'default' : 'secondary'}>
                    {s.is_active ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> {getFrequencyLabel(s.frequency)}
                  </span>
                  {s.preferred_day && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {getDayLabel(s.preferred_day)}
                    </span>
                  )}
                  {s.preferred_time_from && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.preferred_time_from}
                    </span>
                  )}
                </div>
                {s.next_collection_date && (
                  <p className="text-xs">
                    الجمع القادم: <strong>{new Date(s.next_collection_date).toLocaleDateString('ar-EG')}</strong>
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="ghost" size="sm" className="gap-1 text-xs"
                    onClick={() => toggleMutation.mutate({ id: s.id, is_active: s.is_active })}
                  >
                    {s.is_active ? <><Pause className="w-3 h-3" /> إيقاف</> : <><Play className="w-3 h-3" /> تفعيل</>}
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="gap-1 text-xs text-destructive"
                    onClick={() => deleteMutation.mutate(s.id)}
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              جدولة جمع دورية جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان الجدولة *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: جمع البلاستيك الأسبوعي" className="text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">نوع النفايات *</Label>
                <Select value={form.waste_type} onValueChange={(v) => setForm(f => ({ ...f, waste_type: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {WASTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الكمية التقديرية</Label>
                <Input type="number" value={form.estimated_quantity} onChange={(e) => setForm(f => ({ ...f, estimated_quantity: e.target.value }))} placeholder="0" className="text-sm" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">التكرار *</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">اليوم المفضل</Label>
                <Select value={form.preferred_day} onValueChange={(v) => setForm(f => ({ ...f, preferred_day: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">من الساعة</Label>
                <Input type="time" value={form.preferred_time_from} onChange={(e) => setForm(f => ({ ...f, preferred_time_from: e.target.value }))} className="text-sm" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">إلى الساعة</Label>
                <Input type="time" value={form.preferred_time_to} onChange={(e) => setForm(f => ({ ...f, preferred_time_to: e.target.value }))} className="text-sm" dir="ltr" />
              </div>
            </div>

            {transporters && transporters.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Truck className="w-3 h-3" /> الناقل</Label>
                <Select value={form.transporter_id} onValueChange={(v) => setForm(f => ({ ...f, transporter_id: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="اختر ناقل (اختياري)" /></SelectTrigger>
                  <SelectContent>
                    {transporters.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">عنوان الاستلام</Label>
              <Input value={form.pickup_address} onChange={(e) => setForm(f => ({ ...f, pickup_address: e.target.value }))} placeholder="العنوان" className="text-sm" />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">إنشاء شحنة تلقائياً</Label>
              <Switch checked={form.auto_create_shipment} onCheckedChange={(v) => setForm(f => ({ ...f, auto_create_shipment: v }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.title || !form.waste_type || createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إنشاء الجدولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledCollections;
