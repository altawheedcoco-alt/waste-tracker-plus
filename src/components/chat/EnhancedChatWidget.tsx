import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';
import { onWidgetToggle } from '@/lib/widgetBus';
import { usePresence } from '@/hooks/usePresence';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

import ChatSidebar, { ChatPartner } from './ChatSidebar';
import ChatHeader from './ChatHeader';
import EnhancedChatMessages from './EnhancedChatMessages';
import EnhancedChatInput from './EnhancedChatInput';
import ReplyPreview from './ReplyPreview';

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
  const [view, setView] = useState<'sidebar' | 'chat'>('sidebar');
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const { getWallpaperStyle } = useChatWallpaper(selectedPartner?.id);

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

  // Fetch partners when widget opens
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
        const total = partnersWithUnread.reduce((sum, p) => sum + p.unreadCount, 0);
        setUnreadTotal(total);
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
    await fetchMessagesForPartner(partner.id);
    await markPartnerAsRead(partner.id);
    setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, unreadCount: 0 } : p));
    setUnreadTotal(prev => Math.max(0, prev - partner.unreadCount));
  };

  const handleBack = () => {
    setSelectedPartner(null);
    setReplyTo(null);
    setView('sidebar');
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedPartner) return;
    // If replying, wrap content with reply metadata
    if (replyTo) {
      const payload = JSON.stringify({ 
        text: content, 
        reply_to_id: replyTo.id 
      });
      await sendMessage(payload, selectedPartner.id);
      setReplyTo(null);
    } else {
      await sendMessage(content, selectedPartner.id);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedPartner) return;
    await sendFileMessage(file, selectedPartner.id);
    setReplyTo(null);
  };

  const handleReply = (message: ChatMessage) => {
    setReplyTo(message);
  };

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

  if (!user) return null;

  const widgetSize = isExpanded 
    ? isMobile 
      ? 'fixed inset-0 z-50' 
      : 'fixed bottom-4 left-4 z-50 w-[700px] h-[85vh]'
    : isMobile
      ? 'fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-2 right-2 z-50 h-[70vh]'
      : 'fixed bottom-20 left-4 z-50 w-[420px] h-[600px]';

  const selectedPartnerOnline = selectedPartner ? isOrgOnline(selectedPartner.id) : false;
  const selectedPartnerLastSeen = selectedPartner ? lastSeenMap.get(selectedPartner.id) : undefined;

  // Get reply preview info
  const replyPreviewInfo = replyTo ? {
    id: replyTo.id,
    content: (() => {
      try {
        const parsed = JSON.parse(replyTo.content);
        return parsed.text || replyTo.content;
      } catch {
        return replyTo.content;
      }
    })(),
    senderName: replyTo.sender?.full_name || (replyTo.sender_id === user.id ? 'أنت' : 'مستخدم'),
  } : null;

  return (
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
                    <span className="text-[11px] text-emerald-100 block">
                      {unreadTotal} رسالة جديدة
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                  onClick={() => setIsOpen(false)}
                >
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
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                isMobile={isMobile}
                conversationId={selectedPartner.id}
              />
              <div className="flex items-center gap-1 pr-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15"
                  onClick={() => setIsOpen(false)}
                >
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
                <div className="flex-1 overflow-hidden" style={getWallpaperStyle()}>
                  <EnhancedChatMessages
                    messages={messages}
                    currentUserId={user.id}
                    roomName={selectedPartner?.name}
                    onReply={handleReply}
                    partnerName={selectedPartner?.name}
                    onDeleteMessage={handleDeleteMessage}
                  />
                </div>
                {/* Reply Preview */}
                {replyPreviewInfo && (
                  <ReplyPreview
                    replyToMessage={replyPreviewInfo}
                    onCancel={() => setReplyTo(null)}
                  />
                )}
                <EnhancedChatInput
                  onSendMessage={handleSendMessage}
                  onSendFile={handleSendFile}
                  sending={sending}
                  uploadProgress={uploadProgress}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedChatWidget;
