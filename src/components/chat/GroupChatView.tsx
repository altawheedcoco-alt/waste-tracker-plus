import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowRight, Send, Paperclip, MoreVertical,
  UserPlus, Settings, LogOut, Pin, Loader2, Crown, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGroupChat, ChatRoom, GroupMessage } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GroupChatViewProps {
  room: ChatRoom;
  onBack: () => void;
}

const GroupChatView = ({ room, onBack }: GroupChatViewProps) => {
  const { user } = useAuth();
  const { sendRoomMessage, fetchRoomMessages } = useGroupChat();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['group-messages', room.id],
    queryFn: () => fetchRoomMessages(room.id),
    refetchInterval: 5000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group-${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['group-messages', room.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    setSending(true);
    try {
      await sendRoomMessage(room.id, inputValue.trim());
      setInputValue('');
      queryClient.invalidateQueries({ queryKey: ['group-messages', room.id] });
    } finally {
      setSending(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'اليوم';
    if (isYesterday(date)) return 'أمس';
    return format(date, 'EEEE، d MMMM', { locale: ar });
  };

  const groupByDate = (msgs: GroupMessage[]) => {
    const groups: { date: string; messages: GroupMessage[] }[] = [];
    let currentDate = '';
    msgs.forEach(msg => {
      const d = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-white hover:bg-white/15">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{room.name}</h3>
          <p className="text-[11px] text-emerald-200">{room.participant_count} عضو</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><Info className="w-4 h-4 ml-2" />معلومات المجموعة</DropdownMenuItem>
            <DropdownMenuItem><UserPlus className="w-4 h-4 ml-2" />إضافة أعضاء</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 ml-2" />مغادرة المجموعة</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          groupByDate(messages).map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-muted-foreground bg-background/90 px-3 py-1 rounded-lg shadow-sm border border-border/30">
                  {formatDateLabel(group.date)}
                </span>
              </div>
              {group.messages.map((msg, i) => {
                const isOwn = msg.sender_id === user?.id;
                const isSystem = msg.message_type === 'system';
                const showSender = !isOwn && !isSystem && (
                  i === 0 || group.messages[i - 1]?.sender_id !== msg.sender_id
                );

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                      {showSender && (
                        <p className="text-[11px] text-emerald-600 font-semibold mb-0.5 px-3">
                          {msg.sender?.full_name || 'مستخدم'}
                          {msg.sender?.organization_name && (
                            <span className="text-muted-foreground font-normal mr-1">• {msg.sender.organization_name}</span>
                          )}
                        </p>
                      )}
                      <div className={cn(
                        "rounded-2xl px-3 py-2 shadow-sm",
                        isOwn
                          ? "bg-emerald-600 text-white rounded-tl-[4px]"
                          : "bg-background border border-border/50 rounded-tr-[4px]"
                      )}>
                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className={cn("text-[10px] block text-left mt-1", isOwn ? "text-white/60" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-3xl bg-muted/50 border border-border/50 px-3 py-1">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="اكتب رسالة للمجموعة..."
              className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-sm"
              dir="rtl"
            />
          </div>
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shrink-0 transition-all",
              inputValue.trim() ? "bg-emerald-600 hover:bg-emerald-700" : "bg-muted"
            )}
            disabled={!inputValue.trim() || sending}
            onClick={handleSend}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatView;
