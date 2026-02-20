import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Plus, Calendar, User, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'مفتوح', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  pending_verification: { label: 'بانتظار التحقق', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: ClipboardCheck },
  closed: { label: 'مغلق', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  overdue: { label: 'متأخر', color: 'bg-red-200 text-red-900 dark:bg-red-950/40 dark:text-red-200', icon: AlertCircle },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'حرج', color: 'bg-red-500 text-white' },
  major: { label: 'رئيسي', color: 'bg-orange-500 text-white' },
  minor: { label: 'ثانوي', color: 'bg-amber-500 text-white' },
  observation: { label: 'ملاحظة', color: 'bg-blue-500 text-white' },
};

const sourceLabels: Record<string, string> = {
  internal_audit: 'تدقيق داخلي',
  external_audit: 'تدقيق خارجي',
  customer_complaint: 'شكوى عميل',
  incident: 'حادث',
  observation: 'ملاحظة',
  risk_register: 'سجل المخاطر',
};

const CorrectiveActionsWidget = () => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCAR, setEditingCAR] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', description: '', source: 'internal_audit', severity: 'minor',
    root_cause: '', corrective_action: '', preventive_action: '',
    deadline: '', iso_clause: '', status: 'open', evidence_notes: '',
  });

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['corrective-actions', orgId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('corrective_actions') as any)
        .select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        deadline: values.deadline || null,
      };
      if (editingCAR) {
        const { error } = await (supabase.from('corrective_actions') as any).update(payload).eq('id', editingCAR.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('corrective_actions') as any)
          .insert({ ...payload, organization_id: orgId, created_by: user?.id, ticket_number: '' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      toast.success(editingCAR ? 'تم تحديث التذكرة' : 'تم فتح تذكرة تصحيحية جديدة');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCAR(null);
    setForm({ title: '', description: '', source: 'internal_audit', severity: 'minor', root_cause: '', corrective_action: '', preventive_action: '', deadline: '', iso_clause: '', status: 'open', evidence_notes: '' });
  };

  const openEdit = (car: any) => {
    setEditingCAR(car);
    setForm({
      title: car.title, description: car.description || '', source: car.source, severity: car.severity,
      root_cause: car.root_cause || '', corrective_action: car.corrective_action || '',
      preventive_action: car.preventive_action || '', deadline: car.deadline || '',
      iso_clause: car.iso_clause || '', status: car.status, evidence_notes: car.evidence_notes || '',
    });
    setShowForm(true);
  };

  const openCount = cars.filter((c: any) => c.status === 'open' || (c.deadline && isPast(new Date(c.deadline)) && c.status !== 'closed')).length;

  if (isLoading) return <Card><CardHeader><CardTitle>الأفعال التصحيحية</CardTitle></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> فتح تذكرة
            </Button>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              الأفعال التصحيحية (CAR)
              {openCount > 0 && <Badge variant="destructive" className="text-[10px]">{openCount} مفتوحة</Badge>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Summary */}
          <div className="flex gap-2 flex-wrap justify-end text-[10px]">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = cars.filter((c: any) => c.status === key).length;
              return count > 0 ? <Badge key={key} className={`${cfg.color} text-[10px]`}>{cfg.label}: {count}</Badge> : null;
            })}
          </div>

          {/* List */}
          {cars.map((car: any) => {
            const isOverdue = car.deadline && isPast(new Date(car.deadline)) && car.status !== 'closed';
            const st = isOverdue ? statusConfig.overdue : statusConfig[car.status] || statusConfig.open;
            const sev = severityConfig[car.severity] || severityConfig.minor;
            const StIcon = st.icon;
            return (
              <div key={car.id} className={`p-3 rounded-lg border bg-card ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}
                onClick={() => openEdit(car)} role="button" tabIndex={0}>
                <div className="flex items-start justify-between gap-2">
                  <StIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isOverdue ? 'text-red-600' : ''}`} />
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                      <Badge className={`${sev.color} text-[9px]`}>{sev.label}</Badge>
                      <Badge className={`${st.color} text-[9px]`}>{st.label}</Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{car.ticket_number}</span>
                    </div>
                    <h4 className="text-sm font-semibold mt-0.5">{car.title}</h4>
                    {car.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{car.description}</p>}
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-1 justify-end">
                      <span>{sourceLabels[car.source]}</span>
                      {car.deadline && (
                        <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                          <Calendar className="w-3 h-3" /> {format(new Date(car.deadline), 'dd/MM/yyyy')}
                        </span>
                      )}
                      {car.iso_clause && <span>بند: {car.iso_clause}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {cars.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">لا توجد تذاكر تصحيحية</p>}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent dir="rtl" className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCAR ? `تعديل ${editingCAR.ticket_number}` : 'فتح تذكرة تصحيحية'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>العنوان *</Label><Input fieldContext="corrective_action_title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المصدر</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>الخطورة</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(severityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {editingCAR && (
              <div>
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="pending_verification">بانتظار التحقق</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>تحليل السبب الجذري</Label><Textarea value={form.root_cause} onChange={e => setForm({ ...form, root_cause: e.target.value })} rows={2} /></div>
            <div><Label>الإجراء التصحيحي</Label><Textarea value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} rows={2} /></div>
            <div><Label>الإجراء الوقائي</Label><Textarea value={form.preventive_action} onChange={e => setForm({ ...form, preventive_action: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الموعد النهائي</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              <div><Label>بند ISO</Label><Input fieldContext="iso_clause" value={form.iso_clause} onChange={e => setForm({ ...form, iso_clause: e.target.value })} placeholder="10.2" /></div>
            </div>
            <div><Label>ملاحظات الإثبات</Label><Textarea value={form.evidence_notes} onChange={e => setForm({ ...form, evidence_notes: e.target.value })} rows={2} placeholder="وصف دليل الإصلاح المرفق" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {editingCAR ? 'تحديث' : 'فتح التذكرة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CorrectiveActionsWidget;
