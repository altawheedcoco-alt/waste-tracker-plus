import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Loader2, Reply, Forward, FileText, Download, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useChatAppearance } from '@/contexts/ChatAppearanceContext';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import ClickableImage from '@/components/ui/ClickableImage';
import VoiceMessagePlayer from '@/components/chat/VoiceMessagePlayer';
import { MediaThumbnail } from '@/components/media';
import { detectMediaType } from '@/lib/mediaUtils';
import MessageReactionsDisplay, { ReactionPicker } from '@/components/chat/MessageReactions';
import { QuotedReply } from '@/components/chat/ReplyPreview';
import MessageContextMenu from '@/components/chat/MessageContextMenu';
import ChatBottomSheet from '@/components/chat/ChatBottomSheet';
import LinkPreview, { extractUrls } from '@/components/chat/LinkPreview';
import type { DecryptedMessage } from '@/hooks/usePrivateChat';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isMine: boolean;
  reactions: { emoji: string; count: number; users: string[]; reacted: boolean }[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  allMessages: DecryptedMessage[];
  isStarred?: boolean;
  onStar?: () => void;
  isMobile?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const MessageBubble = memo(({ 
  message, isMine, reactions, onReact, onReply, onForward, onDelete, onEdit, onPin, allMessages, isStarred, onStar, isMobile, isFirstInGroup, isLastInGroup 
}: MessageBubbleProps) => {
  const { getBubbleClasses, textStyle, showTimestamp, compactMode } = useChatAppearance();
  const appNavigate = useAppNavigate();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  const getStatusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'sent': return <Check className="w-3.5 h-3.5 text-muted-foreground/70" />;
      case 'sending': return <Loader2 className="w-3 h-3 text-muted-foreground/50 animate-spin" />;
      default: return <Check className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
  };

  // Long-press
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (isMobile) setShowBottomSheet(true);
      else setShowContextMenu(true);
    }, 500);
  }, [isMobile]);
  const handleTouchEnd = useCallback(() => clearTimeout(longPressTimer.current), []);

  // Double-tap
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onReact('❤️');
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onReact]);

  const repliedMessage = message.reply_to_id
    ? allMessages.find(m => m.id === message.reply_to_id)
    : null;

  const broadcastLinkMatch = message.message_type === 'text'
    ? message.content.match(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels\?channel=([a-f0-9-]+)(?:&post=([a-f0-9-]+))?/i)
    : null;

  const messageTextWithoutBroadcastLink = broadcastLinkMatch
    ? message.content.replace(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels[^\s]*/gi, '').trim()
    : message.content;

  if (message.is_deleted) {
    return (
      <div className={cn("flex mb-1", isMine ? "justify-start" : "justify-end")}>
        <div className="px-3 py-1.5 rounded-lg bg-muted/50 italic text-xs text-muted-foreground">
          🚫 تم حذف هذه الرسالة
        </div>
      </div>
    );
  }

  // Bubble corner radius based on grouping
  const bubbleRadius = isMine
    ? cn(
        isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-bl-sm' : '',
        isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-bl-sm rounded-bl-md' : '',
        !isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tl-md rounded-bl-sm' : '',
        !isFirstInGroup && !isLastInGroup ? 'rounded-xl' : '',
      )
    : cn(
        isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-br-sm' : '',
        isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-br-sm rounded-br-md' : '',
        !isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tr-md rounded-br-sm' : '',
        !isFirstInGroup && !isLastInGroup ? 'rounded-xl' : '',
      );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
        className={cn(
          "flex group relative select-none",
          isMine ? "justify-start" : "justify-end",
          isLastInGroup ? (compactMode ? "mb-0.5" : "mb-1") : "mb-px"
        )}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(true); }}
      >
        <div className="max-w-[75%] relative">
          {/* Quick action buttons on hover (desktop) */}
          <div className={cn(
            "absolute top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isMine ? "-left-20" : "-right-20"
          )}>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onReply(); }}>
              <Reply className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onForward(); }}>
              <Forward className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className={cn(getBubbleClasses(isMine), "relative")}>
            {!isMine && message.sender && isFirstInGroup && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.sender_id) window.open(`/dashboard/profile?userId=${message.sender_id}`, '_blank');
                }}
                className="text-[10px] font-semibold text-primary mb-0.5 hover:underline cursor-pointer text-right"
              >
                {message.sender.full_name}
              </button>
            )}

            {repliedMessage && (
              <QuotedReply
                senderName={repliedMessage.sender?.full_name || 'مستخدم'}
                content={repliedMessage.content}
                isOwn={isMine}
              />
            )}
            
            {message.file_url && (
              <div className="mb-1.5 -mx-1 -mt-1">
                {message.message_type === 'voice' || (message.message_type === 'file' && message.file_name && /\.(webm|mp3|wav|ogg|m4a)$/i.test(message.file_name)) ? (
                  <div className="mx-1 mt-1">
                    <VoiceMessagePlayer url={message.file_url} isOwn={isMine} />
                  </div>
                ) : (() => {
                  const mType = detectMediaType(message.file_url, undefined);
                  if (mType === 'image' || message.message_type === 'image') {
                    return (
                      <div className="rounded-lg overflow-hidden">
                        <MediaThumbnail url={message.file_url!} title={message.file_name || ''} size="lg" className="max-w-[300px] max-h-64 w-full object-cover" />
                      </div>
                    );
                  }
                  if (mType === 'video' || message.message_type === 'video') {
                    return (
                      <div className="rounded-lg overflow-hidden">
                        <MediaThumbnail url={message.file_url!} title={message.file_name || ''} size="lg" aspectRatio="video" className="max-w-[300px] w-full" />
                      </div>
                    );
                  }
                  if (mType === 'pdf') {
                    return <div className="mx-1 mt-1"><MediaThumbnail url={message.file_url!} title={message.file_name || 'PDF'} size="md" /></div>;
                  }
                  return (
                    <a href={message.file_url} target="_blank" rel="noopener noreferrer"
                      className="mx-1 mt-1 flex items-center gap-2 p-2.5 rounded-lg bg-background/20 hover:bg-background/30 transition-colors border border-border/30">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium truncate block">{message.file_name || 'ملف'}</span>
                        <span className="text-[10px] text-muted-foreground">اضغط للتحميل</span>
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-60" />
                    </a>
                  );
                })()}
              </div>
            )}
            
            {broadcastLinkMatch ? (
              <div className="space-y-2">
                {messageTextWithoutBroadcastLink && (
                  <p className="leading-relaxed whitespace-pre-wrap break-words" style={textStyle}>
                    {messageTextWithoutBroadcastLink}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => appNavigate(`/dashboard/broadcast-channels?channel=${broadcastLinkMatch[1]}${broadcastLinkMatch[2] ? `&post=${broadcastLinkMatch[2]}` : ''}`)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 px-3 py-3 text-right transition-colors hover:bg-muted/70"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {broadcastLinkMatch[2] ? '📡 منشور من قناة البث' : '📡 قناة بث'}
                    </p>
                    <p className="text-xs text-muted-foreground">اضغط لفتح القناة مباشرة</p>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <p className="leading-relaxed whitespace-pre-wrap break-words" style={textStyle}>{message.content}</p>
                {message.message_type === 'text' && extractUrls(message.content).slice(0, 2).map((url, i) => (
                  <LinkPreview key={i} url={url} />
                ))}
              </>
            )}
            
            {(showTimestamp && isLastInGroup) && (
              <div className={cn(
                "flex items-center gap-1 mt-0.5",
                isMine ? "justify-start" : "justify-end"
              )}>
                <span className={cn(
                  "text-[9px]",
                  isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                )}>
                  {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                </span>
                {message.is_edited && (
                  <span className={cn(
                    "text-[9px]",
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>تم التعديل</span>
                )}
                {isMine && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    key={message.status}
                  >
                    {getStatusIcon()}
                  </motion.span>
                )}
              </div>
            )}

            {/* Double-tap heart animation */}
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-3xl drop-shadow-lg">❤️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MessageReactionsDisplay reactions={reactions} onReact={onReact} isOwn={isMine} />
          <ReactionPicker onReact={onReact} isOwn={isMine} />
        </div>
      </motion.div>

      <MessageContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onReply={onReply}
        onForward={onForward}
        onCopy={() => { navigator.clipboard.writeText(message.content); toast.success('تم النسخ'); }}
        onDelete={isMine ? onDelete : undefined}
        onEdit={isMine && message.message_type === 'text' ? onEdit : undefined}
        onStar={onStar}
        onPin={onPin}
        isMine={isMine}
      />

      <ChatBottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        isOwn={isMine}
        messageContent={message.content}
        onReply={onReply}
        onForward={onForward}
        onCopy={() => { navigator.clipboard.writeText(message.content); toast.success('تم النسخ'); }}
        onDelete={isMine ? onDelete : undefined}
        onEdit={isMine && message.message_type === 'text' ? onEdit : undefined}
        onStar={onStar}
        onPin={onPin}
        onReact={(emoji) => onReact(emoji)}
      />
    </>
  );
});
MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
