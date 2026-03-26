import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Forward, Copy, Trash2, Star, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface ChatBottomSheetProps {
  open: boolean;
  onClose: () => void;
  isOwn: boolean;
  messageContent: string;
  isPinned?: boolean;
  onReply?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onPin?: () => void;
  onReact?: (emoji: string) => void;
}

const ChatBottomSheet = ({
  open,
  onClose,
  isOwn,
  messageContent,
  isPinned,
  onReply,
  onForward,
  onCopy,
  onDelete,
  onStar,
  onPin,
  onReact,
}: ChatBottomSheetProps) => {
  const actions = [
    onReply && { icon: Reply, label: 'رد', onClick: onReply },
    onForward && { icon: Forward, label: 'إعادة توجيه', onClick: onForward },
    onCopy && { icon: Copy, label: 'نسخ', onClick: onCopy },
    onPin && { icon: Pin, label: isPinned ? 'إلغاء التثبيت' : 'تثبيت', onClick: onPin },
    onStar && { icon: Star, label: 'تمييز بنجمة', onClick: onStar },
    isOwn && onDelete && { icon: Trash2, label: 'حذف', onClick: onDelete, destructive: true },
  ].filter(Boolean) as { icon: any; label: string; onClick: () => void; destructive?: boolean }[];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background rounded-t-2xl shadow-2xl max-h-[60vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Quick Reactions */}
            {onReact && (
              <div className="flex items-center justify-center gap-2 px-4 pb-3 border-b border-border/30">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(emoji); onClose(); }}
                    className="w-11 h-11 flex items-center justify-center hover:bg-muted rounded-full transition-all text-2xl hover:scale-125 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="py-2 px-1">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.onClick(); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg active:bg-muted/80",
                    action.destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatBottomSheet;
