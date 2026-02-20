import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Gavel, Plus, Loader2, Search, DollarSign, Ban, Clock } from 'lucide-react';
import { useRegulatoryPenalties, useRegulatoryViolations } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const PENALTY_TYPES = [
  { value: 'warning', label: 'إنذار', icon: '⚠️' },
  { value: 'fine', label: 'غرامة مالية', icon: '💰' },
  { value: 'license_suspension', label: 'تعليق ترخيص', icon: '🔒' },
  { value: 'license_revocation', label: 'إلغاء ترخيص', icon: '❌' },
  { value: 'temporary_ban', label: 'حظر مؤقت', icon: '⏳' },
  { value: 'permanent_ban', label: 'حظر نهائي', icon: '🚫' },
  { value: 'corrective_action', label: 'إجراء تصحيحي', icon: '🔧' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'نشطة', color: 'bg-red-500/10 text-red-600' },
  appealed: { label: 'مستأنفة', color: 'bg-blue-500/10 text-blue-600' },
  suspended: { label: 'معلقة', color: 'bg-amber-500/10 text-amber-600' },
  completed: { label: 'مكتملة', color: 'bg-emerald-500/10 text-emerald-600' },
  cancelled: { label: 'ملغية', color: 'bg-muted text-muted-foreground' },
};

const PenaltiesPanel = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const { data: penalties = [], isLoading } = useRegulatoryPenalties();
  const { data: violations = [] } = useRegulatoryViolations();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    violation_id: '',
    penalty_type: 'warning',
    fine_amount: '',
    corrective_action_required: '',
    corrective_action_deadline: '',
    suspension_start_date: '',
    suspension_end_date: '',
    notes: '',
  });

  const selectedViolation = violations.find((v: any) => v.id === form.violation_id);

  const handleCreate = async () => {
    if (!organization?.id || !user?.id || !form.violation_id) {
      toast.error('يرجى اختيار المخالفة');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('regulatory_penalties').insert({
        violation_id: form.violation_id,
        regulator_organization_id: organization.id,
        issued_by_user_id: user.id,
        target_organization_id: (selectedViolation as any)?.violating_organization_id || (selectedViolation as any)?.violating_org?.id,
        penalty_type: form.penalty_type,
        fine_amount: form.fine_amount ? parseFloat(form.fine_amount) : null,
        corrective_action_required: form.corrective_action_required || null,
        corrective_action_deadline: form.corrective_action_deadline || null,
        suspension_start_date: form.suspension_start_date || null,
        suspension_end_date: form.suspension_end_date || null,
        notes: form.notes || null,
        appeal_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
      toast.success('تم إصدار العقوبة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['regulatory-penalties'] });
      queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
      setOpen(false);
      setForm({ violation_id: '', penalty_type: 'warning', fine_amount: '', corrective_action_required: '', corrective_action_deadline: '', suspension_start_date: '', suspension_end_date: '', notes: '' });
    } catch (err: any) {
      toast.error(err.message || 'فشل في إصدار العقوبة');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('regulatory_penalties').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success('تم تحديث حالة العقوبة');
    queryClient.invalidateQueries({ queryKey: ['regulatory-penalties'] });
    queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
  };

  const filtered = penalties.filter((p: any) => {
    if (!search) return true;
    return (p.target_org?.name || '').includes(search) || p.penalty_number?.includes(search);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="w-5 h-5 text-amber-600" />
              القرارات والعقوبات
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default"><Plus className="w-4 h-4 ml-1" /> إصدار عقوبة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إصدار قرار / عقوبة</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label>المخالفة المرتبطة *</Label>
                    <Select value={form.violation_id} onValueChange={(v) => setForm(f => ({ ...f, violation_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المخالفة" /></SelectTrigger>
                      <SelectContent>
                        {violations.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.violation_number} - {v.violating_org?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع العقوبة *</Label>
                    <Select value={form.penalty_type} onValueChange={(v) => setForm(f => ({ ...f, penalty_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PENALTY_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.penalty_type === 'fine' && (
                    <div>
                      <Label>مبلغ الغرامة (ج.م)</Label>
                      <Input type="number" value={form.fine_amount} onChange={(e) => setForm(f => ({ ...f, fine_amount: e.target.value }))} placeholder="0.00" />
                    </div>
                  )}
                  {(form.penalty_type === 'license_suspension' || form.penalty_type === 'temporary_ban') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>تاريخ البدء</Label>
                        <Input type="date" value={form.suspension_start_date} onChange={(e) => setForm(f => ({ ...f, suspension_start_date: e.target.value }))} />
                      </div>
                      <div>
                        <Label>تاريخ الانتهاء</Label>
                        <Input type="date" value={form.suspension_end_date} onChange={(e) => setForm(f => ({ ...f, suspension_end_date: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  {form.penalty_type === 'corrective_action' && (
                    <>
                      <div>
                        <Label>الإجراء التصحيحي المطلوب</Label>
                        <Textarea value={form.corrective_action_required} onChange={(e) => setForm(f => ({ ...f, corrective_action_required: e.target.value }))} rows={2} />
                      </div>
                      <div>
                        <Label>الموعد النهائي</Label>
                        <Input type="date" value={form.corrective_action_deadline} onChange={(e) => setForm(f => ({ ...f, corrective_action_deadline: e.target.value }))} />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Gavel className="w-4 h-4 ml-1" />}
                    إصدار القرار
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد عقوبات</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: any) => {
                const pType = PENALTY_TYPES.find(t => t.value === p.penalty_type);
                return (
                  <Card key={p.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{pType?.icon}</span>
                            <span className="font-semibold">{pType?.label || p.penalty_type}</span>
                            <span className="font-mono text-xs text-muted-foreground">{p.penalty_number}</span>
                          </div>
                          <p className="text-sm">{p.target_org?.name || 'منظمة غير معروفة'}</p>
                          {p.violation && (
                            <p className="text-xs text-muted-foreground">مخالفة: {p.violation.violation_number}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {p.fine_amount && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {Number(p.fine_amount).toLocaleString()} ج.م
                              {p.fine_paid && <span className="text-emerald-600">✓</span>}
                            </Badge>
                          )}
                          <Badge variant="outline" className={STATUS_MAP[p.status]?.color || ''}>
                            {STATUS_MAP[p.status]?.label || p.status}
                          </Badge>
                        </div>
                      </div>
                      {p.notes && <p className="text-sm mt-2 bg-muted/50 p-2 rounded">{p.notes}</p>}
                      {p.suspension_start_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          فترة التعليق: {format(new Date(p.suspension_start_date), 'yyyy/MM/dd')} - {p.suspension_end_date ? format(new Date(p.suspension_end_date), 'yyyy/MM/dd') : 'غير محدد'}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), 'yyyy/MM/dd HH:mm')}</span>
                        {p.status === 'active' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, 'suspended')}>تعليق</Button>
                            <Button size="sm" variant="default" onClick={() => updateStatus(p.id, 'completed')}>تم التنفيذ</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PenaltiesPanel;
