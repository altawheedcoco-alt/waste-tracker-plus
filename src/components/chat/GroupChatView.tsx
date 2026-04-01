import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowRight, Send, Paperclip, MoreVertical,
  UserPlus, Settings, LogOut, Pin, Loader2, Crown, Info,
  BarChart3, Image as ImageIcon, Smile, AtSign, Search, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMentionRenderer from './ChatMentionRenderer';
import ChatPollCard from './ChatPollCard';
import CreatePollDialog from './CreatePollDialog';
import { useChatPolls } from '@/hooks/useChatPolls';
import { soundEngine } from '@/lib/soundEngine';

interface GroupChatViewProps {
  room: ChatRoom;
  onBack: () => void;
}

const GroupChatView = ({ room, onBack }: GroupChatViewProps) => {
  const { user } = useAuth();
  const { sendRoomMessage, fetchRoomMessages } = useGroupChat();
  const { polls, vote, createPoll, closePoll } = useChatPolls(room.id);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch participants
  const { data: participants = [] } = useQuery({
    queryKey: ['group-participants', room.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_participants')
        .select('user_id, role')
        .eq('room_id', room.id);
      if (!data?.length) return [];
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      return data.map(p => ({
        ...p,
        profile: profiles?.find(pr => pr.user_id === p.user_id),
      }));
    },
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['group-messages', room.id],
    queryFn: () => fetchRoomMessages(room.id),
    refetchInterval: 3000,
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
    const text = inputValue.trim();
    setSending(true);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      await sendRoomMessage(room.id, text);
      soundEngine.play('message_sent');
      queryClient.invalidateQueries({ queryKey: ['group-messages', room.id] });
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
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

  const onlineCount = participants.length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground shrink-0 shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => setShowMembers(!showMembers)}>
          <h3 className="font-bold text-sm truncate">{room.name}</h3>
          <p className="text-[11px] text-primary-foreground/70">{onlineCount} عضو</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15"
            onClick={() => setShowPollDialog(true)}
            title="إنشاء تصويت"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" dir="rtl">
              <DropdownMenuItem onClick={() => setShowMembers(!showMembers)}>
                <Users className="w-4 h-4 ml-2" />الأعضاء ({onlineCount})
              </DropdownMenuItem>
              <DropdownMenuItem><Info className="w-4 h-4 ml-2" />معلومات المجموعة</DropdownMenuItem>
              <DropdownMenuItem><UserPlus className="w-4 h-4 ml-2" />إضافة أعضاء</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 ml-2" />مغادرة المجموعة</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members panel (collapsible) */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-muted/30"
          >
            <div className="p-3 flex gap-2 overflow-x-auto">
              {participants.map(p => (
                <div key={p.user_id} className="flex flex-col items-center gap-1 min-w-[56px]">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={p.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {p.profile?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground truncate w-14 text-center">
                    {p.profile?.full_name?.split(' ')[0] || 'عضو'}
                  </span>
                  {p.role === 'admin' && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1" dir="rtl">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active polls at top */}
            {polls.filter(p => !p.is_closed).length > 0 && (
              <div className="mb-4 space-y-2">
                {polls.filter(p => !p.is_closed).map(poll => (
                  <ChatPollCard
                    key={poll.id}
                    poll={poll}
                    currentUserId={user?.id || ''}
                    onVote={(pollId, optionIndex) => vote({ pollId, optionIndex })}
                    onClose={closePoll}
                  />
                ))}
              </div>
            )}

            {groupByDate(messages).map(group => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-3">
                  <span className="text-[11px] text-muted-foreground bg-muted/80 px-3 py-1 rounded-lg shadow-sm border border-border/30">
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
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn("flex mb-1", isOwn ? "justify-start" : "justify-end")}
                    >
                      <div className={cn("max-w-[80%]", isOwn ? "items-start" : "items-end")}>
                        {showSender && (
                          <p className="text-[11px] text-primary font-semibold mb-0.5 px-3">
                            {msg.sender?.full_name || 'مستخدم'}
                            {msg.sender?.organization_name && (
                              <span className="text-muted-foreground font-normal mr-1">• {msg.sender.organization_name}</span>
                            )}
                          </p>
                        )}
                        <div className={cn(
                          "rounded-2xl px-3 py-2 shadow-sm",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-[4px]"
                            : "bg-card border border-border/50 rounded-bl-[4px]"
                        )}>
                          <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
                            <ChatMentionRenderer text={msg.content} isOwn={isOwn} />
                          </p>
                          <span className={cn(
                            "text-[10px] block text-left mt-1",
                            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background p-2 shrink-0" dir="rtl">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-2xl bg-muted/40 border border-border/50 px-3 py-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextChange}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="اكتب رسالة للمجموعة..."
              className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-sm min-h-[36px] max-h-[100px] resize-none py-2"
              rows={1}
              dir="rtl"
            />
          </div>
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shrink-0 transition-all",
              inputValue.trim()
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
            disabled={!inputValue.trim() || sending}
            onClick={handleSend}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Poll dialog */}
      <CreatePollDialog
        open={showPollDialog}
        onOpenChange={setShowPollDialog}
        onCreatePoll={(data) => {
          createPoll({
            question: data.question,
            options: data.options,
            roomId: room.id,
            isAnonymous: data.isAnonymous,
          });
          setShowPollDialog(false);
        }}
      />
    </div>
  );
};

export default GroupChatView;
