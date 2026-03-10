import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Hook that replaces window.confirm with a themed AlertDialog.
 * Returns [ConfirmDialog, confirm] — render ConfirmDialog once, call confirm() anywhere.
 * 
 * Usage:
 * const [ConfirmDialog, confirmAction] = useConfirmDialog();
 * ...
 * confirmAction({
 *   title: 'حذف العنصر',
 *   description: 'هل أنت متأكد؟ لا يمكن التراجع.',
 *   onConfirm: () => deleteMutation.mutate(id),
 *   variant: 'destructive',
 * });
 * ...
 * return <>{...}<ConfirmDialog /></>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default',
  });

  const confirm = useCallback(
    (opts: Omit<ConfirmState, 'open'>) => {
      setState({ ...opts, open: true });
    },
    []
  );

  const ConfirmDialog = useCallback(
    () => (
      <AlertDialog open={state.open} onOpenChange={(open) => setState((s) => ({ ...s, open }))}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                state.onConfirm();
                setState((s) => ({ ...s, open: false }));
              }}
              className={state.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [state]
  );

  return [ConfirmDialog, confirm] as const;
}
