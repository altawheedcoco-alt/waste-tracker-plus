/**
 * CommandButton - زر ذكي مرتبط بنظام Command Registry
 * يتحقق تلقائياً من: الصلاحيات، التبعيات، منع التكرار، والآثار المتقاطعة
 * 
 * @example
 * <CommandButton
 *   commandId="cmd-weigh-shipment"
 *   resourceId={shipment.id}
 *   onExecute={async () => { await weighShipment(shipment.id) }}
 * >
 *   وزن الشحنة
 * </CommandButton>
 */
import { useState, useCallback, ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useCommandEngine } from '@/hooks/useCommandEngine';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Ban, Lock, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { DependencyCheckResult } from '@/types/commandTypes';

interface CommandButtonProps extends Omit<ButtonProps, 'onClick'> {
  commandId: string;
  resourceId: string;
  onExecute: () => Promise<void>;
  /** Custom label when already executed */
  executedLabel?: ReactNode;
  children: ReactNode;
}

const CommandButton = ({
  commandId,
  resourceId,
  onExecute,
  executedLabel,
  children,
  disabled,
  ...buttonProps
}: CommandButtonProps) => {
  const { organization } = useAuth();
  const orgType = organization?.organization_type || 'generator';
  const { executeCommand, checkDependencies, checkPermission, findCommand } = useCommandEngine({ orgType });

  const [isExecuting, setIsExecuting] = useState(false);
  const [depCheck, setDepCheck] = useState<DependencyCheckResult | null>(null);
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [bypassReason, setBypassReason] = useState('');

  const command = findCommand(commandId);
  const hasPermission = command ? checkPermission(command) : false;

  const handleClick = useCallback(async () => {
    if (isExecuting || !command) return;

    // فحص التبعيات أولاً
    const check = await checkDependencies(commandId, resourceId);
    setDepCheck(check);

    if (!check.canExecute) {
      if (check.bypassable) {
        setShowBypassDialog(true);
        return;
      }
      // التبعيات محجوبة ولا يمكن تجاوزها
      const msg = check.blockedBy[0]?.condition.blockMessageAr || 'لا يمكن تنفيذ هذا الإجراء';
      toast.error(msg);
      return;
    }

    await doExecute();
  }, [commandId, resourceId, isExecuting, command]);

  const doExecute = useCallback(async (bypass?: string) => {
    setIsExecuting(true);
    try {
      const result = await executeCommand(commandId, resourceId, onExecute, {
        bypassReason: bypass,
      });
      if (result.success) {
        toast.success('تم تنفيذ الإجراء بنجاح');
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التنفيذ');
    } finally {
      setIsExecuting(false);
      setShowBypassDialog(false);
      setBypassReason('');
    }
  }, [commandId, resourceId, onExecute, executeCommand]);

  // لا يوجد صلاحية
  if (command && !hasPermission) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button {...buttonProps} disabled className="opacity-40 gap-1">
              <Lock className="w-3 h-3" />
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">ليس لديك صلاحية تنفيذ هذا الإجراء</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        {...buttonProps}
        disabled={disabled || isExecuting}
        onClick={handleClick}
      >
        {isExecuting && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
        {children}
      </Button>

      {/* حوار التجاوز */}
      <Dialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
        <DialogContent className="rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              تجاوز شرط مسبق
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              هذا الإجراء يتطلب اكتمال خطوات سابقة لم تُنفذ بعد:
            </p>
            <ul className="space-y-1">
              {depCheck?.blockedBy.map((b, i) => (
                <li key={i} className="text-sm text-destructive flex items-center gap-2">
                  <Ban className="w-3 h-3" />
                  {b.condition.blockMessageAr}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium">يمكنك التجاوز مع ذكر السبب:</p>
            <Textarea
              value={bypassReason}
              onChange={e => setBypassReason(e.target.value)}
              placeholder="اذكر سبب التجاوز..."
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBypassDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={!bypassReason.trim() || isExecuting}
              onClick={() => doExecute(bypassReason.trim())}
            >
              {isExecuting && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
              تجاوز وتنفيذ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommandButton;
