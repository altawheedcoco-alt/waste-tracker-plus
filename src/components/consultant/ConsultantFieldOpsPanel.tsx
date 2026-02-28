import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Camera, Loader2, CheckCircle2, AlertTriangle,
  Truck, Scale, FlaskConical, Shield, X, Eye, Clock,
  FileWarning, Zap, Skull, Flame, Droplets, Bug,
} from 'lucide-react';

interface ConsultantFieldOpsPanelProps {
  assignments: any[];
  consultantId: string;
}

// ═══ EWC Codes (Basel Convention + Egyptian Law 202/2020) ═══
const EWC_CATEGORIES = [
  { code: '01', label: 'نفايات التنقيب والتعدين', category: 'solid' },
  { code: '02', label: 'نفايات الزراعة والصناعات الغذائية', category: 'solid' },
  { code: '03', label: 'نفايات تصنيع الأخشاب والورق', category: 'solid' },
  { code: '04', label: 'نفايات صناعة الجلود والنسيج', category: 'solid' },
  { code: '06', label: 'نفايات العمليات الكيميائية غير العضوية', category: 'liquid' },
  { code: '07', label: 'نفايات العمليات الكيميائية العضوية', category: 'liquid' },
  { code: '08', label: 'نفايات الطلاء والأحبار', category: 'liquid' },
  { code: '09', label: 'نفايات الصناعات التصويرية', category: 'liquid' },
  { code: '10', label: 'نفايات العمليات الحرارية', category: 'solid' },
  { code: '11', label: 'نفايات معالجة المعادن', category: 'sludge' },
  { code: '12', label: 'نفايات تشكيل المعادن والبلاستيك', category: 'solid' },
  { code: '13', label: 'زيوت ووقود مستعمل', category: 'liquid' },
  { code: '14', label: 'نفايات المذيبات العضوية', category: 'liquid' },
  { code: '15', label: 'نفايات التعبئة والتغليف', category: 'solid' },
  { code: '16', label: 'نفايات غير مدرجة في فئات أخرى', category: 'solid' },
  { code: '17', label: 'نفايات البناء والهدم', category: 'solid' },
  { code: '18', label: 'نفايات طبية وبيطرية', category: 'solid' },
  { code: '19', label: 'نفايات معالجة المياه والصرف', category: 'sludge' },
  { code: '20', label: 'نفايات بلدية ومنزلية', category: 'solid' },
];

const HAZARD_CLASSIFICATIONS = [
  { id: 'flammable', label: 'قابل للاشتعال', icon: Flame, color: 'text-red-500' },
  { id: 'corrosive', label: 'أكّال', icon: Droplets, color: 'text-orange-500' },
  { id: 'toxic', label: 'سام', icon: Skull, color: 'text-purple-500' },
  { id: 'reactive', label: 'تفاعلي', icon: Zap, color: 'text-yellow-500' },
  { id: 'infectious', label: 'معدي', icon: Bug, color: 'text-green-600' },
];

const OPERATION_TYPES = [
  { id: 'site_inspection', label: 'معاينة موقع', icon: MapPin, desc: 'رفع صور + إحداثيات GPS لمكان تخزين النفايات', color: 'bg-blue-500' },
  { id: 'waste_classification', label: 'تصنيف مخلفات', icon: FlaskConical, desc: 'تحديد نوع المادة وفق أكواد EWC العالمية', color: 'bg-emerald-500' },
  { id: 'hazard_assessment', label: 'تقييم الخطورة', icon: AlertTriangle, desc: 'تحديد معامل الخطورة وتنبيه مكتب النقل', color: 'bg-red-500' },
  { id: 'vehicle_inspection', label: 'فحص مركبة', icon: Truck, desc: 'مراجعة تصاريح البيئة وتجهيزات الأمان', color: 'bg-purple-500' },
  { id: 'load_matching', label: 'مطابقة حمولة', icon: Scale, desc: 'مطابقة الحمولة الفعلية مع المسجل', color: 'bg-amber-500' },
] as const;

