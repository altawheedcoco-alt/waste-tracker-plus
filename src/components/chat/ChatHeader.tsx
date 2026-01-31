import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  Building2,
  Truck,
  Recycle,
  Handshake,
  Volume2,
  VolumeX,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatRoom } from '@/hooks/useChat';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  room: ChatRoom | null;
  onBack?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showBackButton?: boolean;
}

const ChatHeader = ({ 
  room, 
  onBack, 
  soundEnabled, 
  onToggleSound,
  showBackButton = false 
}: ChatHeaderProps) => {
  const { isMobile } = useDisplayMode();

  const getRoomIcon = () => {
    if (!room) return Users;
    if (room.type === 'group') return Users;
    if (room.name?.includes('مولدة')) return Building2;
    if (room.name?.includes('ناقلة')) return Truck;
    if (room.name?.includes('مدورة')) return Recycle;
    return Handshake;
  };

  const getRoomColor = () => {
    if (!room) return 'bg-primary/10 text-primary';
    if (room.type === 'group') return 'bg-primary/10 text-primary';
    if (room.name?.includes('مولدة')) return 'bg-blue-500/10 text-blue-500';
    if (room.name?.includes('ناقلة')) return 'bg-amber-500/10 text-amber-500';
    if (room.name?.includes('مدورة')) return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-purple-500/10 text-purple-500';
  };

  const RoomIcon = getRoomIcon();
  const iconColor = getRoomColor();

  if (!room) {
    return (
      <div className={cn(
        "border-b border-border bg-card flex items-center justify-center",
        isMobile ? "p-3" : "p-4"
      )}>
        <p className="text-muted-foreground text-sm">اختر محادثة للبدء</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "border-b border-border bg-card/50 backdrop-blur-sm",
      isMobile ? "p-2.5" : "p-3"
    )}>
      <div className="flex items-center justify-between">
        {/* Left: Back + Room Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
              onClick={onBack}
            >
              <ArrowRight className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
            </Button>
          )}

          <div className={cn(
            "rounded-full flex items-center justify-center shrink-0",
            iconColor,
            isMobile ? "w-9 h-9" : "w-10 h-10"
          )}>
            <RoomIcon className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              isMobile ? "text-sm" : "text-base"
            )}>
              {room.name || 'محادثة'}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">متصل</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
                  onClick={onToggleSound}
                >
                  {soundEnabled ? (
                    <Volume2 className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  ) : (
                    <VolumeX className={cn("text-muted-foreground", isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("shrink-0", isMobile ? "h-8 w-8" : "h-9 w-9")}
              >
                <MoreVertical className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Info className="w-4 h-4" />
                معلومات المحادثة
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Users className="w-4 h-4" />
                المشاركون
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                مغادرة المحادثة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
