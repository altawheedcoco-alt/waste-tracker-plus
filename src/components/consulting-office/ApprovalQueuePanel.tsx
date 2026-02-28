import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  CheckCircle2, XCircle, Clock, FileText, Loader2,
  Stamp, AlertTriangle, User, Calendar,
} from 'lucide-react';

const ApprovalQueuePanel = memo(() => {
  const { pendingApprovals, reviewSignature, isDirector } = useConsultingOffice();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleReview = async (signatureId: string, status: 'approved' | 'rejected') => {
    await reviewSignature.mutateAsync({
      signatureId,
      status,
      notes: reviewNotes[signatureId],
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            طلبات الاعتماد المعلقة
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingApprovals.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            مستندات وقّعها استشاريون وتحتاج اعتماد المدير وختم المكتب
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isDirector && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">فقط مدير المكتب يمكنه اعتماد أو رفض التوقيعات</span>
            </div>
          )}

          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20 text-emerald-500" />
              <p className="font-medium">لا توجد طلبات اعتماد معلقة</p>
              <p className="text-sm mt-1">ستظهر هنا المستندات التي تنتظر ختم وموافقة المدير</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((sig: any) => (
                <Card key={sig.id} className="border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sig.document_type}</p>
                          <p className="text-[11px] text-muted-foreground">
                            مستند: {sig.document_id?.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-700 bg-amber-50">
                        <Clock className="w-3 h-3 ml-1" />قيد المراجعة
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />الموقّع: {sig.signed_as_role || 'استشاري'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />التاريخ: {new Date(sig.signed_at || sig.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    </div>

                    {sig.notes && (
                      <p className="text-xs bg-muted/50 rounded p-2 mb-3">{sig.notes}</p>
                    )}

                    {isDirector && (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea
                          value={reviewNotes[sig.id] || ''}
                          onChange={e => setReviewNotes(p => ({ ...p, [sig.id]: e.target.value }))}
                          placeholder="ملاحظات المدير (اختياري)..."
                          className="text-sm min-h-[50px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm"
                            onClick={() => handleReview(sig.id, 'rejected')}
                            disabled={reviewSignature.isPending}
                            className="gap-1.5 text-destructive hover:text-destructive">
                            <XCircle className="w-3.5 h-3.5" />رفض
                          </Button>
                          <Button size="sm"
                            onClick={() => handleReview(sig.id, 'approved')}
                            disabled={reviewSignature.isPending}
                            className="gap-1.5">
                            <Stamp className="w-3.5 h-3.5" />اعتماد وختم
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ApprovalQueuePanel.displayName = 'ApprovalQueuePanel';
export default ApprovalQueuePanel;
