import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileArchive, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFService } from '@/services/documentService';

interface CompleteShipmentDocButtonProps {
  shipmentId: string;
  shipmentNumber: string;
  shipmentStatus: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/** Statuses that indicate the shipment is fully completed by all parties */
const COMPLETED_STATUSES = ['confirmed', 'completed'];

const CompleteShipmentDocButton = ({
  shipmentId,
  shipmentNumber,
  shipmentStatus,
  variant = 'outline',
  size = 'sm',
  className = '',
}: CompleteShipmentDocButtonProps) => {
  const [generating, setGenerating] = useState(false);

  // Only show when shipment is fully completed
  if (!COMPLETED_STATUSES.includes(shipmentStatus)) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-complete-shipment-doc', {
        body: { shipmentId },
      });

      if (error) throw error;
      if (!data?.html) throw new Error('No document data returned');

      // Dynamic imports for code splitting
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;

      // Render HTML in offscreen iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '794px';
      iframe.style.height = '10000px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe');

      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture each .page as a separate PDF page
      const pages = iframeDoc.querySelectorAll('.page');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const captureOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
      };

      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          const canvas = await html2canvas(pageEl, {
            ...captureOptions,
            height: pageEl.scrollHeight > 1123 ? 1123 : pageEl.scrollHeight,
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.92);

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        }
      } else {
        // Fallback: single capture
        const canvas = await html2canvas(iframeDoc.body, captureOptions);
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      document.body.removeChild(iframe);
      pdf.save(`مستند-الشحنة-الكامل-${shipmentNumber}.pdf`);
      toast.success('تم تحميل مستند الشحنة الكامل بنجاح');
    } catch (error: any) {
      console.error('Complete doc generation error:', error);
      toast.error('فشل في توليد مستند الشحنة الكامل');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleGenerate}
      disabled={generating}
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileArchive className="w-4 h-4" />
      )}
      {size !== 'icon' && (generating ? 'جاري التوليد...' : 'مستند الشحنة الكامل')}
    </Button>
  );
};

export default CompleteShipmentDocButton;
