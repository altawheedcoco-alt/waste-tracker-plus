import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  FileText, 
  Download,
  Image as ImageIcon,
  Video,
  File,
  CheckCheck,
  Check,
  Clock
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage } from '@/hooks/useChat';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ImageLightbox from './ImageLightbox';
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
}

const EnhancedChatMessages = ({ 
  messages, 
  currentUserId, 
  roomName,
  onLoadMore,
  hasMore = false
}: EnhancedChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDisplayMode();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse message content for files
  const parseMessageContent = (message: ChatMessage) => {
    if (message.message_type === 'text') {
      return { text: message.content, fileUrl: null, fileName: null };
    }
    try {
      const parsed = JSON.parse(message.content);
      return {
        text: parsed.text || '',
        fileUrl: parsed.file_url,
        fileName: parsed.file_name
      };
    } catch {
      return { text: message.content, fileUrl: null, fileName: null };
    }
  };

  // Collect all images from messages for lightbox
  const allImages = useMemo(() => {
    return messages
      .filter(m => m.message_type === 'image')
      .map(m => {
        const { fileUrl } = parseMessageContent(m);
        return fileUrl;
      })
      .filter(Boolean) as string[];
  }, [messages]);

  const openImageLightbox = (imageUrl: string) => {
    const index = allImages.indexOf(imageUrl);
    setLightboxImages(allImages);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  // Detect file types
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

  // Group messages by date
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
    const today = new Date();

    if (isToday(date)) {
      return 'اليوم';
    } else if (isYesterday(date)) {
      return 'أمس';
    }
    return format(date, 'EEEE، d MMMM yyyy', { locale: ar });
  };

  const getMessageStatus = (message: ChatMessage, isOwn: boolean) => {
    if (!isOwn) return null;
    
    if (message.is_read) {
      return <CheckCheck className="w-4 h-4 text-primary" />;
    }
    return <Check className="w-4 h-4 text-muted-foreground" />;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 opacity-30" />
          </div>
          <p className="text-base font-medium">لا توجد رسائل</p>
          <p className="text-sm mt-1 max-w-[200px]">
            ابدأ المحادثة الآن مع {roomName || 'هذه الجهة'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className={cn("space-y-1", isMobile ? "p-3" : "p-4")}>
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-2">
              <button 
                onClick={onLoadMore}
                className="text-sm text-primary hover:underline"
              >
                تحميل رسائل سابقة
              </button>
            </div>
          )}

          {messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <span className="text-[11px] text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                  {formatDateLabel(group.date)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-1">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const { text, fileUrl, fileName } = parseMessageContent(message);
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    group.messages[index - 1]?.sender_id !== message.sender_id
                  );
                  const showName = showAvatar && message.sender;
                  const FileIcon = getFileIcon(fileName);

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn("flex", isOwn ? "justify-start" : "justify-end")}
                    >
                      <div className={cn(
                        "flex gap-2 max-w-[85%]",
                        isOwn ? "flex-row" : "flex-row-reverse"
                      )}>
                        {/* Avatar */}
                        {!isOwn && showAvatar ? (
                          <Avatar className={cn("shrink-0 mt-auto", isMobile ? "h-7 w-7" : "h-8 w-8")}>
                            <AvatarImage src={message.sender?.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-xs">
                              {message.sender?.full_name?.[0] || '؟'}
                            </AvatarFallback>
                          </Avatar>
                        ) : !isOwn ? (
                          <div className={cn(isMobile ? "w-7" : "w-8")} />
                        ) : null}

                        {/* Message Bubble */}
                        <div className="space-y-0.5">
                          {/* Sender Name */}
                          {showName && (
                            <p className="text-[11px] text-muted-foreground text-right pr-3">
                              {message.sender?.full_name}
                            </p>
                          )}

                          {/* Content */}
                          <div
                            className={cn(
                              "rounded-2xl overflow-hidden shadow-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tr-md"
                                : "bg-muted rounded-tl-md",
                              // Padding varies by content type
                              message.message_type === 'image' ? "p-1" : "px-3 py-2"
                            )}
                          >
                            {/* Text Message */}
                            {message.message_type === 'text' && (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {text}
                              </p>
                            )}

                            {/* Image Message */}
                            {message.message_type === 'image' && fileUrl && (
                              <div 
                                className="cursor-pointer group relative"
                                onClick={() => openImageLightbox(fileUrl)}
                              >
                                <img
                                  src={fileUrl}
                                  alt={fileName || 'صورة'}
                                  className="rounded-xl max-w-[280px] max-h-[300px] object-cover transition-transform group-hover:scale-[1.02]"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                              </div>
                            )}

                            {/* Video Message */}
                            {message.message_type === 'file' && fileUrl && isVideoFile(fileName) && (
                              <div className="max-w-[280px]">
                                <video
                                  src={fileUrl}
                                  controls
                                  className="rounded-xl w-full"
                                  preload="metadata"
                                />
                              </div>
                            )}

                            {/* Voice Message */}
                            {message.message_type === 'file' && fileUrl && isVoiceMessage(fileName) && (
                              <VoiceMessagePlayer url={fileUrl} isOwn={isOwn} />
                            )}

                            {/* Regular File */}
                            {message.message_type === 'file' && fileUrl && !isVoiceMessage(fileName) && !isVideoFile(fileName) && (
                              <a 
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-xl min-w-[200px] transition-colors",
                                  isOwn 
                                    ? "hover:bg-primary-foreground/10" 
                                    : "hover:bg-background/50"
                                )}
                              >
                                <div className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                                  isOwn ? "bg-primary-foreground/20" : "bg-primary/10"
                                )}>
                                  <FileIcon className={cn(
                                    "w-5 h-5",
                                    isOwn ? "text-primary-foreground" : "text-primary"
                                  )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {fileName}
                                  </p>
                                  <p className={cn(
                                    "text-[11px]",
                                    isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                                  )}>
                                    مستند • اضغط للتحميل
                                  </p>
                                </div>
                                <Download className={cn(
                                  "w-4 h-4 shrink-0",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )} />
                              </a>
                            )}
                          </div>

                          {/* Time & Status */}
                          <div className={cn(
                            "flex items-center gap-1 px-2",
                            isOwn ? "justify-start" : "justify-end"
                          )}>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                            </span>
                            {getMessageStatus(message, isOwn)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Image Lightbox */}
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
