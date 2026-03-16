import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import UnifiedDocumentPreview from '@/components/shared/UnifiedDocumentPreview';

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
  const [manifestHTML, setManifestHTML] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-manifest-pdf', {
        body: { shipmentId },
      });

      if (error) throw error;
      if (!data?.html) throw new Error('No manifest data returned');

      setManifestHTML(data.html);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Manifest generation error:', error);
      toast.error('فشل في توليد المانيفست');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
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

      <UnifiedDocumentPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`مانيفست الشحنة ${shipmentNumber}`}
        filename={`manifest-${shipmentNumber}`}
        htmlContent={manifestHTML || ''}
      />
    </>
  );
};

export default ManifestPDFButton;
