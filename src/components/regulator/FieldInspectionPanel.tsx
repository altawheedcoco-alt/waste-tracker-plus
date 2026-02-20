import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, Plus, MapPin, Calendar, Star, Loader2, Search } from 'lucide-react';
import { useFieldInspections, useAllOrganizations } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const INSPECTION_TYPES = [
  { value: 'routine', label: 'دورية' },
  { value: 'surprise', label: 'مفاجئة' },
  { value: 'complaint_based', label: 'بناءً على شكوى' },
  { value: 'follow_up', label: 'متابعة' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'مجدولة', variant: 'outline' },
  in_progress: { label: 'جارية', variant: 'default' },
  completed: { label: 'مكتملة', variant: 'secondary' },
  cancelled: { label: 'ملغية', variant: 'destructive' },
};

const RATING_MAP: Record<string, { label: string; color: string }> = {
  excellent: { label: 'ممتاز', color: 'text-emerald-600' },
  good: { label: 'جيد', color: 'text-green-600' },
  acceptable: { label: 'مقبول', color: 'text-amber-600' },
  poor: { label: 'ضعيف', color: 'text-orange-600' },
  critical: { label: 'حرج', color: 'text-destructive' },
};

const FieldInspectionPanel = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const { data: inspections = [], isLoading } = useFieldInspections();
  const { data: allOrgs = [] } = useAllOrganizations();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    inspected_organization_id: '',
    inspection_type: 'routine',
    inspection_date: new Date().toISOString().split('T')[0],
    location_address: '',
    findings: '',
    recommendations: '',
    overall_rating: '',
    compliance_score: '',
    status: 'scheduled',
  });

  const handleCreate = async () => {
    if (!organization?.id || !user?.id || !form.inspected_organization_id) {
      toast.error('يرجى اختيار المنظمة المراد تفتيشها');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('field_inspections').insert({
        regulator_organization_id: organization.id,
        inspector_user_id: user.id,
        inspected_organization_id: form.inspected_organization_id,
        inspection_type: form.inspection_type,
        inspection_date: form.inspection_date,
        location_address: form.location_address || null,
        findings: form.findings || null,
        recommendations: form.recommendations || null,
        overall_rating: form.overall_rating || null,
        compliance_score: form.compliance_score ? parseInt(form.compliance_score) : null,
        status: form.status,
      });
      if (error) throw error;
      toast.success('تم إنشاء زيارة التفتيش بنجاح');
      queryClient.invalidateQueries({ queryKey: ['field-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
      setOpen(false);
      setForm({ inspected_organization_id: '', inspection_type: 'routine', inspection_date: new Date().toISOString().split('T')[0], location_address: '', findings: '', recommendations: '', overall_rating: '', compliance_score: '', status: 'scheduled' });
    } catch (err: any) {
      toast.error(err.message || 'فشل في إنشاء زيارة التفتيش');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('field_inspections').update({ status }).eq('id', id);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success('تم تحديث الحالة');
    queryClient.invalidateQueries({ queryKey: ['field-inspections'] });
    queryClient.invalidateQueries({ queryKey: ['regulator-stats'] });
  };

  const filtered = inspections.filter((i: any) => {
    if (!search) return true;
    const orgName = i.inspected_org?.name || '';
    return orgName.includes(search) || i.inspection_type?.includes(search);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              التفتيش الميداني
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 ml-1" /> زيارة جديدة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إنشاء زيارة تفتيش</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label>المنظمة المراد تفتيشها *</Label>
                    <Select value={form.inspected_organization_id} onValueChange={(v) => setForm(f => ({ ...f, inspected_organization_id: v }))}>
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
                      <Label>نوع التفتيش</Label>
                      <Select value={form.inspection_type} onValueChange={(v) => setForm(f => ({ ...f, inspection_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INSPECTION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>تاريخ التفتيش</Label>
                      <Input type="date" value={form.inspection_date} onChange={(e) => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>العنوان / الموقع</Label>
                    <Input value={form.location_address} onChange={(e) => setForm(f => ({ ...f, location_address: e.target.value }))} placeholder="عنوان موقع التفتيش" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>التقييم العام</Label>
                      <Select value={form.overall_rating} onValueChange={(v) => setForm(f => ({ ...f, overall_rating: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(RATING_MAP).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>درجة الامتثال (%)</Label>
                      <Input type="number" min={0} max={100} value={form.compliance_score} onChange={(e) => setForm(f => ({ ...f, compliance_score: e.target.value }))} placeholder="0-100" />
                    </div>
                  </div>
                  <div>
                    <Label>النتائج والملاحظات</Label>
                    <Textarea value={form.findings} onChange={(e) => setForm(f => ({ ...f, findings: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <Label>التوصيات</Label>
                    <Textarea value={form.recommendations} onChange={(e) => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                    إنشاء زيارة التفتيش
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
              <Input className="pr-9" placeholder="بحث عن منظمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد زيارات تفتيش</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((insp: any) => (
                <Card key={insp.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold">{insp.inspected_org?.name || 'منظمة غير معروفة'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(insp.inspection_date), 'yyyy/MM/dd')}
                          <Badge variant="outline" className="text-[10px]">
                            {INSPECTION_TYPES.find(t => t.value === insp.inspection_type)?.label || insp.inspection_type}
                          </Badge>
                        </div>
                        {insp.location_address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {insp.location_address}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {insp.compliance_score != null && (
                          <Badge variant="outline" className={insp.compliance_score >= 80 ? 'text-emerald-600' : insp.compliance_score >= 50 ? 'text-amber-600' : 'text-destructive'}>
                            {insp.compliance_score}%
                          </Badge>
                        )}
                        {insp.overall_rating && (
                          <span className={`text-xs font-medium ${RATING_MAP[insp.overall_rating]?.color || ''}`}>
                            <Star className="w-3 h-3 inline ml-0.5" />
                            {RATING_MAP[insp.overall_rating]?.label || insp.overall_rating}
                          </span>
                        )}
                        <Badge variant={STATUS_MAP[insp.status]?.variant || 'outline'}>
                          {STATUS_MAP[insp.status]?.label || insp.status}
                        </Badge>
                      </div>
                    </div>
                    {insp.findings && <p className="text-sm mt-2 bg-muted/50 p-2 rounded">{insp.findings}</p>}
                    {insp.status === 'scheduled' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(insp.id, 'in_progress')}>بدء التفتيش</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(insp.id, 'cancelled')}>إلغاء</Button>
                      </div>
                    )}
                    {insp.status === 'in_progress' && (
                      <Button size="sm" className="mt-2" onClick={() => updateStatus(insp.id, 'completed')}>إنهاء التفتيش</Button>
                    )}
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

export default FieldInspectionPanel;
