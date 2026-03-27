import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getTabChannelName } from '@/lib/tabSession';
import { soundEngine } from '@/lib/soundEngine';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  message_type: string;
  created_at: string;
  sender_name?: string;
}

const MeetingChat = ({ meetingId }: { meetingId: string }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('video_meeting_messages')
        .select('*, sender:profiles!video_meeting_messages_sender_id_fkey(full_name)')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          ...m,
          sender_name: m.sender?.full_name || 'مستخدم',
        })));
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(getTabChannelName(`meeting-chat-${meetingId}`))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'video_meeting_messages',
        filter: `meeting_id=eq.${meetingId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        // Fetch sender name
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', msg.sender_id)
          .single();

        setMessages(prev => [...prev, {
          ...msg,
          sender_name: sender?.full_name || 'مستخدم',
        }]);
        soundEngine.play('message_received');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || sending) return;
    setSending(true);

    await supabase.from('video_meeting_messages').insert({
      meeting_id: meetingId,
      sender_id: user.id,
      content: input.trim(),
      message_type: 'text',
    });

    setInput('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex gap-2", isMine ? "flex-row" : "flex-row-reverse")}>
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="text-[9px] bg-emerald-600 text-white">
                    {(msg.sender_name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "max-w-[80%] rounded-lg px-2.5 py-1.5",
                  isMine ? "bg-emerald-600/30 text-emerald-100" : "bg-white/10 text-white/90"
                )}>
                  {!isMine && (
                    <p className="text-[9px] text-emerald-400 font-medium mb-0.5">{msg.sender_name}</p>
                  )}
                  <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className="text-[8px] text-white/40 mt-0.5 block">
                    {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-white/10 flex gap-1.5">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-white/5 border-white/10 text-white text-xs placeholder:text-white/30 h-8"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default MeetingChat;
