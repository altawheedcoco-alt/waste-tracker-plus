import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMessageThreads } from '@/hooks/useMessageThreads';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ThreadPanelProps {
  parentMessageId: string;
  parentContent: string;
  parentSenderName: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ThreadPanel({
  parentMessageId,
  parentContent,
  parentSenderName,
  currentUserId,
  onClose,
}: ThreadPanelProps) {
  const { replies, isLoading, sendReply } = useMessageThreads(parentMessageId);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await sendReply(replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 z-30 bg-background border-r border-border flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <MessageSquare className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold flex-1">سلسلة الردود</span>
        <span className="text-xs text-muted-foreground">{replies.length} رد</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Parent message */}
      <div className="p-3 border-b border-border bg-primary/5">
        <p className="text-xs font-medium text-primary mb-1">{parentSenderName}</p>
        <p className="text-sm text-foreground line-clamp-3">{parentContent}</p>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            لا توجد ردود بعد. كن أول من يرد!
          </div>
        ) : (
          replies.map((reply) => {
            const isOwn = reply.sender_id === currentUserId;
            return (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-2', isOwn && 'flex-row-reverse')}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10">
                    {reply.sender?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2',
                  isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {!isOwn && (
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">
                      {reply.sender?.full_name}
                    </p>
                  )}
                  <p className="text-sm">{reply.content}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {format(new Date(reply.created_at), 'HH:mm', { locale: ar })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="اكتب رداً..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="shrink-0 h-10 w-10"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
