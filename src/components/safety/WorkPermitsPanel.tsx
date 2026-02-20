import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkPermits } from '@/hooks/useSafetyManager';
import { Plus, FileWarning, CheckCircle2, Clock, MapPin, HardHat, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const permitTypes: Record<string, string> = {
  hot_work: 'أعمال ساخنة (لحام/قطع)',
  confined_space: 'أماكن محصورة',
  height_work: 'أعمال على ارتفاع',
  electrical: 'أعمال كهربائية',
  excavation: 'حفريات',
  chemical_handling: 'تداول مواد كيميائية',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'معلق', variant: 'secondary' },
  approved: { label: 'معتمد', variant: 'default' },
  active: { label: 'جاري التنفيذ', variant: 'outline' },
  completed: { label: 'مكتمل', variant: 'default' },
  expired: { label: 'منتهي', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

const ppeOptions = [
  { value: 'hard_hat', label: 'خوذة' },
  { value: 'gloves', label: 'قفازات' },
  { value: 'goggles', label: 'نظارات واقية' },
  { value: 'respirator', label: 'كمامة' },
  { value: 'harness', label: 'حزام أمان' },
  { value: 'boots', label: 'حذاء سلامة' },
];

const WorkPermitsPanel = () => {
  const { permits, isLoading, addPermit, updatePermit } = useWorkPermits();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    permit_type: 'hot_work', title: '', description: '', location: '',
    work_start: '', work_end: '', hazards: '', precautions: '', ppe: [] as string[],
    supervisor_name: '', supervisor_phone: '',
  });

  const handleSubmit = () => {
    if (!form.title || !form.work_start || !form.work_end) return;
    const num = `WP-${Date.now().toString(36).toUpperCase()}`;
    addPermit.mutate({
      permit_number: num,
      permit_type: form.permit_type,
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      work_start: new Date(form.work_start).toISOString(),
      work_end: new Date(form.work_end).toISOString(),
      hazards_identified: form.hazards ? form.hazards.split('\n').filter(Boolean) : [],
      precautions: form.precautions ? form.precautions.split('\n').filter(Boolean) : [],
      ppe_required: form.ppe,
      supervisor_name: form.supervisor_name || null,
      supervisor_phone: form.supervisor_phone || null,
    }, { onSuccess: () => { setOpen(false); setForm({ permit_type: 'hot_work', title: '', description: '', location: '', work_start: '', work_end: '', hazards: '', precautions: '', ppe: [], supervisor_name: '', supervisor_phone: '' }); } });
  };

  const togglePPE = (v: string) => setForm(f => ({ ...f, ppe: f.ppe.includes(v) ? f.ppe.filter(p => p !== v) : [...f.ppe, v] }));

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />تصريح عمل جديد</Button></DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>تصريح عمل خطر جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>نوع التصريح</Label>
                <Select value={form.permit_type} onValueChange={v => setForm(f => ({ ...f, permit_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(permitTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>عنوان العمل *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="أعمال لحام في المستودع" /></div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div><Label>الموقع</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="المستودع الرئيسي - المنطقة B" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>بداية العمل *</Label><Input type="datetime-local" value={form.work_start} onChange={e => setForm(f => ({ ...f, work_start: e.target.value }))} /></div>
                <div><Label>نهاية العمل *</Label><Input type="datetime-local" value={form.work_end} onChange={e => setForm(f => ({ ...f, work_end: e.target.value }))} /></div>
              </div>
              <div><Label>المخاطر المحددة (سطر لكل خطر)</Label><Textarea value={form.hazards} onChange={e => setForm(f => ({ ...f, hazards: e.target.value }))} rows={2} placeholder="خطر الحريق&#10;أبخرة سامة" /></div>
              <div><Label>الاحتياطات (سطر لكل إجراء)</Label><Textarea value={form.precautions} onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))} rows={2} placeholder="توفير طفاية حريق&#10;تهوية المكان" /></div>
              <div>
                <Label>معدات الوقاية الشخصية (PPE)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ppeOptions.map(p => (
                    <Badge key={p.value} variant={form.ppe.includes(p.value) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => togglePPE(p.value)}>
                      {p.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>اسم المشرف</Label><Input value={form.supervisor_name} onChange={e => setForm(f => ({ ...f, supervisor_name: e.target.value }))} /></div>
                <div><Label>هاتف المشرف</Label><Input value={form.supervisor_phone} onChange={e => setForm(f => ({ ...f, supervisor_phone: e.target.value }))} /></div>
              </div>
              <Button onClick={handleSubmit} disabled={addPermit.isPending} className="w-full">{addPermit.isPending ? 'جاري الحفظ...' : 'إنشاء التصريح'}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <h3 className="text-lg font-semibold flex items-center gap-2"><FileWarning className="w-5 h-5 text-amber-500" />تصاريح العمل الخطر</h3>
      </div>

      {permits.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><FileWarning className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد تصاريح عمل</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {permits.map((permit: any) => (
            <Card key={permit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-right">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant={statusConfig[permit.status]?.variant || 'secondary'}>{statusConfig[permit.status]?.label || permit.status}</Badge>
                    {permit.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => updatePermit.mutate({ id: permit.id, status: 'approved', approved_at: new Date().toISOString() })}>
                        <CheckCircle2 className="w-3 h-3 ml-1" />اعتماد
                      </Button>
                    )}
                    {permit.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updatePermit.mutate({ id: permit.id, status: 'active' })}>بدء التنفيذ</Button>
                    )}
                    {permit.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => updatePermit.mutate({ id: permit.id, status: 'completed', closed_at: new Date().toISOString() })}>
                        <CheckCircle2 className="w-3 h-3 ml-1" />إغلاق
                      </Button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{permit.title}</h4>
                    <p className="text-xs text-muted-foreground">{permit.permit_number} • {permitTypes[permit.permit_type] || permit.permit_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground justify-end flex-wrap">
                  {permit.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{permit.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(permit.work_start), 'dd/MM HH:mm')} — {format(new Date(permit.work_end), 'dd/MM HH:mm')}</span>
                </div>
                {permit.ppe_required?.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-end mt-2">
                    {permit.ppe_required.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-[10px]"><HardHat className="w-2.5 h-2.5 ml-0.5" />{ppeOptions.find(o => o.value === p)?.label || p}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkPermitsPanel;
