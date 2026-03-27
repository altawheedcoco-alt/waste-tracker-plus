import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sticker } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface StoryReactionsProps {
  storyId: string;
  ownerName: string;
  isMyStory: boolean;
  onReact: (emoji: string) => void;
  onReply: (text: string) => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '💯'];

const StoryReactions = ({ storyId, ownerName, isMyStory, onReact, onReply }: StoryReactionsProps) => {
  const [replyText, setReplyText] = useState('');
  const [reactedEmoji, setReactedEmoji] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleVoiceNote = () => {
    setIsRecording(r => !r);
    if (!isRecording) {
      toast.info('جاري التسجيل...');
    } else {
      toast.success('تم إرسال الرسالة الصوتية');
    }
  };

  if (isMyStory) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3" dir="rtl">
      {/* ══ Floating reaction animation ══ */}
      <AnimatePresence>
        {reactedEmoji && (
          <motion.div
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 3, 2.5], y: -180, opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-5xl pointer-events-none z-30"
          >
            {reactedEmoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Quick reactions tray (WhatsApp/Reels hybrid) ══ */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="mb-2"
          >
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-2xl rounded-2xl px-1.5 py-1 border border-white/10 shadow-2xl">
                {REACTION_EMOJIS.map((emoji, i) => (
                  <motion.button
                    key={emoji}
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 500 }}
                    whileHover={{ scale: 1.4, y: -8 }}
                    whileTap={{ scale: 0.6 }}
                    onClick={() => { handleReact(emoji); setShowReactions(false); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[20px] hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Reply input bar (WhatsApp style) ══ */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`رسالة لـ ${ownerName}...`}
            className="bg-black/25 backdrop-blur-2xl border-white/8 text-white placeholder:text-white/35 text-[13px] rounded-full h-10 pr-10 pl-10 focus:border-white/15 focus:ring-0 shadow-lg"
            dir="rtl"
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            onFocus={() => setShowReactions(false)}
          />
          {/* Emoji/Sticker toggle */}
          <button
            onClick={() => setShowReactions(r => !r)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
          >
            😊
          </button>
          {/* Send or Voice */}
          {replyText.trim() ? (
            <motion.button
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              whileTap={{ scale: 0.7 }}
              onClick={handleSendReply}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.7 }}
              onClick={handleVoiceNote}
              className={`absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-white/60'}`} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryReactions;
