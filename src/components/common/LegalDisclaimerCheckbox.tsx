import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalDisclaimerCheckboxProps {
  /** Called when the user checks/unchecks */
  onAcceptChange: (accepted: boolean) => void;
  /** Custom signer name to display */
  signerName?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Mandatory legal acknowledgment checkbox for document issuance.
 * Must be checked before any document/certificate can be generated.
 */
const LegalDisclaimerCheckbox = ({
  onAcceptChange,
  signerName,
  compact = false,
  className,
}: LegalDisclaimerCheckboxProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleChange = (checked: boolean) => {
    setAccepted(checked);
    onAcceptChange(checked);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-colors',
        accepted
          ? 'border-primary/30 bg-primary/5'
          : 'border-destructive/30 bg-destructive/5',
        compact ? 'p-3' : 'p-4',
        className
      )}
      dir="rtl"
    >
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive">إقرار قانوني إلزامي</span>
        </div>
      )}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <Checkbox
          checked={accepted}
          onCheckedChange={(checked) => handleChange(!!checked)}
          className="mt-0.5"
        />
        <span className={cn('leading-relaxed text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
          أقر أنا {signerName ? `(${signerName})` : '(المستخدم/الممثل القانوني للمنشأة)'} بصحة
          ودقة واكتمال جميع البيانات الواردة، وأتحمل المسؤولية القانونية الكاملة — المدنية
          والجنائية — عن أي خطأ أو تضليل أو تزوير في هذه البيانات، دون أدنى مسؤولية على إدارة
          منصة iRecycle بصفتها جهة وسيطة تقنية.
        </span>
      </label>
    </div>
  );
};

export default LegalDisclaimerCheckbox;
