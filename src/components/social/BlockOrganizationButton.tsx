import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Ban, ShieldCheck, ShieldOff } from 'lucide-react';
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAction}
          className={blocked
            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-full'
            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full'
          }
        >
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
        variant={blocked ? 'outline' : 'ghost'}
        size="sm"
        onClick={handleAction}
        className={blocked
          ? 'gap-2 rounded-full border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
          : 'gap-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5'
        }
      >
        {blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        <span className="text-xs font-medium">{blocked ? 'إلغاء الحظر' : 'حظر الجهة'}</span>
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
    <AlertDialogContent className="sm:max-w-md">
      <AlertDialogHeader className="space-y-3">
        <div className="mx-auto p-3 rounded-2xl bg-destructive/10 w-fit">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <AlertDialogTitle className="text-center">حظر {targetName || 'هذه الجهة'}؟</AlertDialogTitle>
        <AlertDialogDescription className="text-center leading-relaxed">
          بعد الحظر لن تتمكن من رؤية محتوى هذه الجهة أو التفاعل معها.
          <br />
          <span className="text-xs text-muted-foreground/70">يمكنك إلغاء الحظر في أي وقت من الإعدادات.</span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <Textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="سبب الحظر (اختياري)..."
        rows={2}
        className="rounded-xl resize-none"
      />
      <AlertDialogFooter className="gap-2 sm:gap-0">
        <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl gap-2">
          <Ban className="h-4 w-4" />
          تأكيد الحظر
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default BlockOrganizationButton;
