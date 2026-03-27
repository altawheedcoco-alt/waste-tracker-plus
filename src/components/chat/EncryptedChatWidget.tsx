import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Lock, Loader2, Shield, ArrowRight, Search, Users, Building2, ChevronDown, ChevronUp, FileText, Download, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { onWidgetToggle } from '@/lib/widgetBus';
import ChatVideoCallButton from '@/components/meetings/ChatVideoCallButton';
import EnhancedChatInput from './EnhancedChatInput';
import ImageLightbox from './ImageLightbox';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ChatMessageCardRenderer from './ChatMessageCardRenderer';
import ChatMentionRenderer from './ChatMentionRenderer';

const ChatVideoCallButtonMini = ({ partnerName, partnerUserId }: { partnerName: string; partnerUserId?: string }) => (
  <ChatVideoCallButton partnerName={partnerName} partnerUserId={partnerUserId} />
);

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص',
  transport_office: 'مكتب نقل',
  consultant: 'استشاري',
  consulting_office: 'مكتب استشارة',
};

interface OrgMember {
  id: string; // profile id
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  position: string | null;
}

const MiniMessageBubble = memo(({ msg, isMine, allImages, onOpenLightbox }: { 
  msg: DecryptedMessage; 
  isMine: boolean; 
  allImages: string[];
  onOpenLightbox: (url: string) => void;
}) => {
  const isImage = msg.message_type === 'image' && msg.file_url;
  const isVideo = msg.message_type === 'video' && msg.file_url;
  const isVoice = msg.message_type === 'voice' && msg.file_url;
  const isFile = msg.message_type === 'file' && msg.file_url;

  return (
    <div className={cn("flex mb-1", isMine ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[80%] rounded-xl px-2.5 py-1.5 text-xs",
        isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
      )}>
        {isImage ? (
          <button onClick={() => onOpenLightbox(msg.file_url!)} className="block">
            <img 
              src={msg.file_url} 
              alt={msg.file_name || 'صورة'} 
              className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
            />
          </button>
        ) : isVideo ? (
          <video 
            src={msg.file_url} 
            controls 
            className="max-w-full rounded-lg max-h-48" 
            preload="metadata"
          />
        ) : isVoice ? (
          <VoiceMessagePlayer url={msg.file_url!} isOwn={isMine} />
        ) : isFile ? (
          <a 
            href={msg.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 p-1.5 rounded-lg transition-colors",
              isMine ? "hover:bg-white/10" : "hover:bg-muted-foreground/10"
            )}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="truncate flex-1">{msg.file_name || 'ملف'}</span>
            <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words"><ChatMentionRenderer text={msg.content} isOwn={isMine} /></p>
        )}
        {/* Resource Card */}
        {msg.message_type === 'resource_card' && (() => {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed.resource_type && parsed.resource_data) {
              return <ChatMessageCardRenderer resourceType={parsed.resource_type} resourceData={parsed.resource_data} isOwn={isMine} />;
            }
          } catch { /* not a card */ }
          return null;
        })()}
        <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-start" : "justify-end")}>
          <span className={cn("text-[8px]", isMine ? "text-white/60" : "text-muted-foreground")}>
            {format(new Date(msg.created_at), 'hh:mm a', { locale: ar })}
          </span>
          {isMine && (
            msg.status === 'sending' ? (
              <Loader2 className="w-3 h-3 text-primary-foreground/40 animate-spin" />
            ) : msg.status === 'failed' ? (
              <span className="text-[8px] text-destructive">!</span>
            ) : msg.status === 'read' ? (
              <CheckCheck className="w-3 h-3 text-accent" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3 h-3 text-primary-foreground/50" />
            ) : (
              <Check className="w-3 h-3 text-primary-foreground/50" />
            )
          )}
        </div>
      </div>
    </div>
  );
});
MiniMessageBubble.displayName = 'MiniMessageBubble';

const EncryptedChatWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    conversations, conversationsLoading,
    fetchMessages, sendMessage, sendFileMessage, markAsRead, getOrCreateConversation,
  } = usePrivateChat();
  const { data: linkedPartners = [], isLoading: partnersLoading } = useLinkedPartners();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<Map<string, OrgMember[]>>(new Map());
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const { getWallpaperStyle } = useChatWallpaper(selectedConvoId || undefined);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  // Listen for widget bus events — but skip on main dashboard where EnhancedChatWidget handles it
  useEffect(() => {
    const unsubscribe = onWidgetToggle((widgetId) => {
      if (widgetId === 'team-chat' && location.pathname !== '/dashboard') {
        setIsOpen(true);
        setSelectedConvoId(null);
      }
    });
    return unsubscribe;
  }, [location.pathname]);

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
    if (!searchQuery.trim()) return linkedPartners;
    const q = searchQuery.toLowerCase();
    return linkedPartners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  }, [linkedPartners, searchQuery]);

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

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedConvoId || sending) return;
    
    // Optimistic: add message instantly
    const optimisticMsg: DecryptedMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: selectedConvoId,
      sender_id: user!.id,
      content: text.trim(),
      message_type: 'text',
      status: 'sending',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    setSending(true);
    try {
      await sendMessage(selectedConvoId, text.trim());
      // Replace optimistic with real messages
      const updated = await fetchMessages(selectedConvoId, 30);
      setMessages(updated);
    } catch {
      // Mark as failed
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m));
      toast.error('فشل الإرسال');
    }
    finally { setSending(false); }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedConvoId || sending) return;
    
    // Optimistic for files
    let msgType = 'file';
    if (file.type.startsWith('image/')) msgType = 'image';
    else if (file.type.startsWith('video/')) msgType = 'video';
    else if (file.type.startsWith('audio/')) msgType = 'voice';
    
    const optimisticMsg: DecryptedMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: selectedConvoId,
      sender_id: user!.id,
      content: file.name,
      message_type: msgType,
      file_name: file.name,
      status: 'sending',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    setSending(true);
    try {
      await sendFileMessage(selectedConvoId, file);
      const updated = await fetchMessages(selectedConvoId, 30);
      setMessages(updated);
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m));
      toast.error('فشل إرسال الملف');
    }
    finally { setSending(false); }
  };
  const handleSendResourceCard = async (resourceType: string, resourceData: any) => {
    if (!selectedConvoId || sending) return;
    const cardContent = JSON.stringify({ resource_type: resourceType, resource_data: resourceData });
    const label = resourceData.shipment_number || resourceData.invoice_number || resourceData.document_name || 'مورد';
    
    const optimisticMsg: DecryptedMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: selectedConvoId,
      sender_id: user!.id,
      content: cardContent,
      message_type: 'resource_card',
      status: 'sending',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    setSending(true);
    try {
      // Send as text with resource_card content — the card renderer will handle display
      await sendMessage(selectedConvoId, cardContent);
      const updated = await fetchMessages(selectedConvoId, 30);
      setMessages(updated);
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m));
      toast.error('فشل إرسال البطاقة');
    } finally {
      setSending(false);
    }
  };


  const allImageUrls = useMemo(() => 
    messages.filter(m => m.message_type === 'image' && m.file_url).map(m => m.file_url!),
    [messages]
  );

  const handleOpenLightbox = useCallback((url: string) => {
    const idx = allImageUrls.indexOf(url);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }, [allImageUrls]);

  // Load members of a partner org
  const loadOrgMembers = useCallback(async (orgId: string) => {
    if (orgMembers.has(orgId)) return;
    setLoadingMembers(orgId);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, position')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('full_name')
        .limit(50);

      setOrgMembers(prev => new Map(prev).set(orgId, (data || []) as OrgMember[]));
    } catch {
      // silent
    } finally {
      setLoadingMembers(null);
    }
  }, [orgMembers]);

  const handleToggleOrgMembers = async (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
    } else {
      setExpandedOrgId(orgId);
      await loadOrgMembers(orgId);
    }
  };

  // Start chat with a specific user
  const handleStartChatWithUser = async (userId: string) => {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const convoId = await getOrCreateConversation(userId);
      if (convoId) {
        setSelectedConvoId(convoId);
        setSearchQuery('');
        setExpandedOrgId(null);
      }
    } catch {
      toast.error('فشل في بدء المحادثة');
    } finally {
      setStartingChat(false);
    }
  };

  // Start chat with org (pick first user or show members)
  const handleStartChatWithPartner = async (partner: LinkedPartner) => {
    // If already expanded, collapse
    if (expandedOrgId === partner.id) {
      setExpandedOrgId(null);
      return;
    }

    // Try to load members and expand
    setExpandedOrgId(partner.id);
    if (!orgMembers.has(partner.id)) {
      setLoadingMembers(partner.id);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url, position')
          .eq('organization_id', partner.id)
          .eq('is_active', true)
          .order('full_name')
          .limit(50);

        const members = (data || []) as OrgMember[];
        setOrgMembers(prev => new Map(prev).set(partner.id, members));

        // If only one member, start chat directly
        if (members.length === 1) {
          await handleStartChatWithUser(members[0].user_id);
        }
      } catch {
        toast.error('فشل تحميل الأعضاء');
      } finally {
        setLoadingMembers(null);
      }
    } else {
      const members = orgMembers.get(partner.id) || [];
      if (members.length === 1) {
        await handleStartChatWithUser(members[0].user_id);
      }
    }
  };

  if (!user) return null;

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6 left-3 sm:left-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
        {!isOpen && totalUnread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full text-[10px] px-1 bg-destructive text-destructive-foreground border-2 border-background">
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
            className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] sm:bottom-24 left-3 sm:left-6 z-50 w-[calc(100vw-1.5rem)] sm:w-80 h-[28rem] sm:h-[32rem] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-12 px-3 flex items-center justify-between bg-primary text-primary-foreground shrink-0 rounded-t-2xl">
              {selectedConvoId ? (
                <>
                  <button onClick={() => setSelectedConvoId(null)} className="text-primary-foreground/80 hover:text-primary-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-sm font-semibold truncate max-w-[140px] hover:underline"
                      onClick={() => {
                        if (selectedConvo?.partner?.user_id) {
                          navigate(`/dashboard/profile?userId=${selectedConvo.partner.user_id}`);
                        }
                      }}
                    >
                      {selectedConvo?.partner?.full_name || 'محادثة'}
                    </button>
                    <Lock className="w-3 h-3 text-primary-foreground/60" />
                  </div>
                  <div className="flex items-center gap-1">
                    <ChatVideoCallButtonMini partnerName={selectedConvo?.partner?.full_name || ''} partnerUserId={selectedConvo?.partner?.user_id} />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-semibold">المحادثات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-foreground/70" />
                    <span className="text-[10px] text-primary-foreground/70">{linkedPartners.length} جهة</span>
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
                      placeholder="ابحث عن جهة أو شخص..."
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
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {c.partner?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{c.partner?.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.partner?.organization_name}</p>
                          </div>
                          {(c.unread_count || 0) > 0 && (
                            <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-primary text-primary-foreground">
                              {c.unread_count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Linked Partners with expandable members */}
                  {filteredPartners.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 bg-muted/30 border-b border-border/30">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          الجهات المرتبطة ({filteredPartners.length})
                        </span>
                      </div>
                      {filteredPartners.map(p => {
                        const isExpanded = expandedOrgId === p.id;
                        const members = orgMembers.get(p.id) || [];
                        const isLoadingThis = loadingMembers === p.id;

                        return (
                          <div key={p.id}>
                            {/* Org Row */}
                            <button
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
                              {isLoadingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                              ) : isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </button>

                            {/* Expanded Members */}
                            <AnimatePresence>
                              {isExpanded && !isLoadingThis && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden bg-muted/20"
                                >
                                  {members.length > 0 ? members.map(m => (
                                    <button
                                      key={m.user_id}
                                      onClick={() => handleStartChatWithUser(m.user_id)}
                                      disabled={startingChat || m.user_id === user?.id}
                                      className="w-full flex items-center gap-2 px-4 pr-8 py-2 hover:bg-muted/50 text-right border-b border-border/20 disabled:opacity-40"
                                    >
                                      <Avatar className="w-7 h-7 shrink-0">
                                        {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                          {m.full_name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium truncate">{m.full_name}</p>
                                        {m.position && (
                                          <p className="text-[9px] text-muted-foreground truncate">{m.position}</p>
                                        )}
                                      </div>
                                      <MessageCircle className="w-3 h-3 text-primary shrink-0" />
                                    </button>
                                  )) : (
                                    <div className="px-4 py-3 text-center">
                                      <p className="text-[10px] text-muted-foreground">لا يوجد أعضاء نشطين في هذه الجهة</p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {(conversationsLoading || partnersLoading) ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={20} />
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
                <ScrollArea className="flex-1 p-2" style={getWallpaperStyle()}>
                  {msgLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={20} />
                    </div>
                  ) : (
                    <>
                      {messages.map(msg => (
                        <MiniMessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user?.id} allImages={allImageUrls} onOpenLightbox={handleOpenLightbox} />
                      ))}
                      <div ref={endRef} />
                    </>
                  )}
                </ScrollArea>

                {/* Input */}
                <EnhancedChatInput
                  onSendMessage={handleSend}
                  onSendFile={handleSendFile}
                  onSendResourceCard={handleSendResourceCard}
                  sending={sending}
                  chatPartnerOrgId={selectedConvo?.partner?.organization_id}
                />

                {/* Image Lightbox */}
                <ImageLightbox
                  images={allImageUrls}
                  initialIndex={lightboxIndex}
                  isOpen={lightboxOpen}
                  onClose={() => setLightboxOpen(false)}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EncryptedChatWidget;
