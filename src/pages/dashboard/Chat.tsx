import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Building2, 
  Truck, 
  Recycle, 
  Loader2,
  ArrowRight,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Partner {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler' | 'disposal';
  city: string;
  email: string;
  logo_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const Chat = () => {
  const { user, organization } = useAuth();
  const { isMobile, isTablet } = useDisplayMode();
  const {
    messages,
    sending,
    uploadProgress,
    sendMessage,
    sendFileMessage,
    soundEnabled,
    setSoundEnabled,
    fetchMessagesForPartner,
    markPartnerAsRead,
    getPartnerUnreadCount,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerList, setShowPartnerList] = useState(true);

  // On mobile, hide partner list when partner is selected
  useEffect(() => {
    if (isMobile && selectedPartner) {
      setShowPartnerList(false);
    }
  }, [selectedPartner, isMobile]);

  // Fetch partners (organizations with shared shipments)
  const fetchPartners = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      if (shipmentsError) throw shipmentsError;

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

      if (partnerIds.size === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, email, logo_url')
        .in('id', Array.from(partnerIds))
        .order('name');

      if (orgsError) throw orgsError;

      // Get last messages and unread counts for each partner
      const partnersWithDetails = await Promise.all(
        (orgs || []).map(async (org) => {
          const unreadCount = await getPartnerUnreadCount(org.id);
          
          // Get last message
          const { data: lastMsgData } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .or(`and(sender_id.eq.${user?.id},receiver_organization_id.eq.${org.id}),and(sender_organization_id.eq.${org.id},receiver_user_id.eq.${user?.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...org,
            lastMessage: lastMsgData?.content,
            lastMessageTime: lastMsgData?.created_at,
            unreadCount,
          };
        })
      );

      // Sort by last message time
      partnersWithDetails.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setPartners(partnersWithDetails);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [organization?.id, user?.id]);

  // Handle partner selection
  const handleSelectPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    await fetchMessagesForPartner(partner.id);
    await markPartnerAsRead(partner.id);
    
    // Update local state to remove unread count
    setPartners(prev => 
      prev.map(p => p.id === partner.id ? { ...p, unreadCount: 0 } : p)
    );
    
    if (isMobile) setShowPartnerList(false);
  };

  const handleBack = () => {
    setShowPartnerList(true);
    if (isMobile) setSelectedPartner(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedPartner) return;
    await sendMessage(content, selectedPartner.id);
    
    // Refresh partner list to update last message
    fetchPartners();
  };

  const handleSendFile = async (file: File) => {
    if (!selectedPartner) return;
    await sendFileMessage(file, selectedPartner.id);
    fetchPartners();
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'جهة مولدة';
      case 'transporter': return 'جهة ناقلة';
      case 'recycler': return 'جهة مدورة';
      default: return type;
    }
  };

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'generator': return 'bg-blue-500/10 text-blue-600';
      case 'transporter': return 'bg-amber-500/10 text-amber-600';
      case 'recycler': return 'bg-emerald-500/10 text-emerald-600';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = partners.reduce((sum, p) => sum + (p.unreadCount || 0), 0);

  if (!user) return null;

  const sidebarWidth = isMobile ? '100%' : isTablet ? '300px' : '340px';
  const showChat = !isMobile || !showPartnerList;
  const showSidebarPanel = !isMobile || showPartnerList;

  return (
    <DashboardLayout>
      <div className={cn(
        "flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        isMobile ? "mx-2 my-2" : "mx-4 my-4"
      )}>
        {/* Partners List */}
        <AnimatePresence mode="wait">
          {showSidebarPanel && (
            <motion.div
              initial={isMobile ? { x: -300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: -300, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: sidebarWidth, minWidth: sidebarWidth }}
              className="h-full flex flex-col bg-card border-l border-border"
            >
              {/* Header */}
              <div className={cn(
                "border-b border-border bg-gradient-to-l from-primary/5 to-transparent",
                isMobile ? "p-3" : "p-4"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h2 className={cn("font-bold", isMobile ? "text-base" : "text-lg")}>المحادثات</h2>
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                      {totalUnread}
                    </Badge>
                  )}
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في الشركاء..."
                    className="pr-9 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Partners List */}
              <ScrollArea className="flex-1">
                <div className={cn("space-y-1", isMobile ? "p-2" : "p-3")}>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : filteredPartners.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? (
                        <>
                          <Search className="mx-auto mb-2 opacity-30" size={32} />
                          <p className="text-sm">لا توجد نتائج للبحث</p>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mx-auto mb-2 opacity-30" size={32} />
                          <p className="text-sm">لا يوجد شركاء للتواصل</p>
                          <p className="text-xs mt-1">الشركاء يظهرون عند إنشاء شحنات مشتركة</p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredPartners.map((partner) => {
                      const PartnerIcon = getOrgTypeIcon(partner.organization_type);
                      const iconColor = getOrgTypeColor(partner.organization_type);
                      const isActive = selectedPartner?.id === partner.id;

                      return (
                        <motion.button
                          key={partner.id}
                          onClick={() => handleSelectPartner(partner)}
                          className={cn(
                            "w-full rounded-xl border transition-all text-right flex items-center gap-3 group",
                            isActive 
                              ? "bg-primary/10 border-primary/30 shadow-sm" 
                              : "bg-card border-border/50 hover:bg-muted/50 hover:border-border",
                            isMobile ? "p-2.5" : "p-3"
                          )}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className={cn(
                            "rounded-full flex items-center justify-center shrink-0 relative",
                            iconColor,
                            isMobile ? "w-10 h-10" : "w-11 h-11"
                          )}>
                            {partner.logo_url ? (
                              <Avatar className="w-full h-full">
                                <AvatarImage src={partner.logo_url} />
                                <AvatarFallback><PartnerIcon className="w-5 h-5" /></AvatarFallback>
                              </Avatar>
                            ) : (
                              <PartnerIcon className="w-5 h-5" />
                            )}
                            {(partner.unreadCount || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                                {partner.unreadCount > 9 ? '9+' : partner.unreadCount}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={cn(
                                "font-semibold truncate",
                                isMobile ? "text-sm" : "text-sm",
                                (partner.unreadCount || 0) > 0 && "text-foreground"
                              )}>
                                {partner.name}
                              </h4>
                              {partner.lastMessageTime && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {format(new Date(partner.lastMessageTime), 'HH:mm', { locale: ar })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {getOrgTypeLabel(partner.organization_type)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">• {partner.city}</span>
                            </div>
                            {partner.lastMessage && (
                              <p className={cn(
                                "text-xs truncate mt-1",
                                (partner.unreadCount || 0) > 0 ? "text-foreground/70 font-medium" : "text-muted-foreground"
                              )}>
                                {partner.lastMessage}
                              </p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <AnimatePresence mode="wait">
          {showChat && (
            <motion.div
              initial={isMobile ? { x: 300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: 300, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-1 flex flex-col h-full bg-muted/30"
            >
              {selectedPartner ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
                    {isMobile && (
                      <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    )}
                    <div className={cn(
                      "rounded-full flex items-center justify-center",
                      getOrgTypeColor(selectedPartner.organization_type),
                      "w-10 h-10"
                    )}>
                      {selectedPartner.logo_url ? (
                        <Avatar className="w-full h-full">
                          <AvatarImage src={selectedPartner.logo_url} />
                          <AvatarFallback>
                            {(() => { const Icon = getOrgTypeIcon(selectedPartner.organization_type); return <Icon className="w-5 h-5" />; })()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        (() => { const Icon = getOrgTypeIcon(selectedPartner.organization_type); return <Icon className="w-5 h-5" />; })()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{selectedPartner.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getOrgTypeLabel(selectedPartner.organization_type)} • {selectedPartner.city}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ChatMessages
                    messages={messages}
                    currentUserId={user.id}
                    roomName={selectedPartner.name}
                  />

                  {/* Input */}
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    onSendFile={handleSendFile}
                    sending={sending}
                    uploadProgress={uploadProgress}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">مرحباً بك في المحادثات</h3>
                    <p className="text-muted-foreground text-sm">
                      اختر شريك من القائمة لبدء المحادثة
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
