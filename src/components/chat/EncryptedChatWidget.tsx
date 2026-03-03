import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Lock, Loader2, Shield, Maximize2, Search, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrivateChat, type DecryptedMessage } from '@/hooks/usePrivateChat';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedPartners, type LinkedPartner } from '@/hooks/useLinkedPartners';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص',
  transport_office: 'مكتب نقل',
};

const MiniMessageBubble = memo(({ msg, isMine }: { msg: DecryptedMessage; isMine: boolean }) => (
  <div className={cn("flex mb-1", isMine ? "justify-start" : "justify-end")}>
    <div className={cn(
      "max-w-[80%] rounded-xl px-2.5 py-1.5 text-xs",
      isMine ? "bg-emerald-600 text-white rounded-br-sm" : "bg-muted rounded-bl-sm"
    )}>
      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      <span className={cn("text-[8px] block mt-0.5", isMine ? "text-white/60" : "text-muted-foreground")}>
        {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
      </span>
    </div>
  </div>
));
MiniMessageBubble.displayName = 'MiniMessageBubble';

const EncryptedChatWidget = () => {
  const { user } = useAuth();
  const {
    conversations, conversationsLoading,
    fetchMessages, sendMessage, markAsRead, getOrCreateConversation,
  } = usePrivateChat();
  const { data: linkedPartners = [], isLoading: partnersLoading } = useLinkedPartners();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  // All linked partners shown for quick access
  const allLinkedPartners = linkedPartners;

  // Filter by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.partner?.full_name?.toLowerCase().includes(q) ||
      c.partner?.organization_name?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return allLinkedPartners;
    const q = searchQuery.toLowerCase();
    return allLinkedPartners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  }, [allLinkedPartners, searchQuery]);

  // Load messages
  useEffect(() => {
    if (!selectedConvoId) return;
    setMsgLoading(true);
    fetchMessages(selectedConvoId, 30).then(msgs => {
      setMessages(msgs);
      setMsgLoading(false);
      markAsRead(selectedConvoId);
    }).catch(() => setMsgLoading(false));
  }, [selectedConvoId, fetchMessages, markAsRead]);

  // Realtime
  useEffect(() => {
    if (!selectedConvoId) return;
    const ch = supabase
      .channel(`widget-${selectedConvoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encrypted_messages', filter: `conversation_id=eq.${selectedConvoId}` },
        () => { fetchMessages(selectedConvoId, 30).then(setMessages); markAsRead(selectedConvoId); }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedConvoId, fetchMessages, markAsRead]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedConvoId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await sendMessage(selectedConvoId, text);
      const updated = await fetchMessages(selectedConvoId, 30);
      setMessages(updated);
    } catch { toast.error('فشل الإرسال'); }
    finally { setSending(false); }
  };

  const handleStartChatWithPartner = async (partner: LinkedPartner) => {
    if (startingChat) return;
    setStartingChat(true);
    try {
      // Find a user from this organization to chat with
      const { data: orgUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', partner.id)
        .limit(1);

      if (!orgUsers?.length) {
        toast.error('لا يوجد مستخدمين مسجلين في هذه الجهة');
        return;
      }

      const convoId = await getOrCreateConversation(orgUsers[0].id);
      if (convoId) {
        setSelectedConvoId(convoId);
        setSearchQuery('');
      }
    } catch {
      toast.error('فشل في بدء المحادثة');
    } finally {
      setStartingChat(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && totalUnread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full text-[10px] px-1 bg-red-500 text-white border-2 border-background">
            {totalUnread > 9 ? '9+' : totalUnread}
          </Badge>
        )}
      </motion.button>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-24 left-6 z-50 w-80 h-[32rem] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-12 px-3 flex items-center justify-between bg-emerald-600 text-white shrink-0">
              {selectedConvoId ? (
                <>
                  <button onClick={() => setSelectedConvoId(null)} className="text-white/80 hover:text-white">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate max-w-[180px]">
                      {selectedConvo?.partner?.full_name || 'محادثة'}
                    </span>
                    <Lock className="w-3 h-3 text-white/60" />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-semibold">المحادثات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-[10px] text-white/70">{linkedPartners.length} جهة</span>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {!selectedConvoId ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Search Bar */}
                <div className="p-2 border-b border-border shrink-0">
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن جهة أو محادثة..."
                      className="h-8 text-xs pr-8"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {/* Active Conversations */}
                  {filteredConversations.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 bg-muted/30 border-b border-border/30">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          المحادثات النشطة ({filteredConversations.length})
                        </span>
                      </div>
                      {filteredConversations.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedConvoId(c.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-right border-b border-border/30"
                        >
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarImage src={c.partner?.avatar_url || ''} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                              {c.partner?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{c.partner?.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.partner?.organization_name}</p>
                          </div>
                          {(c.unread_count || 0) > 0 && (
                            <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-emerald-600 text-white">
                              {c.unread_count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Linked Partners (no conversation yet) */}
                  {filteredPartners.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 bg-muted/30 border-b border-border/30">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          الجهات المرتبطة ({filteredPartners.length})
                        </span>
                      </div>
                      {filteredPartners.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleStartChatWithPartner(p)}
                          disabled={startingChat}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-right border-b border-border/30 disabled:opacity-50"
                        >
                          <Avatar className="w-9 h-9 shrink-0">
                            {p.logo_url ? <AvatarImage src={p.logo_url} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {p.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{p.name}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-normal">
                                {ORG_TYPE_LABELS[p.organization_type] || p.organization_type}
                              </Badge>
                              {p.city && <span className="text-[9px] text-muted-foreground">{p.city}</span>}
                            </div>
                          </div>
                          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {(conversationsLoading || partnersLoading) ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-emerald-600" size={20} />
                    </div>
                  ) : filteredConversations.length === 0 && filteredPartners.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      {searchQuery ? (
                        <>
                          <Search className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-xs">لا توجد نتائج لـ "{searchQuery}"</p>
                        </>
                      ) : (
                        <>
                          <Users className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-xs">لا توجد محادثات أو جهات مرتبطة</p>
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-2">
                  {msgLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-emerald-600" size={20} />
                    </div>
                  ) : (
                    <>
                      {messages.map(msg => (
                        <MiniMessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user?.id} />
                      ))}
                      <div ref={endRef} />
                    </>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-2 border-t border-border shrink-0 flex gap-1.5">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="رسالة مشفرة..."
                    rows={1}
                    className="flex-1 min-h-[36px] max-h-[80px] resize-none text-xs"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EncryptedChatWidget;
