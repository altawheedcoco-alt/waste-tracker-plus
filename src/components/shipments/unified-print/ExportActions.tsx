/**
 * Multi-format export action bar for shipment documents
 */
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Printer, Download, Share2, Eye, ChevronDown, Loader2, FileText, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportActionsProps {
  onPrint: () => void;
  onDownloadPDF: () => void;
  onPreviewA4: () => void;
  onShareWhatsApp?: () => void;
  onExportWord?: () => void;
  isPDFExporting?: boolean;
  compact?: boolean;
  pdfFileName?: string;
}

const ExportActions = ({
  onPrint, onDownloadPDF, onPreviewA4, onShareWhatsApp, onExportWord,
  isPDFExporting, compact, pdfFileName,
}: ExportActionsProps) => {
  const handleWhatsApp = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
    } else {
      // Default: share via WhatsApp Web with document info
      const text = `📄 مستند الشحنة: ${pdfFileName || 'نموذج تتبع'}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onPreviewA4} className="gap-1.5 h-8">
          <Eye className="w-3.5 h-3.5" />
          معاينة
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled={isPDFExporting}>
              {isPDFExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              تصدير
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" /> تنزيل PDF
            </DropdownMenuItem>
            {onExportWord && (
              <DropdownMenuItem onClick={onExportWord} className="gap-2">
                <FileText className="w-4 h-4" /> تنزيل Word
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleWhatsApp} className="gap-2">
              <MessageCircle className="w-4 h-4" /> مشاركة واتساب
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="eco" size="sm" onClick={onPrint} className="gap-1.5 h-8">
          <Printer className="w-3.5 h-3.5" />
          طباعة
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" onClick={onPreviewA4} className="gap-2">
        <Eye className="w-4 h-4" />
        معاينة A4
      </Button>
      <Button variant="outline" onClick={onDownloadPDF} disabled={isPDFExporting} className="gap-2">
        {isPDFExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        تنزيل PDF
      </Button>
      {onExportWord && (
        <Button variant="outline" onClick={onExportWord} className="gap-2">
          <FileText className="w-4 h-4" />
          تنزيل Word
        </Button>
      )}
      <Button variant="outline" onClick={handleWhatsApp} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        واتساب
      </Button>
      <Button variant="eco" onClick={onPrint} className="gap-2">
        <Printer className="w-4 h-4" />
        طباعة
      </Button>
    </div>
  );
};

export default ExportActions;
