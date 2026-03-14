import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Search, Loader2, ArrowRight, Shield,
  MoreVertical, Send, Lock, Download, VolumeX, Ban,
  FileText, Building2, StickyNote, Bell, BellOff,
  ChevronDown, ChevronRight, Users, Plus, X, Hash
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrivateChat, type PrivateConversation, type DecryptedMessage } from '@/hooks/usePrivateChat';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
interface OrgGroup {
  orgId: string;
  orgName: string;
  conversations: PrivateConversation[];
  totalUnread: number;
}

interface ConversationNote {
  id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

// ─── Conversation List Item ─────────────────────────────
const ConversationItem = memo(({ 
  conversation, isActive, onClick, compact = false
}: { 
  conversation: PrivateConversation; 
  isActive: boolean; 
  onClick: () => void;
  compact?: boolean;
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
        "flex items-center gap-3 cursor-pointer transition-colors border-b border-border/30",
        compact ? "px-2 py-2" : "px-3 py-2.5",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar className={compact ? "w-9 h-9" : "w-11 h-11"}>
          <AvatarImage src={conversation.partner?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {conversation.partner?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
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
              {!compact && (conversation.partner?.organization_name || 'رسالة مشفرة')}
              {compact && 'مشفر E2E'}
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

// ─── Org Group Header ───────────────────────────────────
const OrgGroupHeader = memo(({ group, isExpanded, onToggle }: {
  group: OrgGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors text-start"
  >
    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
    <Building2 className="w-4 h-4 text-primary/70" />
    <span className="text-xs font-semibold flex-1 truncate">{group.orgName}</span>
    <span className="text-[10px] text-muted-foreground">{group.conversations.length}</span>
    {group.totalUnread > 0 && (
      <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-primary text-primary-foreground">
        {group.totalUnread}
      </Badge>
    )}
  </button>
));
OrgGroupHeader.displayName = 'OrgGroupHeader';

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

// ─── Notes Panel ────────────────────────────────────────
const NotesPanel = memo(({ conversationId, organizationId }: { conversationId: string; organizationId?: string }) => {
  const [noteText, setNoteText] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['conversation-notes', conversationId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('notes')
        .select('id, content, created_at, author_id')
        .eq('resource_type', 'conversation')
        .eq('resource_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!data?.length) return [];
      
      const userIds = [...new Set(data.map((n: any) => n.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds as string[]);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      return data.map((n: any) => ({
        id: n.id,
        content: n.content,
        created_at: n.created_at,
        author_name: profileMap.get(n.author_id || '') || 'مجهول',
      })) as ConversationNote[];
    },
    enabled: !!conversationId,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !organizationId) throw new Error('Missing user or org');
      const { error } = await (supabase as any).from('notes').insert({
        resource_type: 'conversation',
        resource_id: conversationId,
        content,
        author_id: user.id,
        organization_id: organizationId,
        note_type: 'comment',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      setNoteText('');
      toast.success('تم إضافة الملاحظة');
    },
  });

  return (
    <div className="flex flex-col h-full border-s border-border bg-card">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold">الملاحظات</span>
        <Badge variant="outline" className="text-[10px]">{notes.length}</Badge>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا توجد ملاحظات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map(note => (
              <div key={note.id} className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/30 dark:border-amber-800/30">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{note.author_name}</span>
                  <span>{format(new Date(note.created_at), 'dd/MM HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="إضافة ملاحظة..."
            className="text-sm h-9"
            onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) addNote.mutate(noteText.trim()); }}
          />
          <Button
            size="sm"
            onClick={() => noteText.trim() && addNote.mutate(noteText.trim())}
            disabled={!noteText.trim() || addNote.isPending}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
NotesPanel.displayName = 'NotesPanel';

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
  const { user, organization } = useAuth();
  const { isMobile } = useDisplayMode();
  const queryClient = useQueryClient();
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
  const [showNotes, setShowNotes] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'all' | 'orgs'>('orgs');
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  // Group conversations by organization
  const orgGroups = useMemo((): OrgGroup[] => {
    const grouped = new Map<string, OrgGroup>();
    const noOrg: PrivateConversation[] = [];

    conversations.forEach(conv => {
      const orgName = conv.partner?.organization_name;
      if (!orgName) {
        noOrg.push(conv);
        return;
      }
      const key = orgName;
      if (!grouped.has(key)) {
        grouped.set(key, {
          orgId: key,
          orgName: orgName,
          conversations: [],
          totalUnread: 0,
        });
      }
      const group = grouped.get(key)!;
      group.conversations.push(conv);
      group.totalUnread += conv.unread_count || 0;
    });

    const result = Array.from(grouped.values()).sort((a, b) => {
      if (a.totalUnread !== b.totalUnread) return b.totalUnread - a.totalUnread;
      return a.orgName.localeCompare(b.orgName, 'ar');
    });

    if (noOrg.length > 0) {
      result.push({
        orgId: '__none__',
        orgName: 'بدون جهة',
        conversations: noOrg,
        totalUnread: noOrg.reduce((s, c) => s + (c.unread_count || 0), 0),
      });
    }

    return result;
  }, [conversations]);

  // Auto-expand orgs with unread
  useEffect(() => {
    const withUnread = orgGroups.filter(g => g.totalUnread > 0).map(g => g.orgId);
    if (withUnread.length > 0) {
      setExpandedOrgs(prev => new Set([...prev, ...withUnread]));
    }
  }, [orgGroups]);

  const toggleOrgExpand = (orgId: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

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
    !searchQuery || c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partner?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgGroups = useMemo(() => {
    if (!searchQuery) return orgGroups;
    return orgGroups.map(g => ({
      ...g,
      conversations: g.conversations.filter(c =>
        c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partner?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(g => g.conversations.length > 0);
  }, [orgGroups, searchQuery]);

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

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <DashboardLayout>
      <div className={cn(
        "flex overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        isMobile ? "mx-0 my-0 h-[calc(100vh-3.5rem)] rounded-none border-0" : "mx-4 my-4 h-[calc(100vh-4rem)]"
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
                isMobile ? "w-full" : "w-[300px] min-w-[300px]"
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
                      <h2 className="font-bold text-sm">مركز التواصل</h2>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> تشفير طرف لطرف
                        {totalUnread > 0 && (
                          <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-destructive text-destructive-foreground ms-1">
                            {totalUnread}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث بالاسم أو الجهة..."
                    className="pr-9 h-9 text-sm bg-muted/50 border-none"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex rounded-lg bg-muted/50 p-0.5">
                  <button
                    onClick={() => setSidebarTab('orgs')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                      sidebarTab === 'orgs' ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    حسب الجهة
                  </button>
                  <button
                    onClick={() => setSidebarTab('all')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                      sidebarTab === 'all' ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Users className="w-3.5 h-3.5" />
                    الكل
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : sidebarTab === 'orgs' ? (
                  // ── Grouped by Organization ──
                  filteredOrgGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Building2 className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">لا توجد محادثات</p>
                    </div>
                  ) : (
                    filteredOrgGroups.map(group => (
                      <div key={group.orgId}>
                        <OrgGroupHeader
                          group={group}
                          isExpanded={expandedOrgs.has(group.orgId)}
                          onToggle={() => toggleOrgExpand(group.orgId)}
                        />
                        <AnimatePresence>
                          {expandedOrgs.has(group.orgId) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {group.conversations.map(convo => (
                                <ConversationItem
                                  key={convo.id}
                                  conversation={convo}
                                  isActive={selectedConvoId === convo.id}
                                  onClick={() => handleSelectConvo(convo)}
                                  compact
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )
                ) : (
                  // ── All Conversations ──
                  filteredConversations.length === 0 ? (
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
                  )
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== CHAT AREA ===== */}
        {showChat && (
          <div className="flex-1 flex min-w-0">
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
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
                          {selectedConvo.partner?.organization_name || 'غير محدد'}
                          <span className="mx-1">·</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-emerald-600">E2E</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={showNotes ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowNotes(!showNotes)}
                      >
                        <StickyNote className="w-4 h-4" />
                      </Button>
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
                  <div className="flex-1 overflow-y-auto p-3 bg-muted/20">
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
                  subtitle="اختر محادثة من القائمة أو ابدأ محادثة جديدة مع أي شريك مرتبط — المحادثات مقسمة حسب الجهة"
                />
              )}
            </div>

            {/* ===== NOTES PANEL ===== */}
            {showNotes && selectedConvoId && !isMobile && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden"
              >
                <NotesPanel conversationId={selectedConvoId} organizationId={organization?.id} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EncryptedChat;
