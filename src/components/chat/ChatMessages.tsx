import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  FileText, 
  Download,
  Play,
  Pause,
  X,
  Radio,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatMessage } from '@/hooks/useChat';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';
import { useAppNavigate } from '@/hooks/useAppNavigate';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  roomName?: string;
}

// Voice Message Player Component - WhatsApp Style
const VoiceMessagePlayer = ({ url, isOwn }: { url: string; isOwn: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white fill-white" />
        )}
      </Button>
      <div className="flex-1">
        {/* WhatsApp-style waveform bars */}
        <div className="flex items-center gap-[2px] h-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-all",
                i < (progress / 100) * 30
                  ? isOwn ? "bg-emerald-200" : "bg-emerald-500"
                  : isOwn ? "bg-white/30" : "bg-muted-foreground/30"
              )}
              style={{ height: `${Math.random() * 16 + 8}px` }}
            />
          ))}
        </div>
        <p className={cn(
          "text-[11px] mt-1",
          isOwn ? "text-white/70" : "text-muted-foreground"
        )}>
          {formatDuration(duration)}
        </p>
      </div>
    </div>
  );
};

const ChatMessages = ({ messages, currentUserId, roomName }: ChatMessagesProps) => {
  const navigate = useAppNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDisplayMode();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto-scroll to bottom
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

  // Detect if file is audio/voice message
  const isVoiceMessage = (fileName: string | null) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['webm', 'mp3', 'wav', 'ogg', 'm4a'].includes(ext || '');
  };

  // Detect if file is video
  const isVideoFile = (fileName: string | null) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '');
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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === format(today, 'yyyy-MM-dd')) {
      return 'اليوم';
    } else if (dateStr === format(yesterday, 'yyyy-MM-dd')) {
      return 'أمس';
    }
    return format(date, 'EEEE، d MMMM yyyy', { locale: ar });
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-3 opacity-20" size={48} />
          <p className="text-base font-medium">لا توجد رسائل</p>
          <p className="text-sm mt-1">ابدأ المحادثة الآن مع {roomName || 'هذه الجهة'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className={cn("space-y-4", isMobile ? "p-3" : "p-4")}>
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                {formatDateLabel(group.date)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {group.messages.map((message, index) => {
                const isOwn = message.sender_id === currentUserId;
                const { text, fileUrl, fileName } = parseMessageContent(message);
                const showAvatar = !isOwn && (
                  index === 0 || 
                  group.messages[index - 1]?.sender_id !== message.sender_id
                );

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn("flex", isOwn ? "justify-start" : "justify-end")}
                  >
                    <div className={cn(
                      "flex gap-2 max-w-[85%]",
                      isOwn ? "flex-row" : "flex-row-reverse"
                    )}>
                      {/* Avatar */}
                      {!isOwn && showAvatar ? (
                        <Avatar className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}>
                          <AvatarImage src={message.sender?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {message.sender?.full_name?.[0] || '؟'}
                          </AvatarFallback>
                        </Avatar>
                      ) : !isOwn ? (
                        <div className={cn(isMobile ? "w-8" : "w-9")} />
                      ) : null}

                      {/* Message Bubble */}
                      <div className="space-y-1">
                        {/* Sender Name */}
                        {!isOwn && showAvatar && message.sender && (
                          <p className="text-xs text-muted-foreground text-right pr-2">
                            {message.sender.full_name}
                          </p>
                        )}

                        {/* Content */}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 shadow-sm",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-md"
                              : "bg-muted rounded-tl-md"
                          )}
                        >
                          {/* Text */}
                          {text && message.message_type === 'text' && (() => {
                            const bcMatch = text.match(/\/dashboard\/broadcast-channels\?channel=([a-f0-9-]+)(?:&post=([a-f0-9-]+))?/);
                            if (bcMatch) {
                              const linkChannelId = bcMatch[1];
                              const linkPostId = bcMatch[2];
                              const textWithoutLink = text.replace(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels[^\s]*/g, '').trim();
                              return (
                                <div>
                                  {textWithoutLink && <p className="whitespace-pre-wrap leading-relaxed text-sm mb-2">{textWithoutLink}</p>}
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
                            return <p className="whitespace-pre-wrap leading-relaxed text-sm">{text}</p>;
                          })()}

                          {/* Image - WhatsApp Style */}
                          {message.message_type === 'image' && fileUrl && (
                            <img
                              src={fileUrl}
                              alt={fileName || 'صورة'}
                              className="rounded-lg max-w-[250px] cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setPreviewImage(fileUrl)}
                            />
                          )}

                          {/* Video - WhatsApp Style */}
                          {message.message_type === 'file' && fileUrl && isVideoFile(fileName) && (
                            <div className="relative max-w-[250px]">
                              <video
                                src={fileUrl}
                                controls
                                className="rounded-lg w-full"
                              />
                            </div>
                          )}

                          {/* Voice Message - WhatsApp Style */}
                          {message.message_type === 'file' && fileUrl && isVoiceMessage(fileName) && (
                            <VoiceMessagePlayer url={fileUrl} isOwn={isOwn} />
                          )}

                          {/* Regular File - WhatsApp Style */}
                          {message.message_type === 'file' && fileUrl && !isVoiceMessage(fileName) && !isVideoFile(fileName) && (
                            <div 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer min-w-[200px]",
                                isOwn ? "bg-white/10" : "bg-background"
                              )}
                              onClick={() => window.open(fileUrl, '_blank')}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                isOwn ? "bg-white/20" : "bg-primary/10"
                              )}>
                                <FileText className={cn("w-5 h-5", isOwn ? "text-white" : "text-primary")} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  isOwn ? "text-white" : "text-foreground"
                                )}>{fileName}</p>
                                <p className={cn(
                                  "text-xs",
                                  isOwn ? "text-white/60" : "text-muted-foreground"
                                )}>مستند</p>
                              </div>
                              <Download className={cn("w-5 h-5 shrink-0", isOwn ? "text-white/70" : "text-muted-foreground")} />
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <p className={cn(
                          "text-[10px] text-muted-foreground px-2",
                          isOwn ? "text-left" : "text-right"
                        )}>
                          {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                        </p>
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

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            <AnimatePresence>
              {previewImage && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={previewImage}
                  alt="معاينة الصورة"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};

export default ChatMessages;
