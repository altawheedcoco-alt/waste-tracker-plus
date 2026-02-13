import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import ShareDocumentDialog from './ShareDocumentDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareDocumentButtonProps {
  referenceId?: string;
  referenceType?: string;
  documentTitle?: string;
  preSelectedOrgId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

const ShareDocumentButton = ({
  referenceId,
  referenceType,
  documentTitle,
  preSelectedOrgId,
  variant = 'outline',
  size = 'sm',
  className = '',
  label,
}: ShareDocumentButtonProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const displayLabel = label ?? t('shareDoc.share');

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        {size !== 'icon' && displayLabel}
      </Button>

      <ShareDocumentDialog
        open={open}
        onOpenChange={setOpen}
        referenceId={referenceId}
        referenceType={referenceType}
        documentTitle={documentTitle}
        preSelectedOrgId={preSelectedOrgId}
      />
    </>
  );
};

export default ShareDocumentButton;
