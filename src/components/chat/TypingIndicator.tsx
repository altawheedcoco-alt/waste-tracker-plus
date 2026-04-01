import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  isTyping: boolean;
  name?: string;
}

/**
 * مؤشر "يكتب الآن..." بنمط واتساب محسّن
 */
const TypingIndicator = ({ isTyping, name }: TypingIndicatorProps) => {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="flex justify-end mb-1 px-2"
        >
          <div className="bg-muted/80 backdrop-blur-sm rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm border border-border/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-[3px]">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-[6px] h-[6px] rounded-full bg-primary/60"
                    animate={{ 
                      y: [0, -5, 0],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              {name && (
                <span className="text-[10px] text-muted-foreground font-medium mr-0.5 truncate max-w-[80px]">
                  {name} يكتب
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TypingIndicator;
