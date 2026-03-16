import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileArchive, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import UnifiedDocumentPreview from '@/components/shared/UnifiedDocumentPreview';

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
  const [docHTML, setDocHTML] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

      setDocHTML(data.html);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Complete doc generation error:', error);
      toast.error('فشل في توليد مستند الشحنة الكامل');
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
          <FileArchive className="w-4 h-4" />
        )}
        {size !== 'icon' && (generating ? 'جاري التوليد...' : 'مستند الشحنة الكامل')}
      </Button>

      <UnifiedDocumentPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`مستند الشحنة الكامل ${shipmentNumber}`}
        filename={`مستند-الشحنة-الكامل-${shipmentNumber}`}
        htmlContent={docHTML || ''}
      />
    </>
  );
};

export default CompleteShipmentDocButton;
