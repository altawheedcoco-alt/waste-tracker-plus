import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isTyping: boolean;
  name?: string;
}

/**
 * مؤشر "يكتب الآن..." بنمط واتساب
 */
const TypingIndicator = ({ isTyping, name }: TypingIndicatorProps) => {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          className="flex justify-end mb-1 px-2"
        >
          <div className="bg-muted rounded-2xl rounded-tr-sm px-3 py-2 max-w-[120px]">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              {name && (
                <span className="text-[9px] text-muted-foreground mr-1 truncate">{name}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TypingIndicator;
