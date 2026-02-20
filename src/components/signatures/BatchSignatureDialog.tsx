import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PenTool, CheckCircle2, XCircle, Loader2, FileStack } from 'lucide-react';
import UniversalSignatureDialog from './UniversalSignatureDialog';
import { saveDocumentSignature } from './signatureService';
import type { SignatureData } from './UniversalSignatureDialog';
import { toast } from 'sonner';

export interface BatchDocument {
  id: string;
  documentType: 'shipment' | 'contract' | 'invoice' | 'certificate' | 'award_letter' | 'other';
  title: string;
  subtitle?: string;
}

interface BatchSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: BatchDocument[];
  organizationId: string;
  userId: string;
  organizationStampUrl?: string;
  signerDefaults?: { name?: string; title?: string; nationalId?: string };
  onComplete?: (results: { success: number; failed: number }) => void;
}

type DocStatus = 'pending' | 'signing' | 'done' | 'failed';

const BatchSignatureDialog = ({
  open,
  onOpenChange,
  documents,
  organizationId,
  userId,
  organizationStampUrl,
  signerDefaults,
  onComplete,
}: BatchSignatureDialogProps) => {
  const [step, setStep] = useState<'preview' | 'sign' | 'progress' | 'complete'>('preview');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });

  const total = documents.length;
  const progress = total > 0 ? ((results.success + results.failed) / total) * 100 : 0;

  const handleStartSign = () => {
    setStep('sign');
    setSignDialogOpen(true);
  };

  const handleSign = async (signatureData: SignatureData) => {
    setSignDialogOpen(false);
    setStep('progress');

    const initialStatuses: Record<string, DocStatus> = {};
    documents.forEach(d => { initialStatuses[d.id] = 'pending'; });
    setStatuses(initialStatuses);
    setResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      setCurrentIdx(i);
      setStatuses(prev => ({ ...prev, [doc.id]: 'signing' }));

      try {
        const result = await saveDocumentSignature({
          signatureData,
          documentType: doc.documentType,
          documentId: doc.id,
          organizationId,
          userId,
        });

        if (result.success) {
          successCount++;
          setStatuses(prev => ({ ...prev, [doc.id]: 'done' }));
        } else {
          failedCount++;
          setStatuses(prev => ({ ...prev, [doc.id]: 'failed' }));
        }
      } catch {
        failedCount++;
        setStatuses(prev => ({ ...prev, [doc.id]: 'failed' }));
      }

      setResults({ success: successCount, failed: failedCount });
    }

    setStep('complete');
    if (successCount > 0) {
      toast.success(`تم توقيع ${successCount} مستند بنجاح`);
    }
    if (failedCount > 0) {
      toast.error(`فشل توقيع ${failedCount} مستند`);
    }
    onComplete?.({ success: successCount, failed: failedCount });
  };

  const handleClose = () => {
    setStep('preview');
    setStatuses({});
    setResults({ success: 0, failed: 0 });
    setCurrentIdx(0);
    onOpenChange(false);
  };

  const statusIcon = (s: DocStatus) => {
    switch (s) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'signing': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <>
      <Dialog open={open && step !== 'sign'} onOpenChange={step === 'progress' ? undefined : handleClose}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="w-5 h-5 text-primary" />
              توقيع جماعي — {total} مستند
            </DialogTitle>
          </DialogHeader>

          {step === 'preview' && (
            <>
              <p className="text-sm text-muted-foreground">
                سيتم تطبيق توقيعك وختمك على جميع المستندات التالية دفعة واحدة:
              </p>
              <ScrollArea className="max-h-60 border rounded-lg">
                <div className="p-2 space-y-1">
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm">
                      <span className="text-muted-foreground w-6 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        {doc.subtitle && <p className="text-xs text-muted-foreground truncate">{doc.subtitle}</p>}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {doc.documentType === 'shipment' ? 'شحنة' : doc.documentType === 'invoice' ? 'فاتورة' : doc.documentType === 'contract' ? 'عقد' : 'مستند'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose}>إلغاء</Button>
                <Button onClick={handleStartSign} className="gap-2">
                  <PenTool className="w-4 h-4" />
                  متابعة للتوقيع
                </Button>
              </DialogFooter>
            </>
          )}

          {(step === 'progress' || step === 'complete') && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{step === 'complete' ? 'اكتمل' : `جاري التوقيع... (${currentIdx + 1}/${total})`}</span>
                  <span className="font-mono text-xs">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />

                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {results.success} نجح
                  </span>
                  {results.failed > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="w-3.5 h-3.5" /> {results.failed} فشل
                    </span>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-1.5 text-sm">
                      {statusIcon(statuses[doc.id] || 'pending')}
                      <span className="truncate flex-1">{doc.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {step === 'complete' && (
                <DialogFooter>
                  <Button onClick={handleClose}>إغلاق</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <UniversalSignatureDialog
        open={signDialogOpen}
        onOpenChange={(v) => { if (!v) { setSignDialogOpen(false); setStep('preview'); } }}
        onSign={handleSign}
        documentType={documents[0]?.documentType || 'other'}
        documentId="batch"
        documentTitle={`توقيع جماعي — ${total} مستند`}
        organizationId={organizationId}
        organizationStampUrl={organizationStampUrl}
        signerDefaults={signerDefaults}
      />
    </>
  );
};

export default BatchSignatureDialog;
