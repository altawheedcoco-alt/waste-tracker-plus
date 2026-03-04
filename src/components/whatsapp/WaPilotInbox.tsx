import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, MessageCircle, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, XCircle, Clock, Phone, Send, Loader2,
  User, ChevronRight, Inbox, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageLog {
  id: string;
  status: string | null;
  direction: string;
  message_type: string;
  created_at: string;
  organization_id: string | null;
  error_message: string | null;
  content: string | null;
  to_phone: string | null;
  from_phone: string | null;
  template_id: string | null;
  attachment_url: string | null;
  sent_by: string | null;
  meta_message_id: string | null;
  metadata: any;
  interactive_buttons: any;
  broadcast_group_id: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  name_en?: string | null;
}

interface Props {
  messages: MessageLog[];
  orgs: OrgInfo[];
  loading?: boolean;
  instanceStatus: 'connected' | 'disconnected' | 'loading';
  onRefresh: () => void;
}

interface Conversation {
  phone: string;
  contactName?: string;
  lastMessage: MessageLog;
  messages: MessageLog[];
  unreadCount: number;
}

const WaPilotInbox = ({ messages, orgs, loading, instanceStatus, onRefresh }: Props) => {
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Group messages into conversations by phone number
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();
    
    const sorted = [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const msg of sorted) {
      const phone = msg.direction === 'outbound' ? msg.to_phone : msg.from_phone;
      if (!phone) continue;

      const cleanPhone = phone.replace(/[\s\-\+@c.us]/g, '').replace(/^0+/, '');
      if (!cleanPhone || cleanPhone.length < 8) continue;

      if (!convMap.has(cleanPhone)) {
        const contactName = msg.metadata?.profile_name || undefined;
        convMap.set(cleanPhone, {
          phone: cleanPhone,
          contactName,
          lastMessage: msg,
          messages: [],
          unreadCount: 0,
        });
      }

      const conv = convMap.get(cleanPhone)!;
      conv.messages.push(msg);
      conv.lastMessage = msg;

      if (msg.direction === 'inbound' && msg.status !== 'read') {
        conv.unreadCount++;
      }
      if (msg.metadata?.profile_name && !conv.contactName) {
        conv.contactName = msg.metadata.profile_name;
      }
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages]);

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.phone.includes(q) ||
      c.contactName?.toLowerCase().includes(q) ||
      c.lastMessage.content?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const activeConversation = useMemo(() => {
    if (!selectedPhone) return null;
    return conversations.find(c => c.phone === selectedPhone) || null;
  }, [selectedPhone, conversations]);

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages.length, selectedPhone]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedPhone) return;
    const chatId = `${selectedPhone}@c.us`;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action: 'send-message', chat_id: chatId, text: replyText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      await supabase.from('whatsapp_messages').insert({
        to_phone: selectedPhone,
        content: replyText,
        message_type: 'text',
        status: 'sent',
        direction: 'outbound',
        organization_id: orgs[0]?.id || '',
        metadata: { source: 'wapilot_inbox_reply' },
      });
      
      toast.success('تم إرسال الرد بنجاح ✓');
      setReplyText('');
      onRefresh();
    } catch (err: any) {
      toast.error(`فشل الإرسال: ${err.message}`);
    } finally {
      setSending(false);
    }
  }, [replyText, selectedPhone, orgs, onRefresh]);

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'delivered': case 'read': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'sent': return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-500" />;
      default: return null;
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!activeConversation) return [];
    const groups: { date: string; messages: MessageLog[] }[] = [];
    let currentDate = '';

    for (const msg of activeConversation.messages) {
      const dateStr = new Date(msg.created_at).toDateString();
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ date: msg.created_at, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [activeConversation]);

  return (
    <Card className="border-2 border-primary/10 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          صندوق الرسائل والمحادثات
          <Badge variant="secondary" className="text-[10px] mr-auto">
            {conversations.length} محادثة
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[600px]">
          {/* ═══ Conversations List ═══ */}
          <div className="w-80 border-l flex flex-col bg-muted/20">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="بحث بالرقم أو الاسم..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9 h-8 text-xs"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />جاري التحميل...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 opacity-30 mb-2" />
                  <p className="text-sm">لا توجد محادثات</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.phone}
                    onClick={() => setSelectedPhone(conv.phone)}
                    className={`w-full text-right p-3 border-b transition-colors hover:bg-muted/50 ${
                      selectedPhone === conv.phone ? 'bg-primary/5 border-r-2 border-r-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        conv.unreadCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold truncate">
                            {conv.contactName || `+${conv.phone}`}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-1">
                            {formatDate(conv.lastMessage.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            {conv.lastMessage.direction === 'outbound' && (
                              <ArrowUpRight className="h-3 w-3 shrink-0 text-blue-500" />
                            )}
                            {conv.lastMessage.direction === 'inbound' && (
                              <ArrowDownLeft className="h-3 w-3 shrink-0 text-green-500" />
                            )}
                            {conv.lastMessage.content?.slice(0, 50) || conv.lastMessage.message_type}
                          </p>
                          <div className="flex items-center gap-1 shrink-0 mr-1">
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {conv.unreadCount}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[8px] px-1 py-0">
                              {conv.messages.length}
                            </Badge>
                          </div>
                        </div>
                        {conv.contactName && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">+{conv.phone}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* ═══ Chat View ═══ */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b bg-muted/30 flex items-center gap-3">
                  <Button
                    variant="ghost" size="sm" className="h-7 w-7 p-0 lg:hidden"
                    onClick={() => setSelectedPhone(null)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {activeConversation.contactName || `+${activeConversation.phone}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                      +{activeConversation.phone} • {activeConversation.messages.length} رسالة
                    </p>
                  </div>
                  <Badge variant={
                    activeConversation.messages.some(m => m.direction === 'inbound') ? 'default' : 'secondary'
                  } className="text-[10px]">
                    {activeConversation.messages.filter(m => m.direction === 'inbound').length} واردة
                    {' / '}
                    {activeConversation.messages.filter(m => m.direction === 'outbound').length} صادرة
                  </Badge>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-1 max-w-2xl mx-auto">
                    {groupedMessages.map((group, gi) => (
                      <div key={gi}>
                        {/* Date separator */}
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                            {formatDate(group.date)}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {group.messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex mb-2 ${msg.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                              msg.direction === 'outbound'
                                ? 'bg-primary/10 text-foreground rounded-bl-sm'
                                : 'bg-green-500/10 text-foreground rounded-br-sm'
                            }`}>
                              {/* Direction indicator */}
                              <div className="flex items-center gap-1 mb-1">
                                {msg.direction === 'outbound' ? (
                                  <span className="text-[9px] text-blue-600 flex items-center gap-0.5">
                                    <ArrowUpRight className="h-2.5 w-2.5" />صادرة
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-green-600 flex items-center gap-0.5">
                                    <ArrowDownLeft className="h-2.5 w-2.5" />واردة
                                  </span>
                                )}
                                {msg.message_type !== 'text' && (
                                  <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                                    {msg.message_type}
                                  </Badge>
                                )}
                              </div>

                              {/* Content */}
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                {msg.content || `[${msg.message_type}]`}
                              </p>

                              {/* Time + Status */}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[9px] text-muted-foreground">
                                  {formatTime(msg.created_at)}
                                </span>
                                {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                              </div>

                              {/* Error */}
                              {msg.error_message && (
                                <p className="text-[9px] text-destructive mt-1 flex items-center gap-1">
                                  <XCircle className="h-2.5 w-2.5" />{msg.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply Box */}
                <div className="p-3 border-t bg-muted/20">
                  <div className="flex gap-2 max-w-2xl mx-auto">
                    <Textarea
                      placeholder="اكتب ردك هنا..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="min-h-[44px] max-h-[100px] text-sm resize-none flex-1"
                      disabled={sending || instanceStatus !== 'connected'}
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sending || instanceStatus !== 'connected' || !replyText.trim()}
                      size="sm"
                      className="h-[44px] px-4"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  {instanceStatus !== 'connected' && (
                    <p className="text-[10px] text-destructive mt-1 text-center">الجهاز غير متصل</p>
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 opacity-20 mb-4" />
                <p className="text-lg font-medium mb-1">صندوق الرسائل</p>
                <p className="text-sm">اختر محادثة من القائمة لعرض الرسائل والرد عليها</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaPilotInbox;
