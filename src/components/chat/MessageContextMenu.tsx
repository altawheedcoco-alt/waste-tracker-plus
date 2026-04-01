import { useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Reply, Forward, Trash2, Pin, Star, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onStar?: () => void;
  isMine: boolean;
}

const MessageContextMenu = memo(({ 
  isOpen, onClose, onReply, onForward, onCopy, onDelete, onEdit, onPin, onStar, isMine 
}: MessageContextMenuProps) => {
  const actions = [
    { icon: Reply, label: 'رد', onClick: onReply },
    { icon: Copy, label: 'نسخ', onClick: onCopy },
    { icon: Forward, label: 'توجيه', onClick: onForward },
    ...(isMine && onEdit ? [{ icon: Pencil, label: 'تعديل', onClick: onEdit }] : []),
    ...(onPin ? [{ icon: Pin, label: 'تثبيت', onClick: onPin }] : []),
    ...(onStar ? [{ icon: Star, label: 'تمييز', onClick: onStar }] : []),
    ...(isMine && onDelete ? [{ icon: Trash2, label: 'حذف', onClick: onDelete, destructive: true }] : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={cn(
              "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "bg-card border border-border rounded-2xl shadow-xl overflow-hidden",
              "min-w-[200px]"
            )}
          >
            <div className="p-1">
              {actions.map((action, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors",
                    "hover:bg-muted/80 active:bg-muted",
                    (action as any).destructive && "text-destructive hover:bg-destructive/10"
                  )}
                >
                  <action.icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

MessageContextMenu.displayName = 'MessageContextMenu';
export default MessageContextMenu;

/**
 * Hook for long-press detection
 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isLongPress,
  };
}
