import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useSafetyInspections } from '@/hooks/useSafetySystem';
import { Plus, Search, Loader2, X, CheckCircle2, XCircle, Minus, Trash2, ClipboardCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LinkedPartnerSafetySelector from './LinkedPartnerSafetySelector';

const INSPECTION_TYPES = [
  { id: 'routine', label: 'دورية', ar: 'تفتيش دوري' },
  { id: 'special', label: 'خاصة', ar: 'تفتيش خاص' },
  { id: 'follow_up', label: 'متابعة', ar: 'متابعة تصحيحية' },
  { id: 'pre_operation', label: 'قبل التشغيل', ar: 'ما قبل التشغيل' },
  { id: 'post_incident', label: 'بعد حادث', ar: 'ما بعد حادث' },
];

const DEFAULT_CHECKLIST = [
  { item: 'نظافة وترتيب منطقة العمل', category: 'housekeeping' },
  { item: 'توفر معدات الإطفاء وصلاحيتها', category: 'fire' },
  { item: 'ارتداء معدات الوقاية الشخصية', category: 'ppe' },
  { item: 'سلامة المعدات الكهربائية', category: 'electrical' },
  { item: 'توفر لوحات التحذير والإرشاد', category: 'signage' },
  { item: 'سلامة مخارج الطوارئ', category: 'emergency' },
  { item: 'توفر صندوق الإسعافات الأولية', category: 'first_aid' },
  { item: 'تخزين المواد الخطرة بشكل صحيح', category: 'hazmat' },
  { item: 'حالة أرضيات المنشأة', category: 'structural' },
  { item: 'كفاية التهوية والإضاءة', category: 'environment' },
];

const SafetyInspectionsPanel = memo(() => {
  const { inspections, isLoading, add } = useSafetyInspections();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [checklist, setChecklist] = useState<any[]>(
    DEFAULT_CHECKLIST.map(item => ({ ...item, status: 'na', comment: '' }))
  );
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const updateCheckItem = (i: number, key: string, val: any) => {
    setChecklist(c => c.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };

  const passedCount = checklist.filter(c => c.status === 'pass').length;
  const failedCount = checklist.filter(c => c.status === 'fail').length;
  const applicableCount = checklist.filter(c => c.status !== 'na').length;
  const complianceScore = applicableCount > 0 ? Math.round((passedCount / applicableCount) * 100) : 0;

  const handleSubmit = () => {
    if (!form.area_inspected || !form.inspection_type) return;
    add.mutate({
      ...form,
      inspection_type_ar: INSPECTION_TYPES.find(t => t.id === form.inspection_type)?.ar,
      checklist: JSON.stringify(checklist),
      total_items: checklist.length,
      passed_items: passedCount,
      failed_items: failedCount,
      compliance_score: complianceScore,
      status: 'completed',
    }, {
      onSuccess: () => {
        setShowForm(false); setForm({});
        setChecklist(DEFAULT_CHECKLIST.map(item => ({ ...item, status: 'na', comment: '' })));
      },
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">جولات التفتيش الدورية</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'تفتيش جديد'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>نوع التفتيش *</Label>
                    <Select value={form.inspection_type || ''} onValueChange={v => u('inspection_type', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>المنطقة المفتشة *</Label><Input value={form.area_inspected || ''} onChange={e => u('area_inspected', e.target.value)} placeholder="مثال: مستودع النفايات الخطرة" /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.inspection_date || new Date().toISOString().slice(0, 10)} onChange={e => u('inspection_date', e.target.value)} /></div>
                </div>

                <LinkedPartnerSafetySelector
                  value={form.linked_entity_id || ''}
                  onChange={(id, type) => { u('linked_entity_id', id); u('linked_entity_type', type); }}
                  label="ربط التفتيش بجهة"
                  includeOwn={false}
                />

                {/* Live Compliance Score */}
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">نسبة الامتثال الحية</span>
                      <Badge className={`${complianceScore >= 80 ? 'bg-emerald-500' : complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'} text-white`}>
                        {complianceScore}%
                      </Badge>
                    </div>
                    <Progress value={complianceScore} className="h-2" />
                    <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span>✅ مطابق: {passedCount}</span>
                      <span>❌ غير مطابق: {failedCount}</span>
                      <span>➖ غير قابل: {checklist.filter(c => c.status === 'na').length}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {checklist.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${item.status === 'pass' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : item.status === 'fail' ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-muted/30 border-border'}`}>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => updateCheckItem(i, 'status', 'pass')} className={`w-7 h-7 rounded flex items-center justify-center ${item.status === 'pass' ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-emerald-100'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateCheckItem(i, 'status', 'fail')} className={`w-7 h-7 rounded flex items-center justify-center ${item.status === 'fail' ? 'bg-red-500 text-white' : 'bg-muted hover:bg-red-100'}`}>
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateCheckItem(i, 'status', 'na')} className={`w-7 h-7 rounded flex items-center justify-center ${item.status === 'na' ? 'bg-gray-500 text-white' : 'bg-muted hover:bg-gray-100'}`}>
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm flex-1">{item.item}</span>
                      <Input placeholder="ملاحظة" className="w-32 h-7 text-[10px]" value={item.comment} onChange={e => updateCheckItem(i, 'comment', e.target.value)} />
                    </div>
                  ))}
                </div>

                <Textarea placeholder="النتائج والملاحظات العامة..." value={form.findings || ''} onChange={e => u('findings', e.target.value)} />
                <Textarea placeholder="الإجراءات التصحيحية المطلوبة..." value={form.corrective_actions || ''} onChange={e => u('corrective_actions', e.target.value)} />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                    حفظ التفتيش
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspections List */}
      <div className="space-y-2">
        {inspections.map((ins: any) => (
          <Card key={ins.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${(ins.compliance_score || 0) >= 80 ? 'bg-emerald-500/10' : (ins.compliance_score || 0) >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                <ClipboardCheck className={`w-5 h-5 ${(ins.compliance_score || 0) >= 80 ? 'text-emerald-500' : (ins.compliance_score || 0) >= 60 ? 'text-amber-500' : 'text-red-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{ins.area_inspected}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ins.inspection_type_ar || ins.inspection_type} • {new Date(ins.inspection_date || ins.created_at).toLocaleDateString('ar-EG')}
                  • ✅{ins.passed_items || 0} ❌{ins.failed_items || 0}
                </p>
              </div>
              <Badge className={`${(ins.compliance_score || 0) >= 80 ? 'bg-emerald-500' : (ins.compliance_score || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'} text-white text-xs`}>
                {ins.compliance_score || 0}%
              </Badge>
            </CardContent>
          </Card>
        ))}
        {!isLoading && inspections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لم يتم إجراء تفتيشات بعد</div>
        )}
      </div>
    </div>
  );
});

SafetyInspectionsPanel.displayName = 'SafetyInspectionsPanel';
export default SafetyInspectionsPanel;
