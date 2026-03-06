import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, Clock, AlertTriangle, XCircle, Stamp, Send, Eye } from 'lucide-react';
import { useLicenseRenewalRequests, useRegulatoryAttestations, useUpdateRenewalRequest, useIssueAttestation } from '@/hooks/useLicenseRenewal';
import { useAuth } from '@/contexts/AuthContext';
import { useRegulatorConfig } from '@/hooks/useRegulatorData';
import { Skeleton } from '@/components/ui/skeleton';
import AttestationPrintView from './AttestationPrintView';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-700', icon: Clock },
  under_review: { label: 'قيد المراجعة', color: 'bg-blue-500/10 text-blue-700', icon: Eye },
  documents_required: { label: 'مستندات مطلوبة', color: 'bg-orange-500/10 text-orange-700', icon: AlertTriangle },
  fees_pending: { label: 'في انتظار الرسوم', color: 'bg-amber-500/10 text-amber-700', icon: FileText },
  fees_paid: { label: 'تم دفع الرسوم', color: 'bg-emerald-500/10 text-emerald-700', icon: CheckCircle },
  processing: { label: 'جاري الإصدار', color: 'bg-indigo-500/10 text-indigo-700', icon: Clock },
  approved: { label: 'تمت الموافقة', color: 'bg-green-500/10 text-green-700', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-700', icon: XCircle },
};

