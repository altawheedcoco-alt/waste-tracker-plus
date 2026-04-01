import { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Shield, Lock } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import SwipeableMessage from '@/components/chat/SwipeableMessage';
import MessageBubble from '@/components/chat/ChatMessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ScrollToBottomButton from '@/components/chat/ScrollToBottomButton';
import { DateSeparator, UnreadSeparator } from '@/components/chat/ChatDateSeparators';
import type { DecryptedMessage } from '@/hooks/usePrivateChat';

interface ChatMessagesAreaProps {
  messages: DecryptedMessage[];
  messagesLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentUserId: string;
  wallpaperStyle: React.CSSProperties;
  reactionsMap: Record<string, { emoji: string; count: number; users: string[]; reacted: boolean }[]>;
  starredMessageIds: Set<string>;
  highlightedMsgId: string | null;
  firstUnreadId: string | null;
  isPartnerTyping: boolean;
  partnerTypingName: string | null;
  unreadCount: number;
  isMobile: boolean;
  showScrollBottom: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: DecryptedMessage) => void;
  onForward: (msg: DecryptedMessage) => void;
  onDelete: (msgId: string) => void;
  onEdit: (msg: DecryptedMessage) => void;
  onPin: (msgId: string, isPinned: boolean) => void;
  onStar: (msg: DecryptedMessage) => void;
  onScrollToBottom: () => void;
}

const ChatMessagesArea = memo(({
  messages, messagesLoading, loadingMore, currentUserId,
  wallpaperStyle, reactionsMap, starredMessageIds, highlightedMsgId,
  firstUnreadId, isPartnerTyping, partnerTypingName, unreadCount, isMobile,
  showScrollBottom, containerRef, messagesEndRef,
  onScroll, onReact, onReply, onForward, onDelete, onEdit, onPin, onStar, onScrollToBottom,
}: ChatMessagesAreaProps) => {

  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: DecryptedMessage[] }[] = [];
    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-3 transition-colors duration-300 relative" style={wallpaperStyle} onScroll={onScroll}>
      {loadingMore && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="animate-spin text-primary w-5 h-5" />
          <span className="text-xs text-muted-foreground mr-2">تحميل رسائل أقدم...</span>
        </div>
      )}
      {messagesLoading ? (
        <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
            <Shield className="w-16 h-16 mb-3 text-primary/20" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm font-semibold text-foreground">محادثة مشفرة</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs mt-1.5 text-center max-w-[250px]">ابدأ بإرسال أول رسالة — محمية بتشفير طرف لطرف</motion.p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
            <div className="bg-amber-50/90 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl px-4 py-2 text-center max-w-md backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 inline-block ml-1" />
              <span className="text-[11px] text-amber-700 dark:text-amber-400">الرسائل محمية بتشفير طرف لطرف</span>
            </div>
          </motion.div>

          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              <DateSeparator date={group.date} />
              {group.messages.map((msg, mi) => {
                const isMine = msg.sender_id === currentUserId;
                const isHighlighted = highlightedMsgId === msg.id;
                const prevMsg = group.messages[mi - 1];
                const nextMsg = group.messages[mi + 1];
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                const showUnreadSep = firstUnreadId === msg.id;
                return (
                  <div key={msg.id}>
                    {showUnreadSep && <UnreadSeparator />}
                    <div id={`msg-${msg.id}`} className={cn(isHighlighted && "ring-2 ring-primary/50 rounded-xl transition-all duration-500")}>
                      <SwipeableMessage isMine={isMine} onSwipeReply={() => onReply(msg)}>
                        <MessageBubble
                          message={msg} isMine={isMine}
                          reactions={reactionsMap[msg.id] || []}
                          onReact={(emoji) => onReact(msg.id, emoji)}
                          onReply={() => onReply(msg)}
                          onForward={() => onForward(msg)}
                          onDelete={() => onDelete(msg.id)}
                          onEdit={isMine && msg.message_type === 'text' ? () => onEdit(msg) : undefined}
                          onPin={() => onPin(msg.id, (msg as any).is_pinned || false)}
                          allMessages={messages}
                          isStarred={starredMessageIds.has(msg.id)}
                          onStar={() => onStar(msg)}
                          isMobile={isMobile}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                        />
                      </SwipeableMessage>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <TypingIndicator isTyping={isPartnerTyping} name={partnerTypingName || undefined} />
          <div ref={messagesEndRef} />
        </>
      )}
      <ScrollToBottomButton isVisible={showScrollBottom && messages.length > 0} onClick={onScrollToBottom} unreadCount={unreadCount} />
    </div>
  );
});

ChatMessagesArea.displayName = 'ChatMessagesArea';
export default ChatMessagesArea;
