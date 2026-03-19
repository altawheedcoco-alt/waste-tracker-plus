import { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage } from '@/hooks/useChat';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ImageLightbox from './ImageLightbox';
import MessageActions from './MessageActions';
import MessageReactions from './MessageReactions';
import { QuotedReply } from './ReplyPreview';
import { useChatReactions } from '@/hooks/useChatReactions';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useDisplayMode } from '@/hooks/useDisplayMode';
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
}

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
}: EnhancedChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDisplayMode();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { reactionsMap, toggleReaction } = useChatReactions(messageIds);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

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
    if (message.is_read) return <CheckCheck className="w-[14px] h-[14px] text-sky-400" />;
    return <Check className="w-[14px] h-[14px] text-white/50" />;
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
      <ScrollArea className="h-full" ref={scrollRef}>
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

                  return (
                    <motion.div
                      key={message.id}
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
                              "rounded-2xl overflow-hidden shadow-sm relative",
                              isOwn
                                ? "bg-emerald-600 text-white rounded-tl-[4px]"
                                : "bg-background border border-border/50 rounded-tr-[4px]",
                              message.message_type === 'image' ? "p-1" : "px-3 py-2"
                            )}
                          >
                            {/* Quoted Reply */}
                            {replyContent && replySender && (
                              <QuotedReply senderName={replySender} content={replyContent} isOwn={isOwn} />
                            )}

                            {/* Sender Name */}
                            {!isOwn && showAvatar && message.sender && (
                              <p className="text-[11px] text-emerald-600 font-semibold mb-0.5">
                                {message.sender.full_name}
                              </p>
                            )}

                            {/* Text */}
                            {message.message_type === 'text' && (
                              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{text}</p>
                            )}

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

                            {/* Timestamp & Status */}
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <span className={cn("text-[10px]", isOwn ? "text-white/60" : "text-muted-foreground")}>
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
                          <MessageActions
                            messageContent={message.content}
                            messageId={message.id}
                            isOwn={isOwn}
                            onReply={onReply ? () => onReply(message) : undefined}
                            onDelete={isOwn && onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                            onForward={onForwardMessage ? () => onForwardMessage(message.id) : undefined}
                          />
                        </div>
                      </div>
                    </motion.div>
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
      </ScrollArea>

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
