import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Scale, ScanLine, Package, AlertTriangle, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GateControlTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const GateControlTab = ({ facilityId, organizationId, searchQuery }: GateControlTabProps) => {
  const queryClient = useQueryClient();
  const [verifyManifest, setVerifyManifest] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [showWeighDialog, setShowWeighDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [weightData, setWeightData] = useState({ gross: '', tare: '' });
  const [rejectReason, setRejectReason] = useState('');

  // Incoming requests
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

  // In-plant operations (pending - need weigh/verify)
  const { data: inPlantOps = [] } = useQuery({
    queryKey: ['mc-inplant-ops', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('*, disposal_facility:disposal_facilities(name)')
        .eq('organization_id', organizationId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Verify manifest
  const verifyMutation = useMutation({
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
      toast.success(`تم التحقق: شحنة رقم #${data.operation_number || data.id.slice(0, 8)} مطابقة للعقد.`);
    },
    onError: () => {
      setVerifyResult(null);
      toast.error('لم يتم العثور على بيان بهذا الرقم');
    },
  });

  // Accept request
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from('disposal_incoming_requests').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم قبول الشحنة ودخولها البوابة');
      queryClient.invalidateQueries({ queryKey: ['mc-pending-requests'] });
    },
  });

  // Reject with reason
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase.from('disposal_incoming_requests').update({ status: 'rejected', responded_at: new Date().toISOString(), rejection_reason: reason }).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم الرفض وإرسال إشعار فوري للعميل والرقابة.');
      setShowRejectDialog(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['mc-pending-requests'] });
    },
  });

  // Record weight
  const weighMutation = useMutation({
    mutationFn: async ({ opId, gross, tare }: { opId: string; gross: number; tare: number }) => {
      const net = gross - tare;
      const ticketNum = `WT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { error } = await supabase.from('disposal_operations').update({
        weight_gross: gross, weight_tare: tare, weight_net: net, quantity: net,
        weight_ticket_number: ticketNum, updated_at: new Date().toISOString(),
      }).eq('id', opId);
      if (error) throw error;
      return { ticketNum, net };
    },
    onSuccess: ({ ticketNum, net }) => {
      toast.success(`تم تسجيل الوزن: ${net.toFixed(2)} طن بنجاح. سند رقم: ${ticketNum}`);
      setShowWeighDialog(false);
      setWeightData({ gross: '', tare: '' });
      queryClient.invalidateQueries({ queryKey: ['mc-inplant-ops'] });
    },
  });

  const filteredRequests = pendingRequests.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.waste_description?.toLowerCase().includes(q) || r.requesting_organization?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* 3 Big Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800/40 cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mx-auto mb-3 flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">تحقق من الشحنة</h3>
            <p className="text-xs text-muted-foreground">فحص رقم الـ Manifest في قاعدة البيانات</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800/40 cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-3 flex items-center justify-center">
              <Scale className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">تسجيل الوزن</h3>
            <p className="text-xs text-muted-foreground">جلب القيمة من ميزان البسكول</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800/40 cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto mb-3 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">رفض الشحنة</h3>
            <p className="text-xs text-muted-foreground">كتابة سبب الرفض وإشعار العميل</p>
          </CardContent>
        </Card>
      </div>

      {/* Verify Manifest Section */}
      <Card className="border-blue-200/60 dark:border-blue-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="w-5 h-5 text-blue-600" />
            تحقق من الشحنة (Verify Manifest)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="أدخل رقم بيان النقل..." value={verifyManifest} onChange={(e) => setVerifyManifest(e.target.value)} className="flex-1" />
            <Button onClick={() => verifyMutation.mutate(verifyManifest)} disabled={!verifyManifest || verifyMutation.isPending} className="gap-2 min-w-[120px]">
              <ScanLine className="w-4 h-4" /> تحقق
            </Button>
          </div>
          {verifyResult && (
            <div className="mt-4 p-4 rounded-lg border border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/10">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-400">تم التحقق: شحنة رقم #{verifyResult.operation_number || verifyResult.id.slice(0, 8)} مطابقة للعقد.</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">نوع المخلف:</span> <strong>{verifyResult.waste_description || verifyResult.waste_type}</strong></div>
                <div><span className="text-muted-foreground">الكمية:</span> <strong>{verifyResult.quantity} {verifyResult.unit}</strong></div>
                <div><span className="text-muted-foreground">الخطورة:</span> <Badge variant={verifyResult.hazard_level === 'hazardous' ? 'destructive' : 'secondary'} className="text-xs">{verifyResult.hazard_level === 'hazardous' ? '⚠️ خطر' : 'غير خطر'}</Badge></div>
                <div><span className="text-muted-foreground">الحالة:</span> <Badge variant="outline" className="text-xs">{verifyResult.status}</Badge></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming Requests */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="text-xs">{filteredRequests.filter((r: any) => r.status === 'pending').length}</Badge>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="w-5 h-5 text-red-600" />
              شحنات واردة للبوابة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لا توجد شحنات واردة حالياً</p>
            </div>
          ) : (
            filteredRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" variant="destructive" className="text-xs h-8 gap-1" onClick={() => { setSelectedOp(req); setShowRejectDialog(true); }}>
                        <XCircle className="w-3 h-3" /> رفض الشحنة
                      </Button>
                      <Button size="sm" className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => acceptMutation.mutate(req.id)}>
                        <CheckCircle className="w-3 h-3" /> قبول
                      </Button>
                    </>
                  )}
                  {req.status === 'accepted' && <Badge className="bg-green-500/10 text-green-600 text-xs">✓ مقبول</Badge>}
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{req.waste_description || req.waste_type}</p>
                  <p className="text-xs text-muted-foreground">{req.requesting_organization?.name} • {req.estimated_quantity} {req.unit} • {formatDistanceToNow(new Date(req.created_at), { locale: ar, addSuffix: true })}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* In-Plant Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            الشحنات داخل الموقع (In-Plant)
          </CardTitle>
          <CardDescription>أزرار سريعة لتوجيه ووزن كل شحنة</CardDescription>
        </CardHeader>
        <CardContent>
          {inPlantOps.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لا توجد شحنات داخل الموقع حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inPlantOps.map((op: any) => (
                <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {!op.weight_ticket_number ? (
                      <Button size="sm" className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setSelectedOp(op); setShowWeighDialog(true); }}>
                        <Scale className="w-3 h-3" /> تسجيل الوزن
                      </Button>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 text-xs gap-1"><Scale className="w-3 h-3" /> {op.weight_ticket_number}</Badge>
                    )}
                    {op.hazard_level === 'hazardous' && <Badge variant="destructive" className="text-xs">⚠️ خطر</Badge>}
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{op.quantity} {op.unit} • {op.disposal_method || 'لم يحدد بعد'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" /> رفض الشحنة</DialogTitle>
            <DialogDescription>يرجى كتابة سبب الرفض — سيتم إشعار العميل والجهة الرقابية فوراً</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/50 text-sm">
              <p><strong>المخلف:</strong> {selectedOp?.waste_description || selectedOp?.waste_type}</p>
              <p><strong>العميل:</strong> {selectedOp?.requesting_organization?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>سبب الرفض</Label>
              <Textarea placeholder="مثال: مخالفة للمواصفات — نسبة السمية تتجاوز الحد المسموح..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
            <Button variant="destructive" className="w-full gap-2" onClick={() => selectedOp && rejectMutation.mutate({ requestId: selectedOp.id, reason: rejectReason })} disabled={!rejectReason || rejectMutation.isPending}>
              <XCircle className="w-4 h-4" /> {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض وإشعار العميل'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weigh Dialog */}
      <Dialog open={showWeighDialog} onOpenChange={setShowWeighDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scale className="w-5 h-5" /> تسجيل الوزن (Weighbridge)</DialogTitle>
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
            <Button className="w-full gap-2" disabled={!weightData.gross || !weightData.tare || weighMutation.isPending} onClick={() => selectedOp && weighMutation.mutate({ opId: selectedOp.id, gross: Number(weightData.gross), tare: Number(weightData.tare) })}>
              <Scale className="w-4 h-4" /> {weighMutation.isPending ? 'جاري التسجيل...' : 'إصدار سند الوزن'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GateControlTab;
