import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Users, Loader2, Search, Building2, Truck, Recycle, Plus, Handshake, Paperclip, Image, Volume2, VolumeX, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChat, ChatRoom } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [partnerOrganizations, setPartnerOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('partners');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = roles.includes('admin');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load rooms on mount
  useEffect(() => {
    if (rooms.length === 0 && !loading) {
      getOrCreateGeneralRoom();
    }
  }, [rooms.length, loading, getOrCreateGeneralRoom]);

  // Fetch partner organizations (organizations with shared shipments)
  const fetchPartnerOrganizations = async () => {
    if (!organization?.id) return;
    
    setLoadingOrgs(true);
    try {
      // Get all organizations that have shipments with current organization
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      if (shipmentsError) throw shipmentsError;

      // Collect unique organization IDs
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

      // Fetch partner organizations (no is_active filter - allow messaging offline orgs)
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

  // Fetch all organizations by type (for admin)
  const fetchOrganizationsByType = async (type: 'generator' | 'transporter' | 'recycler') => {
    setLoadingOrgs(true);
    try {
      // Fetch all organizations (no is_active filter - allow messaging any org)
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

  // Open dialog and fetch organizations
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
      // Get ALL users from the target organization (no is_active filter - messages will wait for them)
      const { data: orgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', org.id);

      if (usersError) throw usersError;

      // Check if a direct room already exists with this organization
      const existingRoom = rooms.find(room => 
        room.type === 'direct' && room.name === org.name
      );

      if (existingRoom) {
        setCurrentRoom(existingRoom);
        setIsAddDialogOpen(false);
        toast({
          title: 'محادثة موجودة',
          description: `تم فتح المحادثة مع ${org.name}`,
        });
        return;
      }

      // Create room with the organization name (even if no users, they can see messages when they join)
      const participantIds = orgUsers?.map(u => u.user_id) || [];
      const room = await createRoom(org.name, 'direct', participantIds);

      if (room) {
        setCurrentRoom(room);
        setIsAddDialogOpen(false);
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

  const handleSend = async () => {
    if (selectedFile) {
      await sendFileMessage(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    if (!inputValue.trim()) return;
    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
  };

  const handleJoinGeneralChat = async () => {
    const room = await getOrCreateGeneralRoom();
    if (room) {
      setCurrentRoom(room);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'خطأ',
          description: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Parse message content for files
  const parseMessageContent = (message: { content: string; message_type: string }) => {
    if (message.message_type === 'text') {
      return { text: message.content, fileUrl: null, fileName: null };
    }
    try {
      const parsed = JSON.parse(message.content);
      return { 
        text: parsed.text || '', 
        fileUrl: parsed.file_url, 
        fileName: parsed.file_name 
      };
    } catch {
      return { text: message.content, fileUrl: null, fileName: null };
    }
  };

  // Calculate total unread count
  const totalUnreadCount = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get the list to display based on current tab
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

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-primary" />
              المحادثات
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {totalUnreadCount}
                </Badge>
              )}
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="ml-2"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'تواصل مع جميع الجهات والشركات' : 'تواصل مع شركائك في الشحنات'}
          </p>

          {/* Add Chat Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                بدء محادثة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  {isAdmin ? 'اختر جهة للتواصل معها' : 'اختر شريك للتواصل معه'}
                </DialogTitle>
              </DialogHeader>

              {isAdmin ? (
                // Admin view - tabs for all organization types
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
                                <Button size="sm" variant="outline" className="shrink-0 gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  محادثة
                                </Button>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </Tabs>
              ) : (
                // Non-admin view - only partners with shipments
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <Handshake className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      يتم عرض الجهات التي لديك شحنات مشتركة معها فقط
                    </p>
                  </div>

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
                        <Handshake className="mx-auto mb-2 opacity-50" size={32} />
                        <p className="text-sm">لا يوجد شركاء حتى الآن</p>
                        <p className="text-xs mt-1">سيظهر هنا الشركاء بعد إنشاء شحنات مشتركة</p>
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
                              <Button size="sm" variant="outline" className="shrink-0 gap-1">
                                <MessageCircle className="w-4 h-4" />
                                محادثة
                              </Button>
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Rooms List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                غرف المحادثة
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في الغرف..."
                  className="pr-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-4 pb-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Join General Chat Button */}
                    <motion.button
                      onClick={handleJoinGeneralChat}
                      className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-right flex items-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Users size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">المحادثة العامة</h4>
                        <p className="text-xs text-muted-foreground">تواصل مع جميع الجهات</p>
                      </div>
                    </motion.button>

                    {/* Existing Rooms */}
                    {filteredRooms.map((room) => (
                      <motion.button
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`w-full p-3 rounded-xl border transition-colors text-right flex items-center gap-3 ${
                          currentRoom?.id === room.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border hover:bg-muted/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {room.name?.[0] || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{room.name || 'محادثة'}</h4>
                          {room.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {room.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {room.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(room.lastMessage.created_at), 'HH:mm', { locale: ar })}
                          </span>
                        )}
                      </motion.button>
                    ))}

                    {filteredRooms.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
                        <p className="text-sm">لا توجد محادثات</p>
                        <p className="text-xs">ابدأ محادثة جديدة أو انضم للمحادثة العامة</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {currentRoom ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {currentRoom.name?.[0] || 'م'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{currentRoom.name || 'محادثة'}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {currentRoom.type === 'group' ? 'محادثة عامة' : 'محادثة خاصة'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="mx-auto mb-2 opacity-50" size={32} />
                          <p className="text-sm">لا توجد رسائل</p>
                          <p className="text-xs">ابدأ المحادثة الآن</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.sender_id === user.id;
                          const { text, fileUrl, fileName } = parseMessageContent(message);
                          const isImage = message.message_type === 'image';
                          const isFile = message.message_type === 'file';
                          
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
                            >
                              <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
                                {!isOwn && (
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                      {message.sender?.full_name?.[0] || '؟'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  {!isOwn && message.sender && (
                                    <p className="text-xs text-muted-foreground mb-1 text-right">
                                      {message.sender.full_name}
                                    </p>
                                  )}
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      isOwn
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                        : 'bg-muted rounded-tl-sm'
                                    }`}
                                  >
                                    {isImage && fileUrl ? (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={fileUrl} 
                                          alt={fileName || 'صورة'} 
                                          className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                      </a>
                                    ) : isFile && fileUrl ? (
                                      <a 
                                        href={fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 ${isOwn ? 'text-primary-foreground' : 'text-foreground'} hover:underline`}
                                      >
                                        <FileText className="w-5 h-5" />
                                        <span className="text-sm">{fileName || 'ملف'}</span>
                                      </a>
                                    ) : (
                                      <p className="text-sm whitespace-pre-wrap">{text || message.content}</p>
                                    )}
                                  </div>
                                  <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-left' : 'text-right'}`}>
                                    {format(new Date(message.created_at), 'HH:mm', { locale: ar })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border bg-muted/30">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-muted rounded-lg flex items-center gap-3">
                        {previewUrl ? (
                          <img src={previewUrl} alt="معاينة" className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                            <FileText className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearSelectedFile}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        className="hidden"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={sending}
                              className="shrink-0"
                            >
                              <Paperclip size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>إرفاق ملف أو صورة</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedFile ? "اضغط إرسال لإرسال الملف..." : "اكتب رسالتك..."}
                        className="flex-1"
                        disabled={sending || !!selectedFile}
                      />
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={sending || (!inputValue.trim() && !selectedFile)}
                        className="shrink-0"
                      >
                        {sending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-4 opacity-50" size={64} />
                  <h3 className="text-lg font-semibold mb-2">اختر محادثة</h3>
                  <p className="text-sm mb-4">اختر غرفة من القائمة أو ابدأ محادثة جديدة</p>
                  <Button onClick={handleOpenDialog} className="gap-2">
                    <Plus className="w-4 h-4" />
                    بدء محادثة جديدة
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
