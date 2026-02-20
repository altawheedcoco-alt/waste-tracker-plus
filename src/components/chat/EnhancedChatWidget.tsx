import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';
import { onWidgetToggle } from '@/lib/widgetBus';
import { usePresence } from '@/hooks/usePresence';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import ChatSidebar, { ChatPartner } from './ChatSidebar';
import ChatHeader from './ChatHeader';
import EnhancedChatMessages from './EnhancedChatMessages';
import EnhancedChatInput from './EnhancedChatInput';

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

  // Listen for unified menu toggle
  useEffect(() => {
    return onWidgetToggle((id) => {
      if (id === 'team-chat') {
        setIsOpen(true);
        setView('sidebar');
      }
    });
  }, []);

  // Fetch last message time for each partner (for "last seen")
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
        if (shipment.generator_id && shipment.generator_id !== organization.id) {
          partnerIds.add(shipment.generator_id);
        }
        if (shipment.transporter_id && shipment.transporter_id !== organization.id) {
          partnerIds.add(shipment.transporter_id);
        }
        if (shipment.recycler_id && shipment.recycler_id !== organization.id) {
          partnerIds.add(shipment.recycler_id);
        }
      });

      if (partnerIds.size > 0) {
        const partnerIdsArr = Array.from(partnerIds);
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type, logo_url')
          .in('id', partnerIdsArr)
          .order('name');
        
        // Get unread counts for each partner
        const partnersWithUnread: ChatPartner[] = await Promise.all(
          (orgs || []).map(async (org) => {
            const unreadCount = await getPartnerUnreadCount(org.id);
            return {
              id: org.id,
              name: org.name,
              organization_type: org.organization_type as 'generator' | 'transporter' | 'recycler',
              logo_url: org.logo_url,
              unreadCount,
              isOnline: isOrgOnline(org.id),
            };
          })
        );
        
        setPartners(partnersWithUnread);
        
        // Calculate total unread
        const total = partnersWithUnread.reduce((sum, p) => sum + p.unreadCount, 0);
        setUnreadTotal(total);

        // Fetch last seen times
        fetchLastSeenTimes(partnerIdsArr);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoadingPartners(false);
    }
  }, [organization?.id, getPartnerUnreadCount, isOrgOnline, fetchLastSeenTimes]);

  // Update online status in partners list when presence changes
  useEffect(() => {
    setPartners(prev => prev.map(p => ({ ...p, isOnline: isOrgOnline(p.id) })));
  }, [isOrgOnline]);

  // Fetch partners on open
  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen, fetchPartners]);

  // Handle opening the widget
  const handleOpen = () => {
    setIsOpen(true);
    setView('sidebar');
  };

  // Handle selecting a partner
  const handleSelectPartner = async (partner: ChatPartner) => {
    setSelectedPartner(partner);
    setView('chat');
    await fetchMessagesForPartner(partner.id);
    await markPartnerAsRead(partner.id);
    
    // Update unread count
    setPartners(prev => 
      prev.map(p => p.id === partner.id ? { ...p, unreadCount: 0 } : p)
    );
    setUnreadTotal(prev => Math.max(0, prev - partner.unreadCount));
  };

  // Handle going back to sidebar
  const handleBack = () => {
    setSelectedPartner(null);
    setView('sidebar');
  };

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!selectedPartner) return;
    await sendMessage(content, selectedPartner.id);
  };

  const handleSendFile = async (file: File) => {
    if (!selectedPartner) return;
    await sendFileMessage(file, selectedPartner.id);
  };

  if (!user) return null;

  const widgetSize = isExpanded 
    ? isMobile 
      ? 'fixed inset-2 z-50' 
      : 'fixed bottom-4 left-4 z-50 w-[600px] h-[700px]'
    : isMobile
      ? 'fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-2 right-2 z-50 h-[60vh]'
      : 'fixed bottom-20 left-4 z-50 w-[380px] h-[550px]';

  const selectedPartnerOnline = selectedPartner ? isOrgOnline(selectedPartner.id) : false;
  const selectedPartnerLastSeen = selectedPartner ? lastSeenMap.get(selectedPartner.id) : undefined;

  return (
    <>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              widgetSize,
              "bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            )}
          >
            {/* Widget Header (when in sidebar view) */}
            {view === 'sidebar' && (
              <div className="flex items-center justify-between p-3 border-b border-border bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">المحادثات</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Chat Header (when in chat view) */}
            {view === 'chat' && selectedPartner && (
              <div className="flex items-center justify-between border-b border-border">
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
                />
                <div className="flex items-center gap-1 pr-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {view === 'sidebar' ? (
                <ChatSidebar
                  partners={partners}
                  selectedPartnerId={selectedPartner?.id || null}
                  onSelectPartner={handleSelectPartner}
                  loading={loadingPartners}
                />
              ) : (
                <>
                  <EnhancedChatMessages
                    messages={messages}
                    currentUserId={user.id}
                    roomName={selectedPartner?.name}
                  />
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
    </>
  );
};

export default EnhancedChatWidget;
