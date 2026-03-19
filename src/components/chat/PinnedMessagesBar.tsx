import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinnedMessage } from '@/hooks/usePinnedMessages';
import { cn } from '@/lib/utils';

interface PinnedMessagesBarProps {
  pinnedMessages: PinnedMessage[];
  onScrollToMessage: (messageId: string) => void;
  onClose: () => void;
}

const PinnedMessagesBar = ({ pinnedMessages, onScrollToMessage, onClose }: PinnedMessagesBarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const current = pinnedMessages[currentIndex];
  const getContent = (msg: PinnedMessage) => {
    try {
      const parsed = JSON.parse(msg.content);
      return parsed.text || msg.content;
    } catch {
      return msg.content;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <Pin className="w-4 h-4 text-amber-600 shrink-0 rotate-45" />
        
        <button
          onClick={() => onScrollToMessage(current.id)}
          className="flex-1 min-w-0 text-right"
        >
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
            {current.sender?.full_name || 'مستخدم'} 
            {pinnedMessages.length > 1 && (
              <span className="text-amber-500 mr-1">({currentIndex + 1}/{pinnedMessages.length})</span>
            )}
          </p>
          <p className="text-xs text-foreground/70 truncate">
            {getContent(current)}
          </p>
        </button>

        {pinnedMessages.length > 1 && (
          <div className="flex flex-col">
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setCurrentIndex(prev => (prev - 1 + pinnedMessages.length) % pinnedMessages.length)}
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setCurrentIndex(prev => (prev + 1) % pinnedMessages.length)}
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        )}

        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default PinnedMessagesBar;
