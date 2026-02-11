import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flame, Mountain, FlaskConical, CheckCircle, Clock, Package, Play, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OperationsTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const OperationsTab = ({ facilityId, organizationId, searchQuery }: OperationsTabProps) => {
  const queryClient = useQueryClient();
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [actionType, setActionType] = useState<string>('');
  const [incinerationTemp, setIncinerationTemp] = useState('');
  const [landfillCell, setLandfillCell] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // Operations ready for processing (pending or processing)
  const { data: operations = [] } = useQuery({
    queryKey: ['mc-processing-ops', organizationId],
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

  // Start processing
  const startProcessingMutation = useMutation({
    mutationFn: async ({ opId, method, extras }: { opId: string; method: string; extras: any }) => {
      const updateData: any = {
        status: 'processing',
        disposal_method: method,
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...extras,
      };
      const { error } = await supabase.from('disposal_operations').update(updateData).eq('id', opId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم بدء المعالجة');
      setShowActionDialog(false);
      queryClient.invalidateQueries({ queryKey: ['mc-processing-ops'] });
    },
  });

  // Complete processing
  const completeMutation = useMutation({
    mutationFn: async (opId: string) => {
      const certNumber = `DISP-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from('disposal_operations')
        .update({
          status: 'completed',
          certificate_number: certNumber,
          processing_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', opId);
      if (error) throw error;
      return certNumber;
    },
    onSuccess: (certNum) => {
      toast.success(`تم إكمال المعالجة وإصدار الشهادة: ${certNum}`);
      queryClient.invalidateQueries({ queryKey: ['mc-processing-ops'] });
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

  const handleConfirmAction = () => {
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
  };

  const pendingOps = operations.filter((o: any) => o.status === 'pending');
  const processingOps = operations.filter((o: any) => o.status === 'processing');

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'incineration': return <Flame className="w-4 h-4 text-red-500" />;
      case 'landfill': return <Mountain className="w-4 h-4 text-amber-600" />;
      case 'chemical_treatment': return <FlaskConical className="w-4 h-4 text-blue-500" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'بانتظار التوجيه', value: pendingOps.length, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'قيد الحرق', value: processingOps.filter((o: any) => o.disposal_method === 'incineration').length, icon: Flame, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
          { label: 'قيد الدفن', value: processingOps.filter((o: any) => o.disposal_method === 'landfill').length, icon: Mountain, color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'قيد المعالجة الكيم', value: processingOps.filter((o: any) => o.disposal_method === 'chemical_treatment').length, icon: FlaskConical, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Operations - Route to processing */}
      {pendingOps.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              عمليات بانتظار التوجيه للمعالجة
            </CardTitle>
            <CardDescription>اختر مسار المعالجة لكل عملية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOps.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-blue-600 border-blue-300" onClick={() => handleStartAction(op, 'chemical_treatment')}>
                    🧪 معالجة
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-amber-600 border-amber-300" onClick={() => handleStartAction(op, 'landfill')}>
                    🏔️ دفن
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-red-600 border-red-300" onClick={() => handleStartAction(op, 'incineration')}>
                    🔥 حرق
                  </Button>
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {op.quantity} {op.unit} •
                    {op.hazard_level === 'hazardous' && <span className="text-red-500 mr-1">⚠️ خطر</span>}
                    {op.processing_path && <Badge variant="outline" className="text-[10px] mr-1">مسار: {op.processing_path}</Badge>}
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
                  <Button size="sm" className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700" onClick={() => completeMutation.mutate(op.id)} disabled={completeMutation.isPending}>
                    <CheckCircle className="w-3 h-3" /> إتمام + شهادة
                  </Button>
                  {getMethodIcon(op.disposal_method)}
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {op.quantity} {op.unit} • {op.disposal_method === 'incineration' ? 'حرق' : op.disposal_method === 'landfill' ? 'دفن صحي' : 'معالجة كيميائية'}
                    {op.processing_started_at && <span className="mr-1">• بدأ {formatDistanceToNow(new Date(op.processing_started_at), { locale: ar, addSuffix: true })}</span>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'incineration' ? '🔥 توجيه للمحرقة' :
               actionType === 'landfill' ? '🏔️ توجيه للدفن الصحي' : '🧪 معالجة كيميائية'}
            </DialogTitle>
            <DialogDescription>تسجيل بيانات بدء عملية المعالجة</DialogDescription>
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
                <p className="text-xs text-muted-foreground">سيتم تحديث السعة المتبقية للخلية تلقائياً</p>
              </div>
            )}

            {actionType === 'chemical_treatment' && (
              <div className="space-y-2">
                <Label>وصف عملية التحييد</Label>
                <Textarea placeholder="مثال: تحييد بمحلول هيدروكسيد الصوديوم..." value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)} rows={3} />
              </div>
            )}

            <Button className="w-full" onClick={handleConfirmAction} disabled={startProcessingMutation.isPending}>
              <Play className="w-4 h-4 ml-2" />
              {startProcessingMutation.isPending ? 'جاري البدء...' : 'بدء المعالجة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationsTab;
