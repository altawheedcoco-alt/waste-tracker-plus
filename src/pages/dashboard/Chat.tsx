import { useState, useEffect, useRef, useCallback, memo, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Loader2, Shield, StickyNote, Hash, BarChart3, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { soundEngine } from '@/lib/soundEngine';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivateChat, type PrivateConversation, type DecryptedMessage } from '@/hooks/usePrivateChat';
import { useChatReactions } from '@/hooks/useChatReactions';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { ChatAppearanceProvider } from '@/contexts/ChatAppearanceContext';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useOnlinePresence, useUserOnlineStatus } from '@/hooks/useOnlinePresence';
import { useStarredMessages } from '@/hooks/useStarredMessages';
import { useDisappearingMessages } from '@/hooks/useDisappearingMessages';
import { usePinnedMessages } from '@/hooks/usePinnedMessages';
import { useChatInfiniteScroll } from '@/hooks/useChatInfiniteScroll';
import { useChatNotificationSettings } from '@/hooks/useChatNotificationSettings';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Extracted components
import ChatSidebarPanel, { type PartnerMember, type LinkedPartnerOrg } from '@/components/chat/ChatSidebarPanel';
import ChatHeaderBar from '@/components/chat/ChatHeaderBar';
import ChatMessagesArea from '@/components/chat/ChatMessagesArea';
import ChatNotesPanel from '@/components/chat/ChatNotesPanel';
import OrgGroupHeader, { type OrgGroup } from '@/components/chat/OrgGroupHeader';

// Feature components
import EnhancedChatInput from '@/components/chat/EnhancedChatInput';
import ForwardDialog from '@/components/chat/ForwardDialog';
import DisappearingMessagesDialog from '@/components/chat/DisappearingMessagesDialog';
import FileUploadProgress from '@/components/chat/FileUploadProgress';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ImageGalleryViewer from '@/components/chat/ImageGalleryViewer';
import PinnedMessagesBar from '@/components/chat/PinnedMessagesBar';
import StarredMessagesPanel from '@/components/chat/StarredMessagesPanel';
import ReplyPreviewBar from '@/components/chat/ReplyPreview';
import ChatNotificationDialog from '@/components/chat/ChatNotificationDialog';
import ScheduleMessageDialog from '@/components/chat/ScheduleMessageDialog';
import ChatPartnerInfo from '@/components/chat/ChatPartnerInfo';

// ─── Types ──────────────────────────────────────────────
interface ReplyTo {
  id: string;
  content: string;
  senderName: string;
}

// ─── Empty State ────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="relative mb-6"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <Icon className="w-12 h-12 text-primary/30" />
      </div>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full border-2 border-primary/10"
      />
    </motion.div>
    <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
      className="font-bold text-foreground text-base">{title}</motion.p>
    <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
      className="text-xs mt-2 max-w-xs text-center leading-relaxed">{subtitle}</motion.p>
  </div>
);

