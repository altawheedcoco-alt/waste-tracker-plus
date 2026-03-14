import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical,
  ArrowRight,
  Building2,
  Truck,
  Recycle,
  Volume2,
  VolumeX,
  Trash2,
  Star,
  Ban,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHeaderProps {
  partnerName: string;
  partnerType: string;
  partnerLogo?: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  onBack?: () => void;
  onSearch?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isMobile?: boolean;
}

const ChatHeader = ({
  partnerName,
  partnerType,
  partnerLogo,
  isOnline,
  lastSeen,
  onBack,
  onSearch,
  soundEnabled,
  onToggleSound,
  isMobile = false
}: ChatHeaderProps) => {
  const { t } = useLanguage();
  
  const getOrgTypeIcon = () => {
    switch (partnerType) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getOrgTypeName = () => {
    switch (partnerType) {
      case 'generator': return t('chat.wasteGenerator');
      case 'transporter': return t('chat.wasteTransporter');
      case 'recycler': return t('chat.wasteRecycler');
      default: return t('chat.partner');
    }
  };

  const Icon = getOrgTypeIcon();

  return (
    <div className={cn(
      "flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm",
      isMobile ? "p-2" : "p-3"
    )}>
      {/* Right Side - Partner Info */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}

        <div className="relative">
          <Avatar className={cn(isMobile ? "h-10 w-10" : "h-11 w-11")}>
            {partnerLogo ? <AvatarImage src={partnerLogo} /> : null}
            <AvatarFallback className="bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
          )}
        </div>

        <div>
          <h3 className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
            {partnerName}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] py-0 h-4">
              {getOrgTypeName()}
            </Badge>
            {isOnline ? (
              <span className="text-[11px] text-emerald-600 font-medium">{t('chat.onlineNow')}</span>
            ) : lastSeen && (
              <span className="text-[11px] text-muted-foreground">
                {t('chat.lastSeen')} {lastSeen}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Left Side - Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Phone className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('chat.voiceCall')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Video className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('chat.videoCall')}</TooltipContent>
            </Tooltip>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('chat.searchChat')}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Info className="w-4 h-4 ml-2" />
              {t('chat.orgInfo')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="w-4 h-4 ml-2" />
              {t('chat.addFavorite')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleSound}>
              {soundEnabled ? (
                <>
                  <VolumeX className="w-4 h-4 ml-2" />
                  {t('chat.muteNotifications')}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 ml-2" />
                  {t('chat.enableNotifications')}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="w-4 h-4 ml-2" />
              {t('chat.deleteChat')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Ban className="w-4 h-4 ml-2" />
              {t('chat.blockOrg')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
