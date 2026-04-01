import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MessageReaction } from '@/hooks/useChatReactions';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReact: (emoji: string) => void;
  isOwn: boolean;
}

const MessageReactionsDisplay = ({ reactions, onReact, isOwn }: MessageReactionsProps) => {
  if (reactions.length === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-0.5 flex-wrap mt-0.5",
      isOwn ? "justify-start" : "justify-end"
    )}>
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.button
            key={r.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={() => { soundEngine.play('reaction'); onReact(r.emoji); }}
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
              r.reacted
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/50 border-border hover:bg-muted"
            )}
          >
            <span>{r.emoji}</span>
            {r.count > 1 && <span className="text-[10px] tabular-nums">{r.count}</span>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Floating reaction picker that shows on hover
export const ReactionPicker = ({ onReact, isOwn }: { onReact: (emoji: string) => void; isOwn: boolean }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full",
            "absolute -bottom-2",
            isOwn ? "left-0" : "right-0"
          )}
        >
          <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" side="top" align={isOwn ? "start" : "end"}>
        <div className="flex items-center gap-0.5">
          {QUICK_REACTIONS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { soundEngine.play('reaction'); onReact(emoji); }}
              className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-lg"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageReactionsDisplay;