// ─── Main Chat Page ─────────────────────────────────────
const EncryptedChatInner = () => {
  const { user, organization, profile } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useDisplayMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const {
    conversations, conversationsLoading, getOrCreateConversation,
    fetchMessages, decryptSingleRow, sendMessage, sendFileMessage, markAsRead, exportChatHistory,
    toggleBlock, toggleMute,
  } = usePrivateChat();

  // State
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<{ name: string; type: string } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<DecryptedMessage | null>(null);
  const [showDisappearDialog, setShowDisappearDialog] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<DecryptedMessage | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showPinnedBar, setShowPinnedBar] = useState(true);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showStarredPanel, setShowStarredPanel] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

  // Hooks
  const { isPartnerTyping, partnerTypingName, sendTyping, stopTyping } = useTypingIndicator(selectedConvoId || undefined);
  useOnlinePresence();
  const partnerOnline = useUserOnlineStatus(selectedConvo?.partner?.user_id);
  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { reactionsMap, toggleReaction } = useChatReactions(messageIds);
  const { starredMessages, starredMessageIds, toggleStar } = useStarredMessages();
  const { duration: disappearDuration, setDisappearDuration, isActive: disappearActive } = useDisappearingMessages(selectedConvo?.partner?.organization_id || undefined);
  const { pinnedMessages, fetchPinned, togglePin: togglePinMessage } = usePinnedMessages(selectedConvo?.partner?.organization_id || undefined);
  const { hasMore, loadingMore, loadOlderMessages, resetPagination } = useChatInfiniteScroll({ fetchMessages, conversationId: selectedConvoId });
  const { settings: notifSettings, shouldNotify } = useChatNotificationSettings(selectedConvoId);
  const { getWallpaperStyle } = useChatWallpaper(selectedConvoId || undefined);

  const galleryImages = useMemo(() => {
    return messages
      .filter(m => m.file_url && (m.message_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(m.file_url)))
      .map(m => ({ url: m.file_url!, name: m.file_name || 'صورة' }));
  }, [messages]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + (c.unread_count || 0), 0), [conversations]);

  useEffect(() => { if (selectedConvo) fetchPinned(); }, [selectedConvo?.id, fetchPinned]);

  // Actions
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await supabase.from('encrypted_messages').update({ is_deleted: true }).eq('id', messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
      toast.success('تم حذف الرسالة');
    } catch { toast.error('فشل حذف الرسالة'); }
  }, []);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await supabase.from('encrypted_messages').update({ content: newContent, is_edited: true }).eq('id', messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, is_edited: true } : m));
      setEditingMessage(null);
      toast.success('تم تعديل الرسالة');
    } catch { toast.error('فشل تعديل الرسالة'); }
  }, []);

  // Linked partners
  const { data: linkedPartners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['chat-linked-partners', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data: partnerships, error: pErr } = await supabase
        .from('verified_partnerships')
        .select('requester_org_id, partner_org_id')
        .or(`requester_org_id.eq.${organization.id},partner_org_id.eq.${organization.id}`)
        .eq('status', 'active');
      if (pErr) throw pErr;
      const partnerIds = new Set<string>();
      partnerships?.forEach(p => {
        const otherId = p.requester_org_id === organization.id ? p.partner_org_id : p.requester_org_id;
        if (otherId) partnerIds.add(otherId);
      });
      if (partnerIds.size === 0) return [];
      const partnerIdsArr = Array.from(partnerIds);
      const { data: orgs } = await supabase
        .from('organizations').select('id, name, organization_type, logo_url')
        .in('id', partnerIdsArr).eq('is_active', true).order('name');
      if (!orgs?.length) return [];
      const { data: profiles } = await supabase
        .from('profiles').select('user_id, full_name, avatar_url, organization_id')
        .in('organization_id', partnerIdsArr);
      const membersByOrg = new Map<string, PartnerMember[]>();
      (profiles || []).forEach(p => {
        if (!p.organization_id) return;
        const list = membersByOrg.get(p.organization_id) || [];
        list.push({ user_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url });
        membersByOrg.set(p.organization_id, list);
      });
      return orgs.map(o => ({
        id: o.id, name: o.name, organization_type: o.organization_type as string,
        logo_url: o.logo_url, members: membersByOrg.get(o.id) || [],
      })) as LinkedPartnerOrg[];
    },
    enabled: !!organization?.id,
  });

  const handleStartConvoWithMember = async (member: PartnerMember) => {
    if (!user) return;
    try {
      const existingConvo = conversations.find(c => c.partner?.user_id === member.user_id);
      if (existingConvo) {
        setSelectedConvoId(existingConvo.id);
        if (isMobile) setShowSidebar(false);
        return;
      }
      const convoId = await getOrCreateConversation(member.user_id);
      if (convoId) {
        setSelectedConvoId(convoId);
        if (isMobile) setShowSidebar(false);
        queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
      }
    } catch { toast.error('فشل بدء المحادثة'); }
  };

  // Group conversations by organization
  const orgGroups = useMemo((): OrgGroup[] => {
    const grouped = new Map<string, OrgGroup>();
    const noOrg: PrivateConversation[] = [];
    conversations.forEach(conv => {
      const orgName = conv.partner?.organization_name;
      if (!orgName) { noOrg.push(conv); return; }
      const key = orgName;
      if (!grouped.has(key)) grouped.set(key, { orgId: key, orgName, conversations: [], totalUnread: 0 });
      const group = grouped.get(key)!;
      group.conversations.push(conv);
      group.totalUnread += conv.unread_count || 0;
    });
    const result = Array.from(grouped.values()).sort((a, b) => {
      if (a.totalUnread !== b.totalUnread) return b.totalUnread - a.totalUnread;
      return a.orgName.localeCompare(b.orgName, 'ar');
    });
    if (noOrg.length > 0) {
      result.push({ orgId: '__none__', orgName: 'بدون جهة', conversations: noOrg, totalUnread: noOrg.reduce((s, c) => s + (c.unread_count || 0), 0) });
    }
    return result;
  }, [conversations]);

  // Auto-expand orgs with unread
  useEffect(() => {
    const withUnread = orgGroups.filter(g => g.totalUnread > 0).map(g => g.orgId);
    if (withUnread.length > 0) setExpandedOrgs(prev => new Set([...prev, ...withUnread]));
  }, [orgGroups]);

  // Auto-open conversation from URL params
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam && !conversationsLoading) {
      const found = conversations.find(c => c.id === convParam);
      if (found) {
        setSelectedConvoId(found.id);
        setShowSidebar(false);
        searchParams.delete('conv');
        setSearchParams(searchParams, { replace: true });
      }
      return;
    }
    const partnerId = searchParams.get('partnerId') || searchParams.get('partner');
    if (!partnerId || !user || conversationsLoading) return;
    (async () => {
      try {
        const { data: members } = await supabase.from('profiles').select('user_id').eq('organization_id', partnerId).limit(1);
        if (members && members.length > 0) {
          const targetUserId = members[0].user_id;
          const existingConvo = conversations.find(c => c.partner?.user_id === targetUserId);
          if (existingConvo) setSelectedConvoId(existingConvo.id);
          else { const convoId = await getOrCreateConversation(targetUserId); if (convoId) setSelectedConvoId(convoId); }
          setShowSidebar(false);
        } else { toast.error('لم يتم العثور على أعضاء في هذه الجهة'); }
      } catch { toast.error('فشل فتح المحادثة'); }
      searchParams.delete('partnerId'); searchParams.delete('partner'); searchParams.delete('partnerName');
      setSearchParams(searchParams, { replace: true });
    })();
  }, [searchParams, user, conversations, conversationsLoading]);

  const toggleOrgExpand = (orgId: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId); else next.add(orgId);
      return next;
    });
  };

  // Load messages
  useEffect(() => {
    if (!selectedConvoId) return;
    let cancelled = false;
    setMessagesLoading(true);
    setReplyTo(null);
    setShowPartnerInfo(false);
    resetPagination();
    fetchMessages(selectedConvoId).then(msgs => {
      if (!cancelled) {
        const unread = msgs.find(m => m.sender_id !== user?.id && m.status !== 'read');
        setFirstUnreadId(unread?.id || null);
        setMessages(msgs);
        setMessagesLoading(false);
        markAsRead(selectedConvoId);
      }
    }).catch(() => { if (!cancelled) setMessagesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedConvoId, fetchMessages, markAsRead, resetPagination]);

  // Realtime messages
  useEffect(() => {
    if (!selectedConvoId) return;
    const channel = supabase
      .channel(`chat-${selectedConvoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encrypted_messages', filter: `conversation_id=eq.${selectedConvoId}` }, async (payload) => {
        const row = payload.new as any;
        const decrypted = await decryptSingleRow(row, selectedConvoId);
        if (decrypted) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== decrypted.id && !m.id.startsWith('temp_'));
            return [...filtered, decrypted];
          });
          if (decrypted.sender_id !== user?.id && shouldNotify()) { try { soundEngine.play('message_received'); } catch {} }
        }
        markAsRead(selectedConvoId);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'encrypted_messages', filter: `conversation_id=eq.${selectedConvoId}` }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m =>
          m.id === updated.id ? { ...m, status: updated.status || m.status, is_edited: updated.is_edited || m.is_edited, is_deleted: updated.is_deleted || m.is_deleted } : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvoId, decryptSingleRow, markAsRead]);

  // Auto scroll
  const isNearBottomRef = useRef(true);
  useEffect(() => {
    if (isNearBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConvo = (convo: PrivateConversation) => {
    setSelectedConvoId(convo.id);
    if (isMobile) setShowSidebar(false);
  };

  const handleReply = (msg: DecryptedMessage) => {
    setReplyTo({
      id: msg.id,
      content: msg.content.substring(0, 100),
      senderName: msg.sender?.full_name || (msg.sender_id === user?.id ? 'أنت' : 'مستخدم'),
    });
  };

  const handleForwardToConversations = useCallback(async (conversationIds: string[]) => {
    if (!forwardMsg) return;
    for (const convoId of conversationIds) {
      await sendMessage(convoId, `↩️ رسالة محوّلة:\n${forwardMsg.content}`);
    }
  }, [forwardMsg, sendMessage]);

  const handleExport = async () => {
    if (!selectedConvoId) return;
    try { await exportChatHistory(selectedConvoId); } catch { toast.error('فشل تصدير المحادثة'); }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    setShowScrollBottom(!nearBottom);
    isNearBottomRef.current = nearBottom;
    if (el.scrollTop < 80 && !loadingMore && hasMore && messages.length > 0) {
      const prevHeight = el.scrollHeight;
      loadOlderMessages(messages, setMessages).then(() => {
        requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
      });
    }
  }, [loadingMore, hasMore, messages, loadOlderMessages]);

  const scrollToMessage = useCallback((msgId: string) => {
    document.getElementById(`msg-${msgId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMsgId(msgId);
    setTimeout(() => setHighlightedMsgId(null), 2000);
  }, []);

  if (!user) return null;

  const showChat = !isMobile || !showSidebar;
  const showSidebarPanel = !isMobile || showSidebar;

  return (
    <>
      <div className={cn("flex overflow-hidden bg-background", "h-full")}>
        {/* SIDEBAR */}
        <AnimatePresence mode="wait">
          {showSidebarPanel && (
            <ChatSidebarPanel
              conversations={conversations}
              conversationsLoading={conversationsLoading}
              linkedPartners={linkedPartners}
              partnersLoading={partnersLoading}
              selectedConvoId={selectedConvoId}
              currentUserId={user?.id}
              isMobile={isMobile}
              orgGroups={orgGroups}
              expandedOrgs={expandedOrgs}
              onToggleOrgExpand={toggleOrgExpand}
              onSelectConvo={handleSelectConvo}
              onStartConvoWithMember={handleStartConvoWithMember}
              totalUnread={totalUnread}
            />
          )}
        </AnimatePresence>

        {/* CHAT AREA */}
        {showChat && (
          <div className="flex-1 flex min-w-0">
            <div className="flex-1 flex flex-col min-w-0">
              {selectedConvo ? (
                <>
                  <ChatHeaderBar
                    selectedConvo={selectedConvo}
                    selectedConvoId={selectedConvoId}
                    isMobile={isMobile}
                    isPartnerTyping={isPartnerTyping}
                    partnerOnline={partnerOnline}
                    disappearActive={disappearActive}
                    showNotes={showNotes}
                    notifSettings={notifSettings}
                    pinnedMessagesCount={pinnedMessages.length}
                    starredMessagesCount={starredMessages.length}
                    galleryImagesCount={galleryImages.length}
                    onShowSidebar={() => setShowSidebar(true)}
                    onToggleChatSearch={() => setShowChatSearch(!showChatSearch)}
                    onTogglePartnerInfo={() => setShowPartnerInfo(!showPartnerInfo)}
                    onToggleNotes={() => setShowNotes(!showNotes)}
                    onOpenGallery={() => { setGalleryIndex(galleryImages.length - 1); setGalleryOpen(true); }}
                    onOpenStarredPanel={() => setShowStarredPanel(true)}
                    onTogglePinnedBar={() => setShowPinnedBar(!showPinnedBar)}
                    onExport={handleExport}
                    onOpenNotifDialog={() => setShowNotifDialog(true)}
                    onOpenScheduleDialog={() => setShowScheduleDialog(true)}
                    onOpenDisappearDialog={() => setShowDisappearDialog(true)}
                    onBlock={() => toggleBlock(selectedConvoId!)}
                  />

                  {/* Search & Pinned Bars */}
                  <AnimatePresence>
                    {showChatSearch && (
                      <ChatSearchBar messages={messages}
                        onScrollToMessage={(msgId) => scrollToMessage(msgId)}
                        onHighlightMessage={setHighlightedMsgId}
                        onClose={() => { setShowChatSearch(false); setHighlightedMsgId(null); }}
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {showPinnedBar && pinnedMessages.length > 0 && (
                      <PinnedMessagesBar pinnedMessages={pinnedMessages}
                        onScrollToMessage={scrollToMessage}
                        onClose={() => setShowPinnedBar(false)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Messages */}
                  <ChatMessagesArea
                    messages={messages}
                    messagesLoading={messagesLoading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    currentUserId={user.id}
                    wallpaperStyle={getWallpaperStyle()}
                    reactionsMap={reactionsMap}
                    starredMessageIds={starredMessageIds}
                    highlightedMsgId={highlightedMsgId}
                    firstUnreadId={firstUnreadId}
                    isPartnerTyping={isPartnerTyping}
                    partnerTypingName={partnerTypingName}
                    unreadCount={selectedConvo?.unread_count || 0}
                    isMobile={isMobile}
                    showScrollBottom={showScrollBottom}
                    containerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    onScroll={handleScroll}
                    onReact={(msgId, emoji) => toggleReaction(msgId, emoji)}
                    onReply={handleReply}
                    onForward={(msg) => setForwardMsg(msg)}
                    onDelete={handleDeleteMessage}
                    onEdit={(msg) => setEditingMessage(msg)}
                    onPin={(msgId, isPinned) => togglePinMessage(msgId, isPinned)}
                    onStar={(msg) => toggleStar(msg.id, msg.conversation_id, msg.content, msg.message_type)}
                    onScrollToBottom={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  />

                  {/* Edit Preview */}
                  {editingMessage && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-card px-3 py-2 flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-primary">تعديل الرسالة</p>
                        <p className="text-xs text-muted-foreground truncate">{editingMessage.content.slice(0, 60)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingMessage(null)}><X className="w-3.5 h-3.5" /></Button>
                    </motion.div>
                  )}

                  {/* Reply Preview */}
                  {replyTo && !editingMessage && <ReplyPreviewBar replyToMessage={replyTo} onCancel={() => setReplyTo(null)} />}

                  {/* Upload Progress */}
                  <FileUploadProgress fileName={uploadingFile?.name || ''} progress={uploadProgress} isVisible={!!uploadingFile} fileType={uploadingFile?.type} />

                  {/* Input */}
                  <div className="p-2 border-t border-border bg-card shrink-0">
                    <EnhancedChatInput
                      onSendMessage={async (text) => {
                        if (editingMessage) { await handleEditMessage(editingMessage.id, text.trim()); return; }
                        const optimistic = {
                          id: `temp_${Date.now()}`, conversation_id: selectedConvoId!, sender_id: user!.id,
                          content: text.trim(), message_type: 'text' as const, status: 'sending',
                          is_edited: false, is_deleted: false, created_at: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, optimistic]);
                        setReplyTo(null);
                        setSending(true);
                        try {
                          await sendMessage(selectedConvoId!, text, 'text', undefined, undefined, replyTo?.id);
                          soundEngine.play('message_sent');
                          setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'sent' } : m));
                        } catch { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); toast.error('فشل إرسال الرسالة'); }
                        finally { setSending(false); }
                      }}
                      onSendFile={async (file) => {
                        const optimistic = {
                          id: `temp_file_${Date.now()}`, conversation_id: selectedConvoId!, sender_id: user!.id,
                          content: file.name, message_type: file.type.startsWith('image/') ? 'image' : 'file',
                          file_name: file.name, status: 'sending', is_edited: false, is_deleted: false, created_at: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, optimistic]);
                        setSending(true);
                        setUploadingFile({ name: file.name, type: file.type });
                        setUploadProgress(0);
                        const progressInterval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 15, 90)); }, 200);
                        try {
                          await sendFileMessage(selectedConvoId!, file);
                          clearInterval(progressInterval);
                          setUploadProgress(100);
                          setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'sent' } : m));
                          setTimeout(() => { setUploadingFile(null); setUploadProgress(0); }, 500);
                        } catch {
                          clearInterval(progressInterval);
                          setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                          setUploadingFile(null); setUploadProgress(0);
                          toast.error('فشل إرسال الملف');
                        } finally { setSending(false); }
                      }}
                      sending={sending}
                      disabled={!selectedConvoId}
                      onTyping={sendTyping}
                    />
                  </div>
                </>
              ) : (
                <EmptyState icon={Shield} title="اختر محادثة" subtitle="اختر محادثة من القائمة أو ابدأ محادثة جديدة مع أي شريك مرتبط — المحادثات مقسمة حسب الجهة" />
              )}
            </div>

            {/* Side Panels */}
            {showPartnerInfo && selectedConvo && !isMobile && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="h-full overflow-hidden border-s border-border">
                <ChatPartnerInfo
                  partner={{ id: selectedConvo.partner?.organization_id || '', name: selectedConvo.partner?.organization_name || selectedConvo.partner?.full_name || '', organization_type: (selectedConvo.partner as any)?.organization_type || 'generator', logo_url: selectedConvo.partner?.avatar_url || null }}
                  conversationId={selectedConvoId || undefined}
                  notificationsEnabled={true}
                  onToggleNotifications={() => selectedConvoId && toggleMute(selectedConvoId)}
                  onBack={() => setShowPartnerInfo(false)}
                  isMobile={isMobile}
                />
              </motion.div>
            )}
            {showNotes && selectedConvoId && !isMobile && !showPartnerInfo && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="h-full overflow-hidden">
                <ChatNotesPanel conversationId={selectedConvoId} organizationId={organization?.id} targetOrganizationId={selectedConvo?.partner?.organization_id || null} />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DisappearingMessagesDialog open={showDisappearDialog} onOpenChange={setShowDisappearDialog} currentDuration={disappearDuration} onSetDuration={setDisappearDuration} />
      <ForwardDialog isOpen={!!forwardMsg} onClose={() => setForwardMsg(null)} messageContent={forwardMsg?.content || ''}
        conversations={conversations.filter(c => c.id !== selectedConvoId)} onForward={handleForwardToConversations} currentUserId={user?.id} />
      <ImageGalleryViewer images={galleryImages} initialIndex={galleryIndex} isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <ChatNotificationDialog open={showNotifDialog} onOpenChange={setShowNotifDialog} conversationId={selectedConvoId} partnerName={selectedConvo?.partner?.full_name} />
      <ScheduleMessageDialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)}
        onSchedule={(scheduledAt, content) => {
          const delay = new Date(scheduledAt).getTime() - Date.now();
          if (delay > 0 && selectedConvoId) {
            setTimeout(async () => { try { await sendMessage(selectedConvoId, content); } catch {} }, Math.min(delay, 2147483647));
          }
        }}
      />
      <StarredMessagesPanel isOpen={showStarredPanel} onClose={() => setShowStarredPanel(false)} starredMessages={starredMessages}
        onScrollToMessage={scrollToMessage}
        onUnstar={(msgId) => { const msg = messages.find(m => m.id === msgId); if (msg) toggleStar(msgId, msg.conversation_id, msg.content, msg.message_type); }}
      />
    </>
  );
};

