/**
 * UnifiedShipmentPrint — Single component replacing ShipmentPrintView, ShipmentQuickPrint, EnhancedShipmentPrintView
 * 
 * Supports 3 modes:
 * - 'dialog': Pass shipment data directly (replaces ShipmentPrintView)
 * - 'quick': Pass shipmentId to auto-fetch (replaces ShipmentQuickPrint)
 * - 'enhanced': Full tabs with stamp config (replaces EnhancedShipmentPrintView)
 */
import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Download, Eye, Palette } from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import PrintThemeSelector from '../PrintThemeSelector';
import { getThemeById } from '../printThemes';
import ShipmentA4Document from './ShipmentA4Document';
import A4PreviewModal from './A4PreviewModal';
import ExportActions from './ExportActions';
import { useShipmentPrintData } from './useShipmentPrintData';
import type { ShipmentPrintData, PrintMode } from './types';

interface UnifiedShipmentPrintProps {
  isOpen: boolean;
  onClose: () => void;
  /** Direct shipment data (dialog/enhanced mode) */
  shipment?: ShipmentPrintData | null;
  /** Shipment ID or number for auto-fetch (quick mode) */
  shipmentId?: string;
  /** Auto-trigger action when data loads */
  autoAction?: 'print' | 'pdf' | null;
  /** UI mode */
  mode?: PrintMode;
}

const UnifiedShipmentPrint = ({
  isOpen, onClose, shipment: rawShipment, shipmentId,
  autoAction, mode = 'dialog',
}: UnifiedShipmentPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [themeId, setThemeId] = useState('eco-green');
  const [showA4Preview, setShowA4Preview] = useState(false);
  const theme = getThemeById(themeId);

  const {
    shipment, loading, logs, supervisors, declaration,
    qrData, driverName, vehiclePlate, documentSerial,
    verificationCode, pdfFileName,
  } = useShipmentPrintData({
    shipmentData: rawShipment,
    shipmentId,
    isOpen,
  });

  const { printContent: printContentFn, printWithTheme, exportToPDF, isExporting } = usePDFExport({
    filename: pdfFileName,
    orientation: 'portrait',
    format: 'a4',
    fitSinglePage: true,
  });

  // Auto-action
  const autoActionDone = useRef(false);
  useEffect(() => {
    if (!autoAction || !shipment || loading || autoActionDone.current) return;
    const timer = setTimeout(() => {
      if (!printRef.current) return;
      autoActionDone.current = true;
      if (autoAction === 'print') {
        printWithTheme(printRef.current, themeId as any);
      } else if (autoAction === 'pdf') {
        exportToPDF(printRef.current, pdfFileName);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [autoAction, shipment, loading]);

  useEffect(() => {
    if (!isOpen) autoActionDone.current = false;
  }, [isOpen]);

  const handlePrint = () => {
    if (printRef.current) printWithTheme(printRef.current, themeId as any);
  };

  const handleDownloadPDF = () => {
    if (printRef.current) exportToPDF(printRef.current, pdfFileName);
  };

  const handleShareWhatsApp = () => {
    const text = `📄 نموذج تتبع نقل المخلفات\n📦 شحنة: ${shipment?.shipment_number}\n🏢 ${shipment?.generator?.name || ''} ← ${shipment?.recycler?.name || ''}\n🔗 ${window.location.origin}/verify?type=shipment&code=${shipment?.shipment_number}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading || !shipment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3">جاري تحميل بيانات الشحنة...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen && !showA4Preview} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between flex-wrap">
              <div className="flex items-center gap-2">
                <PrintThemeSelector selectedThemeId={themeId} onSelect={setThemeId} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">نموذج تتبع الشحنة</span>
                <Printer className="w-5 h-5" />
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Document Preview */}
          <ShipmentA4Document
            ref={printRef}
            shipment={shipment}
            theme={theme}
            qrData={qrData}
            driverName={driverName}
            vehiclePlate={vehiclePlate}
            documentSerial={documentSerial}
            verificationCode={verificationCode}
            supervisors={supervisors}
            declaration={declaration}
            compact={true}
          />

          <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
            <ExportActions
              compact
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
              onPreviewA4={() => setShowA4Preview(true)}
              onShareWhatsApp={handleShareWhatsApp}
              isPDFExporting={isExporting}
              pdfFileName={pdfFileName}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full A4 Preview */}
      <A4PreviewModal
        isOpen={showA4Preview}
        onClose={() => setShowA4Preview(false)}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onShareWhatsApp={handleShareWhatsApp}
        isPDFExporting={isExporting}
        title={`نموذج تتبع - ${shipment.shipment_number}`}
      >
        <ShipmentA4Document
          shipment={shipment}
          theme={theme}
          qrData={qrData}
          driverName={driverName}
          vehiclePlate={vehiclePlate}
          documentSerial={documentSerial}
          verificationCode={verificationCode}
          supervisors={supervisors}
          declaration={declaration}
          compact={false}
        />
      </A4PreviewModal>
    </>
  );
};

export default UnifiedShipmentPrint;
