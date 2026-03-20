import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SmartReply {
  id: string;
  text: string;
  icon: string;
  action?: string;
}

interface SmartRepliesBarProps {
  replies: SmartReply[];
  onSelect: (reply: SmartReply) => void;
}

const SmartRepliesBar = memo(({ replies, onSelect }: SmartRepliesBarProps) => {
  if (replies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border/30 bg-muted/20"
    >
      <span className="text-[10px] text-muted-foreground self-center ml-1">ردود مقترحة:</span>
      {replies.map((reply, i) => (
        <motion.button
          key={reply.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(reply)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
            "border border-border/60 bg-background hover:bg-primary/5 hover:border-primary/40",
            "transition-colors cursor-pointer shadow-sm"
          )}
        >
          <span>{reply.icon}</span>
          <span>{reply.text}</span>
        </motion.button>
      ))}
    </motion.div>
  );
});

SmartRepliesBar.displayName = 'SmartRepliesBar';
export default SmartRepliesBar;
