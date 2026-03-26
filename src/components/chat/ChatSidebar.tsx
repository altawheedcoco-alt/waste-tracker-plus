import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Building2, 
  Truck, 
  Recycle,
  MessageCircle,
  Users,
  Pin,
  MoreVertical,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  Video,
  FileText,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ChatPartner {
  id: string;
  name: string;
  organization_type: string;
  logo_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isTyping?: boolean;
}

interface ChatSidebarProps {
  partners: ChatPartner[];
  selectedPartnerId: string | null;
  onSelectPartner: (partner: ChatPartner) => void;
  loading: boolean;
}

const ChatSidebar = ({ partners, selectedPartnerId, onSelectPartner, loading }: ChatSidebarProps) => {
  const { organization } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedPartners, setPinnedPartners] = useState<Set<string>>(new Set());
  const [lastMessages, setLastMessages] = useState<Map<string, { content: string; time: string; isRead: boolean; isMine: boolean; type?: string; status?: string }>>(new Map());

  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!organization?.id || partners.length === 0) return;
      const newLastMessages = new Map<string, { content: string; time: string; isRead: boolean; isMine: boolean; type?: string; status?: string }>();

      for (const partner of partners) {
        const { data } = await supabase
          .from('direct_messages')
          .select('content, created_at, is_read, sender_organization_id, message_type')
          .or(
            `and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partner.id}),and(sender_organization_id.eq.${partner.id},receiver_organization_id.eq.${organization.id})`
          )
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          newLastMessages.set(partner.id, {
            content: data.content,
            time: data.created_at,
            isRead: data.is_read || data.sender_organization_id === organization.id,
            isMine: data.sender_organization_id === organization.id,
            type: data.message_type,
            status: data.is_read ? 'read' : 'delivered',
          });
        }
      }
      setLastMessages(newLastMessages);
    };
    fetchLastMessages();

    // Realtime subscription for new messages to update sidebar
    if (!organization?.id) return;
    const channel = supabase
      .channel('sidebar-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_organization_id=eq.${organization.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new;
          if (!newMsg) return;
          const partnerId = newMsg.sender_organization_id;
          setLastMessages(prev => {
            const updated = new Map(prev);
            updated.set(partnerId, {
              content: newMsg.content,
              time: newMsg.created_at,
              isRead: false,
              isMine: false,
              type: newMsg.message_type,
            });
            return updated;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, partners]);

  const filteredPartners = useMemo(() => {
    let filtered = partners;
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => {
      if (pinnedPartners.has(a.id) && !pinnedPartners.has(b.id)) return -1;
      if (!pinnedPartners.has(a.id) && pinnedPartners.has(b.id)) return 1;
      const aTime = lastMessages.get(a.id)?.time;
      const bTime = lastMessages.get(b.id)?.time;
      if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
      return 0;
    });
  }, [partners, searchQuery, pinnedPartners, lastMessages]);

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const formatMessageTime = (timeStr: string) => {
    const date = new Date(timeStr);
    if (isToday(date)) return format(date, 'hh:mm a', { locale: ar });
    if (isYesterday(date)) return 'أمس';
    if (differenceInDays(new Date(), date) < 7) return format(date, 'EEEE', { locale: ar });
    return format(date, 'd/M/yyyy', { locale: ar });
  };

  const getMessagePreview = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.file_name) {
        const ext = parsed.file_name.split('.').pop()?.toLowerCase();
        if (['jpg','jpeg','png','gif','webp'].includes(ext || '')) return { icon: ImageIcon, text: '📷 صورة' };
        if (['mp4','webm','mov'].includes(ext || '')) return { icon: Video, text: '🎬 فيديو' };
        if (['webm','mp3','wav','ogg','m4a'].includes(ext || '')) return { icon: Mic, text: '🎤 رسالة صوتية' };
        return { icon: FileText, text: `📎 ${parsed.file_name}` };
      }
      return { icon: null, text: parsed.text || content };
    } catch {
      if (content.includes('تم حذف')) return { icon: null, text: '🚫 تم حذف هذه الرسالة' };
      return { icon: null, text: content.length > 45 ? content.substring(0, 45) + '...' : content };
    }
  };

  const togglePin = (partnerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedPartners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerId)) newSet.delete(partnerId);
      else newSet.add(partnerId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search */}
      <div className="px-3 py-2.5 bg-muted/30">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث أو ابدأ محادثة جديدة"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-9 bg-background border-0 shadow-sm rounded-lg text-sm"
          />
          {searchQuery && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Partners List */}
      <ScrollArea className="flex-1">
        <div>
          <AnimatePresence>
            {filteredPartners.map((partner, index) => {
              const Icon = getOrgTypeIcon(partner.organization_type);
              const lastMsg = lastMessages.get(partner.id);
              const isSelected = selectedPartnerId === partner.id;
              const isPinned = pinnedPartners.has(partner.id);
              const preview = lastMsg ? getMessagePreview(lastMsg.content) : null;

              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <button
                    onClick={() => onSelectPartner(partner)}
                    className={cn(
                      "w-full px-3 py-3 flex items-center gap-3 transition-all relative group",
                      "hover:bg-muted/60 active:bg-muted/80",
                      isSelected && "bg-wa-outgoing/40"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar className="h-[50px] w-[50px]">
                        {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                          <Icon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      {partner.isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-primary border-2 border-background rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-right border-b border-border/40 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isPinned && <Pin className="w-3 h-3 text-muted-foreground shrink-0" />}
                          <span className="font-semibold text-[13px] truncate">{partner.name}</span>
                        </div>
                        {lastMsg && (
                          <span className={cn(
                            "text-[11px] shrink-0",
                            partner.unreadCount > 0 ? "text-wa-unread-badge font-semibold" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(lastMsg.time)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Typing indicator in sidebar */}
                          {partner.isTyping ? (
                            <span className="text-xs text-primary font-medium italic">يكتب...</span>
                          ) : (
                            <>
                              {lastMsg?.isMine && (
                                lastMsg.status === 'read' || lastMsg.isRead ? (
                                  <CheckCheck className="w-4 h-4 text-sky-400 shrink-0" />
                                ) : lastMsg.status === 'delivered' ? (
                                  <CheckCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                                )
                              )}
                              <p className="text-xs text-muted-foreground truncate">
                                {preview?.text || 'ابدأ المحادثة'}
                              </p>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {partner.unreadCount > 0 && (
                            <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-wa-unread-badge text-white rounded-full border-0">
                              {partner.unreadCount > 99 ? '99+' : partner.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => togglePin(partner.id, e as any)}>
                          <Pin className="w-4 h-4 ml-2" />
                          {isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPartners.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">لا توجد محادثات</p>
              <p className="text-xs mt-1.5 text-muted-foreground/70 max-w-[200px] mx-auto">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'ستظهر المحادثات عند التعامل مع جهات مرتبطة'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
