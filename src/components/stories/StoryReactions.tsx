import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface StoryReactionsProps {
  storyId: string;
  ownerName: string;
  isMyStory: boolean;
  onReact: (emoji: string) => void;
  onReply: (text: string) => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

const StoryReactions = ({ storyId, ownerName, isMyStory, onReact, onReply }: StoryReactionsProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [reactedEmoji, setReactedEmoji] = useState<string | null>(null);

  const handleReact = (emoji: string) => {
    setReactedEmoji(emoji);
    onReact(emoji);
    setTimeout(() => setReactedEmoji(null), 1500);
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  if (isMyStory) return null;

  return (
    <div className="absolute bottom-4 left-0 right-0 z-20 px-4" dir="rtl">
      {/* Floating reaction animation */}
      <AnimatePresence>
        {reactedEmoji && (
          <motion.div
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: 2, y: -120, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 text-4xl pointer-events-none"
          >
            {reactedEmoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply input */}
      <AnimatePresence>
        {showReplyInput ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`رد على ${ownerName}...`}
              className="flex-1 bg-black/50 border-white/20 text-white placeholder:text-white/50 text-sm rounded-full h-10"
              autoFocus
              dir="rtl"
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendReply}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Reactions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleReact(emoji)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-lg hover:bg-black/60 transition-colors"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 text-white text-xs"
        >
          <Send className="w-3.5 h-3.5" />
          رد
        </motion.button>
      </div>
    </div>
  );
};

export default StoryReactions;