const ConsultantFieldOpsPanel = memo(({ assignments, consultantId }: ConsultantFieldOpsPanelProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');

  // Form state
  const [form, setForm] = useState<Record<string, any>>({});
  const updateForm = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  // Check permissions for current org
  const currentAssignment = assignments.find((a: any) => a.organization_id === selectedOrg);
  const canInspectSites = currentAssignment?.can_inspect_sites !== false;
  const canClassifyWaste = currentAssignment?.can_classify_waste !== false;
  const canInspectVehicles = currentAssignment?.can_inspect_vehicles !== false;
  const canMatchLoads = currentAssignment?.can_match_loads !== false;

  const permissionMap: Record<string, boolean> = {
    site_inspection: canInspectSites,
    waste_classification: canClassifyWaste,
    hazard_assessment: canClassifyWaste,
    vehicle_inspection: canInspectVehicles,
    load_matching: canMatchLoads,
  };

  // Fetch recent field ops
  const { data: recentOps = [] } = useQuery({
    queryKey: ['consultant-field-ops', consultantId, selectedOrg],
    queryFn: async () => {
      let q = supabase
        .from('consultant_field_operations')
        .select('*')
        .eq('consultant_id', consultantId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (selectedOrg) q = q.eq('organization_id', selectedOrg);
      const { data } = await q;
      return data || [];
    },
    enabled: !!consultantId,
  });

  // Submit field operation
  const submitOp = useMutation({
    mutationFn: async () => {
      if (!selectedOrg || !activeOp) throw new Error('اختر الجهة ونوع العملية');
      
      const payload: any = {
        consultant_id: consultantId,
        organization_id: selectedOrg,
        operation_type: activeOp,
        notes: form.notes || null,
        result: 'approved',
      };

      if (activeOp === 'site_inspection') {
        payload.location_lat = form.lat ? parseFloat(form.lat) : null;
        payload.location_lng = form.lng ? parseFloat(form.lng) : null;
        payload.location_address = form.address || null;
      } else if (activeOp === 'waste_classification') {
        payload.ewc_code = form.ewcCode || null;
        payload.ewc_description = EWC_CATEGORIES.find(c => c.code === form.ewcCode)?.label || null;
        payload.waste_category = form.wasteCategory || null;
      } else if (activeOp === 'hazard_assessment') {
        payload.is_hazardous = form.isHazardous || false;
        payload.hazard_level = form.hazardLevel || 'none';
        payload.hazard_classification = form.hazardClass || null;
        payload.un_number = form.unNumber || null;
        payload.result = form.isHazardous ? 'needs_review' : 'approved';
      } else if (activeOp === 'vehicle_inspection') {
        payload.vehicle_plate = form.vehiclePlate || null;
        payload.vehicle_permit_valid = form.permitValid || false;
        payload.vehicle_safety_check = form.safetyCheck || false;
        payload.vehicle_labeling_check = form.labelCheck || false;
        const allPass = form.permitValid && form.safetyCheck && form.labelCheck;
        payload.result = allPass ? 'approved' : 'rejected';
      } else if (activeOp === 'load_matching') {
        payload.declared_weight = form.declaredWeight ? parseFloat(form.declaredWeight) : null;
        payload.actual_weight = form.actualWeight ? parseFloat(form.actualWeight) : null;
        if (payload.declared_weight && payload.actual_weight) {
          const variance = Math.abs(payload.declared_weight - payload.actual_weight) / payload.declared_weight * 100;
          payload.weight_variance_pct = Math.round(variance * 10) / 10;
          payload.weight_match = variance <= 5;
          payload.result = variance <= 5 ? 'approved' : 'needs_review';
        }
      }

      const { error } = await supabase.from('consultant_field_operations').insert(payload as any);
      if (error) throw error;

      // Notify org about field operation result
      const orgProfiles = await supabase.from('profiles').select('id').eq('organization_id', selectedOrg).limit(5);
      if (orgProfiles.data?.length) {
        const opLabel = OPERATION_TYPES.find(o => o.id === activeOp)?.label || activeOp;
        await supabase.from('notifications').insert(
          orgProfiles.data.map(p => ({
            user_id: p.id,
            title: `عملية ميدانية: ${opLabel}`,
            message: `أتم الاستشاري البيئي عملية "${opLabel}" - النتيجة: ${payload.result === 'approved' ? '✅ مطابق' : payload.result === 'rejected' ? '❌ غير مطابق' : '⚠️ يحتاج مراجعة'}`,
            type: 'consultant_action',
          })) as any
        );
      }
    },
    onSuccess: () => {
      const opLabel = OPERATION_TYPES.find(o => o.id === activeOp)?.label || '';
      toast.success(`تم إتمام "${opLabel}" بنجاح`);
      setActiveOp(null);
      setForm({});
      queryClient.invalidateQueries({ queryKey: ['consultant-field-ops'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getResultBadge = (result: string) => {
    if (result === 'approved') return <Badge className="bg-emerald-500 text-white text-[10px]">مطابق</Badge>;
    if (result === 'rejected') return <Badge variant="destructive" className="text-[10px]">غير مطابق</Badge>;
    if (result === 'needs_review') return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">يحتاج مراجعة</Badge>;
    return <Badge variant="secondary" className="text-[10px]">قيد الانتظار</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Organization Selector */}
      <Card>
        <CardContent className="pt-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجهة لتنفيذ العمليات الميدانية" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((a: any) => (
                <SelectItem key={a.organization_id} value={a.organization_id}>
                  {a.organization?.name || 'جهة'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedOrg && (
        <>
          {/* Operation Type Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {OPERATION_TYPES.map((op) => {
              const hasPermission = permissionMap[op.id];
              return (
                <motion.button
                  key={op.id}
                  onClick={() => hasPermission && setActiveOp(activeOp === op.id ? null : op.id)}
                  whileHover={hasPermission ? { scale: 1.02 } : undefined}
                  whileTap={hasPermission ? { scale: 0.98 } : undefined}
                  disabled={!hasPermission}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                    !hasPermission ? 'opacity-40 cursor-not-allowed' :
                    activeOp === op.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${op.color} flex items-center justify-center shadow-lg`}>
                    <op.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-bold">{op.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{op.desc}</span>
                  {!hasPermission && (
                    <Badge variant="outline" className="text-[9px] absolute top-1 left-1">🔒 محظور</Badge>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Active Operation Form */}
          <AnimatePresence mode="wait">
            {activeOp && (
              <motion.div
                key={activeOp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {(() => { const Op = OPERATION_TYPES.find(o => o.id === activeOp); return Op ? <Op.icon className="w-5 h-5 text-primary" /> : null; })()}
                        {OPERATION_TYPES.find(o => o.id === activeOp)?.label}
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setActiveOp(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* ═══ Site Inspection Form ═══ */}
                    {activeOp === 'site_inspection' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>خط العرض (Latitude)</Label>
                            <Input type="number" step="any" placeholder="مثال: 30.0444" value={form.lat || ''} onChange={e => updateForm('lat', e.target.value)} />
                          </div>
                          <div>
                            <Label>خط الطول (Longitude)</Label>
                            <Input type="number" step="any" placeholder="مثال: 31.2357" value={form.lng || ''} onChange={e => updateForm('lng', e.target.value)} />
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(pos => {
                              updateForm('lat', pos.coords.latitude.toFixed(6));
                              updateForm('lng', pos.coords.longitude.toFixed(6));
                              toast.success('تم تحديد الموقع بنجاح');
                            }, () => toast.error('فشل تحديد الموقع'));
                          }
                        }}>
                          <MapPin className="w-4 h-4" />تحديد موقعي الحالي
                        </Button>
                        <div>
                          <Label>العنوان التفصيلي</Label>
                          <Input placeholder="المنطقة الصناعية، المنصورة، الدقهلية" value={form.address || ''} onChange={e => updateForm('address', e.target.value)} />
                        </div>
                      </>
                    )}

                    {/* ═══ Waste Classification Form ═══ */}
                    {activeOp === 'waste_classification' && (
                      <>
                        <div>
                          <Label>كود EWC (التصنيف الأوروبي للنفايات)</Label>
                          <Select value={form.ewcCode || ''} onValueChange={v => updateForm('ewcCode', v)}>
                            <SelectTrigger><SelectValue placeholder="اختر تصنيف النفاية" /></SelectTrigger>
                            <SelectContent>
                              {EWC_CATEGORIES.map(c => (
                                <SelectItem key={c.code} value={c.code}>
                                  <span className="font-mono text-xs ml-2">{c.code}</span> {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>الحالة الفيزيائية</Label>
                          <Select value={form.wasteCategory || ''} onValueChange={v => updateForm('wasteCategory', v)}>
                            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">صلب</SelectItem>
                              <SelectItem value="liquid">سائل</SelectItem>
                              <SelectItem value="gaseous">غازي</SelectItem>
                              <SelectItem value="sludge">حمأة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* ═══ Hazard Assessment Form ═══ */}
                    {activeOp === 'hazard_assessment' && (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                          <Switch checked={form.isHazardous || false} onCheckedChange={v => updateForm('isHazardous', v)} />
                          <div>
                            <Label className="font-bold">نفايات خطرة؟</Label>
                            <p className="text-[11px] text-muted-foreground">تصنيف وفق قانون 202/2020 واتفاقية بازل</p>
                          </div>
                          {form.isHazardous && <AlertTriangle className="w-6 h-6 text-red-500 mr-auto animate-pulse" />}
                        </div>
                        {form.isHazardous && (
                          <>
                            <div>
                              <Label>مستوى الخطورة</Label>
                              <Select value={form.hazardLevel || ''} onValueChange={v => updateForm('hazardLevel', v)}>
                                <SelectTrigger><SelectValue placeholder="اختر مستوى الخطورة" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">منخفض</SelectItem>
                                  <SelectItem value="medium">متوسط</SelectItem>
                                  <SelectItem value="high">عالي</SelectItem>
                                  <SelectItem value="critical">حرج</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>تصنيف الخطورة</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {HAZARD_CLASSIFICATIONS.map(h => (
                                  <button key={h.id} onClick={() => updateForm('hazardClass', form.hazardClass === h.id ? '' : h.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm ${form.hazardClass === h.id ? 'border-primary bg-primary/10 font-medium' : 'border-border'}`}>
                                    <h.icon className={`w-4 h-4 ${h.color}`} />{h.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>رقم الأمم المتحدة (UN Number)</Label>
                              <Input placeholder="مثال: UN1203" className="font-mono" value={form.unNumber || ''} onChange={e => updateForm('unNumber', e.target.value)} />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* ═══ Vehicle Inspection Form ═══ */}
                    {activeOp === 'vehicle_inspection' && (
                      <>
                        <div>
                          <Label>رقم لوحة المركبة</Label>
                          <Input placeholder="أ ب ج 1234" value={form.vehiclePlate || ''} onChange={e => updateForm('vehiclePlate', e.target.value)} />
                        </div>
                        <div className="space-y-3">
                          {[
                            { key: 'permitValid', label: 'تصريح البيئة ساري المفعول', desc: 'رخصة تداول مواد خطرة من وزارة البيئة' },
                            { key: 'safetyCheck', label: 'تجهيزات الأمان مكتملة', desc: 'طفاية حريق، أدوات حماية شخصية، حقيبة إسعاف' },
                            { key: 'labelCheck', label: 'ملصقات التحذير موضوعة', desc: 'علامات الخطر وفق معايير ADR/GHS' },
                          ].map(item => (
                            <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border">
                              <Switch checked={form[item.key] || false} onCheckedChange={v => updateForm(item.key, v)} />
                              <div className="flex-1">
                                <Label className="font-medium">{item.label}</Label>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                              </div>
                              {form[item.key] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
                        {form.vehiclePlate && (
                          <div className={`p-3 rounded-lg border ${form.permitValid && form.safetyCheck && form.labelCheck ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200'}`}>
                            <p className="text-sm font-bold text-center">
                              {form.permitValid && form.safetyCheck && form.labelCheck
                                ? '✅ المركبة مطابقة للمعايير — مسموح ببدء الرحلة'
                                : '❌ المركبة غير مطابقة — يُمنع بدء الرحلة'}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* ═══ Load Matching Form ═══ */}
                    {activeOp === 'load_matching' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>الوزن المُعلن (طن)</Label>
                            <Input type="number" step="0.01" placeholder="10.5" value={form.declaredWeight || ''} onChange={e => updateForm('declaredWeight', e.target.value)} />
                          </div>
                          <div>
                            <Label>الوزن الفعلي (طن)</Label>
                            <Input type="number" step="0.01" placeholder="10.3" value={form.actualWeight || ''} onChange={e => updateForm('actualWeight', e.target.value)} />
                          </div>
                        </div>
                        {form.declaredWeight && form.actualWeight && (() => {
                          const d = parseFloat(form.declaredWeight);
                          const a = parseFloat(form.actualWeight);
                          const variance = Math.abs(d - a) / d * 100;
                          const match = variance <= 5;
                          return (
                            <div className={`p-4 rounded-lg border ${match ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200'}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold">نسبة التفاوت:</span>
                                <span className={`text-lg font-mono font-bold ${match ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {variance.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {match ? '✅ ضمن الحد المسموح (≤5%) — الحمولة مطابقة' : '❌ تجاوز الحد المسموح (>5%) — يتطلب تحقيق'}
                              </p>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* Common Notes */}
                    <Textarea value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)} placeholder="ملاحظات فنية إضافية..." className="min-h-[60px]" />

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => { setActiveOp(null); setForm({}); }}>إلغاء</Button>
                      <Button onClick={() => submitOp.mutate()} disabled={submitOp.isPending} className="gap-1.5">
                        {submitOp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        تأكيد وحفظ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Operations */}
          {recentOps.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  العمليات الميدانية الأخيرة ({recentOps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {recentOps.map((op: any) => {
                    const opType = OPERATION_TYPES.find(o => o.id === op.operation_type);
                    return (
                      <div key={op.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors text-sm">
                        <div className={`w-8 h-8 rounded-lg ${opType?.color || 'bg-muted'} flex items-center justify-center`}>
                          {opType && <opType.icon className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{opType?.label || op.operation_type}</p>
                          {op.notes && <p className="text-[10px] text-muted-foreground truncate">{op.notes}</p>}
                        </div>
                        {getResultBadge(op.result)}
                        <span className="text-[10px] text-muted-foreground">{new Date(op.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
});

ConsultantFieldOpsPanel.displayName = 'ConsultantFieldOpsPanel';
export default ConsultantFieldOpsPanel;
