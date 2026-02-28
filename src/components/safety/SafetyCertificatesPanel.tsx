import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSafetyCertificates } from '@/hooks/useSafetySystem';
import { Plus, Award, Loader2, X, Shield, QrCode, FileText, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CERT_TYPES = [
  { id: 'ppe_compliance', ar: 'شهادة امتثال PPE' },
  { id: 'fire_safety', ar: 'شهادة السلامة من الحريق' },
  { id: 'hazard_control', ar: 'شهادة السيطرة على المخاطر' },
  { id: 'first_aid', ar: 'شهادة الإسعافات الأولية' },
  { id: 'vehicle_safety', ar: 'شهادة سلامة المركبة' },
  { id: 'driver_safety', ar: 'شهادة سلامة السائق' },
  { id: 'toolbox_completion', ar: 'شهادة إتمام Toolbox Talk' },
  { id: 'inspection_clearance', ar: 'شهادة تخليص تفتيش' },
  { id: 'training_completion', ar: 'شهادة إتمام تدريب' },
  { id: 'site_clearance', ar: 'شهادة تخليص موقع' },
];

const RECIPIENT_TYPES = [
  { id: 'employee', ar: 'موظف' },
  { id: 'driver', ar: 'سائق' },
  { id: 'worker', ar: 'عامل' },
  { id: 'vehicle', ar: 'مركبة' },
  { id: 'site', ar: 'موقع' },
  { id: 'organization', ar: 'جهة/شركة' },
];

const SafetyCertificatesPanel = memo(() => {
  const { certificates, isLoading, issue } = useSafetyCertificates();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const certType = CERT_TYPES.find(c => c.id === form.certificate_type);
    if (!form.certificate_type || !form.recipient_name || !form.recipient_type) return;
    issue.mutate({
      ...form,
      certificate_type_ar: certType?.ar || form.certificate_type,
    }, {
      onSuccess: () => { setShowForm(false); setForm({}); },
    });
  };

  const activeCerts = certificates.filter((c: any) => c.status === 'active');
  const expiredCerts = certificates.filter((c: any) => c.status === 'expired' || (c.expiry_date && new Date(c.expiry_date) < new Date()));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">شهادات السلامة</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'إصدار شهادة'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{certificates.length}</p>
          <p className="text-[11px] text-muted-foreground">إجمالي الشهادات</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{activeCerts.length}</p>
          <p className="text-[11px] text-muted-foreground">سارية</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{expiredCerts.length}</p>
          <p className="text-[11px] text-muted-foreground">منتهية</p>
        </Card>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>نوع الشهادة *</Label>
                    <Select value={form.certificate_type || ''} onValueChange={v => u('certificate_type', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>{CERT_TYPES.map(c => <SelectItem key={c.id} value={c.id}>{c.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع المستلم *</Label>
                    <Select value={form.recipient_type || ''} onValueChange={v => u('recipient_type', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{RECIPIENT_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>اسم المستلم *</Label><Input value={form.recipient_name || ''} onChange={e => u('recipient_name', e.target.value)} /></div>
                  <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date || ''} onChange={e => u('expiry_date', e.target.value)} /></div>
                </div>

                <Textarea placeholder="وصف/ملخص الشهادة..." value={form.description || ''} onChange={e => u('description', e.target.value)} />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={issue.isPending} className="gap-1.5">
                    {issue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    إصدار الشهادة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificates List */}
      <div className="space-y-2">
        {certificates.map((cert: any) => {
          const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
          return (
            <Card key={cert.id} className={`hover:shadow-sm transition-shadow ${isExpired ? 'border-red-200 dark:border-red-800' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                  <Award className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{cert.certificate_type_ar}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{cert.recipient_name}</span>
                    <span className="font-mono">{cert.certificate_number}</span>
                    {cert.expiry_date && (
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(cert.expiry_date).toLocaleDateString('ar-EG')}</span>
                    )}
                  </div>
                </div>
                <Badge variant={isExpired ? 'destructive' : cert.status === 'active' ? 'default' : 'secondary'} className="text-[9px]">
                  {isExpired ? 'منتهية' : cert.status === 'active' ? 'سارية' : cert.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && certificates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لم يتم إصدار شهادات سلامة بعد</div>
        )}
      </div>
    </div>
  );
});

SafetyCertificatesPanel.displayName = 'SafetyCertificatesPanel';
export default SafetyCertificatesPanel;
