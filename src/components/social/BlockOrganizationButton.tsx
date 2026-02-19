import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Ban, ShieldCheck } from 'lucide-react';
import { useOrganizationBlocks } from '@/hooks/useSocialInteractions';

interface BlockOrganizationButtonProps {
  targetOrgId: string;
  targetOrgName?: string;
  variant?: 'button' | 'icon' | 'menu-item';
}

const BlockOrganizationButton = memo(({ targetOrgId, targetOrgName, variant = 'button' }: BlockOrganizationButtonProps) => {
  const { isBlocked, blockOrg, unblockOrg } = useOrganizationBlocks();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const blocked = isBlocked(targetOrgId);

  const handleAction = () => {
    if (blocked) {
      unblockOrg(targetOrgId);
    } else {
      setShowConfirm(true);
    }
  };

  const confirmBlock = () => {
    blockOrg({ targetOrgId, reason: reason.trim() || undefined });
    setShowConfirm(false);
    setReason('');
  };

  if (variant === 'icon') {
    return (
      <>
        <Button variant="ghost" size="icon" onClick={handleAction} className={blocked ? 'text-destructive' : 'text-muted-foreground'}>
          {blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        </Button>
        <BlockConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          targetName={targetOrgName}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={confirmBlock}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={blocked ? 'outline' : 'destructive'}
        size="sm"
        onClick={handleAction}
        className="gap-1.5"
      >
        {blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        {blocked ? 'إلغاء الحظر' : 'حظر الجهة'}
      </Button>
      <BlockConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        targetName={targetOrgName}
        reason={reason}
        onReasonChange={setReason}
        onConfirm={confirmBlock}
      />
    </>
  );
});

BlockOrganizationButton.displayName = 'BlockOrganizationButton';

const BlockConfirmDialog = ({ open, onOpenChange, targetName, reason, onReasonChange, onConfirm }: any) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>حظر {targetName || 'هذه الجهة'}؟</AlertDialogTitle>
        <AlertDialogDescription>
          لن تتمكن من رؤية محتوى هذه الجهة أو التفاعل معها. يمكنك إلغاء الحظر لاحقاً.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <Textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="سبب الحظر (اختياري)"
        rows={2}
      />
      <AlertDialogFooter>
        <AlertDialogCancel>إلغاء</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          تأكيد الحظر
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default BlockOrganizationButton;