// Lazy-loaded tabs
const NotesTab = lazy(() => import('@/components/chat/NotesTab'));
const ChannelListViewPage = lazy(() => import('@/components/chat/ChannelListView'));
const PollsListView = lazy(() => import('@/components/chat/PollsListView'));

type ChatTabType = 'chat' | 'notes' | 'channels' | 'polls';

const ChatAndNotesPage = () => {
  const [searchParamsPage] = useSearchParams();
  const paramTab = searchParamsPage.get('tab') as ChatTabType | null;
  const initialTab: ChatTabType = paramTab && ['chat', 'notes', 'channels', 'polls'].includes(paramTab) ? paramTab : 'chat';
  const [activeTab, setActiveTab] = useState<ChatTabType>(initialTab);
  const [notesUnread, setNotesUnread] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('notes-badge-counter')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, () => {
        if (activeTab !== 'notes') setNotesUnread(prev => prev + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  useEffect(() => { if (activeTab === 'notes') setNotesUnread(0); }, [activeTab]);

  useEffect(() => {
    const t = searchParamsPage.get('tab') as ChatTabType | null;
    if (t && ['chat', 'notes', 'channels', 'polls'].includes(t)) setActiveTab(t);
  }, [searchParamsPage]);

  return (
    <DashboardLayout>
      <ChatAppearanceProvider>
        <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex items-center border-b border-border bg-card px-4 shrink-0" dir="rtl">
            {[
              { key: 'chat' as const, icon: MessageCircle, label: 'الدردشات' },
              { key: 'notes' as const, icon: StickyNote, label: 'الملاحظات', badge: notesUnread },
              { key: 'channels' as const, icon: Hash, label: 'القنوات' },
              { key: 'polls' as const, icon: BarChart3, label: 'التصويت' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative",
                  activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-destructive text-destructive-foreground">{tab.badge}</Badge>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <EncryptedChatInner />}
            {activeTab === 'notes' && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
                <NotesTab className="h-full" />
              </Suspense>
            )}
            {activeTab === 'channels' && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
                <ChannelListViewPage />
              </Suspense>
            )}
            {activeTab === 'polls' && (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
                <PollsListView />
              </Suspense>
            )}
          </div>
        </div>
      </ChatAppearanceProvider>
    </DashboardLayout>
  );
};

export default ChatAndNotesPage;
