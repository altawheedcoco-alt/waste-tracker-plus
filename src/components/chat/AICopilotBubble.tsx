import { motion } from 'framer-motion';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface AICopilotBubbleProps {
  content: string;
  isLoading?: boolean;
}

export default function AICopilotBubble({ content, isLoading }: AICopilotBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex gap-2 my-2 justify-start"
      dir="rtl"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3',
        'bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20'
      )}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3 h-3 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-600">المساعد الذكي</span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري التحليل...
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
