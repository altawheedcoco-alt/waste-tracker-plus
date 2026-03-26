import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  FileText, 
  Download,
  Image as ImageIcon,
  Video,
  File,
  CheckCheck,
  Check,
  Lock,
  ChevronDown,
  ArrowDown,
  Loader2,
  Radio,
  Play,
  Reply,
  Copy,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/hooks/useChat';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ImageLightbox from './ImageLightbox';
import MessageActions from './MessageActions';
import MessageReactions from './MessageReactions';
import ChatBottomSheet from './ChatBottomSheet';
import ChatMessageCardRenderer from './ChatMessageCardRenderer';
import ChatMentionRenderer from './ChatMentionRenderer';
import { QuotedReply } from './ReplyPreview';
import { useChatReactions } from '@/hooks/useChatReactions';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { cn } from '@/lib/utils';

interface EnhancedChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  roomName?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onReply?: (message: ChatMessage) => void;
  replyToMessage?: ChatMessage | null;
  isPartnerTyping?: boolean;
  partnerName?: string;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  scrollToMessageId?: string | null;
  firstUnreadMessageId?: string | null;
}

// URL detection and rendering
const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}"'])/g;

const renderTextWithLinks = (text: string, isOwn: boolean) => {
  const parts = text.split(URL_REGEX);
  if (parts.length === 1) return <span>{text}</span>;
  
  return (
    <span>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          URL_REGEX.lastIndex = 0;
          let displayUrl = part.replace(/^https?:\/\/(www\.)?/, '');
          if (displayUrl.length > 40) displayUrl = displayUrl.substring(0, 37) + '...';
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2 break-all",
                isOwn ? "text-[#53bdeb] hover:text-[#53bdeb]/80" : "text-primary hover:text-primary/80"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// Swipeable message wrapper for reply
const SwipeableMessage = ({ children, onSwipeReply, isOwn }: { children: React.ReactNode; onSwipeReply?: () => void; isOwn: boolean }) => {
  const x = useMotionValue(0);
  const replyIconOpacity = useTransform(x, isOwn ? [-80, -40, 0] : [0, 40, 80], isOwn ? [1, 0.5, 0] : [0, 0.5, 1]);
  const replyIconScale = useTransform(x, isOwn ? [-80, -40, 0] : [0, 40, 80], isOwn ? [1, 0.6, 0] : [0, 0.6, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 60;
    if (isOwn && info.offset.x < -threshold && onSwipeReply) {
      onSwipeReply();
    } else if (!isOwn && info.offset.x > threshold && onSwipeReply) {
      onSwipeReply();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Reply icon indicator */}
      <motion.div 
        className={cn("absolute top-1/2 -translate-y-1/2 z-0", isOwn ? "left-3" : "right-3")}
        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Reply className="w-4 h-4 text-primary" />
        </div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: isOwn ? -100 : 0, right: isOwn ? 0 : 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

const EnhancedChatMessages = ({ 
  messages, 
  currentUserId, 
  roomName,
  onLoadMore,
  hasMore = false,
  onReply,
  isPartnerTyping = false,
  partnerName,
  onDeleteMessage,
  onForwardMessage,
  onPinMessage,
  scrollToMessageId,
  firstUnreadMessageId,
}: EnhancedChatMessagesProps) => {
  const navigate = useAppNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDisplayMode();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);

  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { reactionsMap, toggleReaction } = useChatReactions(messageIds);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 150;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewMessageCount(0);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    } else {
      setNewMessageCount(prev => prev + 1);
    }
  }, [messages.length]);

  useEffect(() => { scrollToBottom('instant'); }, []);

  useEffect(() => {
    if (isPartnerTyping && isNearBottom) scrollToBottom();
  }, [isPartnerTyping, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (scrollToMessageId) {
      const el = document.getElementById(`msg-${scrollToMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary/50', 'rounded-2xl');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50', 'rounded-2xl'), 2000);
      }
    }
  }, [scrollToMessageId]);

  const parseMessageContent = (message: ChatMessage) => {
    if (message.message_type === 'text') {
      try {
        const parsed = JSON.parse(message.content);
        return { text: parsed.text || message.content, fileUrl: parsed.file_url || null, fileName: parsed.file_name || null };
      } catch {
        return { text: message.content, fileUrl: null, fileName: null };
      }
    }
    try {
      const parsed = JSON.parse(message.content);
      return { text: parsed.text || '', fileUrl: parsed.file_url, fileName: parsed.file_name };
    } catch {
      return { text: message.content, fileUrl: null, fileName: null };
    }
  };

  const allImages = useMemo(() => {
    return messages
      .filter(m => m.message_type === 'image')
      .map(m => { const { fileUrl } = parseMessageContent(m); return fileUrl; })
      .filter(Boolean) as string[];
  }, [messages]);

  const openImageLightbox = (imageUrl: string) => {
    const index = allImages.indexOf(imageUrl);
    setLightboxImages(allImages);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  const isVoiceMessage = (fileName: string | null) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['webm', 'mp3', 'wav', 'ogg', 'm4a'].includes(ext || '');
  };

  const isVideoFile = (fileName: string | null) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '');
  };

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return FileText;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return FileText;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return Video;
    return File;
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'اليوم';
    if (isYesterday(date)) return 'أمس';
    return format(date, 'EEEE، d MMMM yyyy', { locale: ar });
  };

  const getMessageStatus = (message: ChatMessage, isOwn: boolean) => {
    if (!isOwn) return null;
    const optStatus = (message as any).optimistic_status;
    if (optStatus === 'sending') return <Loader2 className="w-[14px] h-[14px] text-[hsl(var(--wa-time))] animate-spin" />;
    if (optStatus === 'failed') return <span className="text-[10px] text-destructive font-bold">!</span>;
    if (message.is_read) return <CheckCheck className="w-[14px] h-[14px] text-[#53bdeb]" />;
    const msgStatus = (message as any).message_status || (message as any).status;
    if (msgStatus === 'delivered') return <CheckCheck className="w-[14px] h-[14px] text-[hsl(var(--wa-time))]" />;
    return <Check className="w-[14px] h-[14px] text-[hsl(var(--wa-time))]" />;
  };

  const findMessage = (id: string) => messages.find(m => m.id === id);

  const messageGroups = groupMessagesByDate(messages);

  // Long press handler
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressMsg(msgId);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-8 h-8 text-[hsl(var(--wa-light-green))]/50" />
          </div>
          <p className="text-sm font-medium text-foreground/70">لا توجد رسائل بعد</p>
          <p className="text-xs mt-1.5 text-muted-foreground max-w-[220px]">
            ابدأ المحادثة الآن مع {roomName || 'هذه الجهة'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Lock className="w-3 h-3" />
            الرسائل محمية بتشفير تام
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="h-full overflow-y-auto relative bg-[hsl(var(--wa-chat-bg))]" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'thin',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='412' height='412' viewBox='0 0 412 412' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='100' height='100' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' fill-opacity='0.35'/%3E%3Ccircle cx='50' cy='30' r='1' fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' fill-opacity='0.25'/%3E%3Cpath d='M30 60 Q35 55 40 60 Q35 65 30 60z' fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' fill-opacity='0.2'/%3E%3Cpath d='M70 80 l5-8 5 8z' fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' fill-opacity='0.2'/%3E%3Cpath d='M80 20 Q85 15 90 20' stroke='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' stroke-opacity='0.2' fill='none' stroke-width='1.5'/%3E%3Crect x='15' y='85' width='6' height='6' rx='1' fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '1a2e28' : 'c8d6cf'}' fill-opacity='0.15'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='412' height='412' fill='url(%23p)'/%3E%3C/svg%3E")`,
        }}
      >
        <div className={cn("space-y-0", isMobile ? "px-2 py-2" : "px-4 py-3")}>
          {hasMore && (
            <div className="text-center py-2">
              <button onClick={onLoadMore} className="text-xs text-[hsl(var(--wa-teal-green))] hover:underline bg-white/80 dark:bg-background/80 px-3 py-1 rounded-full shadow-sm">
                تحميل رسائل سابقة
              </button>
            </div>
          )}

          {messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date Separator - WhatsApp pill style */}
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-muted-foreground bg-background/90 dark:bg-[hsl(var(--wa-incoming))] px-3 py-1 rounded-lg shadow-sm">
                  {formatDateLabel(group.date)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-[2px]">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const { text, fileUrl, fileName } = parseMessageContent(message);
                  const prevMsg = group.messages[index - 1];
                  const nextMsg = group.messages[index + 1];
                  const isFirstInGroup = !prevMsg || prevMsg.sender_id !== message.sender_id;
                  const isLastInGroup = !nextMsg || nextMsg.sender_id !== message.sender_id;
                  const showAvatar = !isOwn && isFirstInGroup;
                  const FileIcon = getFileIcon(fileName);
                  const messageReactions = reactionsMap[message.id] || [];
                  const isFirstUnread = message.id === firstUnreadMessageId;
                  const isMediaOnly = (message.message_type === 'image' || (message.message_type === 'file' && isVideoFile(fileName))) && !text;

                  // Reply content
                  let replyContent: string | null = null;
                  let replySender: string | null = null;
                  try {
                    const parsed = JSON.parse(message.content);
                    if (parsed.reply_to_id) {
                      const original = findMessage(parsed.reply_to_id);
                      if (original) {
                        replySender = original.sender?.full_name || 'مستخدم';
                        const origParsed = parseMessageContent(original);
                        replyContent = origParsed.text || (origParsed.fileName ? `📎 ${origParsed.fileName}` : 'رسالة');
                      }
                    }
                  } catch {}

                  const isDeleted = message.message_type === 'system' && message.content.includes('تم حذف');

                  // Bubble tail SVG - RTL aware
                  const renderTail = () => {
                    if (!isFirstInGroup) return null;
                    return (
                      <div className={cn(
                        "absolute top-0 w-2 h-[13px]",
                        isOwn ? "-right-[7px]" : "-left-[7px]"
                      )}>
                        <svg viewBox="0 0 8 13" width="8" height="13">
                          <path 
                            d={isOwn 
                              ? "M6.467 3.568 0 12.193V1h5.188c1.77 0 2.338 1.156 1.279 2.568z" 
                              : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
                            } 
                            fill={isOwn ? 'hsl(var(--wa-outgoing))' : 'hsl(var(--wa-incoming))'} 
                          />
                        </svg>
                      </div>
                    );
                  };

                  const bubbleContent = (
                    <motion.div
                      id={`msg-${message.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                      className={cn(
                        "flex group",
                        isOwn ? "justify-end" : "justify-start",
                        isFirstInGroup ? "mt-2" : "mt-[2px]"
                      )}
                      onTouchStart={() => handleTouchStart(message.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                    >
                      <div className={cn(
                        "flex gap-1 max-w-[85%]",
                        isOwn ? "flex-row-reverse" : "flex-row"
                      )}>
                        {/* Avatar - only for first in group */}
                        {!isOwn && showAvatar ? (
                          <Avatar className="h-7 w-7 shrink-0 mt-auto mb-0.5">
                            <AvatarImage src={message.sender?.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-[10px]">
                              {message.sender?.full_name?.[0] || '؟'}
                            </AvatarFallback>
                          </Avatar>
                        ) : !isOwn ? (
                          <div className="w-7 shrink-0" />
                        ) : null}

                        {/* Message Bubble */}
                        <div className="relative">
                          {renderTail()}
                          <div
                            className={cn(
                              "overflow-hidden relative",
                              isDeleted
                                ? "bg-muted/50 border border-border/30 italic rounded-lg"
                                : isOwn
                                  ? "bg-[hsl(var(--wa-outgoing))] text-[hsl(var(--wa-outgoing-foreground))]"
                                  : "bg-[hsl(var(--wa-incoming))] text-[hsl(var(--wa-incoming-foreground))] shadow-[0_1px_0.5px_rgba(0,0,0,0.06)]",
                              // Rounded corners - WhatsApp style: no corner where tail is
                              isFirstInGroup && isOwn ? "rounded-lg rounded-tr-[4px]" :
                              isFirstInGroup && !isOwn ? "rounded-lg rounded-tl-[4px]" :
                              "rounded-lg",
                              isMediaOnly ? "p-[3px]" : "px-2 py-[5px]"
                            )}
                          >
                            {/* Quoted Reply */}
                            {replyContent && replySender && (
                              <QuotedReply senderName={replySender} content={replyContent} isOwn={isOwn} />
                            )}

                            {/* Sender Name - first message in group */}
                            {!isOwn && isFirstInGroup && message.sender && !isDeleted && (
                              <p className="text-[11px] text-primary font-bold mb-[2px] leading-tight">
                                {message.sender.full_name}
                              </p>
                            )}

                            {/* Deleted */}
                            {isDeleted ? (
                              <p className="text-[13px] text-muted-foreground">🚫 تم حذف هذه الرسالة</p>
                            ) : (
                              <>
                                {/* Text / Resource cards */}
                                {message.message_type === 'text' && (() => {
                                  try {
                                    const parsed = JSON.parse(text);
                                    if (parsed.resource_type && parsed.resource_data) {
                                      return <ChatMessageCardRenderer resourceType={parsed.resource_type} resourceData={parsed.resource_data} isOwn={isOwn} />;
                                    }
                                  } catch {}
                                  const bcMatch = text.match(/\/dashboard\/broadcast-channels\?channel=([a-f0-9-]+)(?:&post=([a-f0-9-]+))?/);
                                  if (bcMatch) {
                                    const linkChannelId = bcMatch[1];
                                    const linkPostId = bcMatch[2];
                                    const textWithoutLink = text.replace(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels[^\s]*/g, '').trim();
                                    return (
                                      <div>
                                        {textWithoutLink && (
                                          <p className="whitespace-pre-wrap text-[13.2px] leading-[19px] mb-2">
                                            <ChatMentionRenderer text={textWithoutLink} isOwn={isOwn} />
                                          </p>
                                        )}
                                        <button
                                          onClick={() => navigate(`/dashboard/broadcast-channels?channel=${linkChannelId}${linkPostId ? `&post=${linkPostId}` : ''}`)}
                                          className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-right"
                                        >
                                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Radio className="w-5 h-5 text-primary" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold">📡 {linkPostId ? 'منشور من قناة البث' : 'قناة بث'}</p>
                                            <p className="text-[11px] text-muted-foreground">اضغط لفتح القناة</p>
                                          </div>
                                        </button>
                                      </div>
                                    );
                                  }
                                  return (
                                    <p className="whitespace-pre-wrap text-[13.2px] leading-[19px]">
                                      <ChatMentionRenderer text={text} isOwn={isOwn} />
                                    </p>
                                  );
                                })()}

                                {/* Resource Card */}
                                {(message.message_type as string) === 'resource_card' && (() => {
                                  try {
                                    const parsed = JSON.parse(message.content);
                                    if (parsed.resource_type && parsed.resource_data) {
                                      return <ChatMessageCardRenderer resourceType={parsed.resource_type} resourceData={parsed.resource_data} isOwn={isOwn} />;
                                    }
                                  } catch {}
                                  return null;
                                })()}

                                {/* Image */}
                                {message.message_type === 'image' && fileUrl && (
                                  <div className="cursor-pointer group/img relative" onClick={() => openImageLightbox(fileUrl)}>
                                    <img 
                                      src={fileUrl} 
                                      alt={fileName || 'صورة'} 
                                      className="rounded-lg max-w-[260px] max-h-[280px] object-cover w-full" 
                                      loading="lazy" 
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-lg transition-colors" />
                                    {/* Inline time on image */}
                                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                                      <span className="text-[10px] text-white/90">{format(new Date(message.created_at), 'hh:mm a', { locale: ar })}</span>
                                      {getMessageStatus(message, isOwn)}
                                    </div>
                                  </div>
                                )}

                                {/* Video with play overlay */}
                                {message.message_type === 'file' && fileUrl && isVideoFile(fileName) && (
                                  <div className="max-w-[260px] relative group/vid">
                                    <video src={fileUrl} controls className="rounded-lg w-full" preload="metadata" />
                                    {/* Inline time on video */}
                                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5 pointer-events-none">
                                      <span className="text-[10px] text-white/90">{format(new Date(message.created_at), 'hh:mm a', { locale: ar })}</span>
                                      {getMessageStatus(message, isOwn)}
                                    </div>
                                  </div>
                                )}

                                {/* Voice Message */}
                                {message.message_type === 'file' && fileUrl && isVoiceMessage(fileName) && (
                                  <VoiceMessagePlayer 
                                    url={fileUrl} 
                                    isOwn={isOwn} 
                                    senderAvatar={message.sender?.avatar_url}
                                    senderName={message.sender?.full_name}
                                  />
                                )}

                                {/* Document */}
                                {message.message_type === 'file' && fileUrl && !isVoiceMessage(fileName) && !isVideoFile(fileName) && (
                                  <a 
                                    href={fileUrl} target="_blank" rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-center gap-2.5 p-2 rounded-lg min-w-[200px] transition-colors",
                                      isOwn ? "hover:bg-black/5" : "hover:bg-black/5"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                      isOwn ? "bg-[hsl(var(--wa-teal-green))]/20" : "bg-primary/10"
                                    )}>
                                      <FileIcon className={cn("w-5 h-5", isOwn ? "text-[hsl(var(--wa-teal-green))]" : "text-primary")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium truncate">{fileName}</p>
                                      <p className="text-[10px] text-[hsl(var(--wa-time))]">مستند • اضغط للتحميل</p>
                                    </div>
                                    <Download className="w-4 h-4 shrink-0 text-[hsl(var(--wa-time))]" />
                                  </a>
                                )}
                              </>
                            )}

                            {/* Timestamp & Status - inline at bottom-left (RTL: bottom-right) */}
                            {!isMediaOnly && (
                              <div className="flex items-center gap-1 justify-end -mb-0.5 mt-0.5 float-left ml-1" style={{ clear: 'both' }}>
                                <span className="text-[10px] text-[hsl(var(--wa-time))] leading-none">
                                  {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                                </span>
                                {getMessageStatus(message, isOwn)}
                              </div>
                            )}
                            {/* Clearfix for inline float */}
                            {!isMediaOnly && <div className="clear-both" />}
                          </div>

                          {/* Reactions */}
                          <MessageReactions
                            reactions={messageReactions}
                            onReact={(emoji) => toggleReaction(message.id, emoji)}
                            isOwn={isOwn}
                          />

                          {/* Message Actions - hover on desktop */}
                          {!isDeleted && (
                            <MessageActions
                              messageContent={message.content}
                              messageId={message.id}
                              isOwn={isOwn}
                              onReply={onReply ? () => onReply(message) : undefined}
                              onDelete={isOwn && onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                              onForward={onForwardMessage ? () => onForwardMessage(message.id) : undefined}
                              onPin={onPinMessage ? () => onPinMessage(message.id) : undefined}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );

                  return (
                    <div key={message.id}>
                      {/* Unread Divider */}
                      {isFirstUnread && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[11px] font-medium text-[hsl(var(--wa-teal-green))] bg-[hsl(var(--wa-teal-green))]/10 px-4 py-1 rounded-lg shadow-sm">
                            رسائل جديدة
                          </span>
                        </div>
                      )}

                      {/* Swipeable wrapper for reply */}
                      {onReply && !isDeleted ? (
                        <SwipeableMessage isOwn={isOwn} onSwipeReply={() => onReply(message)}>
                          {bubbleContent}
                        </SwipeableMessage>
                      ) : bubbleContent}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isPartnerTyping && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start mt-2">
              <div className="flex items-center gap-1.5">
                <div className="bg-[hsl(var(--wa-incoming))] rounded-lg rounded-tl-[4px] px-4 py-2.5 shadow-sm relative">
                  {/* Tail */}
                  <div className="absolute top-0 -left-[7px] w-2 h-[13px]">
                    <svg viewBox="0 0 8 13" width="8" height="13">
                      <path d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" fill="hsl(var(--wa-incoming))" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.span key={i} className="w-[7px] h-[7px] rounded-full bg-muted-foreground/50"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay }}
                      />
                    ))}
                  </div>
                </div>
                {partnerName && <span className="text-[10px] text-muted-foreground mr-1">{partnerName} يكتب...</span>}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom FAB - WhatsApp circle */}
      <AnimatePresence>
        {!isNearBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute bottom-3 left-4 z-10"
          >
            <button
              className="w-10 h-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center relative hover:bg-muted transition-colors"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="w-5 h-5 text-muted-foreground" />
              {newMessageCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[hsl(var(--wa-unread-badge))] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {newMessageCount}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default EnhancedChatMessages;
