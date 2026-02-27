import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download, X, FileText, Loader2 } from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import AttestationDocumentPrint from './AttestationDocumentPrint';
import PrintThemeSelector from '@/components/print/PrintThemeSelector';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import type { AttestationData } from '@/hooks/useOrganizationAttestation';
import { useOrganizationAttestation } from '@/hooks/useOrganizationAttestation';

interface AttestationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass existing attestation to view, or null to request a new one */
  existingAttestation?: AttestationData | null;
}

const AttestationDialog = ({ open, onOpenChange, existingAttestation }: AttestationDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [attestation, setAttestation] = useState<AttestationData | null>(existingAttestation || null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { loading, requestAttestation } = useOrganizationAttestation();
  const { exportToPDF, printWithTheme, generatePDF, isExporting } = usePDFExport({
    filename: `attestation-${attestation?.attestation_number || 'new'}`,
    orientation: 'portrait',
    format: 'a4',
  });

  // Generate PDF file for sharing when attestation is ready
  useEffect(() => {
    const genPdf = async () => {
      if (attestation && printRef.current) {
        // Wait for render
        await new Promise(r => setTimeout(r, 500));
        try {
          const pdf = await generatePDF(printRef.current);
          if (pdf) {
            const blob = pdf.output('blob');
            const file = new File([blob], `إفادة-${attestation.organization_name}-${attestation.attestation_number}.pdf`, {
              type: 'application/pdf',
            });
            setPdfFile(file);
          }
        } catch (e) {
          console.warn('Failed to pre-generate PDF for sharing:', e);
        }
      }
    };
    genPdf();
  }, [attestation]);

  const handleRequest = async () => {
    const result = await requestAttestation();
    if (result) setAttestation(result);
  };

  const handleDownload = () => {
    if (printRef.current && attestation) {
      exportToPDF(printRef.current, `إفادة-${attestation.organization_name}-${attestation.attestation_number}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              إفادة تسجيل واعتماد رقمي
            </DialogTitle>
            <div className="flex items-center gap-2">
              {attestation && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setThemeOpen(true)} disabled={isExporting}>
                    <Printer className="ml-2 h-4 w-4" />
                    طباعة
                  </Button>
                  <Button variant="default" size="sm" onClick={handleDownload} disabled={isExporting}>
                    <Download className="ml-2 h-4 w-4" />
                    تحميل PDF
                  </Button>
                  <ShareDocumentButton
                    referenceId={attestation.id}
                    referenceType="contract"
                    documentTitle={`إفادة تسجيل - ${attestation.organization_name}`}
                    size="sm"
                    autoFile={pdfFile}
                  />
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {attestation ? (
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <AttestationDocumentPrint ref={printRef} attestation={attestation} />
          </ScrollArea>
        ) : (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">طلب إفادة تسجيل واعتماد رقمي</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                بطلبك لهذه الإفادة فإنك تُقر بالتزامك الكامل بقوانين البيئة المصرية وشروط وأحكام المنصة، وسيتم إرفاق ختمك وتوقيعك الرقمي وباركود وQR Code خاص بمنظمتك على الوثيقة.
              </p>
            </div>
            <Button onClick={handleRequest} disabled={loading} size="lg" className="min-w-48">
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإصدار...
                </>
              ) : (
                <>
                  <FileText className="ml-2 h-4 w-4" />
                  إصدار الإفادة الآن
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚖️ بالضغط على "إصدار الإفادة" فإنك تُقر بالتزامك بجميع القوانين البيئية السارية
            </p>
          </div>
        )}
      </DialogContent>

      {attestation && (
        <PrintThemeSelector
          open={themeOpen}
          onOpenChange={setThemeOpen}
          onSelect={(themeId) => printWithTheme(printRef.current, themeId)}
        />
      )}
    </Dialog>
  );
};

export default AttestationDialog;
