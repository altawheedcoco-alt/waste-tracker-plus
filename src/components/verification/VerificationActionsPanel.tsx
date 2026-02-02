import { Textarea } from '@/components/ui/textarea';

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
  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-right">إجراءات التحقق</h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground block text-right mb-1">
            ملاحظات التحقق (اختياري)
          </label>
          <Textarea
            value={verificationNotes}
            onChange={(e) => onVerificationNotesChange(e.target.value)}
            placeholder="أضف ملاحظات حول التحقق..."
            className="text-right"
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground block text-right mb-1">
            سبب الرفض (مطلوب عند الرفض)
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            placeholder="أدخل سبب رفض المستند..."
            className="text-right"
          />
        </div>
      </div>
    </div>
  );
};

export default VerificationActionsPanel;
