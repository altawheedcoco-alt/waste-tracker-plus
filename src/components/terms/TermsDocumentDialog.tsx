import { useRef, useState, useEffect } from 'react';
import { useKeyboardShortcutContext } from '@/contexts/KeyboardShortcutContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download, X } from 'lucide-react';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import { useDocumentService } from '@/hooks/useDocumentService';
import TermsDocumentPrint from './TermsDocumentPrint';
import PrintThemeSelector from '@/components/print/PrintThemeSelector';
import { type PrintThemeId } from '@/lib/printThemes';

interface TermsAcceptanceData {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  organization_type: string;
  organization_logo_url?: string | null;
  terms_version: string;
  accepted_at: string;
  ip_address: string | null;
  signer_national_id?: string | null;
  signer_phone?: string | null;
  signer_position?: string | null;
  signer_id_front_url?: string | null;
  signer_id_back_url?: string | null;
  signer_signature_url?: string | null;
  verified_match?: boolean;
}

interface TermsDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acceptance: TermsAcceptanceData | null;
  showSignature?: boolean; // Only true for admin view
}

const TermsDocumentDialog = ({ open, onOpenChange, acceptance, showSignature = false }: TermsDocumentDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const { exportToPDF, printWithTheme, isExporting } = useDocumentService({
    filename: `terms-acceptance-${acceptance?.id?.slice(0, 8) || 'document'}`,
    orientation: 'portrait',
    format: 'a4',
  });

  // Register print/PDF handlers with global keyboard context
  let kbCtx: ReturnType<typeof useKeyboardShortcutContext> | null = null;
  try { kbCtx = useKeyboardShortcutContext(); } catch { /* not wrapped */ }

  const handleDownload = () => {
    if (printRef.current && acceptance) {
      exportToPDF(printRef.current, `موافقة-الشروط-${acceptance.organization_name || acceptance.id.slice(0, 8)}`);
    }
  };

  const handlePrint = () => {
    setThemeOpen(true);
  };

  useEffect(() => {
    if (!kbCtx) return;
    if (open) {
      kbCtx.registerPrintHandler(handlePrint);
      kbCtx.registerPdfHandler(handleDownload);
    }
    return () => {
      if (kbCtx) {
        kbCtx.registerPrintHandler(null);
        kbCtx.registerPdfHandler(null);
      }
    };
  }, [open]);

  if (!acceptance) return null;

  const handlePrint = () => {
    setThemeOpen(true);
  };

  const handleDownload = () => {
    if (printRef.current) {
      exportToPDF(printRef.current, `موافقة-الشروط-${acceptance.organization_name || acceptance.id.slice(0, 8)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right">
              وثيقة الموافقة على الشروط والأحكام
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isExporting}
              >
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={isExporting}
              >
                <Download className="ml-2 h-4 w-4" />
                تحميل PDF
              </Button>
              <ShareDocumentButton
                referenceId={acceptance.id}
                referenceType="contract"
                documentTitle={`وثيقة الشروط والأحكام - ${acceptance.organization_name || ''}`}
                size="sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <TermsDocumentPrint ref={printRef} acceptance={acceptance} showSignature={showSignature} />
        </ScrollArea>
      </DialogContent>

      <PrintThemeSelector
        open={themeOpen}
        onOpenChange={setThemeOpen}
        onSelect={(themeId) => printWithTheme(printRef.current, themeId)}
      />
    </Dialog>
  );
};

export default TermsDocumentDialog;
