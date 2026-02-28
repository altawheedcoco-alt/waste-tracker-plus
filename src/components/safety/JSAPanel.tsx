import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useJSAAnalyses } from '@/hooks/useSafetySystem';
import { Plus, ClipboardList, Loader2, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface JSAStep {
  step_number: number;
  description: string;
  hazards: string;
  controls: string;
  responsible: string;
  ppe_required: string;
}

const JSAPanel = memo(() => {
  const { analyses, isLoading, add } = useJSAAnalyses();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [steps, setSteps] = useState<JSAStep[]>([{ step_number: 1, description: '', hazards: '', controls: '', responsible: '', ppe_required: '' }]);
  const [expandedJSA, setExpandedJSA] = useState<string | null>(null);
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addStep = () => setSteps(s => [...s, { step_number: s.length + 1, description: '', hazards: '', controls: '', responsible: '', ppe_required: '' }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, step_number: idx + 1 })));
  const updateStep = (i: number, key: keyof JSAStep, val: string) => {
    setSteps(s => s.map((st, idx) => idx === i ? { ...st, [key]: val } : st));
  };

  const handleSubmit = () => {
    if (!form.job_title) return;
    add.mutate({ ...form, steps: JSON.stringify(steps) }, {
      onSuccess: () => { setShowForm(false); setForm({}); setSteps([{ step_number: 1, description: '', hazards: '', controls: '', responsible: '', ppe_required: '' }]); },
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">تحليل مخاطر الوظيفة (JSA)</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'تحليل جديد'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><Label>اسم الوظيفة/المهمة *</Label><Input value={form.job_title || ''} onChange={e => u('job_title', e.target.value)} placeholder="مثال: تحميل نفايات كيميائية" /></div>
                  <div><Label>الموقع</Label><Input value={form.job_location || ''} onChange={e => u('job_location', e.target.value)} /></div>
                  <div>
                    <Label>مستوى الخطورة العام</Label>
                    <Select value={form.overall_risk_level || 'medium'} onValueChange={v => u('overall_risk_level', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="critical">حرج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">خطوات العمل وتحليل المخاطر</Label>
                    <Button variant="outline" size="sm" onClick={addStep} className="gap-1"><Plus className="w-3 h-3" />خطوة</Button>
                  </div>

                  {steps.map((step, i) => (
                    <Card key={i} className="bg-muted/30">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">الخطوة {step.step_number}</Badge>
                          {steps.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(i)}><Trash2 className="w-3 h-3 text-red-500" /></Button>}
                        </div>
                        <Input placeholder="وصف الخطوة" value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="المخاطر المحتملة" value={step.hazards} onChange={e => updateStep(i, 'hazards', e.target.value)} />
                          <Input placeholder="إجراءات التحكم" value={step.controls} onChange={e => updateStep(i, 'controls', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="المسؤول" value={step.responsible} onChange={e => updateStep(i, 'responsible', e.target.value)} />
                          <Input placeholder="PPE المطلوب" value={step.ppe_required} onChange={e => updateStep(i, 'ppe_required', e.target.value)} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                    حفظ التحليل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JSA List */}
      <div className="space-y-2">
        {analyses.map((jsa: any) => {
          const jsaSteps = typeof jsa.steps === 'string' ? JSON.parse(jsa.steps) : (jsa.steps || []);
          const expanded = expandedJSA === jsa.id;
          return (
            <Card key={jsa.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedJSA(expanded ? null : jsa.id)}>
                  <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{jsa.job_title}</p>
                    <p className="text-[10px] text-muted-foreground">{jsa.job_location || ''} • {jsaSteps.length} خطوة • {new Date(jsa.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <Badge variant={jsa.overall_risk_level === 'low' ? 'default' : jsa.overall_risk_level === 'critical' ? 'destructive' : 'secondary'} className="text-[9px]">
                    {jsa.overall_risk_level === 'low' ? 'منخفض' : jsa.overall_risk_level === 'medium' ? 'متوسط' : jsa.overall_risk_level === 'high' ? 'عالي' : 'حرج'}
                  </Badge>
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2">
                      {jsaSteps.map((step: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/50 text-sm grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground text-[10px]">الخطوة {step.step_number}:</span> <strong>{step.description}</strong></div>
                          <div><span className="text-muted-foreground text-[10px]">المخاطر:</span> {step.hazards}</div>
                          <div><span className="text-muted-foreground text-[10px]">التحكم:</span> {step.controls}</div>
                          <div><span className="text-muted-foreground text-[10px]">PPE:</span> {step.ppe_required}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && analyses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لم يتم إنشاء تحليلات JSA بعد</div>
        )}
      </div>
    </div>
  );
});

JSAPanel.displayName = 'JSAPanel';
export default JSAPanel;
