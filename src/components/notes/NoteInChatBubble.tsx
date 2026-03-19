import { StickyNote, AlertTriangle, ThumbsUp, ThumbsDown, HelpCircle, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoteInChatBubbleProps {
  content: string;
  noteType: string;
  priority: string;
  authorName?: string;
  createdAt?: string;
  className?: string;
}

const noteTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  comment: { icon: MessageSquare, label: 'تعليق', color: 'text-blue-500' },
  instruction: { icon: Send, label: 'تعليمات', color: 'text-indigo-500' },
  warning: { icon: AlertTriangle, label: 'تحذير', color: 'text-amber-500' },
  approval: { icon: ThumbsUp, label: 'موافقة', color: 'text-emerald-500' },
  rejection: { icon: ThumbsDown, label: 'رفض', color: 'text-red-500' },
  question: { icon: HelpCircle, label: 'سؤال', color: 'text-purple-500' },
  answer: { icon: CheckCircle2, label: 'إجابة', color: 'text-teal-500' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

const NoteInChatBubble = ({ content, noteType, priority, authorName, className }: NoteInChatBubbleProps) => {
  const config = noteTypeConfig[noteType] || noteTypeConfig.comment;
  const NoteIcon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border-2 border-amber-200/60 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 max-w-[280px]',
      className
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <StickyNote className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">ملاحظة مشتركة</span>
        <Badge variant="outline" className={cn('text-[8px] py-0 h-3.5 mr-auto', priorityColors[priority])}>
          {config.label}
        </Badge>
      </div>
      <p className="text-sm text-foreground leading-relaxed text-right">{content}</p>
      {authorName && (
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">— {authorName}</p>
      )}
    </div>
  );
};

export default NoteInChatBubble;
