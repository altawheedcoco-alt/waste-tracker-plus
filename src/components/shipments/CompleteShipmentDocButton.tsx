import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileArchive, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

      // Render HTML in offscreen iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '794px';
      iframe.style.height = '1123px';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe');

      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 800));

      // Capture all pages
      const pages = iframeDoc.querySelectorAll('.page');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794,
          });
          const imgData = canvas.toDataURL('image/png');
          const imgHeight = (canvas.height * pageWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
        }
      } else {
        // Fallback: single capture
        const canvas = await html2canvas(iframeDoc.body, {
          scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
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
