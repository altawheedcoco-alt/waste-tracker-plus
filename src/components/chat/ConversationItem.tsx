import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserOnlineStatus } from '@/hooks/useOnlinePresence';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { PrivateConversation } from '@/hooks/usePrivateChat';

const ConversationItem = memo(({ 
  conversation, isActive, onClick, currentUserId, compact = false
}: { 
  conversation: PrivateConversation; 
  isActive: boolean; 
  onClick: () => void;
  currentUserId?: string;
  compact?: boolean;
}) => {
  const partnerStatus = useUserOnlineStatus(conversation.partner?.user_id);

  const formatTime = (t?: string | null) => {
    if (!t) return '';
    const d = new Date(t);
    if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
    if (isYesterday(d)) return 'أمس';
    return format(d, 'd/M', { locale: ar });
  };

  const isMyLastMessage = !!currentUserId && conversation.last_message_sender_id === currentUserId;

  return (
    <motion.div
      layout
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 cursor-pointer transition-all border-b border-border/20",
        compact ? "px-2 py-2" : "px-3 py-3",
        isActive ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/40 active:bg-muted/60"
      )}
    >
      <div className="relative">
        <Avatar className={compact ? "w-9 h-9" : "w-11 h-11"}>
          <AvatarImage src={conversation.partner?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {conversation.partner?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        {partnerStatus.isOnline && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" 
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "text-sm truncate",
            (conversation.unread_count || 0) > 0 ? "font-bold" : "font-semibold"
          )}>
            {conversation.partner?.full_name || 'مستخدم'}
          </h4>
          <span className={cn(
            "text-[10px] shrink-0 mr-1",
            (conversation.unread_count || 0) > 0 ? "text-primary font-semibold" : "text-muted-foreground"
          )}>
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {isMyLastMessage && (
              conversation.last_message_status === 'read'
                ? <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                : conversation.last_message_status === 'delivered'
                  ? <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  : <Check className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <p className={cn(
              "text-xs truncate",
              (conversation.unread_count || 0) > 0 ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {conversation.lastDecryptedPreview 
                ? (conversation.lastDecryptedPreview.startsWith('voice-') 
                    ? '🎤 رسالة صوتية'
                    : conversation.lastDecryptedPreview.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                      ? '📷 صورة'
                      : conversation.lastDecryptedPreview.match(/\.(pdf|doc|docx|xls|xlsx)$/i)
                        ? '📎 مستند'
                        : conversation.lastDecryptedPreview.match(/\.(mp4|mov|webm)$/i)
                          ? '🎬 فيديو'
                          : conversation.lastDecryptedPreview)
                : (!compact && (conversation.partner?.organization_name || 'رسالة مشفرة')) || 'رسالة مشفرة'}
            </p>
          </div>
          {(conversation.unread_count || 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 300 }}
            >
              <Badge className="h-5 min-w-5 rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground shadow-sm">
                {conversation.unread_count}
              </Badge>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
