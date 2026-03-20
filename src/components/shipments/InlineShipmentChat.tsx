import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { emitChatSync } from '@/lib/chatSyncBus';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, ExternalLink, ChevronUp, MessageCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InlineShipmentChatProps {
  partnerOrgId: string;
  partnerName: string;
  shipmentId: string;
  onBack?: () => void;
}

interface SimpleMessage {
  id: string;
  sender_id: string;
  sender_organization_id: string | null;
  receiver_organization_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

const InlineShipmentChat = ({ partnerOrgId, partnerName, shipmentId, onBack }: InlineShipmentChatProps) => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const myOrgId = organization?.id;

  // Fetch messages
  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!myOrgId) return;
    setLoading(true);
    try {
      const query = supabase
        .from('direct_messages')
        .select('id, sender_id, sender_organization_id, receiver_organization_id, content, message_type, created_at, is_read')
        .or(
          `and(sender_organization_id.eq.${myOrgId},receiver_organization_id.eq.${partnerOrgId}),and(sender_organization_id.eq.${partnerOrgId},receiver_organization_id.eq.${myOrgId})`
        )
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        setHasMore(data.length > PAGE_SIZE);
        const trimmed = data.slice(0, PAGE_SIZE).reverse();
        
        // Fetch sender names
        const senderIds = [...new Set(trimmed.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);
        
        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setMessages(trimmed.map(m => ({
          ...m,
          sender_name: nameMap.get(m.sender_id) || 'مستخدم',
        })));

        // Mark unread as read
        const unreadIds = trimmed
          .filter(m => !m.is_read && m.sender_organization_id === partnerOrgId)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('direct_messages').update({ is_read: true }).in('id', unreadIds);
          emitChatSync({ type: 'messages-read', partnerOrgId });
        }
      }
    } catch (err) {
      console.error('Inline chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [myOrgId, partnerOrgId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!myOrgId) return;
    const channel = supabase
      .channel(`inline-chat-${myOrgId}-${partnerOrgId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      }, async (payload) => {
        const msg = payload.new as any;
        const isRelevant =
          (msg.sender_organization_id === myOrgId && msg.receiver_organization_id === partnerOrgId) ||
          (msg.sender_organization_id === partnerOrgId && msg.receiver_organization_id === myOrgId);
        if (!isRelevant) return;

        // Get sender name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', msg.sender_id)
          .single();

        const newMsg: SimpleMessage = {
          ...msg,
          sender_name: profile?.full_name || 'مستخدم',
        };

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Auto-mark as read if from partner
        if (msg.sender_organization_id === partnerOrgId) {
          await supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myOrgId, partnerOrgId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || !myOrgId || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          sender_organization_id: myOrgId,
          receiver_organization_id: partnerOrgId,
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      emitChatSync({ type: 'message-sent', partnerOrgId, message: data });
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    } catch (err) {
      console.error('Send error:', err);
      toast.error('فشل إرسال الرسالة');
      setText(content);
    } finally {
      setSending(false);
    }
  }, [text, user, myOrgId, partnerOrgId, sending, queryClient]);

  const openFullChat = () => {
    navigate(`/dashboard/chat?partner=${partnerOrgId}&ref=shipment&shipment=${shipmentId}`);
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return format(d, isToday(d) ? 'hh:mm a' : 'd/M hh:mm a', { locale: ar });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={openFullChat}>
          <ExternalLink className="w-3 h-3" /> فتح كاملة
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{partnerName}</span>
          <MessageCircle className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">لا توجد رسائل بعد</p>
          <p className="text-xs">ابدأ محادثة مع {partnerName}</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] custom-scrollbar">
          {hasMore && (
            <div className="text-center">
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={openFullChat}>
                <ChevronUp className="w-3 h-3" /> عرض المزيد
              </Button>
            </div>
          )}
          {messages.map(msg => {
            const isOwn = msg.sender_organization_id === myOrgId;
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-start' : 'justify-end')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-bl-sm'
                    : 'bg-muted rounded-br-sm'
                )}>
                  {!isOwn && (
                    <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-right">{msg.content}</p>
                  <p className={cn(
                    'text-[9px] mt-1 text-right',
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-2 flex items-center gap-2">
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!text.trim() || sending}
          onClick={handleSend}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
        <Input
          className="text-sm h-8 text-right"
          placeholder={`رسالة إلى ${partnerName}...`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default InlineShipmentChat;
