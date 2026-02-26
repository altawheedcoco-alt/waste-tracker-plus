import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Search, Loader2, ArrowRight, ArrowLeft, Shield,
  MoreVertical, Phone, Video, Send, Paperclip, Mic, Image as ImageIcon,
  Check, CheckCheck, Clock, Lock, Download, VolumeX, Volume2, Ban,
  Smile, Reply, Trash2, Edit2, ChevronDown, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrivateChat, type PrivateConversation, type DecryptedMessage } from '@/hooks/usePrivateChat';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ─── Conversation List Item ─────────────────────────────
const ConversationItem = memo(({ 
  conversation, isActive, onClick 
}: { 
  conversation: PrivateConversation; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const formatTime = (t?: string | null) => {
    if (!t) return '';
    const d = new Date(t);
    if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
    if (isYesterday(d)) return 'أمس';
    return format(d, 'd/M', { locale: ar });
  };

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/30",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar className="w-11 h-11">
          <AvatarImage src={conversation.partner?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {conversation.partner?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator placeholder */}
        <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold truncate">{conversation.partner?.full_name || 'مستخدم'}</h4>
          <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {conversation.partner?.organization_name || 'رسالة مشفرة'}
            </p>
          </div>
          {(conversation.unread_count || 0) > 0 && (
            <Badge className="h-5 min-w-5 rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ConversationItem.displayName = 'ConversationItem';

// ─── Message Bubble ─────────────────────────────────────
const MessageBubble = memo(({ message, isMine }: { message: DecryptedMessage; isMine: boolean }) => {
  const getStatusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  if (message.is_deleted) {
    return (
      <div className={cn("flex mb-1", isMine ? "justify-start" : "justify-end")}>
        <div className="px-3 py-1.5 rounded-lg bg-muted/50 italic text-xs text-muted-foreground">
          🚫 تم حذف هذه الرسالة
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex mb-1 group", isMine ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-3 py-2 relative shadow-sm",
        isMine
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-card border border-border rounded-bl-sm"
      )}>
        {!isMine && message.sender && (
          <p className="text-[10px] font-semibold text-primary mb-0.5">{message.sender.full_name}</p>
        )}
        
        {message.file_url && (
          <div className="mb-1">
            {message.message_type === 'image' ? (
              <img src={message.file_url} alt="" className="rounded-lg max-w-full max-h-60 object-cover" />
            ) : (
              <a href={message.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-background/20">
                <FileText className="w-5 h-5" />
                <span className="text-xs truncate">{message.file_name || 'ملف'}</span>
              </a>
            )}
          </div>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        
        <div className={cn(
          "flex items-center gap-1 mt-0.5",
          isMine ? "justify-start" : "justify-end"
        )}>
          <span className={cn(
            "text-[9px]",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
          </span>
          {message.is_edited && (
            <span className={cn(
              "text-[9px]",
              isMine ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>تم التعديل</span>
          )}
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// ─── Date Separator ─────────────────────────────────────
const DateSeparator = ({ date }: { date: Date }) => {
  let label: string;
  if (isToday(date)) label = 'اليوم';
  else if (isYesterday(date)) label = 'أمس';
  else label = format(date, 'EEEE d MMMM yyyy', { locale: ar });

  return (
    <div className="flex items-center gap-3 my-3 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

// ─── Empty State ────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
      <Icon className="w-10 h-10 text-primary/30" />
    </div>
    <p className="font-semibold text-foreground">{title}</p>
    <p className="text-xs mt-1 max-w-xs text-center">{subtitle}</p>
  </div>
);

// ─── Main Chat Page ─────────────────────────────────────
const EncryptedChat = () => {
  const { user } = useAuth();
  const { isMobile } = useDisplayMode();
  const {
    conversations, conversationsLoading, getOrCreateConversation,
    fetchMessages, sendMessage, markAsRead, exportChatHistory,
    toggleBlock, toggleMute,
  } = usePrivateChat();

  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvoId) return;
    let cancelled = false;
    
    setMessagesLoading(true);
    fetchMessages(selectedConvoId).then(msgs => {
      if (!cancelled) {
        setMessages(msgs);
        setMessagesLoading(false);
        markAsRead(selectedConvoId);
      }
    }).catch(() => {
      if (!cancelled) setMessagesLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedConvoId, fetchMessages, markAsRead]);

  // Realtime: reload messages
  useEffect(() => {
    if (!selectedConvoId) return;

    const channel = supabase
      .channel(`chat-${selectedConvoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'encrypted_messages',
        filter: `conversation_id=eq.${selectedConvoId}`,
      }, () => {
        fetchMessages(selectedConvoId).then(setMessages);
        markAsRead(selectedConvoId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvoId, fetchMessages, markAsRead]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConvo = (convo: PrivateConversation) => {
    setSelectedConvoId(convo.id);
    if (isMobile) setShowSidebar(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedConvoId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await sendMessage(selectedConvoId, text);
      const updated = await fetchMessages(selectedConvoId);
      setMessages(updated);
    } catch {
      toast.error('فشل إرسال الرسالة');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = async () => {
    if (!selectedConvoId) return;
    try {
      await exportChatHistory(selectedConvoId);
    } catch {
      toast.error('فشل تصدير المحادثة');
    }
  };

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  const showChat = !isMobile || !showSidebar;
  const showSidebarPanel = !isMobile || showSidebar;

  // Group messages by date
  const groupedMessages: { date: Date; messages: DecryptedMessage[] }[] = [];
  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    }
  });

  return (
    <DashboardLayout>
      <div className={cn(
        "flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        isMobile ? "mx-1 my-1" : "mx-4 my-4"
      )}>
        {/* ===== SIDEBAR ===== */}
        <AnimatePresence mode="wait">
          {showSidebarPanel && (
            <motion.div
              initial={isMobile ? { x: 100, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: 100, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25 }}
              className={cn(
                "h-full flex flex-col bg-card border-l border-border",
                isMobile ? "w-full" : "w-[340px] min-w-[340px]"
              )}
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b border-border bg-gradient-to-l from-emerald-500/5 to-transparent">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm">المحادثات المشفرة</h2>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> تشفير طرف لطرف
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث..."
                    className="pr-9 h-9 text-sm bg-muted/50 border-none"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">لا توجد محادثات</p>
                  </div>
                ) : (
                  filteredConversations.map(convo => (
                    <ConversationItem
                      key={convo.id}
                      conversation={convo}
                      isActive={selectedConvoId === convo.id}
                      onClick={() => handleSelectConvo(convo)}
                    />
                  ))
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== CHAT AREA ===== */}
        {showChat && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConvo ? (
              <>
                {/* Chat Header */}
                <div className="h-14 px-3 flex items-center justify-between border-b border-border bg-card shrink-0">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(true)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={selectedConvo.partner?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {selectedConvo.partner?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-semibold">{selectedConvo.partner?.full_name}</h3>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        {selectedConvo.partner?.organization_name || 'مشفر E2E'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleExport}>
                          <Download className="w-4 h-4 ml-2" /> تصدير المحادثة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMute(selectedConvoId!)}>
                          <VolumeX className="w-4 h-4 ml-2" /> كتم المحادثة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleBlock(selectedConvoId!)} className="text-destructive">
                          <Ban className="w-4 h-4 ml-2" /> حظر
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 bg-[url('/chat-bg.png')] bg-repeat bg-[length:400px] bg-muted/20">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary" size={28} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Shield className="w-16 h-16 mb-3 text-emerald-500/20" />
                      <p className="text-sm font-medium">محادثة مشفرة</p>
                      <p className="text-xs mt-1">الرسائل محمية بتشفير طرف لطرف</p>
                    </div>
                  ) : (
                    <>
                      {/* E2E banner */}
                      <div className="flex justify-center mb-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-center max-w-md">
                          <Lock className="w-4 h-4 text-amber-600 inline-block ml-1" />
                          <span className="text-[11px] text-amber-700 dark:text-amber-400">
                            الرسائل محمية بتشفير طرف لطرف. لا يمكن لأي طرف ثالث قراءتها.
                          </span>
                        </div>
                      </div>

                      {groupedMessages.map((group, gi) => (
                        <div key={gi}>
                          <DateSeparator date={group.date} />
                          {group.messages.map(msg => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isMine={msg.sender_id === user?.id}
                            />
                          ))}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-2 border-t border-border bg-card shrink-0">
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="اكتب رسالة مشفرة..."
                      rows={1}
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={Shield}
                title="اختر محادثة"
                subtitle="اختر محادثة من القائمة أو ابدأ محادثة جديدة مع أي شريك مرتبط"
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EncryptedChat;