const LicenseManagementPanel = () => {
  const { organization } = useAuth();
  const { data: config } = useRegulatorConfig();
  const { data: requests = [], isLoading: reqLoading } = useLicenseRenewalRequests(true);
  const { data: attestations = [], isLoading: attLoading } = useRegulatoryAttestations(true);
  const updateRequest = useUpdateRenewalRequest();
  const issueAttestation = useIssueAttestation();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showAttestationDialog, setShowAttestationDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ status: '', fee_amount: '', notes: '', rejection_reason: '' });
  const [attestationData, setAttestationData] = useState({ type: 'fee_payment_processing', valid_days: '15', notes: '' });

  const isLoading = reqLoading || attLoading;

  const handleReview = (request: any) => {
    setSelectedRequest(request);
    setReviewData({ status: request.status, fee_amount: request.fee_amount || '', notes: request.notes || '', rejection_reason: '' });
    setShowReviewDialog(true);
  };

  const handleSaveReview = async () => {
    if (!selectedRequest) return;
    const updates: Record<string, any> = {
      status: reviewData.status,
      notes: reviewData.notes,
      reviewed_at: new Date().toISOString(),
    };
    if (reviewData.fee_amount) updates.fee_amount = parseFloat(reviewData.fee_amount);
    if (reviewData.status === 'rejected') updates.rejection_reason = reviewData.rejection_reason;
    if (reviewData.status === 'approved') updates.completed_at = new Date().toISOString();
    
    await updateRequest.mutateAsync({ id: selectedRequest.id, updates });
    setShowReviewDialog(false);
  };

  const handleIssueAttestation = (request: any) => {
    setSelectedRequest(request);
    setAttestationData({ type: 'fee_payment_processing', valid_days: '15', notes: '' });
    setShowAttestationDialog(true);
  };

  const handleSaveAttestation = async () => {
    if (!selectedRequest || !organization) return;
    const validDays = parseInt(attestationData.valid_days) || 15;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Snapshot org data
    const orgData = {
      name: selectedRequest.org?.name,
      name_en: selectedRequest.org?.name_en,
      organization_type: selectedRequest.org?.organization_type,
      email: selectedRequest.org?.email,
      phone: selectedRequest.org?.phone,
      license_number: selectedRequest.current_license_number,
      license_expiry: selectedRequest.current_license_expiry,
    };

    await issueAttestation.mutateAsync({
      renewal_request_id: selectedRequest.id,
      organization_id: selectedRequest.organization_id,
      regulator_organization_id: organization.id,
      regulator_level_code: config?.regulator_level_code || 'WMRA',
      attestation_type: attestationData.type,
      valid_until: validUntil.toISOString(),
      max_validity_days: validDays,
      organization_data: orgData,
      notes: attestationData.notes || null,
    });

    // Update request status
    if (attestationData.type === 'fee_payment_processing') {
      await updateRequest.mutateAsync({ id: selectedRequest.id, updates: { status: 'processing' } });
    }
    setShowAttestationDialog(false);
  };

  const pendingCount = (requests as any[]).filter((r: any) => ['pending', 'under_review'].includes(r.status)).length;
  const activeAttCount = (attestations as any[]).filter((a: any) => a.status === 'active' && new Date(a.valid_until) > new Date()).length;

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{(requests as any[]).length}</div>
          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">بانتظار المراجعة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{activeAttCount}</div>
          <p className="text-xs text-muted-foreground">إفادات سارية</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{(requests as any[]).filter((r: any) => r.status === 'approved').length}</div>
          <p className="text-xs text-muted-foreground">تراخيص مُصدرة</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="requests" dir="rtl">
        <TabsList>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileText className="w-4 h-4" /> طلبات التجديد {pendingCount > 0 && <Badge variant="destructive" className="text-[9px] px-1.5">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="attestations" className="gap-1.5">
            <Stamp className="w-4 h-4" /> الإفادات الصادرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {(requests as any[]).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد طلبات تجديد حالياً</CardContent></Card>
          ) : (
            (requests as any[]).map((req: any) => {
              const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
              const StIcon = st.icon;
              return (
                <Card key={req.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm truncate">{req.org?.name || 'جهة غير معروفة'}</h4>
                          <Badge className={`text-[10px] ${st.color}`}>
                            <StIcon className="w-3 h-3 ml-1" />{st.label}
                          </Badge>
                          {req.auto_requested && <Badge variant="outline" className="text-[9px]">تلقائي</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>📋 {req.request_type === 'renewal' ? 'تجديد' : req.request_type === 'new_license' ? 'ترخيص جديد' : 'تسجيل'}</span>
                          {req.current_license_number && <span>🔢 {req.current_license_number}</span>}
                          {req.current_license_expiry && <span>📅 ينتهي: {new Date(req.current_license_expiry).toLocaleDateString('ar-EG')}</span>}
                          {req.fee_amount && <span>💰 {req.fee_amount} ج.م</span>}
                          <span>🕐 {new Date(req.requested_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                        {req.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">📝 {req.notes}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleReview(req)}>
                          <Eye className="w-3.5 h-3.5 ml-1" /> مراجعة
                        </Button>
                        {['fees_paid', 'processing', 'under_review'].includes(req.status) && (
                          <Button size="sm" variant="default" onClick={() => handleIssueAttestation(req)}>
                            <Stamp className="w-3.5 h-3.5 ml-1" /> إفادة
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="attestations" className="mt-4 space-y-3">
          {(attestations as any[]).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لم يتم إصدار إفادات بعد</CardContent></Card>
          ) : (
            (attestations as any[]).map((att: any) => {
              const isExpired = new Date(att.valid_until) < new Date();
              const isRevoked = att.status === 'revoked';
              return (
                <Card key={att.id} className={`${isExpired || isRevoked ? 'opacity-60' : ''} hover:border-primary/30 transition-colors`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm">{att.org?.name || 'جهة'}</h4>
                          <Badge variant={isExpired ? 'destructive' : isRevoked ? 'destructive' : 'default'} className="text-[10px]">
                            {isRevoked ? 'ملغاة' : isExpired ? 'منتهية' : 'سارية'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px]">
                            {att.attestation_type === 'fee_payment_processing' ? 'إفادة دفع رسوم' : 'إفادة تسجيل'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>🔢 {att.attestation_number}</span>
                          <span>📅 صادرة: {new Date(att.issued_at).toLocaleDateString('ar-EG')}</span>
                          <span>⏰ سارية حتى: {new Date(att.valid_until).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowPrintView(att)}>
                        <FileText className="w-3.5 h-3.5 ml-1" /> عرض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>مراجعة طلب تجديد الترخيص</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><strong>الجهة:</strong> {selectedRequest.org?.name}</p>
                <p><strong>النوع:</strong> {selectedRequest.org?.organization_type}</p>
                <p><strong>رقم الترخيص:</strong> {selectedRequest.current_license_number || 'غير محدد'}</p>
                <p><strong>تاريخ الانتهاء:</strong> {selectedRequest.current_license_expiry ? new Date(selectedRequest.current_license_expiry).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">حالة الطلب</label>
              <Select value={reviewData.status} onValueChange={(v) => setReviewData(d => ({ ...d, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="under_review">قيد المراجعة</SelectItem>
                  <SelectItem value="documents_required">مستندات مطلوبة</SelectItem>
                  <SelectItem value="fees_pending">في انتظار الرسوم</SelectItem>
                  <SelectItem value="fees_paid">تم دفع الرسوم</SelectItem>
                  <SelectItem value="processing">جاري الإصدار</SelectItem>
                  <SelectItem value="approved">موافقة وإصدار</SelectItem>
                  <SelectItem value="rejected">رفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">قيمة الرسوم (ج.م)</label>
              <Input type="number" value={reviewData.fee_amount} onChange={e => setReviewData(d => ({ ...d, fee_amount: e.target.value }))} placeholder="0.00" />
            </div>
            {reviewData.status === 'rejected' && (
              <div>
                <label className="text-sm font-medium mb-1 block">سبب الرفض</label>
                <Textarea value={reviewData.rejection_reason} onChange={e => setReviewData(d => ({ ...d, rejection_reason: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Textarea value={reviewData.notes} onChange={e => setReviewData(d => ({ ...d, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveReview} disabled={updateRequest.isPending}>
              <Send className="w-4 h-4 ml-1" /> حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Attestation Dialog */}
      <Dialog open={showAttestationDialog} onOpenChange={setShowAttestationDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إصدار إفادة رسمية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p><strong>الجهة:</strong> {selectedRequest.org?.name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الإفادة</label>
              <Select value={attestationData.type} onValueChange={(v) => setAttestationData(d => ({ ...d, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fee_payment_processing">إفادة دفع رسوم وجاري الإصدار (15 يوم عمل)</SelectItem>
                  <SelectItem value="registration_confirmation">إفادة تسجيل وتفعيل مؤقت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">مدة الصلاحية (أيام)</label>
              <Input type="number" value={attestationData.valid_days} onChange={e => setAttestationData(d => ({ ...d, valid_days: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground mt-1">
                {attestationData.type === 'fee_payment_processing' 
                  ? 'المدة الافتراضية 15 يوم عمل حتى إصدار الترخيص'
                  : 'المدة المحددة لسريان الإفادة حتى استخراج الترخيص'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Textarea value={attestationData.notes} onChange={e => setAttestationData(d => ({ ...d, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttestationDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveAttestation} disabled={issueAttestation.isPending}>
              <Stamp className="w-4 h-4 ml-1" /> إصدار الإفادة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print View */}
      {showPrintView && (
        <AttestationPrintView attestation={showPrintView} onClose={() => setShowPrintView(null)} />
      )}
    </div>
  );
};

export default LicenseManagementPanel;
