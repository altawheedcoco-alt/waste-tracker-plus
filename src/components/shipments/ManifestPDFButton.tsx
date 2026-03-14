import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFService } from '@/services/documentService';

interface ManifestPDFButtonProps {
  shipmentId: string;
  shipmentNumber: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const ManifestPDFButton = ({
  shipmentId,
  shipmentNumber,
  variant = 'outline',
  size = 'sm',
  className = '',
}: ManifestPDFButtonProps) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-manifest-pdf', {
        body: { shipmentId },
      });

      if (error) throw error;
      if (!data?.html) throw new Error('No manifest data returned');

      // Create an offscreen iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '794px'; // A4 width in px at 96dpi
      iframe.style.height = '1123px'; // A4 height
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe');

      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use unified PDFService instead of direct jsPDF/html2canvas imports
      await PDFService.download(iframeDoc.body, {
        filename: `manifest-${shipmentNumber}`,
        orientation: 'portrait',
        format: 'a4',
        scale: 2,
        fitSinglePage: false,
      });

      document.body.removeChild(iframe);
      toast.success('تم تحميل المانيفست بنجاح');
    } catch (error: any) {
      console.error('Manifest generation error:', error);
      toast.error('فشل في توليد المانيفست');
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
        <FileText className="w-4 h-4" />
      )}
      {size !== 'icon' && (generating ? 'جاري التوليد...' : 'مانيفست PDF')}
    </Button>
  );
};

export default ManifestPDFButton;
