import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, ClipboardList, Shield, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const licenseCategories = [
  { value: 'commercial_register', label: 'السجل التجاري', authority: 'السجل التجاري', required: true },
  { value: 'tax_card', label: 'البطاقة الضريبية', authority: 'مصلحة الضرائب المصرية', required: true },
  { value: 'e_invoice_registration', label: 'قيد منظومة الفاتورة الإلكترونية', authority: 'مصلحة الضرائب المصرية', required: false },
  { value: 'chamber_membership', label: 'عضوية اتحاد الصناعات / الغرفة التجارية', authority: 'اتحاد الصناعات المصرية', required: false },
  { value: 'ida', label: 'رخصة التشغيل - التنمية الصناعية (IDA)', authority: 'الهيئة العامة للتنمية الصناعية', required: false },
  { value: 'industrial_register', label: 'السجل الصناعي', authority: 'الهيئة العامة للتنمية الصناعية', required: false },
  { value: 'wmra', label: 'ترخيص مزاولة النشاط (WMRA)', authority: 'جهاز تنظيم إدارة المخلفات', required: true },
  { value: 'eeaa', label: 'موافقة تقييم الأثر البيئي (EIA)', authority: 'جهاز شئون البيئة', required: true },
  { value: 'hazardous_handling', label: 'ترخيص تداول مواد خطرة', authority: 'وزارة البيئة / الصحة / الصناعة', required: false },
  { value: 'civil_protection', label: 'تصريح الحماية المدنية (حريق)', authority: 'إدارة الحماية المدنية', required: false },
  { value: 'atomic_energy', label: 'تصريح هيئة الطاقة الذرية', authority: 'هيئة الطاقة الذرية', required: false },
  { value: 'activity_specific', label: 'ترخيص نشاط نوعي', authority: 'الجهة المختصة', required: false },
  { value: 'other', label: 'أخرى', authority: '', required: false },
];

const inspectionAuthorities = [
  { value: 'wmra', label: 'جهاز تنظيم إدارة المخلفات (WMRA)' },
  { value: 'eeaa', label: 'جهاز شئون البيئة (EEAA)' },
  { value: 'civil_protection', label: 'إدارة الحماية المدنية' },
  { value: 'ida', label: 'الهيئة العامة للتنمية الصناعية' },
  { value: 'health', label: 'وزارة الصحة' },
  { value: 'other', label: 'جهة أخرى' },
];

const LicenseManagementDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState('add');
  const [saving, setSaving] = useState(false);
  const [savingInspection, setSavingInspection] = useState(false);

  // License form
  const [form, setForm] = useState({
    license_category: '',
    license_name: '',
    issuing_authority: '',
    license_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  });

  // Inspection form
  const [inspForm, setInspForm] = useState({
    inspection_date: '',
    inspector_name: '',
    inspector_authority: '',
    inspection_type: 'routine',
    result: 'pending',
    findings: '',
    recommendations: '',
    risk_level: 'low',
    follow_up_date: '',
    corrective_actions: '',
  });

  // Existing licenses
  const { data: licenses = [], refetch: refetchLicenses } = useQuery({
    queryKey: ['legal-licenses-manage', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from('legal_licenses').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId && open,
  });

  // Existing inspections
  const { data: inspections = [], refetch: refetchInspections } = useQuery({
    queryKey: ['inspection-logs-manage', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from('inspection_logs').select('*').eq('organization_id', orgId).order('inspection_date', { ascending: false });
      return data || [];
    },
    enabled: !!orgId && open,
  });

  const handleCategoryChange = (value: string) => {
    const cat = licenseCategories.find(c => c.value === value);
    setForm(prev => ({
      ...prev,
      license_category: value,
      license_name: cat?.label || '',
      issuing_authority: cat?.authority || '',
    }));
  };

  const handleSaveLicense = async () => {
    if (!orgId || !form.license_category || !form.license_name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('legal_licenses').insert({
        organization_id: orgId,
        license_category: form.license_category,
        license_name: form.license_name,
        issuing_authority: form.issuing_authority,
        license_number: form.license_number || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('تم إضافة الترخيص بنجاح');
      setForm({ license_category: '', license_name: '', issuing_authority: '', license_number: '', issue_date: '', expiry_date: '', notes: '' });
      refetchLicenses();
      onSaved();
    } catch (err: any) {
      toast.error('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInspection = async () => {
    if (!orgId || !inspForm.inspection_date || !inspForm.inspector_authority) {
      toast.error('يرجى ملء تاريخ التفتيش والجهة');
      return;
    }
    setSavingInspection(true);
    try {
      const { error } = await supabase.from('inspection_logs').insert({
        organization_id: orgId,
        inspection_date: inspForm.inspection_date,
        inspector_name: inspForm.inspector_name || null,
        inspector_authority: inspForm.inspector_authority,
        inspection_type: inspForm.inspection_type,
        result: inspForm.result,
        findings: inspForm.findings || null,
        recommendations: inspForm.recommendations || null,
        risk_level: inspForm.risk_level,
        follow_up_date: inspForm.follow_up_date || null,
        corrective_actions: inspForm.corrective_actions || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('تم تسجيل محضر التفتيش');
      setInspForm({ inspection_date: '', inspector_name: '', inspector_authority: '', inspection_type: 'routine', result: 'pending', findings: '', recommendations: '', risk_level: 'low', follow_up_date: '', corrective_actions: '' });
      refetchInspections();
    } catch (err: any) {
      toast.error('خطأ: ' + err.message);
    } finally {
      setSavingInspection(false);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    const { error } = await supabase.from('legal_licenses').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    toast.success('تم حذف الترخيص');
    refetchLicenses();
    onSaved();
  };

  const getStatusLight = (lic: any) => {
    if (!lic.expiry_date) return 'green';
    const days = differenceInDays(new Date(lic.expiry_date), new Date());
    if (days < 0) return 'red';
    if (days <= 30) return 'yellow';
    return 'green';
  };

  const resultLabels: Record<string, string> = {
    passed: 'ناجح ✅', passed_with_notes: 'ناجح مع ملاحظات ⚠️', failed: 'فشل ❌', pending: 'قيد المراجعة ⏳',
  };

  // Check which required licenses are missing
  const requiredCategories = licenseCategories.filter(c => c.required);
  const existingCategories = new Set(licenses.map((l: any) => l.license_category));
  const missingRequired = requiredCategories.filter(c => !existingCategories.has(c.value));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 justify-end">
            <Shield className="w-5 h-5" />
            إدارة التراخيص والامتثال القانوني
          </DialogTitle>
        </DialogHeader>

        {/* Missing Required Licenses Alert */}
        {missingRequired.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1.5 text-right">
              ⚠️ تراخيص إلزامية مفقودة ({missingRequired.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {missingRequired.map(c => (
                <Badge key={c.value} variant="destructive" className="text-[10px]">{c.label}</Badge>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="inspections" className="text-xs gap-1">
              <ClipboardList className="w-3 h-3" /> سجل التفتيش
            </TabsTrigger>
            <TabsTrigger value="existing" className="text-xs gap-1">
              <FileText className="w-3 h-3" /> التراخيص ({licenses.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="text-xs gap-1">
              <Plus className="w-3 h-3" /> إضافة ترخيص
            </TabsTrigger>
          </TabsList>

          {/* Add License Tab */}
          <TabsContent value="add" className="space-y-3 mt-3">
            <div>
              <Label>نوع الترخيص *</Label>
              <Select value={form.license_category} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="اختر نوع الترخيص" /></SelectTrigger>
                <SelectContent>
                  {licenseCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} {c.required && '(إلزامي)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>اسم الترخيص *</Label>
              <Input value={form.license_name} onChange={e => setForm(p => ({ ...p, license_name: e.target.value }))} />
            </div>

            <div>
              <Label>الجهة المصدرة *</Label>
              <Input value={form.issuing_authority} onChange={e => setForm(p => ({ ...p, issuing_authority: e.target.value }))} />
            </div>

            <div>
              <Label>رقم الترخيص</Label>
              <Input value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>تاريخ الإصدار</Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>

            <Button onClick={handleSaveLicense} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة الترخيص
            </Button>
          </TabsContent>

          {/* Existing Licenses Tab */}
          <TabsContent value="existing" className="mt-3">
            {licenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">لا توجد تراخيص مسجلة</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {licenses.map((lic: any) => {
                  const light = getStatusLight(lic);
                  const days = lic.expiry_date ? differenceInDays(new Date(lic.expiry_date), new Date()) : null;
                  return (
                    <div key={lic.id} className={`p-3 rounded-lg border bg-card ${
                      light === 'red' ? 'border-red-300' : light === 'yellow' ? 'border-amber-300' : ''
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <Button variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0 shrink-0" onClick={() => handleDeleteLicense(lic.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              light === 'red' ? 'bg-red-500' : light === 'yellow' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`} />
                            <span className="text-sm font-medium">{lic.license_name}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {lic.issuing_authority}
                            {lic.license_number && ` • رقم: ${lic.license_number}`}
                          </p>
                          {lic.expiry_date && (
                            <p className={`text-[10px] mt-0.5 ${
                              light === 'red' ? 'text-red-600 font-bold' : light === 'yellow' ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                            }`}>
                              {light === 'red' ? `⛔ منتهي منذ ${Math.abs(days!)} يوم` :
                               light === 'yellow' ? `⚠️ ينتهي خلال ${days} يوم` :
                               `ينتهي: ${format(new Date(lic.expiry_date), 'dd MMM yyyy', { locale: ar })}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Inspection Log Tab */}
          <TabsContent value="inspections" className="space-y-3 mt-3">
            {/* Add Inspection Form */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <p className="text-sm font-medium text-right">تسجيل محضر تفتيش جديد</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">تاريخ التفتيش *</Label>
                  <Input type="date" value={inspForm.inspection_date} onChange={e => setInspForm(p => ({ ...p, inspection_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">اسم المفتش</Label>
                  <Input value={inspForm.inspector_name} onChange={e => setInspForm(p => ({ ...p, inspector_name: e.target.value }))} placeholder="اسم المفتش" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">الجهة المفتشة *</Label>
                  <Select value={inspForm.inspector_authority} onValueChange={v => setInspForm(p => ({ ...p, inspector_authority: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                    <SelectContent>
                      {inspectionAuthorities.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">النتيجة</Label>
                  <Select value={inspForm.result} onValueChange={v => setInspForm(p => ({ ...p, result: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">ناجح</SelectItem>
                      <SelectItem value="passed_with_notes">ناجح مع ملاحظات</SelectItem>
                      <SelectItem value="failed">فشل</SelectItem>
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">مستوى الخطر</Label>
                  <Select value={inspForm.risk_level} onValueChange={v => setInspForm(p => ({ ...p, risk_level: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض 🟢</SelectItem>
                      <SelectItem value="medium">متوسط 🟡</SelectItem>
                      <SelectItem value="high">عالي 🟠</SelectItem>
                      <SelectItem value="critical">حرج 🔴</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">تاريخ المتابعة</Label>
                  <Input type="date" value={inspForm.follow_up_date} onChange={e => setInspForm(p => ({ ...p, follow_up_date: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label className="text-xs">الملاحظات والنتائج</Label>
                <Textarea value={inspForm.findings} onChange={e => setInspForm(p => ({ ...p, findings: e.target.value }))} rows={2} placeholder="ملاحظات التفتيش..." />
              </div>

              <div>
                <Label className="text-xs">الإجراءات التصحيحية المطلوبة</Label>
                <Textarea value={inspForm.corrective_actions} onChange={e => setInspForm(p => ({ ...p, corrective_actions: e.target.value }))} rows={2} placeholder="الإجراءات المطلوبة..." />
              </div>

              <Button onClick={handleSaveInspection} disabled={savingInspection} size="sm" className="w-full gap-2">
                {savingInspection ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardList className="w-3 h-3" />}
                تسجيل المحضر
              </Button>
            </div>

            {/* Inspection History */}
            {inspections.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-right">سجل التفتيشات ({inspections.length})</p>
                {inspections.map((insp: any) => (
                  <div key={insp.id} className={`p-2.5 rounded-lg border text-right ${
                    insp.result === 'failed' ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <Badge variant={insp.result === 'failed' ? 'destructive' : insp.result === 'passed' ? 'default' : 'secondary'} className="text-[10px]">
                        {resultLabels[insp.result] || insp.result}
                      </Badge>
                      <div>
                        <span className="text-xs font-medium">
                          {inspectionAuthorities.find(a => a.value === insp.inspector_authority)?.label || insp.inspector_authority}
                        </span>
                        <span className="text-[10px] text-muted-foreground mr-2">
                          {format(new Date(insp.inspection_date), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    </div>
                    {insp.findings && <p className="text-[10px] text-muted-foreground mt-1">{insp.findings}</p>}
                    {insp.corrective_actions && (
                      <p className="text-[10px] text-amber-600 mt-1">📋 إجراء مطلوب: {insp.corrective_actions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseManagementDialog;
