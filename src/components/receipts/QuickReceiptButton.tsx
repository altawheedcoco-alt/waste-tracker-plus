import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck, Loader2, CheckCircle2 } from 'lucide-react';
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
  has_receipt?: boolean; // من البيانات المحملة مسبقاً
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
  // استخدام has_receipt من الـ props إذا كانت متوفرة
  const [hasReceipt, setHasReceipt] = useState(shipment.has_receipt ?? false);
  const [checkingReceipt, setCheckingReceipt] = useState(false);

  // تحديث الحالة عند تغيير has_receipt في الـ props
  useEffect(() => {
    if (shipment.has_receipt !== undefined) {
      setHasReceipt(shipment.has_receipt);
    }
  }, [shipment.has_receipt]);

  const checkExistingReceipt = async () => {
    // إذا كانت has_receipt معروفة من الـ props، لا حاجة للتحقق
    if (shipment.has_receipt !== undefined) {
      return shipment.has_receipt;
    }
    
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

  const handleOpenDialog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // إذا تم إصدار شهادة مسبقاً، لا تفتح الحوار
    if (hasReceipt) {
      return;
    }
    
    const exists = await checkExistingReceipt();
    if (!exists) {
      setOpen(true);
    }
  };

  // إذا تم إصدار شهادة، اعرض زر مختلف
  if (hasReceipt) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className="gap-1 text-blue-600 dark:text-blue-400 cursor-not-allowed"
        title="تم إصدار شهادة استلام لهذه الشحنة"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>تم إصدار شهادة استلام</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={checkingReceipt}
        className="gap-1"
        title="إصدار شهادة استلام للشحنة"
      >
        {checkingReceipt ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileCheck className="w-4 h-4 text-primary" />
        )}
        {size !== 'sm' && <span>استلام</span>}
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
