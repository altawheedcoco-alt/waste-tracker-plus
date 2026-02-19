import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MessageCircle, Search, Building2, Truck, Recycle, Loader2,
  ArrowRight, Plus, Users, Megaphone, Settings, MoreVertical,
  Phone, Video, Pin, Star, Archive, Trash2, Shield, CheckCheck,
  Check, Mic, Paperclip, Send, Image as ImageIcon, HeadphonesIcon,
  Bell, BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useGroupChat, ChatRoom } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import CreateGroupDialog from '@/components/chat/CreateGroupDialog';
import BroadcastDialog from '@/components/chat/BroadcastDialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
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
  isOnline?: boolean;
}

const Chat = () => {
  const { user, organization } = useAuth();
  const { t } = useLanguage();
  const { isMobile, isTablet } = useDisplayMode();
  const {
    messages, sending, uploadProgress, sendMessage, sendFileMessage,
    soundEnabled, setSoundEnabled, fetchMessagesForPartner, markPartnerAsRead,
    getPartnerUnreadCount,
  } = useChat();
  const {
    rooms, roomsLoading, fetchRoomMessages, createGroup, isCreatingGroup,
    sendRoomMessage, sendBroadcast, isSendingBroadcast,
  } = useGroupChat();

  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      const partnerIds = new Set<string>();
      shipments?.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id].forEach(id => {
          if (id && id !== organization.id) partnerIds.add(id);
        });
      });

      if (partnerIds.size === 0) { setPartners([]); setLoading(false); return; }

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, email, logo_url')
        .in('id', Array.from(partnerIds))
        .order('name');

      const partnersWithDetails = await Promise.all(
        (orgs || []).map(async (org) => {
          const unreadCount = await getPartnerUnreadCount(org.id);
          const { data: lastMsg } = await supabase
            .from('direct_messages')
            .select('content, created_at')
            .or(`and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${org.id}),and(sender_organization_id.eq.${org.id},receiver_organization_id.eq.${organization.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return { ...org, lastMessage: lastMsg?.content, lastMessageTime: lastMsg?.created_at, unreadCount };
        })
      );

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
  }, [organization?.id, user?.id, getPartnerUnreadCount]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // Select partner
  const handleSelectPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    setSelectedRoom(null);
    await fetchMessagesForPartner(partner.id);
    await markPartnerAsRead(partner.id);
    setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, unreadCount: 0 } : p));
    if (isMobile) setShowSidebar(false);
  };

  // Select room
  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    setSelectedPartner(null);
    try {
      const msgs = await fetchRoomMessages(room.id);
      setRoomMessages(msgs.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_organization_id: m.sender_organization_id,
        receiver_organization_id: '',
        content: m.content,
        message_type: m.message_type as any,
        created_at: m.created_at,
        is_read: true,
        sender: m.sender ? { full_name: m.sender.full_name, avatar_url: m.sender.avatar_url } : undefined,
      })));
    } catch (error) {
      console.error('Error fetching room messages:', error);
    }
    if (isMobile) setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
    if (isMobile) { setSelectedPartner(null); setSelectedRoom(null); }
  };

  const handleSendMessage = async (content: string) => {
    if (selectedPartner) {
      await sendMessage(content, selectedPartner.id);
      fetchPartners();
    } else if (selectedRoom) {
      await sendRoomMessage(selectedRoom.id, content);
      const msgs = await fetchRoomMessages(selectedRoom.id);
      setRoomMessages(msgs.map(m => ({
        id: m.id, sender_id: m.sender_id, sender_organization_id: m.sender_organization_id,
        receiver_organization_id: '', content: m.content, message_type: m.message_type as any,
        created_at: m.created_at, is_read: true,
        sender: m.sender ? { full_name: m.sender.full_name, avatar_url: m.sender.avatar_url } : undefined,
      })));
    }
  };

  const handleSendFile = async (file: File) => {
    if (selectedPartner) {
      await sendFileMessage(file, selectedPartner.id);
      fetchPartners();
    }
  };

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'مُنتج';
      case 'transporter': return 'ناقل';
      case 'recycler': return 'مُعالج';
      default: return type;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isToday(date)) return format(date, 'hh:mm a', { locale: ar });
    if (isYesterday(date)) return 'أمس';
    return format(date, 'd/M', { locale: ar });
  };

  const truncateMsg = (content?: string) => {
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      if (parsed.file_name) return `📎 ${parsed.file_name}`;
      return parsed.text || content;
    } catch {
      return content.length > 45 ? content.substring(0, 45) + '...' : content;
    }
  };

  const totalUnread = partners.reduce((sum, p) => sum + (p.unreadCount || 0), 0);
  const groupRooms = rooms.filter(r => r.type === 'group');
  const shipmentRooms = rooms.filter(r => r.type === 'shipment');

  if (!user) return null;

  const showChat = !isMobile || !showSidebar;
  const showSidebarPanel = !isMobile || showSidebar;

  const currentMessages = selectedPartner ? messages : roomMessages;
  const currentName = selectedPartner?.name || selectedRoom?.name || '';

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
              initial={isMobile ? { x: -300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: -300, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25 }}
              style={{ width: isMobile ? '100%' : isTablet ? '300px' : '360px', minWidth: isMobile ? '100%' : isTablet ? '300px' : '360px' }}
              className="h-full flex flex-col bg-card border-l border-border"
            >
              {/* Header */}
              <div className="p-3 border-b border-border bg-gradient-to-l from-primary/5 to-transparent">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm">المحادثات</h2>
                      <p className="text-[10px] text-muted-foreground">{organization?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBroadcast(true)}>
                          <Megaphone className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>بث جماعي</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreateGroup(true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>مجموعة جديدة</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setSoundEnabled(!soundEnabled)}>
                          {soundEnabled ? <Bell className="w-4 h-4 ml-2" /> : <BellOff className="w-4 h-4 ml-2" />}
                          {soundEnabled ? 'كتم الأصوات' : 'تفعيل الأصوات'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 ml-2" />
                          إعدادات المحادثات
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث في المحادثات..."
                    className="pr-9 h-9 text-sm bg-muted/50 border-none"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-2 gap-0 shrink-0">
                  <TabsTrigger value="direct" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 relative">
                    محادثات
                    {totalUnread > 0 && (
                      <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
                    مجموعات
                    {groupRooms.length > 0 && (
                      <Badge variant="secondary" className="mr-1 text-[9px] px-1 py-0 h-4">{groupRooms.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="shipments" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
                    شحنات
                  </TabsTrigger>
                </TabsList>

                {/* Direct Chats */}
                <TabsContent value="direct" className="flex-1 m-0 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="py-1">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                      ) : partners.filter(p => !searchQuery || p.name.includes(searchQuery)).length === 0 ? (
                        <EmptyState icon={MessageCircle} text="لا توجد محادثات" subtext="ستظهر عند التعامل مع جهات مرتبطة" />
                      ) : (
                        partners
                          .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((partner) => (
                            <PartnerItem
                              key={partner.id}
                              partner={partner}
                              isActive={selectedPartner?.id === partner.id}
                              onClick={() => handleSelectPartner(partner)}
                              formatTime={formatTime}
                              truncateMsg={truncateMsg}
                              getOrgIcon={getOrgIcon}
                              getOrgTypeLabel={getOrgTypeLabel}
                            />
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Groups */}
                <TabsContent value="groups" className="flex-1 m-0 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="py-1">
                      {roomsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                      ) : groupRooms.length === 0 ? (
                        <EmptyState icon={Users} text="لا توجد مجموعات" subtext="أنشئ مجموعة للتواصل مع عدة جهات" />
                      ) : (
                        groupRooms.map(room => (
                          <RoomItem
                            key={room.id}
                            room={room}
                            isActive={selectedRoom?.id === room.id}
                            onClick={() => handleSelectRoom(room)}
                            formatTime={formatTime}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Shipment Chats */}
                <TabsContent value="shipments" className="flex-1 m-0 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="py-1">
                      {roomsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                      ) : shipmentRooms.length === 0 ? (
                        <EmptyState icon={Truck} text="لا توجد محادثات شحنات" subtext="ستُنشأ تلقائياً مع كل شحنة" />
                      ) : (
                        shipmentRooms.map(room => (
                          <RoomItem
                            key={room.id}
                            room={room}
                            isActive={selectedRoom?.id === room.id}
                            onClick={() => handleSelectRoom(room)}
                            formatTime={formatTime}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== CHAT AREA ===== */}
        <AnimatePresence mode="wait">
          {showChat && (
            <motion.div
              initial={isMobile ? { x: 300, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: 300, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25 }}
              className="flex-1 flex flex-col h-full bg-muted/20"
            >
              {(selectedPartner || selectedRoom) ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shadow-sm">
                    {isMobile && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleBack}>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    )}
                    
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        {selectedPartner?.logo_url ? (
                          <AvatarImage src={selectedPartner.logo_url} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10">
                          {selectedRoom ? (
                            <Users className="w-5 h-5 text-primary" />
                          ) : (
                            (() => { const Icon = getOrgIcon(selectedPartner?.organization_type || ''); return <Icon className="w-5 h-5 text-primary" />; })()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {selectedPartner?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent border-2 border-card rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{currentName}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {selectedPartner 
                          ? `${getOrgTypeLabel(selectedPartner.organization_type)} • ${selectedPartner.city}`
                          : selectedRoom 
                            ? `${selectedRoom.participant_count || 0} عضو`
                            : ''
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Search className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>بحث في المحادثة</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>
                            <Pin className="w-4 h-4 ml-2" />
                            تثبيت المحادثة
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="w-4 h-4 ml-2" />
                            المفضلة
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BellOff className="w-4 h-4 ml-2" />
                            كتم الإشعارات
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 ml-2" />
                            أرشفة
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Shield className="w-4 h-4 ml-2" />
                            إبلاغ / حظر
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Messages */}
                  <ChatMessages
                    messages={currentMessages}
                    currentUserId={user.id}
                    roomName={currentName}
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
                /* Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"
                    >
                      <MessageCircle className="w-12 h-12 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-bold mb-2">مرحباً بك في المحادثات</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      اختر محادثة من القائمة للبدء، أو أنشئ مجموعة جديدة للتواصل مع شركائك
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setShowCreateGroup(true)}>
                        <Users className="w-4 h-4 ml-1.5" />
                        مجموعة جديدة
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowBroadcast(true)}>
                        <Megaphone className="w-4 h-4 ml-1.5" />
                        بث رسالة
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onCreateGroup={(data) => {
          createGroup(data);
          setShowCreateGroup(false);
        }}
        isCreating={isCreatingGroup}
      />
      <BroadcastDialog
        open={showBroadcast}
        onOpenChange={setShowBroadcast}
        onSendBroadcast={(data) => {
          sendBroadcast(data);
          setShowBroadcast(false);
        }}
        isSending={isSendingBroadcast}
      />
    </DashboardLayout>
  );
};

/* ===== Sub Components ===== */

const EmptyState = ({ icon: Icon, text, subtext }: { icon: any; text: string; subtext: string }) => (
  <div className="text-center py-12 text-muted-foreground">
    <Icon className="mx-auto mb-3 opacity-20" size={40} />
    <p className="text-sm font-medium">{text}</p>
    <p className="text-xs mt-1">{subtext}</p>
  </div>
);

const PartnerItem = ({ partner, isActive, onClick, formatTime, truncateMsg, getOrgIcon, getOrgTypeLabel }: {
  partner: Partner;
  isActive: boolean;
  onClick: () => void;
  formatTime: (t?: string) => string;
  truncateMsg: (c?: string) => string;
  getOrgIcon: (t: string) => any;
  getOrgTypeLabel: (t: string) => string;
}) => {
  const Icon = getOrgIcon(partner.organization_type);
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-2.5 transition-all group text-right border-b border-border/30",
        isActive ? "bg-primary/5" : "hover:bg-muted/40"
      )}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
          <AvatarFallback className="bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      {partner.isOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent border-2 border-card rounded-full" />
      )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{partner.name}</span>
          {partner.lastMessageTime && (
            <span className={cn(
              "text-[10px] shrink-0",
              (partner.unreadCount || 0) > 0 ? "text-primary font-bold" : "text-muted-foreground"
            )}>
              {formatTime(partner.lastMessageTime)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {partner.lastMessage ? truncateMsg(partner.lastMessage) : getOrgTypeLabel(partner.organization_type) + ' • ' + partner.city}
          </p>
          {(partner.unreadCount || 0) > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shrink-0">
              {partner.unreadCount! > 9 ? '9+' : partner.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const RoomItem = ({ room, isActive, onClick, formatTime }: {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
  formatTime: (t?: string) => string;
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "w-full flex items-start gap-3 px-3 py-2.5 transition-all text-right border-b border-border/30",
      isActive ? "bg-primary/5" : "hover:bg-muted/40"
    )}
    whileTap={{ scale: 0.99 }}
  >
    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      {room.type === 'shipment' ? (
        <Truck className="w-5 h-5 text-primary" />
      ) : (
        <Users className="w-5 h-5 text-primary" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm truncate">{room.name || 'مجموعة'}</span>
        {room.last_message_at && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTime(room.last_message_at)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Badge variant="outline" className="text-[9px] py-0 h-3.5 px-1">
          {room.participant_count || 0} عضو
        </Badge>
        {room.last_message_preview && (
          <p className="text-xs text-muted-foreground truncate flex-1">
            {room.last_message_preview.length > 35 ? room.last_message_preview.substring(0, 35) + '...' : room.last_message_preview}
          </p>
        )}
      </div>
    </div>
  </motion.button>
);

export default Chat;
