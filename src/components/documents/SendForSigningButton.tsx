import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSignature } from 'lucide-react';
import MentionToSignDialog from './MentionToSignDialog';

interface SendForSigningButtonProps {
  documentTitle?: string;
  documentType?: string;
  documentUrl?: string;
  documentId?: string;
  relatedShipmentId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

const SendForSigningButton = ({
  documentTitle,
  documentType,
  documentUrl,
  documentId,
  relatedShipmentId,
  variant = 'outline',
  size = 'sm',
  className = '',
  label = 'إرسال للتوقيع',
}: SendForSigningButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => setOpen(true)}
      >
        <FileSignature className="w-4 h-4" />
        {size !== 'icon' && label}
      </Button>

      <MentionToSignDialog
        open={open}
        onOpenChange={setOpen}
        documentTitle={documentTitle}
        documentType={documentType}
        documentUrl={documentUrl}
        documentId={documentId}
        relatedShipmentId={relatedShipmentId}
      />
    </>
  );
};

export default SendForSigningButton;
