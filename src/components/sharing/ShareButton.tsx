import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import ShareDialog from './ShareDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareButtonProps {
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const ShareButton = ({
  resourceType,
  resourceId,
  resourceTitle,
  variant = 'outline',
  size = 'sm',
  className = '',
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        {size !== 'icon' && t('share.smartShare')}
      </Button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        resourceType={resourceType}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
      />
    </>
  );
};

export default ShareButton;
