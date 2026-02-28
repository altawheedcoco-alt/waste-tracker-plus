import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useHazardRegister } from '@/hooks/useSafetySystem';
import { Plus, AlertTriangle, Shield, MapPin, Loader2, X, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LinkedPartnerSafetySelector from './LinkedPartnerSafetySelector';

const CATEGORIES = [
  { id: 'physical', label: 'مخاطر فيزيائية', color: 'bg-blue-500' },
  { id: 'chemical', label: 'مخاطر كيميائية', color: 'bg-purple-500' },
  { id: 'biological', label: 'مخاطر بيولوجية', color: 'bg-green-500' },
  { id: 'ergonomic', label: 'مخاطر أرجونومية', color: 'bg-orange-500' },
  { id: 'psychosocial', label: 'مخاطر نفسية', color: 'bg-pink-500' },
  { id: 'environmental', label: 'مخاطر بيئية', color: 'bg-emerald-500' },
];

const CONTROLS = [
  { id: 'elimination', label: 'إزالة الخطر', order: 1 },
  { id: 'substitution', label: 'استبدال', order: 2 },
  { id: 'engineering', label: 'ضوابط هندسية', order: 3 },
  { id: 'administrative', label: 'ضوابط إدارية', order: 4 },
  { id: 'ppe', label: 'معدات وقاية', order: 5 },
];

const getRiskColor = (score: number) => {
  if (score <= 4) return 'bg-emerald-500 text-white';
  if (score <= 9) return 'bg-amber-500 text-white';
  if (score <= 16) return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
};

const getRiskLabel = (score: number) => {
  if (score <= 4) return 'منخفض';
  if (score <= 9) return 'متوسط';
  if (score <= 16) return 'عالي';
  return 'حرج';
};

const HazardRegisterPanel = memo(() => {
  const { hazards, isLoading, add } = useHazardRegister();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const likelihood = parseInt(form.likelihood || '1');
  const severity = parseInt(form.severity || '1');
  const riskScore = likelihood * severity;

  const handleSubmit = () => {
    if (!form.hazard_title || !form.hazard_category) return;
    add.mutate(form, { onSuccess: () => { setShowForm(false); setForm({}); } });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">سجل المخاطر ومصفوفة التقييم</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'تسجيل خطر'}
        </Button>
      </div>

      {/* Risk Matrix Legend */}
      <div className="flex gap-2 text-[10px]">
        {[{ s: 'منخفض (1-4)', c: 'bg-emerald-500' }, { s: 'متوسط (5-9)', c: 'bg-amber-500' }, { s: 'عالي (10-16)', c: 'bg-orange-500' }, { s: 'حرج (17-25)', c: 'bg-red-600' }].map(l => (
          <Badge key={l.s} className={`${l.c} text-white text-[9px]`}>{l.s}</Badge>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>عنوان الخطر *</Label>
                    <Input placeholder="مثال: أرضية زلقة في منطقة التحميل" value={form.hazard_title || ''} onChange={e => u('hazard_title', e.target.value)} />
                  </div>
                  <div>
                    <Label>فئة الخطر *</Label>
                    <Select value={form.hazard_category || ''} onValueChange={v => u('hazard_category', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea placeholder="وصف تفصيلي للخطر..." value={form.hazard_description || ''} onChange={e => u('hazard_description', e.target.value)} />

                <div>
                  <Label>الموقع</Label>
                  <div className="flex gap-2">
                    <Input placeholder="المنطقة/الموقع" value={form.location || ''} onChange={e => u('location', e.target.value)} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.geolocation?.getCurrentPosition(p => { u('location_lat', p.coords.latitude); u('location_lng', p.coords.longitude); });
                    }}><MapPin className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Risk Assessment */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">مصفوفة تقييم المخاطر</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>الاحتمالية (1-5)</Label>
                        <Select value={form.likelihood || '1'} onValueChange={v => u('likelihood', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[{ v: '1', l: '1 - نادر جداً' }, { v: '2', l: '2 - نادر' }, { v: '3', l: '3 - ممكن' }, { v: '4', l: '4 - محتمل' }, { v: '5', l: '5 - مؤكد تقريباً' }].map(o => (
                              <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>الخطورة (1-5)</Label>
                        <Select value={form.severity || '1'} onValueChange={v => u('severity', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[{ v: '1', l: '1 - طفيف' }, { v: '2', l: '2 - بسيط' }, { v: '3', l: '3 - متوسط' }, { v: '4', l: '4 - خطير' }, { v: '5', l: '5 - كارثي' }].map(o => (
                              <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-background">
                      <span className="text-sm">درجة الخطر:</span>
                      <Badge className={`${getRiskColor(riskScore)} text-sm px-3 py-1`}>
                        {riskScore} — {getRiskLabel(riskScore)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label>نوع التحكم المقترح</Label>
                  <Select value={form.control_type || ''} onValueChange={v => u('control_type', v)}>
                    <SelectTrigger><SelectValue placeholder="تسلسل التحكم الهرمي" /></SelectTrigger>
                    <SelectContent>{CONTROLS.map(c => <SelectItem key={c.id} value={c.id}>{c.order}. {c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <Textarea placeholder="الإجراءات التصحيحية الموصى بها..." value={form.recommended_controls || ''} onChange={e => u('recommended_controls', e.target.value)} />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowForm(false); setForm({}); }}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    تسجيل وتقييم
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hazards List */}
      <div className="space-y-2">
        {hazards.map((h: any) => (
          <Card key={h.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Badge className={`${getRiskColor(h.risk_score || 1)} text-xs shrink-0`}>
                  {h.risk_score || '?'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{h.hazard_title}</p>
                    <Badge variant="outline" className="text-[9px]">{CATEGORIES.find(c => c.id === h.hazard_category)?.label || h.hazard_category}</Badge>
                    <Badge variant={h.status === 'closed' ? 'default' : h.status === 'controlled' ? 'secondary' : 'outline'} className="text-[9px]">
                      {h.status === 'identified' ? 'مُحدد' : h.status === 'assessed' ? 'مُقيّم' : h.status === 'controlled' ? 'مُسيطر عليه' : h.status === 'closed' ? 'مُغلق' : h.status}
                    </Badge>
                  </div>
                  {h.hazard_description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{h.hazard_description}</p>}
                  {h.location && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{h.location}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && hazards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مخاطر مسجلة — ابدأ بتسجيل المخاطر المحتملة في بيئة العمل</div>
        )}
      </div>
    </div>
  );
});

HazardRegisterPanel.displayName = 'HazardRegisterPanel';
export default HazardRegisterPanel;
