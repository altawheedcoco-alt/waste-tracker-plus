import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface VerificationActionsPanelProps {
  verificationNotes: string;
  rejectionReason: string;
  onVerificationNotesChange: (value: string) => void;
  onRejectionReasonChange: (value: string) => void;
}

const VerificationActionsPanel = ({
  verificationNotes,
  rejectionReason,
  onVerificationNotesChange,
  onRejectionReasonChange,
}: VerificationActionsPanelProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-right">{t('verification.verificationActions')}</h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground block text-right mb-1">
            {t('verification.verificationNotes')}
          </label>
          <Textarea
            value={verificationNotes}
            onChange={(e) => onVerificationNotesChange(e.target.value)}
            placeholder={t('verification.addVerificationNotes')}
            className="text-right"
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground block text-right mb-1">
            {t('verification.rejectionReason')}
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            placeholder={t('verification.enterRejectionReason')}
            className="text-right"
          />
        </div>
      </div>
    </div>
  );
};

export default VerificationActionsPanel;
