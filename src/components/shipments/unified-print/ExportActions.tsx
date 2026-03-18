/**
 * Multi-format export action bar for shipment documents
 */
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Printer, Download, Eye, ChevronDown, Loader2, FileText } from 'lucide-react';
import SendToPartiesPopover from './SendToPartiesPopover';
import ManifestPDFButton from '../ManifestPDFButton';
import SignManifestButton from '../SignManifestButton';
import type { ShipmentPrintData } from './types';

interface ExportActionsProps {
  onPrint: () => void;
  onDownloadPDF: () => void;
  onPreviewA4: () => void;
  onExportWord?: () => void;
  isPDFExporting?: boolean;
  compact?: boolean;
  pdfFileName?: string;
  shipment?: ShipmentPrintData | null;
}

const ExportActions = ({
  onPrint, onDownloadPDF, onPreviewA4, onExportWord,
  isPDFExporting, compact, pdfFileName, shipment,
}: ExportActionsProps) => {

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
          </DropdownMenuContent>
        </DropdownMenu>
        {shipment && <SendToPartiesPopover shipment={shipment} compact />}
        {shipment && (
          <ManifestPDFButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} variant="outline" size="sm" />
        )}
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
      {shipment && <SendToPartiesPopover shipment={shipment} />}
      {shipment && (
        <ManifestPDFButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} variant="outline" />
      )}
      <Button variant="eco" onClick={onPrint} className="gap-2">
        <Printer className="w-4 h-4" />
        طباعة
      </Button>
    </div>
  );
};

export default ExportActions;
