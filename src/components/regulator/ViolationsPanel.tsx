import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Plus, Loader2, Search, Scale } from 'lucide-react';
import { useRegulatoryViolations, useAllOrganizations } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const VIOLATION_TYPES = [
  { value: 'license_expired', label: 'ترخيص منتهي' },
  { value: 'illegal_dumping', label: 'تخلص غير قانوني' },
  { value: 'unsafe_transport', label: 'نقل غير آمن' },
  { value: 'missing_documents', label: 'مستندات ناقصة' },
  { value: 'environmental_breach', label: 'خرق بيئي' },
  { value: 'weight_tampering', label: 'تلاعب بالأوزان' },
  { value: 'route_deviation', label: 'انحراف عن المسار' },
  { value: 'unauthorized_waste', label: 'مخلفات غير مصرح بها' },
];

const SEVERITY_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  minor: { label: 'بسيطة', variant: 'secondary' },
  major: { label: 'جسيمة', variant: 'default' },
  critical: { label: 'حرجة', variant: 'destructive' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  issued: { label: 'صادرة', color: 'bg-red-500/10 text-red-600' },
  acknowledged: { label: 'تم الإقرار', color: 'bg-amber-500/10 text-amber-600' },
  appealed: { label: 'مستأنفة', color: 'bg-blue-500/10 text-blue-600' },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500/10 text-emerald-600' },
  escalated: { label: 'تم التصعيد', color: 'bg-purple-500/10 text-purple-600' },
  cancelled: { label: 'ملغية', color: 'bg-muted text-muted-foreground' },
};

const ViolationsPanel = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const { data: violations = [], isLoading } = useRegulatoryViolations();
  const { data: allOrgs = [] } = useAllOrganizations();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    violating_organization_id: '',
    violation_type: 'license_expired',
    severity: 'minor',
    description_ar: '',
    legal_reference: '',
    location_address: '',
  });

  const handleCreate = async () => {
    if (!organization?.id || !user?.id || !form.violating_organization_id || !form.description_ar) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('regulatory_violations').insert({
        regulator_organization_id: organization.id,
        issued_by_user_id: user.id,
        violating_organization_id: form.violating_organization_id,
        violation_type: form.violation_type,
        severity: form.severity,
        description_ar: form.description_ar,
        legal_reference: form.legal_reference || null,
        location_address: form.location_address || null,
        response_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
      toast.success('تم إصدار المخالفة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['regulatory-violations'] });
      queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
      setOpen(false);
      setForm({ violating_organization_id: '', violation_type: 'license_expired', severity: 'minor', description_ar: '', legal_reference: '', location_address: '' });
    } catch (err: any) {
      toast.error(err.message || 'فشل في إصدار المخالفة');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user?.id;
    }
    const { error } = await supabase.from('regulatory_violations').update(updates).eq('id', id);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success('تم تحديث حالة المخالفة');
    queryClient.invalidateQueries({ queryKey: ['regulatory-violations'] });
    queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
  };

  const filtered = violations.filter((v: any) => {
    if (!search) return true;
    return (v.violating_org?.name || '').includes(search) || v.violation_number?.includes(search) || v.description_ar?.includes(search);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              المخالفات التنظيمية
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive"><Plus className="w-4 h-4 ml-1" /> إصدار مخالفة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إصدار مخالفة تنظيمية</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label>المنظمة المخالفة *</Label>
                    <Select value={form.violating_organization_id} onValueChange={(v) => setForm(f => ({ ...f, violating_organization_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المنظمة" /></SelectTrigger>
                      <SelectContent>
                        {allOrgs.map((org: any) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>نوع المخالفة *</Label>
                      <Select value={form.violation_type} onValueChange={(v) => setForm(f => ({ ...f, violation_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VIOLATION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الخطورة</Label>
                      <Select value={form.severity} onValueChange={(v) => setForm(f => ({ ...f, severity: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>وصف المخالفة *</Label>
                    <Textarea value={form.description_ar} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={3} placeholder="وصف تفصيلي للمخالفة..." />
                  </div>
                  <div>
                    <Label>المرجع القانوني</Label>
                    <Input value={form.legal_reference} onChange={(e) => setForm(f => ({ ...f, legal_reference: e.target.value }))} placeholder="مثال: قانون 202/2020 مادة 15" />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} variant="destructive" className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Scale className="w-4 h-4 ml-1" />}
                    إصدار المخالفة
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
              <Input className="pr-9" placeholder="بحث برقم المخالفة أو اسم المنظمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد مخالفات ✅</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((v: any) => (
                <Card key={v.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{v.violation_number}</span>
                          <Badge variant={SEVERITY_MAP[v.severity]?.variant || 'secondary'}>
                            {SEVERITY_MAP[v.severity]?.label || v.severity}
                          </Badge>
                        </div>
                        <p className="font-semibold">{v.violating_org?.name || 'منظمة غير معروفة'}</p>
                        <p className="text-xs text-muted-foreground">
                          {VIOLATION_TYPES.find(t => t.value === v.violation_type)?.label || v.violation_type}
                          {v.legal_reference && <span className="mr-2">• {v.legal_reference}</span>}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_MAP[v.status]?.color || ''}>
                        {STATUS_MAP[v.status]?.label || v.status}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2 bg-muted/50 p-2 rounded">{v.description_ar}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{format(new Date(v.created_at), 'yyyy/MM/dd HH:mm')}</span>
                      {v.status === 'issued' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'escalated')}>تصعيد</Button>
                          <Button size="sm" variant="default" onClick={() => updateStatus(v.id, 'resolved')}>تم الحل</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationsPanel;
