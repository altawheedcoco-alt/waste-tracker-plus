import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useReelComments, useReelActions } from '@/hooks/useReels';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  reelId: string;
  onClose: () => void;
}

const ReelComments = memo(({ reelId, onClose }: Props) => {
  const { data: comments = [], isLoading } = useReelComments(reelId);
  const { addComment } = useReelActions();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    addComment.mutate({ reelId, content: text.trim() });
    setText('');
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-40 bg-card rounded-t-3xl max-h-[60vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="font-bold text-foreground">التعليقات ({comments.length})</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">جاري التحميل...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-1">💬</p>
            <p>كن أول من يعلق!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={c.profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-muted">
                  {c.profile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ar })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/30 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب تعليقاً..."
          className="flex-1 bg-muted border-0 rounded-full"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || addComment.isPending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </motion.div>
  );
});

ReelComments.displayName = 'ReelComments';
export default ReelComments;
