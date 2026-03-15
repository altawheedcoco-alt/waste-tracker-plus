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

      // Use unified PDFService
      await PDFService.download(iframeDoc.body, {
        filename: `مستند-الشحنة-الكامل-${shipmentNumber}`,
        orientation: 'portrait',
        format: 'a4',
        scale: 2,
      });

      document.body.removeChild(iframe);
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
