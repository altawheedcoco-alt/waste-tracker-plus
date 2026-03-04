import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, MessageCircle, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, XCircle, Clock, Phone, Send, Loader2,
  User, ChevronRight, Inbox, Eye, Users, Star, StarOff,
  BarChart3, CheckCheck, Check, AlertCircle, TrendingUp,
  MessageSquare, Filter, SortAsc, RefreshCw
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
  // Engagement metrics
  totalInbound: number;
  totalOutbound: number;
  responseRate: number; // % of inbound that got a reply
  avgResponseTimeMin: number;
  lastActivity: string;
  isStarred: boolean;
  deliveryRate: number;
  readRate: number;
  engagementLevel: 'high' | 'medium' | 'low' | 'none';
}

const WaPilotInbox = ({ messages, orgs, loading, instanceStatus, onRefresh }: Props) => {
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [starredPhones, setStarredPhones] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'starred' | 'important'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'unread' | 'engagement'>('recent');
  const [syncingChats, setSyncingChats] = useState(false);
  const [liveMessages, setLiveMessages] = useState<MessageLog[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load starred from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wapilot_starred');
    if (saved) setStarredPhones(new Set(JSON.parse(saved)));
  }, []);

  const toggleStar = (phone: string) => {
    setStarredPhones(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      localStorage.setItem('wapilot_starred', JSON.stringify([...next]));
      return next;
    });
  };

  // Sync chats from WaPilot API directly
  const handleSyncChats = useCallback(async () => {
    setSyncingChats(true);
    try {
      // Try fetching chats list
      const { data: chatsData } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action: 'list-chats' },
      });
      
      // For each chat, try to get messages
      const chats = Array.isArray(chatsData) ? chatsData : 
        (chatsData?.data && Array.isArray(chatsData.data)) ? chatsData.data : [];
      
      if (chats.length > 0) {
        const chatMessages: MessageLog[] = [];
        // Get messages for top 20 chats
        const topChats = chats.slice(0, 20);
        const chatPromises = topChats.map(async (chat: any) => {
          const chatId = chat.id || chat.jid || chat.chatId || '';
          if (!chatId || chatId.includes('status') || chatId.includes('broadcast')) return [];
          try {
            const { data } = await supabase.functions.invoke('wapilot-proxy', {
              body: { action: 'get-chat-messages', chat_id: chatId, limit: 50 },
            });
            const rawMsgs = Array.isArray(data) ? data : 
              (data?.data && Array.isArray(data.data)) ? data.data :
              (data?.messages && Array.isArray(data.messages)) ? data.messages : [];
            
            return rawMsgs.map((msg: any, idx: number) => {
              const isFromMe = msg.fromMe ?? msg.from_me ?? (msg.key?.fromMe) ?? false;
              const phone = chatId.replace('@c.us', '').replace('@s.whatsapp.net', '').replace(/[\s\-\+]/g, '');
              const content = msg.body || msg.text || msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || msg.content || '';
              const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() :
                msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() :
                msg.created_at || new Date().toISOString();
              const msgId = msg.key?.id || msg.id || `chat-${chatId}-${idx}`;
              
              return {
                id: `wapilot-chat-${msgId}`,
                status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : msg.ack === 1 ? 'sent' : 'sent',
                direction: isFromMe ? 'outbound' : 'inbound',
                message_type: msg.type || 'text',
                created_at: timestamp,
                organization_id: null,
                error_message: null,
                content: content || `[${msg.type || 'message'}]`,
                to_phone: isFromMe ? phone : null,
                from_phone: isFromMe ? null : phone,
                template_id: null,
                attachment_url: null,
                sent_by: null,
                meta_message_id: msgId,
                metadata: { 
                  profile_name: chat.name || chat.pushName || msg.notifyName || null,
                  source: 'wapilot_chat_sync',
                },
                interactive_buttons: null,
                broadcast_group_id: null,
              } as MessageLog;
            });
          } catch {
            return [];
          }
        });
        
        const results = await Promise.all(chatPromises);
        results.forEach(r => chatMessages.push(...r));
        setLiveMessages(chatMessages);
        toast.success(`تم مزامنة ${chatMessages.length} رسالة من ${topChats.length} محادثة`);
      } else {
        toast.info('لم يتم العثور على محادثات - جاري استخدام الرسائل المتاحة');
      }
    } catch (err: any) {
      console.error('Chat sync error:', err);
      toast.error('فشل مزامنة المحادثات');
    } finally {
      setSyncingChats(false);
    }
  }, []);

  // Combined messages: props + live synced
  const allMessages = useMemo(() => {
    const combined = [...messages];
    const existingIds = new Set(messages.map(m => m.meta_message_id).filter(Boolean));
    for (const msg of liveMessages) {
      if (!msg.meta_message_id || !existingIds.has(msg.meta_message_id)) {
        combined.push(msg);
        existingIds.add(msg.meta_message_id);
      }
    }
    return combined;
  }, [messages, liveMessages]);

  // Group messages into conversations with engagement metrics
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();
    const sorted = [...allMessages].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const msg of sorted) {
      const phone = msg.direction === 'outbound' ? msg.to_phone : msg.from_phone;
      if (!phone) continue;
      const cleanPhone = phone.replace(/[\s\-\+@c.us]/g, '').replace(/^0+/, '');
      if (!cleanPhone || cleanPhone.length < 8) continue;

      if (!convMap.has(cleanPhone)) {
        convMap.set(cleanPhone, {
          phone: cleanPhone,
          contactName: msg.metadata?.profile_name || undefined,
          lastMessage: msg,
          messages: [],
          unreadCount: 0,
          totalInbound: 0,
          totalOutbound: 0,
          responseRate: 0,
          avgResponseTimeMin: 0,
          lastActivity: msg.created_at,
          isStarred: starredPhones.has(cleanPhone),
          deliveryRate: 0,
          readRate: 0,
          engagementLevel: 'none',
        });
      }

      const conv = convMap.get(cleanPhone)!;
      conv.messages.push(msg);
      conv.lastMessage = msg;
      conv.lastActivity = msg.created_at;
      conv.isStarred = starredPhones.has(cleanPhone);

      if (msg.direction === 'inbound') {
        conv.totalInbound++;
        if (msg.status !== 'read') conv.unreadCount++;
      } else {
        conv.totalOutbound++;
      }

      if (msg.metadata?.profile_name && !conv.contactName) {
        conv.contactName = msg.metadata.profile_name;
      }
    }

    // Calculate engagement metrics per conversation
    for (const conv of convMap.values()) {
      const outbound = conv.messages.filter(m => m.direction === 'outbound');
      const delivered = outbound.filter(m => m.status === 'delivered' || m.status === 'read' || m.status === 'sent');
      const read = outbound.filter(m => m.status === 'read');

      conv.deliveryRate = outbound.length > 0 ? Math.round((delivered.length / outbound.length) * 100) : 0;
      conv.readRate = outbound.length > 0 ? Math.round((read.length / outbound.length) * 100) : 0;

      // Response rate: how many outbound messages got an inbound reply within 24h
      let replies = 0;
      let totalResponseTime = 0;
      for (const outMsg of outbound) {
        const outTime = new Date(outMsg.created_at).getTime();
        const reply = conv.messages.find(m =>
          m.direction === 'inbound' &&
          new Date(m.created_at).getTime() > outTime &&
          new Date(m.created_at).getTime() - outTime < 86400000
        );
        if (reply) {
          replies++;
          totalResponseTime += new Date(reply.created_at).getTime() - outTime;
        }
      }
      conv.responseRate = outbound.length > 0 ? Math.round((replies / outbound.length) * 100) : 0;
      conv.avgResponseTimeMin = replies > 0 ? Math.round(totalResponseTime / replies / 60000) : 0;

      // Engagement level
      if (conv.totalInbound >= 3 && conv.responseRate >= 50) conv.engagementLevel = 'high';
      else if (conv.totalInbound >= 1 || conv.responseRate >= 20) conv.engagementLevel = 'medium';
      else if (conv.totalOutbound > 0 && conv.totalInbound === 0) conv.engagementLevel = 'low';
      else conv.engagementLevel = 'none';
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [allMessages, starredPhones]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalContacts = conversations.length;
    const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
    const highEngagement = conversations.filter(c => c.engagementLevel === 'high').length;
    const noResponse = conversations.filter(c => c.totalOutbound > 0 && c.totalInbound === 0).length;
    const avgDelivery = conversations.length > 0
      ? Math.round(conversations.reduce((s, c) => s + c.deliveryRate, 0) / conversations.length)
      : 0;
    const avgRead = conversations.length > 0
      ? Math.round(conversations.reduce((s, c) => s + c.readRate, 0) / conversations.length)
      : 0;
    return { totalContacts, totalUnread, highEngagement, noResponse, avgDelivery, avgRead };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let list = conversations;

    // Filter
    if (filterTab === 'unread') list = list.filter(c => c.unreadCount > 0);
    else if (filterTab === 'starred') list = list.filter(c => c.isStarred);
    else if (filterTab === 'important') list = list.filter(c => c.engagementLevel === 'high' || c.unreadCount > 2);

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.phone.includes(q) ||
        c.contactName?.toLowerCase().includes(q) ||
        c.lastMessage.content?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'unread') list = [...list].sort((a, b) => b.unreadCount - a.unreadCount);
    else if (sortBy === 'engagement') list = [...list].sort((a, b) => {
      const levels = { high: 3, medium: 2, low: 1, none: 0 };
      return levels[b.engagementLevel] - levels[a.engagementLevel];
    });

    return list;
  }, [conversations, search, filterTab, sortBy]);

  const activeConversation = useMemo(() => {
    if (!selectedPhone) return null;
    return conversations.find(c => c.phone === selectedPhone) || null;
  }, [selectedPhone, conversations]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, selectedPhone]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedPhone) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action: 'send-message', chat_id: `${selectedPhone}@c.us`, text: replyText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await supabase.from('whatsapp_messages').insert({
        to_phone: selectedPhone, content: replyText, message_type: 'text',
        status: 'sent', direction: 'outbound', organization_id: orgs[0]?.id || '',
        metadata: { source: 'wapilot_inbox_reply' },
      });
      toast.success('تم إرسال الرد ✓');
      setReplyText('');
      onRefresh();
    } catch (err: any) {
      toast.error(`فشل الإرسال: ${err.message}`);
    } finally {
      setSending(false);
    }
  }, [replyText, selectedPhone, orgs, onRefresh]);

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'delivered': return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'sent': return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'pending': return <Clock className="h-3 w-3 text-amber-500" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground/50" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'read': return 'مقروءة';
      case 'delivered': return 'تم التوصيل';
      case 'sent': return 'تم الإرسال';
      case 'failed': return 'فشلت';
      case 'pending': return 'قيد الإرسال';
      default: return 'غير معروف';
    }
  };

  const getEngagementBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge className="text-[8px] px-1.5 py-0 bg-green-500/10 text-green-700 border-green-200">🔥 تفاعل عالي</Badge>;
      case 'medium': return <Badge className="text-[8px] px-1.5 py-0 bg-amber-500/10 text-amber-700 border-amber-200">⚡ تفاعل متوسط</Badge>;
      case 'low': return <Badge className="text-[8px] px-1.5 py-0 bg-red-500/10 text-red-700 border-red-200">📉 بدون تفاعل</Badge>;
      default: return <Badge variant="outline" className="text-[8px] px-1.5 py-0">جديد</Badge>;
    }
  };

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
    <div className="space-y-4">
      {/* ═══ Summary Stats Bar ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{summaryStats.totalContacts}</div>
            <p className="text-[10px] text-muted-foreground">جهات التواصل</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-bold text-amber-600">{summaryStats.totalUnread}</div>
            <p className="text-[10px] text-muted-foreground">غير مقروءة</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-xl font-bold text-green-600">{summaryStats.highEngagement}</div>
            <p className="text-[10px] text-muted-foreground">تفاعل عالي</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <AlertCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <div className="text-xl font-bold text-destructive">{summaryStats.noResponse}</div>
            <p className="text-[10px] text-muted-foreground">بدون رد</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <CheckCheck className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold text-blue-600">{summaryStats.avgDelivery}%</div>
            <p className="text-[10px] text-muted-foreground">نسبة التوصيل</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <Eye className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="text-xl font-bold text-purple-600">{summaryStats.avgRead}%</div>
            <p className="text-[10px] text-muted-foreground">نسبة القراءة</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Main Inbox ═══ */}
      <Card className="border-2 border-primary/10 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            صندوق الرسائل والمحادثات
            <Badge variant="secondary" className="text-[10px]">
              {filteredConversations.length} محادثة
            </Badge>
            <div className="mr-auto flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                onClick={handleSyncChats}
                disabled={syncingChats || instanceStatus !== 'connected'}
              >
                {syncingChats ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                مزامنة المحادثات
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 text-[10px] gap-1"
                onClick={onRefresh}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                تحديث
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-[650px]">
            {/* ═══ Conversations List ═══ */}
            <div className="w-[340px] border-l flex flex-col bg-muted/20">
              {/* Filter Tabs */}
              <div className="p-2 border-b">
                <Tabs value={filterTab} onValueChange={v => setFilterTab(v as any)}>
                  <TabsList className="w-full h-7 grid grid-cols-4">
                    <TabsTrigger value="all" className="text-[10px] px-1">الكل</TabsTrigger>
                    <TabsTrigger value="unread" className="text-[10px] px-1">
                      غير مقروء {summaryStats.totalUnread > 0 && `(${summaryStats.totalUnread})`}
                    </TabsTrigger>
                    <TabsTrigger value="starred" className="text-[10px] px-1">⭐ مهم</TabsTrigger>
                    <TabsTrigger value="important" className="text-[10px] px-1">🔥 نشط</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Search + Sort */}
              <div className="p-2 border-b flex gap-1">
                <div className="relative flex-1">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pr-8 h-7 text-xs"
                  />
                </div>
                <Button
                  variant="outline" size="sm" className="h-7 px-2 text-[10px]"
                  onClick={() => setSortBy(s => s === 'recent' ? 'unread' : s === 'unread' ? 'engagement' : 'recent')}
                >
                  <SortAsc className="h-3 w-3 ml-1" />
                  {sortBy === 'recent' ? 'الأحدث' : sortBy === 'unread' ? 'غير مقروء' : 'التفاعل'}
                </Button>
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
                      className={`w-full text-right p-2.5 border-b transition-colors hover:bg-muted/50 ${
                        selectedPhone === conv.phone ? 'bg-primary/5 border-r-2 border-r-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center relative ${
                          conv.unreadCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          <User className="h-4 w-4" />
                          {/* Engagement dot */}
                          {conv.engagementLevel === 'high' && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {conv.contactName || `+${conv.phone}`}
                              </p>
                              {conv.isStarred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-1">
                              {formatDate(conv.lastMessage.created_at)}
                            </span>
                          </div>

                          {/* Last message preview */}
                          <div className="flex items-center gap-1 mb-1">
                            {conv.lastMessage.direction === 'outbound' && getStatusIcon(conv.lastMessage.status)}
                            <p className="text-[11px] text-muted-foreground truncate">
                              {conv.lastMessage.content?.slice(0, 40) || `[${conv.lastMessage.message_type}]`}
                            </p>
                          </div>

                          {/* Bottom row: engagement + unread */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {getEngagementBadge(conv.engagementLevel)}
                              <span className="text-[9px] text-muted-foreground">
                                ↑{conv.totalOutbound} ↓{conv.totalInbound}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {conv.unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
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
                  {/* Chat Header with contact details */}
                  <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0 lg:hidden"
                        onClick={() => setSelectedPhone(null)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <User className="h-5 w-5 text-primary" />
                        {activeConversation.engagementLevel === 'high' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            {activeConversation.contactName || `+${activeConversation.phone}`}
                          </p>
                          <Button
                            variant="ghost" size="sm" className="h-5 w-5 p-0"
                            onClick={() => toggleStar(activeConversation.phone)}
                          >
                            {activeConversation.isStarred
                              ? <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              : <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">+{activeConversation.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEngagementBadge(activeConversation.engagementLevel)}
                      </div>
                    </div>

                    {/* Contact metrics bar */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 flex-wrap">
                      <div className="flex items-center gap-1 text-[10px]">
                        <ArrowUpRight className="h-3 w-3 text-blue-500" />
                        <span className="text-muted-foreground">صادرة:</span>
                        <span className="font-semibold">{activeConversation.totalOutbound}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <ArrowDownLeft className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">واردة:</span>
                        <span className="font-semibold">{activeConversation.totalInbound}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                        <span className="text-muted-foreground">توصيل:</span>
                        <span className={`font-semibold ${activeConversation.deliveryRate >= 80 ? 'text-green-600' : activeConversation.deliveryRate >= 50 ? 'text-amber-600' : 'text-destructive'}`}>
                          {activeConversation.deliveryRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Eye className="h-3 w-3 text-purple-500" />
                        <span className="text-muted-foreground">قراءة:</span>
                        <span className={`font-semibold ${activeConversation.readRate >= 50 ? 'text-green-600' : activeConversation.readRate >= 20 ? 'text-amber-600' : 'text-destructive'}`}>
                          {activeConversation.readRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">تفاعل:</span>
                        <span className="font-semibold">{activeConversation.responseRate}%</span>
                      </div>
                      {activeConversation.avgResponseTimeMin > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-muted-foreground">متوسط الرد:</span>
                          <span className="font-semibold">
                            {activeConversation.avgResponseTimeMin < 60
                              ? `${activeConversation.avgResponseTimeMin} د`
                              : `${Math.round(activeConversation.avgResponseTimeMin / 60)} س`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-1 max-w-2xl mx-auto">
                      {groupedMessages.map((group, gi) => (
                        <div key={gi}>
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
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                  {msg.content || `[${msg.message_type}]`}
                                </p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                  <span className="text-[9px] text-muted-foreground">
                                    {formatTime(msg.created_at)}
                                  </span>
                                  {msg.direction === 'outbound' && (
                                    <span className="flex items-center gap-0.5">
                                      {getStatusIcon(msg.status)}
                                      <span className="text-[8px] text-muted-foreground">{getStatusLabel(msg.status)}</span>
                                    </span>
                                  )}
                                </div>
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
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
                        }}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={sending || instanceStatus !== 'connected' || !replyText.trim()}
                        size="sm" className="h-[44px] px-4"
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
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 opacity-20 mb-4" />
                  <p className="text-lg font-medium mb-1">صندوق الرسائل</p>
                  <p className="text-sm">اختر محادثة من القائمة لعرض التفاصيل والرد</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{summaryStats.totalContacts}</p>
                      <p className="text-[10px]">جهة تواصل</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600">{summaryStats.totalUnread}</p>
                      <p className="text-[10px]">رسالة غير مقروءة</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotInbox;
