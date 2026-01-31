import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  FileText, 
  Image as ImageIcon,
  Download,
  ExternalLink
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
                          {text && (
                            <p className={cn(
                              "whitespace-pre-wrap leading-relaxed",
                              isMobile ? "text-sm" : "text-sm"
                            )}>
                              {text}
                            </p>
                          )}

                          {/* Image */}
                          {message.message_type === 'image' && fileUrl && (
                            <div className="mt-2">
                              <img
                                src={fileUrl}
                                alt={fileName || 'صورة'}
                                className="rounded-lg max-w-[250px] cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(fileUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* File */}
                          {message.message_type === 'file' && fileUrl && (
                            <div className={cn(
                              "mt-2 flex items-center gap-2 p-2 rounded-lg",
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
