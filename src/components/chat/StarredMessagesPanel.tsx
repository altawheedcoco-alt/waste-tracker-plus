import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { StarredMessage } from '@/hooks/useStarredMessages';

interface StarredMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  starredMessages: StarredMessage[];
  onScrollToMessage: (msgId: string) => void;
  onUnstar: (msgId: string) => void;
}

const StarredMessagesPanel = memo(({
  isOpen, onClose, starredMessages, onScrollToMessage, onUnstar
}: StarredMessagesPanelProps) => {
  const formatTime = (t: string) => {
    const d = new Date(t);
    if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
    if (isYesterday(d)) return 'أمس ' + format(d, 'hh:mm a', { locale: ar });
    return format(d, 'd/M/yyyy hh:mm a', { locale: ar });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-0 z-30 bg-card flex flex-col"
        >
          {/* Header */}
          <div className="h-14 px-3 flex items-center gap-3 border-b border-border bg-card shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">الرسائل المميزة</h3>
            <span className="text-[10px] text-muted-foreground mr-auto">{starredMessages.length} رسالة</span>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            {starredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Star className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">لا توجد رسائل مميزة</p>
                <p className="text-xs mt-1">اضغط مطولاً على رسالة واختر "تمييز بنجمة"</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {starredMessages.map((msg) => (
                  <motion.button
                    key={msg.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onScrollToMessage(msg.message_id);
                      onClose();
                    }}
                    className="w-full text-right p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/20 group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">
                          {msg.message_type === 'image' ? '📷 صورة' :
                           msg.message_type === 'voice' ? '🎤 رسالة صوتية' :
                           msg.message_type === 'file' ? '📎 ملف' :
                           msg.message_content || 'رسالة'}
                        </p>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          {formatTime(msg.starred_at)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnstar(msg.message_id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

StarredMessagesPanel.displayName = 'StarredMessagesPanel';
export default StarredMessagesPanel;
