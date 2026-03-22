import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2,
  Scale,
  ExternalLink,
  Gavel,
  FileText,
  FileWarning,
  History,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { OrganizationDocument, VerificationHistory, AILegalAnalysis } from './types';
import { getDocumentTypeLabel, getOrgTypeLabel, getStatusBadge, getRiskBadge } from './verificationUtils';

interface DocumentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: OrganizationDocument | null;
  onVerify: (docId: string, status: 'verified' | 'rejected' | 'requires_review', notes?: string, rejectionReason?: string) => Promise<void>;
  actionLoading: boolean;
}

const DocumentReviewDialog = ({
  open,
  onOpenChange,
  document,
  onVerify,
  actionLoading,
}: DocumentReviewDialogProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AILegalAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getDocumentUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(filePath, 3600);

      if (!signedError && signedData?.signedUrl) {
        return signedData.signedUrl;
      }

      const { data } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }, []);

  const loadDocumentPreview = useCallback(async (doc: OrganizationDocument) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);

    try {
      const url = await getDocumentUrl(doc.file_path);
      if (url) {
        setPreviewUrl(url);
      } else {
        setPreviewError('فشل في تحميل المستند');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError('فشل في تحميل المستند');
    } finally {
      setPreviewLoading(false);
    }
  }, [getDocumentUrl]);

  const fetchVerificationHistory = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerificationHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Load data when dialog opens
  useState(() => {
    if (open && document) {
      loadDocumentPreview(document);
      fetchVerificationHistory(document.id);
      if (document.ai_verification_result && typeof document.ai_verification_result === 'object') {
        setCurrentAnalysis(document.ai_verification_result as AILegalAnalysis);
      }
    }
  });

  const handleDownload = async () => {
    if (!document) return;
    const url = await getDocumentUrl(document.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleVerifyClick = async (status: 'verified' | 'rejected' | 'requires_review') => {
    if (!document) return;
    await onVerify(document.id, status, verificationNotes, rejectionReason);
    setVerificationNotes('');
    setRejectionReason('');
  };

  if (!document) return null;

  const canVerify = document.verification_status === 'pending' || 
    !document.verification_status ||
    document.verification_status === 'requires_review';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 justify-end">
            <Scale className="w-5 h-5" />
            المراجعة القانونية للمستند
          </DialogTitle>
          <DialogDescription>
            تحليل وتوثيق المستند قانونياً
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pl-4">
          <div className="space-y-6">
            {/* Document Preview */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح المستند
                  </Button>
                </div>
                <h3 className="font-medium">{document.file_name}</h3>
              </div>
              
              <div className="aspect-video bg-background rounded-lg border flex items-center justify-center overflow-hidden">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>جاري تحميل المستند...</p>
                  </div>
                ) : previewError ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileWarning className="w-12 h-12" />
                    <p>{previewError}</p>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      فتح المستند مباشرة
                    </Button>
                  </div>
                ) : previewUrl ? (
                  document.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={previewUrl} 
                      alt={document.file_name}
                      className="max-w-full max-h-full object-contain"
                      onError={() => setPreviewError('فشل في عرض الصورة')}
                    />
                  ) : document.file_path.match(/\.pdf$/i) ? (
                    <GoogleDocsPdfViewer
                      url={previewUrl}
                      title={document.file_name}
                      height="400px"
                      className="w-full"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-2" />
                      <p>انقر لفتح المستند</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleDownload}
                      >
                        فتح المستند
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-2" />
                    <p>انقر لفتح المستند</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">نوع المستند</p>
                <p className="font-medium">{getDocumentTypeLabel(document.document_type)}</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">الحالة</p>
                {getStatusBadge(document.verification_status)}
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">الجهة</p>
                <p className="font-medium">{document.organization?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getOrgTypeLabel(document.organization?.organization_type || '')}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground">تاريخ الرفع</p>
                <p className="font-medium">
                  {format(new Date(document.created_at), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            {currentAnalysis && (
              <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getRiskBadge(currentAnalysis.riskLevel)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">التحليل القانوني</h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className={`font-bold text-2xl ${
                    currentAnalysis.confidence >= 80 ? 'text-emerald-600' :
                    currentAnalysis.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {currentAnalysis.confidence}%
                  </span>
                  <div className="flex-1">
                    <Progress value={currentAnalysis.confidence} className="h-3" />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 bg-background/50 p-2 rounded">
                  {currentAnalysis.summary}
                </p>

                <div className="space-y-2 mb-4">
                  <h5 className="text-sm font-medium">الفحوصات القانونية:</h5>
                  {currentAnalysis.legalChecks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">{check.name}:</span>
                        <span className="text-muted-foreground mr-1">{check.details}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {currentAnalysis.recommendations.length > 0 && (
                  <div className="border-t pt-3">
                    <h5 className="text-sm font-medium mb-2">التوصيات:</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {currentAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Verification History */}
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    سجل التحقق ({verificationHistory.length})
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {verificationHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا يوجد سجل تحقق</p>
                  ) : (
                    verificationHistory.map((h) => (
                      <div key={h.id} className="p-3 rounded-lg border text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">
                            {format(new Date(h.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                          </span>
                          <Badge variant="outline">
                            {h.verification_type === 'auto' ? 'تلقائي' : 
                             h.verification_type === 'ai_analysis' ? 'تحليل AI' : 'يدوي'}
                          </Badge>
                        </div>
                        <p>{h.previous_status} ← {h.new_status}</p>
                        {h.notes && <p className="text-muted-foreground mt-1">{h.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Verification Actions */}
            {canVerify && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-right">إجراءات التحقق</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground block text-right mb-1">
                      ملاحظات التحقق (اختياري)
                    </label>
                    <Textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="أضف ملاحظات حول التحقق..."
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground block text-right mb-1">
                      سبب الرفض (مطلوب عند الرفض)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="أدخل سبب رفض المستند..."
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          {canVerify && (
            <>
              <Button
                variant="outline"
                onClick={() => handleVerifyClick('requires_review')}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <AlertTriangle className="w-4 h-4" />
                تحويل للمراجعة
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerifyClick('rejected')}
                disabled={actionLoading || !rejectionReason}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <X className="w-4 h-4" />
                رفض
              </Button>
              <Button
                onClick={() => handleVerifyClick('verified')}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                توثيق
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentReviewDialog;
