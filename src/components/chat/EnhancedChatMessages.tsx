import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/hooks/useChat';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ImageLightbox from './ImageLightbox';
import MessageActions from './MessageActions';
import MessageReactions from './MessageReactions';
import ChatMessageCardRenderer from './ChatMessageCardRenderer';
import ChatMentionRenderer from './ChatMentionRenderer';
import { QuotedReply } from './ReplyPreview';
import { useChatReactions } from '@/hooks/useChatReactions';
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
          URL_REGEX.lastIndex = 0; // Reset regex state
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
                isOwn ? "text-white/90 hover:text-white" : "text-primary hover:text-primary/80"
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

  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { reactionsMap, toggleReaction } = useChatReactions(messageIds);

  // Smart scroll: only auto-scroll when near bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setNewMessageCount(0);
  }, []);

  // Track scroll position
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
      // New message arrived while user is scrolled up
      setNewMessageCount(prev => prev + 1);
    }
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom('instant');
  }, []);

  // Scroll for typing indicator
  useEffect(() => {
    if (isPartnerTyping && isNearBottom) {
      scrollToBottom();
    }
  }, [isPartnerTyping, isNearBottom, scrollToBottom]);

  // Scroll to specific message (for search)
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
    if (optStatus === 'sending') {
      return <Loader2 className="w-[14px] h-[14px] text-wa-time animate-spin" />;
    }
    if (optStatus === 'failed') {
      return <span className="text-[10px] text-destructive">!</span>;
    }
    
    if (message.is_read) return <CheckCheck className="w-[14px] h-[14px] text-sky-500" />;
    
    const msgStatus = (message as any).message_status || (message as any).status;
    if (msgStatus === 'delivered') return <CheckCheck className="w-[14px] h-[14px] text-wa-time" />;
    
    return <Check className="w-[14px] h-[14px] text-wa-time" />;
  };

  const findMessage = (id: string) => messages.find(m => m.id === id);

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-8 h-8 text-emerald-500/50" />
          </div>
          <p className="text-sm font-medium text-foreground/70">لا توجد رسائل بعد</p>
          <p className="text-xs mt-1.5 text-muted-foreground max-w-[220px]">
            ابدأ المحادثة الآن مع {roomName || 'هذه الجهة'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Lock className="w-3 h-3" />
            الرسائل محمية وآمنة
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="h-full overflow-y-auto relative bg-wa-chat-bg" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'thin',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '2a3a35' : 'c8d6cf'}' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className={cn("space-y-0.5", isMobile ? "p-3" : "p-4")}>
          {hasMore && (
            <div className="text-center py-2">
              <button onClick={onLoadMore} className="text-xs text-emerald-600 hover:underline bg-white/80 px-3 py-1 rounded-full shadow-sm">
                تحميل رسائل سابقة
              </button>
            </div>
          )}

          {messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-border/30">
                  {formatDateLabel(group.date)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-1">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const { text, fileUrl, fileName } = parseMessageContent(message);
                  const showAvatar = !isOwn && (
                    index === 0 || group.messages[index - 1]?.sender_id !== message.sender_id
                  );
                  const FileIcon = getFileIcon(fileName);
                  const messageReactions = reactionsMap[message.id] || [];
                  const isFirstUnread = message.id === firstUnreadMessageId;

                  // Check if message is a reply
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
                  } catch {
                    // not a JSON message
                  }

                  // Check if message is deleted
                  const isDeleted = message.message_type === 'system' && message.content.includes('تم حذف');

                  return (
                    <div key={message.id}>
                      {/* Unread Messages Divider */}
                      {isFirstUnread && (
                        <div className="flex items-center justify-center my-3 gap-3">
                          <div className="flex-1 h-px bg-primary/30" />
                          <span className="text-[11px] font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                            رسائل جديدة
                          </span>
                          <div className="flex-1 h-px bg-primary/30" />
                        </div>
                      )}

                      <motion.div
                        id={`msg-${message.id}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.12 }}
                        className={cn("flex group", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "flex gap-1.5 max-w-[82%]",
                          isOwn ? "flex-row-reverse" : "flex-row"
                        )}>
                          {/* Avatar */}
                          {!isOwn && showAvatar ? (
                            <Avatar className="h-7 w-7 shrink-0 mt-auto">
                              <AvatarImage src={message.sender?.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-[10px]">
                                {message.sender?.full_name?.[0] || '؟'}
                              </AvatarFallback>
                            </Avatar>
                          ) : !isOwn ? (
                            <div className="w-7" />
                          ) : null}

                          {/* Message Bubble + Reactions */}
                          <div className="relative">
                            <div
                              className={cn(
                                "rounded-lg overflow-hidden relative",
                                isDeleted
                                  ? "bg-muted/50 border border-border/30 italic"
                                  : isOwn
                                    ? "bg-wa-outgoing text-wa-outgoing-foreground rounded-tr-none"
                                    : "bg-wa-incoming text-wa-incoming-foreground border border-border/20 rounded-tl-none shadow-sm",
                                message.message_type === 'image' ? "p-1" : "px-3 py-1.5"
                              )}
                            >
                              {/* Quoted Reply */}
                              {replyContent && replySender && (
                                <QuotedReply senderName={replySender} content={replyContent} isOwn={isOwn} />
                              )}

                              {/* Sender Name */}
                              {!isOwn && showAvatar && message.sender && !isDeleted && (
                                <p className="text-[11px] text-primary font-semibold mb-0.5">
                                  {message.sender.full_name}
                                </p>
                              )}

                              {/* Deleted message */}
                              {isDeleted ? (
                                <p className="text-[13px] text-muted-foreground">🚫 تم حذف هذه الرسالة</p>
                              ) : (
                                <>
                                  {/* Text - check if it's a resource card first */}
                                  {message.message_type === 'text' && (() => {
                                    try {
                                      const parsed = JSON.parse(text);
                                      if (parsed.resource_type && parsed.resource_data) {
                                        return (
                                          <ChatMessageCardRenderer
                                            resourceType={parsed.resource_type}
                                            resourceData={parsed.resource_data}
                                            isOwn={isOwn}
                                          />
                                        );
                                      }
                                    } catch { /* not JSON, render as text */ }
                                    // Check for broadcast channel links
                                    const bcMatch = text.match(/\/dashboard\/broadcast-channels\?channel=([a-f0-9-]+)(?:&post=([a-f0-9-]+))?/);
                                    if (bcMatch) {
                                      const linkChannelId = bcMatch[1];
                                      const linkPostId = bcMatch[2];
                                      const textWithoutLink = text.replace(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels[^\s]*/g, '').trim();
                                      return (
                                        <div>
                                          {textWithoutLink && (
                                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed mb-2">
                                              <ChatMentionRenderer text={textWithoutLink} isOwn={isOwn} />
                                            </p>
                                          )}
                                          <button
                                            onClick={() => navigate(`/dashboard/broadcast-channels?channel=${linkChannelId}${linkPostId ? `&post=${linkPostId}` : ''}`)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-right"
                                          >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                              <Radio className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[13px] font-semibold text-foreground">📡 {linkPostId ? 'منشور من قناة البث' : 'قناة بث'}</p>
                                              <p className="text-[11px] text-muted-foreground">اضغط لفتح القناة</p>
                                            </div>
                                          </button>
                                        </div>
                                      );
                                    }
                                    return (
                                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                                        <ChatMentionRenderer text={text} isOwn={isOwn} />
                                      </p>
                                    );
                                  })()}

                                  {/* Resource Card */}
                                  {(message.message_type as string) === 'resource_card' && (() => {
                                    try {
                                      const parsed = JSON.parse(message.content);
                                      if (parsed.resource_type && parsed.resource_data) {
                                        return (
                                          <ChatMessageCardRenderer
                                            resourceType={parsed.resource_type}
                                            resourceData={parsed.resource_data}
                                            isOwn={isOwn}
                                          />
                                        );
                                      }
                                    } catch { /* not a card */ }
                                    return null;
                                  })()}

                                  {/* Image */}
                                  {message.message_type === 'image' && fileUrl && (
                                    <div className="cursor-pointer group/img relative" onClick={() => openImageLightbox(fileUrl)}>
                                      <img src={fileUrl} alt={fileName || 'صورة'} className="rounded-xl max-w-[260px] max-h-[280px] object-cover" loading="lazy" />
                                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-xl transition-colors" />
                                    </div>
                                  )}

                                  {/* Video */}
                                  {message.message_type === 'file' && fileUrl && isVideoFile(fileName) && (
                                    <div className="max-w-[260px]">
                                      <video src={fileUrl} controls className="rounded-xl w-full" preload="metadata" />
                                    </div>
                                  )}

                                  {/* Voice */}
                                  {message.message_type === 'file' && fileUrl && isVoiceMessage(fileName) && (
                                    <VoiceMessagePlayer url={fileUrl} isOwn={isOwn} />
                                  )}

                                  {/* Regular File */}
                                  {message.message_type === 'file' && fileUrl && !isVoiceMessage(fileName) && !isVideoFile(fileName) && (
                                    <a 
                                      href={fileUrl} target="_blank" rel="noopener noreferrer"
                                      className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl min-w-[200px] transition-colors",
                                        isOwn ? "hover:bg-white/10" : "hover:bg-muted"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        isOwn ? "bg-white/20" : "bg-emerald-500/10"
                                      )}>
                                        <FileIcon className={cn("w-5 h-5", isOwn ? "text-white" : "text-emerald-600")} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium truncate">{fileName}</p>
                                        <p className={cn("text-[10px]", isOwn ? "text-white/60" : "text-muted-foreground")}>
                                          مستند • اضغط للتحميل
                                        </p>
                                      </div>
                                      <Download className={cn("w-4 h-4 shrink-0", isOwn ? "text-white/60" : "text-muted-foreground")} />
                                    </a>
                                  )}
                                </>
                              )}

                              {/* Timestamp & Status */}
                              <div className="flex items-center gap-1 mt-0.5 justify-end">
                                <span className="text-[10px] text-wa-time">
                                  {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                                </span>
                                {getMessageStatus(message, isOwn)}
                              </div>
                            </div>

                            {/* Reactions */}
                            <MessageReactions
                              reactions={messageReactions}
                              onReact={(emoji) => toggleReaction(message.id, emoji)}
                              isOwn={isOwn}
                            />

                            {/* Message Actions */}
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isPartnerTyping && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="flex items-center gap-1.5">
                <div className="bg-background border border-border/50 rounded-2xl rounded-tr-[4px] px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.span key={i} className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay }}
                      />
                    ))}
                  </div>
                </div>
                {partnerName && <span className="text-[10px] text-muted-foreground">{partnerName} يكتب...</span>}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {!isNearBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg gap-1 h-8 px-3 bg-background border border-border hover:bg-muted"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              {newMessageCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {newMessageCount}
                </span>
              )}
            </Button>
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
