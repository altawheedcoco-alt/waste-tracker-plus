import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancel: () => void;
}

const ReplyPreview = ({ replyToMessage, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-t border-primary/20">
      <Reply className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0 border-r-2 border-primary pr-2">
        <p className="text-xs font-semibold text-primary truncate">{replyToMessage.senderName}</p>
        <p className="text-xs text-muted-foreground truncate">{replyToMessage.content}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onCancel}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

// Inline quoted reply inside a message bubble
export const QuotedReply = ({ senderName, content, isOwn }: { senderName: string; content: string; isOwn: boolean }) => {
  return (
    <div className={cn(
      "rounded-lg px-2.5 py-1.5 mb-1 border-r-2 text-xs",
      isOwn
        ? "bg-primary-foreground/10 border-primary-foreground/40"
        : "bg-muted/80 border-primary/50"
    )}>
      <p className={cn(
        "font-semibold text-[10px]",
        isOwn ? "text-primary-foreground/80" : "text-primary"
      )}>
        {senderName}
      </p>
      <p className={cn(
        "truncate",
        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
      )}>
        {content}
      </p>
    </div>
  );
};

export default ReplyPreview;
