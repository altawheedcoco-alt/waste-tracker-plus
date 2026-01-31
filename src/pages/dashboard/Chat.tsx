import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Building2, 
  Truck, 
  Recycle, 
  Handshake,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatRoom } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler';
  city: string;
  email: string;
  logo_url: string | null;
}

type TabType = 'partners' | 'generator' | 'transporter' | 'recycler';

const Chat = () => {
  const { user, organization, roles } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useDisplayMode();
  const {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    loading,
    sending,
    sendMessage,
    sendFileMessage,
    getOrCreateGeneralRoom,
    createRoom,
    soundEnabled,
    setSoundEnabled,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [partnerOrganizations, setPartnerOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('partners');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const isAdmin = roles.includes('admin');

  // On mobile, hide sidebar when room is selected
  useEffect(() => {
    if (isMobile && currentRoom) {
      setShowSidebar(false);
    }
  }, [currentRoom, isMobile]);

  // Load rooms on mount
  useEffect(() => {
    if (rooms.length === 0 && !loading) {
      getOrCreateGeneralRoom();
    }
  }, [rooms.length, loading, getOrCreateGeneralRoom]);

  // Fetch partner organizations
  const fetchPartnerOrganizations = async () => {
    if (!organization?.id) return;
    
    setLoadingOrgs(true);
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
        setPartnerOrganizations([]);
        setLoadingOrgs(false);
        return;
      }

      const { data: partners, error: partnersError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, email, logo_url')
        .in('id', Array.from(partnerIds))
        .order('name');

      if (partnersError) throw partnersError;
      setPartnerOrganizations(partners || []);
    } catch (error) {
      console.error('Error fetching partner organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Fetch organizations by type
  const fetchOrganizationsByType = async (type: 'generator' | 'transporter' | 'recycler') => {
    setLoadingOrgs(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, email, logo_url')
        .eq('organization_type', type)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as TabType;
    setSelectedTab(tab);
    setOrgSearchQuery('');
    
    if (tab === 'partners') {
      fetchPartnerOrganizations();
    } else {
      fetchOrganizationsByType(tab);
    }
  };

  // Open dialog
  const handleOpenDialog = () => {
    setIsAddDialogOpen(true);
    if (isAdmin) {
      setSelectedTab('generator');
      fetchOrganizationsByType('generator');
    } else {
      setSelectedTab('partners');
      fetchPartnerOrganizations();
    }
  };

  // Start chat with organization
  const startChatWithOrganization = async (org: Organization) => {
    if (!user || creatingRoom) return;

    setCreatingRoom(true);
    try {
      const { data: orgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', org.id);

      if (usersError) throw usersError;

      const existingRoom = rooms.find(room => 
        room.type === 'direct' && room.name === org.name
      );

      if (existingRoom) {
        setCurrentRoom(existingRoom);
        setIsAddDialogOpen(false);
        if (isMobile) setShowSidebar(false);
        toast({
          title: 'محادثة موجودة',
          description: `تم فتح المحادثة مع ${org.name}`,
        });
        return;
      }

      const participantIds = orgUsers?.map(u => u.user_id) || [];
      const room = await createRoom(org.name, 'direct', participantIds);

      if (room) {
        setCurrentRoom(room);
        setIsAddDialogOpen(false);
        if (isMobile) setShowSidebar(false);
        toast({
          title: 'تم بنجاح',
          description: `تم بدء محادثة مع ${org.name}`,
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'خطأ',
        description: 'فشل بدء المحادثة',
        variant: 'destructive',
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
    if (isMobile) setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
    if (isMobile) setCurrentRoom(null);
  };

  const handleJoinGeneralChat = async () => {
    const room = await getOrCreateGeneralRoom();
    if (room) {
      setCurrentRoom(room);
      if (isMobile) setShowSidebar(false);
    }
  };

  const totalUnreadCount = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  const displayOrganizations = selectedTab === 'partners' ? partnerOrganizations : organizations;
  const filteredOrganizations = displayOrganizations.filter(org =>
    org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
    org.city.toLowerCase().includes(orgSearchQuery.toLowerCase())
  );

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

  if (!user) return null;

  // Calculate layout dimensions
  const sidebarWidth = isMobile ? '100%' : isTablet ? '280px' : '320px';
  const showChat = !isMobile || !showSidebar;
  const showSidebarPanel = !isMobile || showSidebar;

  return (
    <DashboardLayout>
      <div className={cn(
        "flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        isMobile ? "mx-2 my-2" : "mx-4 my-4"
      )}>
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {showSidebarPanel && (
            <motion.div
              initial={isMobile ? { x: -300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: -300, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: sidebarWidth, minWidth: sidebarWidth }}
              className="h-full"
            >
              <ChatSidebar
                rooms={rooms}
                currentRoom={currentRoom}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectRoom={handleSelectRoom}
                onNewChat={handleOpenDialog}
                onJoinGeneralChat={handleJoinGeneralChat}
                totalUnreadCount={totalUnreadCount}
              />
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
              {currentRoom ? (
                <>
                  <ChatHeader
                    room={currentRoom}
                    onBack={handleBack}
                    soundEnabled={soundEnabled}
                    onToggleSound={() => setSoundEnabled(!soundEnabled)}
                    showBackButton={isMobile}
                  />
                  <ChatMessages
                    messages={messages}
                    currentUserId={user.id}
                    roomName={currentRoom.name || undefined}
                  />
                  <ChatInput
                    onSendMessage={async (msg) => { await sendMessage(msg); }}
                    onSendFile={sendFileMessage}
                    sending={sending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">مرحباً بك في المحادثات</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      اختر محادثة من القائمة أو ابدأ محادثة جديدة
                    </p>
                    <Button onClick={handleOpenDialog} className="gap-2">
                      <Plus className="w-4 h-4" />
                      بدء محادثة جديدة
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {isAdmin ? 'اختر جهة للتواصل معها' : 'اختر شريك للتواصل معه'}
            </DialogTitle>
          </DialogHeader>

          {isAdmin ? (
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generator" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">الجهات المولدة</span>
                  <span className="sm:hidden">مولدة</span>
                </TabsTrigger>
                <TabsTrigger value="transporter" className="gap-2">
                  <Truck className="w-4 h-4" />
                  <span className="hidden sm:inline">الجهات الناقلة</span>
                  <span className="sm:hidden">ناقلة</span>
                </TabsTrigger>
                <TabsTrigger value="recycler" className="gap-2">
                  <Recycle className="w-4 h-4" />
                  <span className="hidden sm:inline">الجهات المدورة</span>
                  <span className="sm:hidden">مدورة</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={orgSearchQuery}
                    onChange={(e) => setOrgSearchQuery(e.target.value)}
                    placeholder="بحث بالاسم أو المدينة..."
                    className="pr-9"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  {loadingOrgs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  ) : filteredOrganizations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="mx-auto mb-2 opacity-50" size={32} />
                      <p className="text-sm">لا توجد جهات متاحة</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOrganizations.map((org) => {
                        const OrgIcon = getOrgTypeIcon(org.organization_type);
                        return (
                          <motion.button
                            key={org.id}
                            onClick={() => startChatWithOrganization(org)}
                            disabled={creatingRoom}
                            className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-right flex items-center gap-4 disabled:opacity-50"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={org.logo_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <OrgIcon className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{org.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {getOrgTypeLabel(org.organization_type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{org.city}</span>
                              </div>
                            </div>
                            {creatingRoom && (
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Tabs>
          ) : (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Handshake className="w-5 h-5 text-primary" />
                <p className="text-sm">يمكنك التواصل مع الجهات التي لديك شحنات مشتركة معها</p>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  placeholder="بحث في الشركاء..."
                  className="pr-9"
                />
              </div>

              <ScrollArea className="h-[400px]">
                {loadingOrgs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : filteredOrganizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Handshake className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">لا يوجد شركاء حالياً</p>
                    <p className="text-xs mt-1">سيظهر الشركاء عند إنشاء شحنات مشتركة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOrganizations.map((org) => {
                      const OrgIcon = getOrgTypeIcon(org.organization_type);
                      return (
                        <motion.button
                          key={org.id}
                          onClick={() => startChatWithOrganization(org)}
                          disabled={creatingRoom}
                          className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-right flex items-center gap-4 disabled:opacity-50"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={org.logo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <OrgIcon className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{org.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getOrgTypeLabel(org.organization_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{org.city}</span>
                            </div>
                          </div>
                          {creatingRoom && (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Chat;
