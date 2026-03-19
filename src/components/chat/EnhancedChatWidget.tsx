import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Maximize2, Minimize2, Users, Plus, Timer, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';
import { onWidgetToggle } from '@/lib/widgetBus';
import { usePresence } from '@/hooks/usePresence';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePinnedMessages } from '@/hooks/usePinnedMessages';
import { useDisappearingMessages } from '@/hooks/useDisappearingMessages';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useGroupChat } from '@/hooks/useGroupChat';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

import ChatSidebar, { ChatPartner } from './ChatSidebar';
import ChatHeader from './ChatHeader';
import EnhancedChatMessages from './EnhancedChatMessages';
import EnhancedChatInput from './EnhancedChatInput';
import ReplyPreview from './ReplyPreview';
import ForwardMessageDialog from './ForwardMessageDialog';
import ChatSearchBar from './ChatSearchBar';
import PinnedMessagesBar from './PinnedMessagesBar';
import DisappearingMessagesDialog from './DisappearingMessagesDialog';
import GroupChatView from './GroupChatView';
import CreateGroupDialog from './CreateGroupDialog';

const EnhancedChatWidget = () => {
  const { user, organization } = useAuth();
  const { isMobile } = useDisplayMode();
  const { isOrgOnline } = usePresence();
  const {
    messages,
    loading,
    sending,
    uploadProgress,
    sendMessage,
    sendFileMessage,
    fetchMessagesForPartner,
    getPartnerUnreadCount,
    markPartnerAsRead,
    soundEnabled,
    setSoundEnabled,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<'sidebar' | 'chat' | 'group'>('sidebar');
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [forwardDialog, setForwardDialog] = useState<{ open: boolean; messageContent: string }>({ open: false, messageContent: '' });
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const { getWallpaperStyle } = useChatWallpaper(selectedPartner?.id);
  const { isPartnerTyping, partnerTypingName, sendTyping, stopTyping } = useTypingIndicator(selectedPartner?.id);
  const { pinnedMessages, fetchPinned, togglePin } = usePinnedMessages(selectedPartner?.id);
  const { duration: disappearDuration, setDisappearDuration, getExpiryDate, isActive: disappearActive } = useDisappearingMessages(selectedPartner?.id);
  const { permission: pushPermission, requestPermission: requestPush } = usePushNotifications();
  const { rooms, createGroup, isCreatingGroup } = useGroupChat();

  // Listen for unified menu toggle
  useEffect(() => {
    return onWidgetToggle((id) => {
      if (id === 'team-chat') {
        setIsOpen(true);
        setView('sidebar');
      }
    });
  }, []);

  // Fetch last message time for each partner
  const fetchLastSeenTimes = useCallback(async (partnerOrgIds: string[]) => {
    if (!organization?.id || partnerOrgIds.length === 0) return;
    try {
      const map = new Map<string, string>();
      for (const pId of partnerOrgIds) {
        const { data } = await supabase
          .from('chat_messages')
          .select('created_at')
          .eq('sender_organization_id', pId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data?.[0]?.created_at) {
          map.set(pId, formatDistanceToNow(new Date(data[0].created_at), { addSuffix: true, locale: ar }));
        }
      }
      setLastSeenMap(map);
    } catch (e) {
      console.error('Error fetching last seen:', e);
    }
  }, [organization?.id]);

  const fetchPartners = useCallback(async () => {
    if (!organization?.id) return;
    setLoadingPartners(true);
    try {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      const partnerIds = new Set<string>();
      shipments?.forEach(shipment => {
        if (shipment.generator_id && shipment.generator_id !== organization.id) partnerIds.add(shipment.generator_id);
        if (shipment.transporter_id && shipment.transporter_id !== organization.id) partnerIds.add(shipment.transporter_id);
        if (shipment.recycler_id && shipment.recycler_id !== organization.id) partnerIds.add(shipment.recycler_id);
      });

      if (partnerIds.size > 0) {
        const partnerIdsArr = Array.from(partnerIds);
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type, logo_url')
          .in('id', partnerIdsArr)
          .order('name');

        const partnersWithUnread: ChatPartner[] = await Promise.all(
          (orgs || []).map(async (org) => {
            const unreadCount = await getPartnerUnreadCount(org.id);
            return {
              id: org.id,
              name: org.name,
              organization_type: org.organization_type as string,
              logo_url: org.logo_url,
              unreadCount,
              isOnline: isOrgOnline(org.id),
            };
          })
        );

        setPartners(partnersWithUnread);
        setUnreadTotal(partnersWithUnread.reduce((sum, p) => sum + p.unreadCount, 0));
        fetchLastSeenTimes(partnerIdsArr);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoadingPartners(false);
    }
  }, [organization?.id, getPartnerUnreadCount, isOrgOnline, fetchLastSeenTimes]);

  useEffect(() => {
    setPartners(prev => prev.map(p => ({ ...p, isOnline: isOrgOnline(p.id) })));
  }, [isOrgOnline]);

  useEffect(() => {
    if (isOpen) fetchPartners();
  }, [isOpen, fetchPartners]);

  const handleSelectPartner = async (partner: ChatPartner) => {
    setSelectedPartner(partner);
    setView('chat');
    setReplyTo(null);
    setShowSearch(false);
    setShowPinned(false);
    await fetchMessagesForPartner(partner.id);
    await markPartnerAsRead(partner.id);
    fetchPinned();
    setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, unreadCount: 0 } : p));
    setUnreadTotal(prev => Math.max(0, prev - partner.unreadCount));
  };

  const handleSelectGroup = (room: any) => {
    setSelectedGroup(room);
    setView('group');
  };

  const handleBack = () => {
    setSelectedPartner(null);
    setSelectedGroup(null);
    setReplyTo(null);
    setShowSearch(false);
    setShowPinned(false);
    setView('sidebar');
    stopTyping();
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedPartner) return;
    stopTyping();
    const expiresAt = getExpiryDate();
    if (replyTo) {
      const payload = JSON.stringify({ text: content, reply_to_id: replyTo.id });
      await sendMessage(payload, selectedPartner.id);
      setReplyTo(null);
    } else {
      await sendMessage(content, selectedPartner.id);
    }
    // Set expiry if disappearing is active
    if (expiresAt) {
      // Get latest message and set expiry
      const { data: latest } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('sender_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (latest?.[0]) {
        await supabase.from('direct_messages').update({ expires_at: expiresAt }).eq('id', latest[0].id);
      }
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedPartner) return;
    await sendFileMessage(file, selectedPartner.id);
    setReplyTo(null);
  };

  const handleReply = (message: ChatMessage) => setReplyTo(message);

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ content: '🚫 تم حذف هذه الرسالة', message_type: 'system' })
        .eq('id', messageId)
        .eq('sender_id', user!.id);
      if (error) throw error;
      if (selectedPartner) await fetchMessagesForPartner(selectedPartner.id);
      toast.success('تم حذف الرسالة');
    } catch {
      toast.error('فشل حذف الرسالة');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    const isPinned = pinnedMessages.some(m => m.id === messageId);
    await togglePin(messageId, isPinned);
    if (selectedPartner) await fetchMessagesForPartner(selectedPartner.id);
  };

  const handleForwardMessage = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setForwardDialog({ open: true, messageContent: msg.content });
    }
  };

  const handleForwardTo = async (targetPartnerId: string) => {
    try {
      let content = forwardDialog.messageContent;
      try {
        const parsed = JSON.parse(content);
        content = `⤵️ رسالة مُعاد توجيهها:\n${parsed.text || content}`;
      } catch {
        content = `⤵️ رسالة مُعاد توجيهها:\n${content}`;
      }
      await sendMessage(content, targetPartnerId);
      toast.success('تم إعادة التوجيه');
    } catch {
      toast.error('فشل إعادة التوجيه');
    }
  };

  const handleScrollToMessage = (messageId: string) => {
    setScrollToMessageId(messageId);
    setTimeout(() => setScrollToMessageId(null), 100);
  };

  const handleInputChange = () => {
    sendTyping();
  };

  if (!user) return null;

  const widgetSize = isExpanded
    ? isMobile ? 'fixed inset-0 z-50' : 'fixed bottom-4 left-4 z-50 w-[700px] h-[85vh]'
    : isMobile
      ? 'fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-2 right-2 z-50 h-[70vh]'
      : 'fixed bottom-20 left-4 z-50 w-[420px] h-[600px]';

  const selectedPartnerOnline = selectedPartner ? isOrgOnline(selectedPartner.id) : false;
  const selectedPartnerLastSeen = selectedPartner ? lastSeenMap.get(selectedPartner.id) : undefined;

  const replyPreviewInfo = replyTo ? {
    id: replyTo.id,
    content: (() => {
      try { const p = JSON.parse(replyTo.content); return p.text || replyTo.content; } catch { return replyTo.content; }
    })(),
    senderName: replyTo.sender?.full_name || (replyTo.sender_id === user.id ? 'أنت' : 'مستخدم'),
  } : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              widgetSize,
              "bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              "border border-border/50 backdrop-blur-sm"
            )}
          >
            {/* Header */}
            {view === 'sidebar' ? (
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">المحادثات</span>
                    {unreadTotal > 0 && (
                      <span className="text-[11px] text-emerald-100 block">{unreadTotal} رسالة جديدة</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : selectedPartner && (
              <div className="flex items-center justify-between bg-gradient-to-l from-emerald-600 to-emerald-700 shrink-0">
                <ChatHeader
                  partnerName={selectedPartner.name}
                  partnerType={selectedPartner.organization_type}
                  partnerLogo={selectedPartner.logo_url}
                  isOnline={selectedPartnerOnline}
                  lastSeen={selectedPartnerLastSeen}
                  onBack={handleBack}
                  onSearch={() => setShowSearch(!showSearch)}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  isMobile={isMobile}
                  conversationId={selectedPartner.id}
                  isTyping={isPartnerTyping}
                />
                <div className="flex items-center gap-1 pr-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {view === 'sidebar' ? (
                <ChatSidebar
                  partners={partners}
                  selectedPartnerId={selectedPartner?.id || null}
                  onSelectPartner={handleSelectPartner}
                  loading={loadingPartners}
                />
              ) : (
                <>
                  {/* Search Bar */}
                  {showSearch && (
                    <ChatSearchBar
                      messages={messages}
                      onScrollToMessage={handleScrollToMessage}
                      onClose={() => setShowSearch(false)}
                    />
                  )}

                  <div className="flex-1 overflow-hidden relative" style={getWallpaperStyle()}>
                    <EnhancedChatMessages
                      messages={messages}
                      currentUserId={user.id}
                      roomName={selectedPartner?.name}
                      onReply={handleReply}
                      partnerName={partnerTypingName || selectedPartner?.name}
                      onDeleteMessage={handleDeleteMessage}
                      onForwardMessage={handleForwardMessage}
                      isPartnerTyping={isPartnerTyping}
                      scrollToMessageId={scrollToMessageId}
                    />
                  </div>

                  {/* Reply Preview */}
                  {replyPreviewInfo && (
                    <ReplyPreview replyToMessage={replyPreviewInfo} onCancel={() => setReplyTo(null)} />
                  )}

                  <EnhancedChatInput
                    onSendMessage={handleSendMessage}
                    onSendFile={handleSendFile}
                    sending={sending}
                    uploadProgress={uploadProgress}
                    onTyping={handleInputChange}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Dialog */}
      <ForwardMessageDialog
        open={forwardDialog.open}
        onOpenChange={(open) => setForwardDialog(prev => ({ ...prev, open }))}
        partners={partners.filter(p => p.id !== selectedPartner?.id)}
        messageContent={forwardDialog.messageContent}
        onForward={handleForwardTo}
      />
    </>
  );
};

export default EnhancedChatWidget;
