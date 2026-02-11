import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Scale, FlaskConical, ScanLine, Package, AlertTriangle, Clock, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EntryValidationTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const EntryValidationTab = ({ facilityId, organizationId, searchQuery }: EntryValidationTabProps) => {
  const queryClient = useQueryClient();
  const [verifyManifest, setVerifyManifest] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [showWeighDialog, setShowWeighDialog] = useState(false);
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [weightData, setWeightData] = useState({ gross: '', tare: '' });
  const [labResult, setLabResult] = useState('');

  // Pending incoming requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['mc-pending-requests', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data, error } = await supabase
        .from('disposal_incoming_requests')
        .select('*, requesting_organization:organizations!disposal_incoming_requests_requesting_organization_id_fkey(name)')
        .eq('disposal_facility_id', facilityId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!facilityId,
    refetchInterval: 15000,
  });

  // Pending operations (awaiting weighing/lab)
  const { data: pendingOps = [] } = useQuery({
    queryKey: ['mc-pending-ops', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('*, disposal_facility:disposal_facilities(name)')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Verify manifest
  const verifyManifestMutation = useMutation({
    mutationFn: async (manifestNumber: string) => {
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('*, disposal_facility:disposal_facilities(name)')
        .eq('manifest_number', manifestNumber)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setVerifyResult(data);
      toast.success('تم التحقق من البيان بنجاح');
    },
    onError: () => {
      setVerifyResult(null);
      toast.error('لم يتم العثور على بيان بهذا الرقم');
    },
  });

  // Accept request
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('disposal_incoming_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم قبول الطلب');
      queryClient.invalidateQueries({ queryKey: ['mc-pending-requests'] });
    },
  });

  // Reject request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('disposal_incoming_requests')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم رفض الطلب');
      queryClient.invalidateQueries({ queryKey: ['mc-pending-requests'] });
    },
  });

  // Record weight
  const weighMutation = useMutation({
    mutationFn: async ({ opId, gross, tare }: { opId: string; gross: number; tare: number }) => {
      const net = gross - tare;
      const ticketNum = `WT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { error } = await supabase
        .from('disposal_operations')
        .update({
          weight_gross: gross,
          weight_tare: tare,
          weight_net: net,
          quantity: net,
          weight_ticket_number: ticketNum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', opId);
      if (error) throw error;
      return ticketNum;
    },
    onSuccess: (ticketNum) => {
      toast.success(`تم تسجيل الوزن • سند رقم: ${ticketNum}`);
      setShowWeighDialog(false);
      setWeightData({ gross: '', tare: '' });
      queryClient.invalidateQueries({ queryKey: ['mc-pending-ops'] });
    },
  });

  // Lab sampling
  const labMutation = useMutation({
    mutationFn: async ({ opId, result }: { opId: string; result: string }) => {
      const path = result === 'matched' ? 'incineration' : result === 'less_hazardous' ? 'landfill' : 'chemical_neutralization';
      const { error } = await supabase
        .from('disposal_operations')
        .update({
          lab_sample_taken: true,
          lab_sample_result: result,
          lab_analysis_date: new Date().toISOString(),
          processing_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', opId);
      if (error) throw error;
      return path;
    },
    onSuccess: (path) => {
      const pathLabel = path === 'incineration' ? 'الحرق 🔥' : path === 'landfill' ? 'الدفن الصحي 🏔️' : 'المعالجة الكيميائية 🧪';
      toast.success(`تم تحديد مسار المعالجة: ${pathLabel}`);
      setShowLabDialog(false);
      setLabResult('');
      queryClient.invalidateQueries({ queryKey: ['mc-pending-ops'] });
    },
  });

  const filteredRequests = pendingRequests.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.waste_description?.toLowerCase().includes(q) || r.requesting_organization?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Verify Manifest */}
      <Card className="border-blue-200 dark:border-blue-800/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="w-5 h-5 text-blue-600" />
            التحقق من الكود الموحد (Manifest)
          </CardTitle>
          <CardDescription>مقارنة بيانات الشحنة الواصلة مع البيانات المسجلة مسبقاً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="أدخل رقم بيان النقل..."
              value={verifyManifest}
              onChange={(e) => setVerifyManifest(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => verifyManifestMutation.mutate(verifyManifest)}
              disabled={!verifyManifest || verifyManifestMutation.isPending}
              className="gap-2"
            >
              <ScanLine className="w-4 h-4" />
              تحقق
            </Button>
          </div>
          {verifyResult && (
            <div className="mt-4 p-4 rounded-lg border bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800/40">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-400">تم التحقق — البيان مطابق</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">نوع المخلف:</span> <strong>{verifyResult.waste_description || verifyResult.waste_type}</strong></div>
                <div><span className="text-muted-foreground">الكمية:</span> <strong>{verifyResult.quantity} {verifyResult.unit}</strong></div>
                <div><span className="text-muted-foreground">الخطورة:</span> <Badge variant={verifyResult.hazard_level === 'hazardous' ? 'destructive' : 'secondary'} className="text-xs">{verifyResult.hazard_level === 'hazardous' ? 'خطر' : 'غير خطر'}</Badge></div>
                <div><span className="text-muted-foreground">الحالة:</span> <Badge variant="outline" className="text-xs">{verifyResult.status}</Badge></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming Requests */}
      <Card className="border-red-200 dark:border-red-800/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="text-xs">{filteredRequests.length}</Badge>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="w-5 h-5 text-red-600" />
              طلبات الاستقبال الواردة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>لا توجد طلبات واردة حالياً</p>
            </div>
          ) : (
            filteredRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => rejectMutation.mutate(req.id)}>
                        <XCircle className="w-3 h-3 ml-1" /> رفض
                      </Button>
                      <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => acceptMutation.mutate(req.id)}>
                        <CheckCircle className="w-3 h-3 ml-1" /> قبول
                      </Button>
                    </>
                  )}
                  {req.status === 'accepted' && (
                    <Badge className="bg-green-500/10 text-green-600 text-xs">✓ مقبول</Badge>
                  )}
                  <Badge variant={req.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {req.priority === 'urgent' ? 'عاجل' : req.priority === 'high' ? 'مهم' : 'عادي'}
                  </Badge>
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{req.waste_description || req.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.requesting_organization?.name} • {req.estimated_quantity} {req.unit} •
                    <span className="mr-1">{formatDistanceToNow(new Date(req.created_at), { locale: ar, addSuffix: true })}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending Operations - Weigh & Lab */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-amber-600" />
            عمليات بانتظار الوزن / فحص المختبر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>لا توجد عمليات معلقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingOps.map((op: any) => (
                <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {!op.lab_sample_taken && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setSelectedOp(op); setShowLabDialog(true); }}>
                        <FlaskConical className="w-3 h-3" /> عينة مختبر
                      </Button>
                    )}
                    {!op.weight_ticket_number && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setSelectedOp(op); setShowWeighDialog(true); }}>
                        <Scale className="w-3 h-3" /> تسجيل الوزن
                      </Button>
                    )}
                    {op.weight_ticket_number && <Badge className="bg-green-500/10 text-green-600 text-xs gap-1"><Scale className="w-3 h-3" /> {op.weight_ticket_number}</Badge>}
                    {op.lab_sample_taken && <Badge className="bg-blue-500/10 text-blue-600 text-xs gap-1"><FlaskConical className="w-3 h-3" /> تم الفحص</Badge>}
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{op.quantity} {op.unit} • {op.disposal_method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weigh Dialog */}
      <Dialog open={showWeighDialog} onOpenChange={setShowWeighDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scale className="w-5 h-5" /> تسجيل الوزن الصافي</DialogTitle>
            <DialogDescription>سند وزن إلكتروني غير قابل للتلاعب</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/50 text-sm">
              <p><strong>العملية:</strong> {selectedOp?.operation_number || selectedOp?.id?.slice(0, 8)}</p>
              <p><strong>المخلف:</strong> {selectedOp?.waste_description || selectedOp?.waste_type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوزن الإجمالي (طن)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={weightData.gross} onChange={(e) => setWeightData(p => ({ ...p, gross: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>وزن المركبة فارغة (طن)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={weightData.tare} onChange={(e) => setWeightData(p => ({ ...p, tare: e.target.value }))} />
              </div>
            </div>
            {weightData.gross && weightData.tare && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground">الوزن الصافي</p>
                <p className="text-3xl font-bold text-primary">{(Number(weightData.gross) - Number(weightData.tare)).toFixed(2)} طن</p>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!weightData.gross || !weightData.tare || weighMutation.isPending}
              onClick={() => selectedOp && weighMutation.mutate({ opId: selectedOp.id, gross: Number(weightData.gross), tare: Number(weightData.tare) })}
            >
              <Scale className="w-4 h-4 ml-2" />
              {weighMutation.isPending ? 'جاري التسجيل...' : 'إصدار سند الوزن'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Dialog */}
      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> أخذ عينة مختبر</DialogTitle>
            <DialogDescription>تحليل العينة لتحديد مسار المعالجة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/50 text-sm">
              <p><strong>العملية:</strong> {selectedOp?.operation_number || selectedOp?.id?.slice(0, 8)}</p>
              <p><strong>المخلف المعلن:</strong> {selectedOp?.waste_description || selectedOp?.waste_type}</p>
              <p><strong>مستوى الخطورة:</strong> {selectedOp?.hazard_level === 'hazardous' ? '⚠️ خطر' : '✅ غير خطر'}</p>
            </div>
            <Label>نتيجة التحليل</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'matched', label: '🔥 مطابق — يذهب للحرق (Incineration)', color: 'border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20' },
                { value: 'less_hazardous', label: '🏔️ أقل خطورة — يذهب للدفن الصحي (Landfill)', color: 'border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20' },
                { value: 'needs_treatment', label: '🧪 يحتاج تحييد — معالجة كيميائية (Neutralization)', color: 'border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`p-3 rounded-lg border text-right transition-all ${opt.color} ${labResult === opt.value ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                  onClick={() => setLabResult(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={!labResult || labMutation.isPending}
              onClick={() => selectedOp && labMutation.mutate({ opId: selectedOp.id, result: labResult })}
            >
              <FlaskConical className="w-4 h-4 ml-2" />
              {labMutation.isPending ? 'جاري الحفظ...' : 'تأكيد نتيجة التحليل'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntryValidationTab;
