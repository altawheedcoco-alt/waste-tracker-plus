import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Users, 
  Building2, 
  Truck, 
  Recycle,
  Loader2,
  Handshake
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatRoom } from '@/hooks/useChat';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectRoom: (room: ChatRoom) => void;
  onNewChat: () => void;
  onJoinGeneralChat: () => void;
  totalUnreadCount: number;
}

const ChatSidebar = ({
  rooms,
  currentRoom,
  loading,
  searchQuery,
  onSearchChange,
  onSelectRoom,
  onNewChat,
  onJoinGeneralChat,
  totalUnreadCount,
}: ChatSidebarProps) => {
  const { isMobile, getResponsiveClass } = useDisplayMode();

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomIcon = (room: ChatRoom) => {
    if (room.type === 'group') return Users;
    if (room.name?.includes('مولدة')) return Building2;
    if (room.name?.includes('ناقلة')) return Truck;
    if (room.name?.includes('مدورة')) return Recycle;
    return Handshake;
  };

  const getRoomColor = (room: ChatRoom) => {
    if (room.type === 'group') return 'bg-primary/10 text-primary';
    if (room.name?.includes('مولدة')) return 'bg-blue-500/10 text-blue-500';
    if (room.name?.includes('ناقلة')) return 'bg-amber-500/10 text-amber-500';
    if (room.name?.includes('مدورة')) return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-purple-500/10 text-purple-500';
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className={cn(
        "border-b border-border bg-gradient-to-l from-primary/5 to-transparent",
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className={cn("font-bold", isMobile ? "text-base" : "text-lg")}>المحادثات</h2>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {totalUnreadCount}
              </Badge>
            )}
          </div>
          <Button size="sm" onClick={onNewChat} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {!isMobile && <span>جديد</span>}
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في المحادثات..."
            className="pr-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className={cn("space-y-1", isMobile ? "p-2" : "p-3")}>
          {/* General Chat Button */}
          <motion.button
            onClick={onJoinGeneralChat}
            className={cn(
              "w-full rounded-xl border transition-all text-right flex items-center gap-3",
              "bg-gradient-to-l from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
              isMobile ? "p-2.5" : "p-3"
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className={cn(
              "rounded-full bg-primary flex items-center justify-center text-primary-foreground",
              isMobile ? "w-10 h-10" : "w-11 h-11"
            )}>
              <Users className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn("font-semibold truncate", isMobile ? "text-sm" : "text-sm")}>
                المحادثة العامة
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                تواصل مع جميع الجهات
              </p>
            </div>
          </motion.button>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {/* Rooms */}
          {!loading && filteredRooms.map((room) => {
            const RoomIcon = getRoomIcon(room);
            const iconColor = getRoomColor(room);
            const isActive = currentRoom?.id === room.id;

            return (
              <motion.button
                key={room.id}
                onClick={() => onSelectRoom(room)}
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
                  <RoomIcon className={isMobile ? "w-5 h-5" : "w-5 h-5"} />
                  {room.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "font-semibold truncate",
                      isMobile ? "text-sm" : "text-sm",
                      room.unreadCount > 0 && "text-foreground"
                    )}>
                      {room.name || 'محادثة'}
                    </h4>
                    {room.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(room.lastMessage.created_at), 'HH:mm', { locale: ar })}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className={cn(
                      "text-xs truncate mt-0.5",
                      room.unreadCount > 0 ? "text-foreground/70 font-medium" : "text-muted-foreground"
                    )}>
                      {room.lastMessage.content}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}

          {/* Empty State */}
          {!loading && filteredRooms.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">لا توجد نتائج للبحث</p>
            </div>
          )}

          {!loading && rooms.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">لا توجد محادثات</p>
              <p className="text-xs mt-1">ابدأ محادثة جديدة</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
