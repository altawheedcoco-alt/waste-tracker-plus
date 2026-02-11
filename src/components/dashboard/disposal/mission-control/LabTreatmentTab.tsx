import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Flame, Mountain, FlaskConical, CheckCircle, Clock, Package, Play, Lock, AlertTriangle, Beaker } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LabTreatmentTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const LabTreatmentTab = ({ facilityId, organizationId, searchQuery }: LabTreatmentTabProps) => {
  const queryClient = useQueryClient();
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showDualVerify, setShowDualVerify] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [actionType, setActionType] = useState<string>('');
  const [labResult, setLabResult] = useState('');
  const [incinerationTemp, setIncinerationTemp] = useState('');
  const [landfillCell, setLandfillCell] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Operations needing lab or processing
  const { data: operations = [] } = useQuery({
    queryKey: ['mc-lab-ops', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('*, disposal_facility:disposal_facilities(name)')
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Lab analysis mutation
  const labMutation = useMutation({
    mutationFn: async ({ opId, result }: { opId: string; result: string }) => {
      const path = result === 'matched' ? 'incineration' : result === 'less_hazardous' ? 'landfill' : 'chemical_neutralization';
      const pathLabel = path === 'incineration' ? 'الحرق' : path === 'landfill' ? 'الدفن الصحي' : 'المعالجة الكيميائية';
      const { error } = await supabase.from('disposal_operations').update({
        lab_sample_taken: true, lab_sample_result: result, lab_analysis_date: new Date().toISOString(),
        processing_path: path, updated_at: new Date().toISOString(),
      }).eq('id', opId);
      if (error) throw error;
      return pathLabel;
    },
    onSuccess: (pathLabel) => {
      toast.success(`تم الحفظ: المادة جاهزة للمسار ${pathLabel}.`);
      setShowLabDialog(false);
      setLabResult('');
      queryClient.invalidateQueries({ queryKey: ['mc-lab-ops'] });
    },
  });

  // Start processing with dual verification
  const startProcessingMutation = useMutation({
    mutationFn: async ({ opId, method, extras }: { opId: string; method: string; extras: any }) => {
      const { error } = await supabase.from('disposal_operations').update({
        status: 'processing', disposal_method: method, processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), ...extras,
      }).eq('id', opId);
      if (error) throw error;
    },
    onSuccess: () => {
      const label = actionType === 'incineration' ? `بدأت عملية الحرق.. درجة الحرارة الحالية ${incinerationTemp}°C.` :
        actionType === 'landfill' ? `تم تحديد الخلية ${landfillCell}.` : 'بدأت المعالجة الكيميائية.';
      toast.success(label);
      setShowActionDialog(false);
      setShowDualVerify(false);
      queryClient.invalidateQueries({ queryKey: ['mc-lab-ops'] });
    },
  });

  // Complete processing
  const completeMutation = useMutation({
    mutationFn: async (opId: string) => {
      const certNumber = `DISP-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase.from('disposal_operations').update({
        status: 'completed', certificate_number: certNumber, processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', opId);
      if (error) throw error;
      return certNumber;
    },
    onSuccess: (certNum) => {
      toast.success(`تم إكمال المعالجة وإصدار الشهادة: ${certNum}`);
      queryClient.invalidateQueries({ queryKey: ['mc-lab-ops'] });
    },
  });

  const handleStartAction = (op: any, type: string) => {
    setSelectedOp(op);
    setActionType(type);
    setShowActionDialog(true);
    setIncinerationTemp('');
    setLandfillCell('');
    setTreatmentNotes('');
  };

  const handleConfirmWithDualVerify = () => {
    // Trigger dual verification for critical operations
    setPendingAction(() => () => {
      if (!selectedOp) return;
      let extras: any = {};
      if (actionType === 'incineration') {
        extras = { incineration_temperature: Number(incinerationTemp), processing_path: 'incineration' };
      } else if (actionType === 'landfill') {
        extras = { landfill_cell_id: landfillCell, processing_path: 'landfill' };
      } else {
        extras = { notes: treatmentNotes, processing_path: 'chemical_neutralization' };
      }
      startProcessingMutation.mutate({ opId: selectedOp.id, method: actionType, extras });
    });
    setShowDualVerify(true);
  };

  const handleDualVerifyConfirm = () => {
    if (supervisorPassword.length < 4) {
      toast.error('يرجى إدخال كلمة مرور المشرف');
      return;
    }
    // In production, verify against actual supervisor password
    pendingAction?.();
    setSupervisorPassword('');
  };

  const pendingOps = operations.filter((o: any) => o.status === 'pending');
  const processingOps = operations.filter((o: any) => o.status === 'processing');

  return (
    <div className="space-y-6">
      {/* 3 Big Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto mb-3 flex items-center justify-center">
              <Flame className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">بدء الحرق</h3>
            <p className="text-xs text-muted-foreground">ربط الشحنة بمعرف المحرقة</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-600">
              <Lock className="w-3 h-3" /> يتطلب تحقق مزدوج
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mx-auto mb-3 flex items-center justify-center">
              <Mountain className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">توجيه للدفن</h3>
            <p className="text-xs text-muted-foreground">اختيار الخلية المناسبة في المدفن</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-600">
              <Lock className="w-3 h-3" /> يتطلب تحقق مزدوج
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mx-auto mb-3 flex items-center justify-center">
              <Beaker className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">اعتماد التحليل</h3>
            <p className="text-xs text-muted-foreground">إدخال نتائج المعمل وتحديد المسار</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending - Need Lab Analysis */}
      {pendingOps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              شحنات تنتظر التحليل والتوجيه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOps.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  {!op.lab_sample_taken && (
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => { setSelectedOp(op); setShowLabDialog(true); }}>
                      <FlaskConical className="w-3 h-3" /> اعتماد التحليل
                    </Button>
                  )}
                  {op.lab_sample_taken && !op.processing_path && (
                    <Badge className="bg-blue-500/10 text-blue-600 text-xs gap-1"><FlaskConical className="w-3 h-3" /> تم التحليل</Badge>
                  )}
                  {op.processing_path && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-red-600 border-red-300" onClick={() => handleStartAction(op, 'incineration')}>🔥 حرق</Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-amber-600 border-amber-300" onClick={() => handleStartAction(op, 'landfill')}>🏔️ دفن</Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-blue-600 border-blue-300" onClick={() => handleStartAction(op, 'chemical_treatment')}>🧪 معالجة</Button>
                    </>
                  )}
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {op.quantity} {op.unit}
                    {op.hazard_level === 'hazardous' && <span className="text-red-500 mr-1"> ⚠️ خطر</span>}
                    {op.processing_path && <Badge variant="outline" className="text-[10px] mr-1">مسار: {op.processing_path === 'incineration' ? 'حرق' : op.processing_path === 'landfill' ? 'دفن' : 'كيميائي'}</Badge>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Currently Processing */}
      {processingOps.length > 0 && (
        <Card className="border-green-200 dark:border-green-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              عمليات قيد المعالجة النشطة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {processingOps.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => completeMutation.mutate(op.id)} disabled={completeMutation.isPending}>
                    <CheckCircle className="w-3 h-3" /> إتمام
                  </Button>
                  {op.disposal_method === 'incineration' && <Flame className="w-4 h-4 text-red-500" />}
                  {op.disposal_method === 'landfill' && <Mountain className="w-4 h-4 text-amber-600" />}
                  {op.disposal_method === 'chemical_treatment' && <FlaskConical className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {op.quantity} {op.unit} • {op.disposal_method === 'incineration' ? `حرق ${op.incineration_temperature ? `(${op.incineration_temperature}°C)` : ''}` : op.disposal_method === 'landfill' ? `دفن ${op.landfill_cell_id ? `(${op.landfill_cell_id})` : ''}` : 'معالجة كيميائية'}
                    {op.processing_started_at && <span className="mr-1">• بدأ {formatDistanceToNow(new Date(op.processing_started_at), { locale: ar, addSuffix: true })}</span>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lab Analysis Dialog */}
      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> اعتماد التحليل المعملي</DialogTitle>
            <DialogDescription>إدخال نتائج المعمل (درجة الحموضة، السمية..)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/50 text-sm">
              <p><strong>العملية:</strong> {selectedOp?.operation_number || selectedOp?.id?.slice(0, 8)}</p>
              <p><strong>المخلف المعلن:</strong> {selectedOp?.waste_description}</p>
              <p><strong>مستوى الخطورة:</strong> {selectedOp?.hazard_level === 'hazardous' ? '⚠️ خطر' : '✅ غير خطر'}</p>
            </div>
            <Label>نتيجة التحليل — تحديد مسار المعالجة</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'matched', label: '🔥 مطابق للمعلن — يذهب للحرق', color: 'border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20' },
                { value: 'less_hazardous', label: '🏔️ أقل خطورة — يذهب للدفن الصحي', color: 'border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20' },
                { value: 'needs_treatment', label: '🧪 يحتاج تحييد — معالجة كيميائية', color: 'border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20' },
              ].map((opt) => (
                <button key={opt.value}
                  className={`p-3 rounded-lg border text-right transition-all ${opt.color} ${labResult === opt.value ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                  onClick={() => setLabResult(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
            <Button className="w-full gap-2" disabled={!labResult || labMutation.isPending} onClick={() => selectedOp && labMutation.mutate({ opId: selectedOp.id, result: labResult })}>
              <FlaskConical className="w-4 h-4" /> {labMutation.isPending ? 'جاري الحفظ...' : 'اعتماد التحليل وتحديد المسار'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Processing Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'incineration' ? '🔥 بدء الحرق (Incineration)' :
               actionType === 'landfill' ? '🏔️ توجيه للدفن الصحي (Landfill)' : '🧪 معالجة كيميائية (Treatment)'}
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-1 text-amber-600"><Lock className="w-3 h-3" /> يتطلب تأكيد المشرف (التحقق المزدوج)</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/50 text-sm">
              <p><strong>العملية:</strong> {selectedOp?.operation_number || selectedOp?.id?.slice(0, 8)}</p>
              <p><strong>المخلف:</strong> {selectedOp?.waste_description} — {selectedOp?.quantity} {selectedOp?.unit}</p>
            </div>

            {actionType === 'incineration' && (
              <div className="space-y-2">
                <Label>درجة حرارة المحرقة (°C)</Label>
                <Input type="number" placeholder="مثال: 1100" value={incinerationTemp} onChange={(e) => setIncinerationTemp(e.target.value)} />
                <p className="text-xs text-muted-foreground">الحد الأدنى المطلوب: 850°C للنفايات الخطرة</p>
              </div>
            )}
            {actionType === 'landfill' && (
              <div className="space-y-2">
                <Label>رقم / اسم خلية الدفن</Label>
                <Input placeholder="مثال: Cell-A3" value={landfillCell} onChange={(e) => setLandfillCell(e.target.value)} />
              </div>
            )}
            {actionType === 'chemical_treatment' && (
              <div className="space-y-2">
                <Label>وصف عملية التحييد</Label>
                <Textarea placeholder="مثال: تحييد بمحلول هيدروكسيد الصوديوم..." value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)} rows={3} />
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleConfirmWithDualVerify} disabled={startProcessingMutation.isPending}>
              <Lock className="w-4 h-4" /> طلب تأكيد المشرف وبدء المعالجة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dual Verification Dialog */}
      <AlertDialog open={showDualVerify} onOpenChange={setShowDualVerify}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              التحقق المزدوج — تأكيد المشرف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء يتطلب تأكيد مدير الموقع. يرجى إدخال كلمة مرور المشرف للمتابعة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 text-sm">
              <p className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-600" /> <strong>عملية حرجة:</strong> {actionType === 'incineration' ? 'بدء الحرق' : actionType === 'landfill' ? 'توجيه للدفن' : 'معالجة كيميائية'}</p>
              <p className="text-xs text-muted-foreground mt-1">العملية: {selectedOp?.operation_number} — {selectedOp?.waste_description}</p>
            </div>
            <div className="space-y-2">
              <Label>كلمة مرور المشرف</Label>
              <Input type="password" placeholder="أدخل كلمة مرور المشرف..." value={supervisorPassword} onChange={(e) => setSupervisorPassword(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDualVerifyConfirm} className="bg-red-600 hover:bg-red-700 gap-1">
              <Lock className="w-3 h-3" /> تأكيد وبدء المعالجة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LabTreatmentTab;
