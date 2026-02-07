import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReceiptFlowDialog from './ReceiptFlowDialog';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  generator_id: string;
  generator: { name: string; id?: string } | null;
  recycler?: { name: string; id?: string } | null;
  driver_id: string | null;
  driver?: { profile: { full_name: string } | null } | null;
  created_at: string;
  delivery_address?: string;
}

interface QuickReceiptButtonProps {
  shipment: Shipment;
  onSuccess?: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
}

const QuickReceiptButton = ({ 
  shipment, 
  onSuccess,
  variant = 'ghost',
  size = 'sm'
}: QuickReceiptButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [checkingReceipt, setCheckingReceipt] = useState(false);

  const checkExistingReceipt = async () => {
    setCheckingReceipt(true);
    try {
      const { data } = await supabase
        .from('shipment_receipts')
        .select('id')
        .eq('shipment_id', shipment.id)
        .maybeSingle();
      
      setHasReceipt(!!data);
      return !!data;
    } catch (error) {
      console.error('Error checking receipt:', error);
      return false;
    } finally {
      setCheckingReceipt(false);
    }
  };

  const handleOpenDialog = async () => {
    const exists = await checkExistingReceipt();
    if (!exists) {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={checkingReceipt || hasReceipt}
        className="gap-1"
        title={hasReceipt ? 'تم إصدار شهادة مسبقاً' : 'استلام الشحنة'}
      >
        {checkingReceipt ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileCheck className="w-4 h-4 text-primary" />
        )}
        {size !== 'sm' && <span>{hasReceipt ? 'تم الاستلام' : 'استلام'}</span>}
      </Button>

      <ReceiptFlowDialog
        open={open}
        onOpenChange={setOpen}
        shipment={shipment}
        onSuccess={() => {
          setHasReceipt(true);
          onSuccess?.();
        }}
      />
    </>
  );
};

export default QuickReceiptButton;
