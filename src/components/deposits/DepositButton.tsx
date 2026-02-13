import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Banknote, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddDepositDialog from './AddDepositDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface DepositButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  preselectedPartnerId?: string;
  preselectedPartnerType?: 'organization' | 'external';
  onSuccess?: () => void;
}

export default function DepositButton({
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  showLabel = true,
  preselectedPartnerId,
  preselectedPartnerType,
  onSuccess,
}: DepositButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn('gap-2', className)}
      >
        {showIcon && <Banknote className="h-4 w-4" />}
        {showLabel && <span>{t('deposits.registerDeposit')}</span>}
      </Button>

      <AddDepositDialog
        open={open}
        onOpenChange={setOpen}
        preselectedPartnerId={preselectedPartnerId}
        preselectedPartnerType={preselectedPartnerType}
        onSuccess={onSuccess}
      />
    </>
  );
}
