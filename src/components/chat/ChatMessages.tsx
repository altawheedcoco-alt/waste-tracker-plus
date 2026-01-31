import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  FileText, 
  Image as ImageIcon,
  Download,
  Play,
  Pause,
  Video,
  Mic
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/hooks/useChat';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  roomName?: string;
}

// Voice Message Player Component
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
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg min-w-[180px]",
      isOwn ? "bg-primary-foreground/10" : "bg-background/50"
    )}>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-full shrink-0",
          isOwn ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" : "bg-emerald-500/20 hover:bg-emerald-500/30"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className={cn("w-4 h-4", isOwn ? "text-primary-foreground" : "text-emerald-600")} />
        ) : (
          <Play className={cn("w-4 h-4", isOwn ? "text-primary-foreground" : "text-emerald-600")} />
        )}
      </Button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isOwn ? "bg-primary-foreground/50" : "bg-emerald-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={cn(
          "text-[10px] mt-1",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatDuration(duration)}
        </p>
      </div>
      <Mic className={cn(
        "w-4 h-4 shrink-0",
        isOwn ? "text-primary-foreground/50" : "text-emerald-500/50"
      )} />
    </div>
  );
};

const ChatMessages = ({ messages, currentUserId, roomName }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDisplayMode();

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
                          {text && message.message_type === 'text' && (
                            <p className={cn(
                              "whitespace-pre-wrap leading-relaxed",
                              isMobile ? "text-sm" : "text-sm"
                            )}>
                              {text}
                            </p>
                          )}

                          {/* Image */}
                          {message.message_type === 'image' && fileUrl && (
                            <div className="mt-1">
                              <img
                                src={fileUrl}
                                alt={fileName || 'صورة'}
                                className="rounded-lg max-w-[280px] cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(fileUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* Video */}
                          {message.message_type === 'file' && fileUrl && isVideoFile(fileName) && (
                            <div className="mt-1">
                              <video
                                src={fileUrl}
                                controls
                                className="rounded-lg max-w-[280px]"
                              />
                            </div>
                          )}

                          {/* Voice Message */}
                          {message.message_type === 'file' && fileUrl && isVoiceMessage(fileName) && (
                            <VoiceMessagePlayer url={fileUrl} isOwn={isOwn} />
                          )}

                          {/* Regular File */}
                          {message.message_type === 'file' && fileUrl && !isVoiceMessage(fileName) && !isVideoFile(fileName) && (
                            <div className={cn(
                              "flex items-center gap-2 p-2 rounded-lg",
                              isOwn ? "bg-primary-foreground/10" : "bg-background/50"
                            )}>
                              <FileText className="w-8 h-8 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fileName}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0"
                                onClick={() => window.open(fileUrl, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <p className={cn(
                          "text-[10px] text-muted-foreground px-2",
                          isOwn ? "text-left" : "text-right"
                        )}>
                          {format(new Date(message.created_at), 'HH:mm', { locale: ar })}
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
    </ScrollArea>
  );
};

export default ChatMessages;
