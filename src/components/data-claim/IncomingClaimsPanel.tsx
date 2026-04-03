import { useState } from 'react';
import { useIncomingClaims, useApproveClaim, useRejectClaim } from '@/hooks/useDataClaim';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowRightLeft,
  Check,
  X,
  Loader2,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'في الانتظار', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  approved: { label: 'تمت الموافقة', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Check },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 border-red-300', icon: X },
};

export function IncomingClaimsPanel() {
  const { data: claims, isLoading } = useIncomingClaims();
  const approveClaim = useApproveClaim();
  const rejectClaim = useRejectClaim();
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);

  if (isLoading) return null;
  if (!claims?.length) return null;

  const handleApprove = (claimId: string) => {
    approveClaim.mutate(claimId, {
      onSuccess: () => setConfirmApprove(null),
    });
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    rejectClaim.mutate(
      { claimId: rejectDialog, reason: rejectReason },
      { onSuccess: () => { setRejectDialog(null); setRejectReason(''); } }
    );
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            طلبات استيعاب البيانات
            <Badge variant="secondary" className="mr-auto">
              {claims.filter(c => c.status === 'pending').length} معلّق
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {claims.map((claim) => {
            const status = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            
            return (
              <div
                key={claim.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {claim.requesting_org?.name || 'جهة غير معروفة'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      تطلب ضم بيانات "{claim.external_partner?.name}" إلى حسابها
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(claim.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                    </p>
                  </div>
                  <Badge variant="outline" className={status.color}>
                    <StatusIcon className="h-3 w-3 ml-1" />
                    {status.label}
                  </Badge>
                </div>

                {claim.status === 'completed' && claim.records_count != null && (
                  <div className="text-xs text-emerald-600 bg-emerald-50 rounded p-2">
                    ✅ تم ترحيل {claim.records_count} سجل عبر {claim.tables_migrated?.length || 0} جداول
                  </div>
                )}

                {claim.status === 'rejected' && claim.rejection_reason && (
                  <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                    سبب الرفض: {claim.rejection_reason}
                  </div>
                )}

                {claim.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => setConfirmApprove(claim.id)}
                      disabled={approveClaim.isPending}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      موافقة وترحيل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30"
                      onClick={() => setRejectDialog(claim.id)}
                    >
                      <X className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Confirm Approve Dialog */}
      <Dialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              تأكيد الموافقة على الترحيل
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            سيتم نقل جميع البيانات (شحنات، فواتير، قيود محاسبية، مستندات) المرتبطة بالشريك الخارجي إلى حساب الجهة الطالبة. هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmApprove(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => confirmApprove && handleApprove(confirmApprove)}
              disabled={approveClaim.isPending}
            >
              {approveClaim.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <Check className="h-4 w-4 ml-1" />
              )}
              تأكيد الترحيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="اكتب سبب الرفض..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectClaim.isPending}
            >
              {rejectClaim.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : null}
              رفض الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
