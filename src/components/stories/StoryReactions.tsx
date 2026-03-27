import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
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
  const [replyText, setReplyText] = useState('');
  const [reactedEmoji, setReactedEmoji] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const handleReact = (emoji: string) => {
    setReactedEmoji(emoji);
    onReact(emoji);
    setTimeout(() => setReactedEmoji(null), 1500);
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
    }
  };

  if (isMyStory) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4" dir="rtl">
      {/* Floating reaction animation */}
      <AnimatePresence>
        {reactedEmoji && (
          <motion.div
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: 2.5, y: -150, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-5xl pointer-events-none z-30"
          >
            {reactedEmoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick reactions row */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl rounded-full px-2 py-1.5 border border-white/5">
              {REACTION_EMOJIS.map((emoji, i) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 400 }}
                  whileTap={{ scale: 0.7 }}
                  onClick={() => { handleReact(emoji); setShowReactions(false); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply input bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`رد على ${ownerName}...`}
            className="bg-black/30 backdrop-blur-xl border-white/10 text-white placeholder:text-white/40 text-[13px] rounded-full h-11 pr-4 pl-10 focus:border-white/20 focus:ring-0"
            dir="rtl"
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            onFocus={() => setShowReactions(false)}
          />
          {replyText.trim() ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.8 }}
              onClick={handleSendReply}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <button
              onClick={() => setShowReactions(r => !r)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-xl leading-none"
            >
              😊
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryReactions;
