import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Building2, 
  Truck, 
  Recycle,
  MessageCircle,
  Users,
  Star,
  Pin,
  MoreVertical,
  Check,
  CheckCheck
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
  const [lastMessages, setLastMessages] = useState<Map<string, { content: string; time: string; isRead: boolean }>>(new Map());

  // Fetch last message for each partner
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!organization?.id || partners.length === 0) return;

      const newLastMessages = new Map<string, { content: string; time: string; isRead: boolean }>();

      for (const partner of partners) {
        const { data } = await supabase
          .from('direct_messages')
          .select('content, created_at, is_read, sender_organization_id')
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
            isRead: data.is_read || data.sender_organization_id === organization.id
          });
        }
      }

      setLastMessages(newLastMessages);
    };

    fetchLastMessages();
  }, [organization?.id, partners]);

  // Filter and sort partners
  const filteredPartners = useMemo(() => {
    let filtered = partners;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (pinnedPartners.has(a.id) && !pinnedPartners.has(b.id)) return -1;
      if (!pinnedPartners.has(a.id) && pinnedPartners.has(b.id)) return 1;
      
      const aTime = lastMessages.get(a.id)?.time;
      const bTime = lastMessages.get(b.id)?.time;
      
      if (aTime && bTime) {
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }
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

  const getOrgTypeName = (type: string) => {
    switch (type) {
      case 'generator': return 'مُنتج';
      case 'transporter': return 'ناقل';
      case 'recycler': return 'مُعالج';
      default: return 'شريك';
    }
  };

  const formatMessageTime = (timeStr: string) => {
    const date = new Date(timeStr);
    if (isToday(date)) {
      return format(date, 'hh:mm a', { locale: ar });
    } else if (isYesterday(date)) {
      return 'أمس';
    } else if (differenceInDays(new Date(), date) < 7) {
      return format(date, 'EEEE', { locale: ar });
    }
    return format(date, 'd/M/yyyy', { locale: ar });
  };

  const truncateMessage = (content: string, maxLength: number = 40) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.file_name) {
        return `📎 ${parsed.file_name}`;
      }
      return parsed.text || content;
    } catch {
      if (content.length > maxLength) {
        return content.substring(0, maxLength) + '...';
      }
      return content;
    }
  };

  const togglePin = (partnerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedPartners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerId)) {
        newSet.delete(partnerId);
      } else {
        newSet.add(partnerId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 animate-pulse" size={32} />
          <p className="text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Partners List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          <AnimatePresence>
            {filteredPartners.map((partner, index) => {
              const Icon = getOrgTypeIcon(partner.organization_type);
              const lastMsg = lastMessages.get(partner.id);
              const isSelected = selectedPartnerId === partner.id;
              const isPinned = pinnedPartners.has(partner.id);

              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    onClick={() => onSelectPartner(partner)}
                    className={cn(
                      "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors relative group",
                      isSelected && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    {/* Avatar with Online Indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12">
                        {partner.logo_url ? (
                          <AvatarImage src={partner.logo_url} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {partner.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isPinned && (
                            <Pin className="w-3 h-3 text-primary shrink-0" />
                          )}
                          <span className="font-semibold text-sm truncate">
                            {partner.name}
                          </span>
                        </div>
                        {lastMsg && (
                          <span className={cn(
                            "text-[11px] shrink-0",
                            partner.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(lastMsg.time)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {lastMsg && (
                            <>
                              {lastMsg.isRead ? (
                                <CheckCheck className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              <p className="text-xs text-muted-foreground truncate">
                                {truncateMessage(lastMsg.content)}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {partner.unreadCount > 0 && (
                          <Badge 
                            variant="default" 
                            className="h-5 min-w-[20px] px-1.5 text-[10px] bg-primary shrink-0"
                          >
                            {partner.unreadCount > 99 ? '99+' : partner.unreadCount}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {getOrgTypeName(partner.organization_type)}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions Menu - appears on hover */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => togglePin(partner.id, e as any)}>
                          <Pin className="w-4 h-4 ml-2" />
                          {isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="w-4 h-4 ml-2" />
                          إضافة للمفضلة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPartners.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto mb-3 opacity-30" size={48} />
              <p className="text-sm font-medium">لا توجد محادثات</p>
              <p className="text-xs mt-1">
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
