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
  Info,
  Paintbrush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatWallpaperPicker from './ChatWallpaperPicker';

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

  const getStatusText = () => {
    if (isOnline) return t('chat.onlineNow');
    if (lastSeen) return `${t('chat.lastSeen')} ${lastSeen}`;
    return partnerType === 'generator' ? t('chat.wasteGenerator') : 
           partnerType === 'transporter' ? t('chat.wasteTransporter') : 
           partnerType === 'recycler' ? t('chat.wasteRecycler') : t('chat.partner');
  };

  const Icon = getOrgTypeIcon();

  return (
    <div className={cn(
      "flex items-center justify-between flex-1",
      isMobile ? "px-2 py-2" : "px-3 py-2.5"
    )}>
      {/* Right Side - Partner Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0 text-white hover:bg-white/15">
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}

        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            {partnerLogo ? <AvatarImage src={partnerLogo} /> : null}
            <AvatarFallback className="bg-white/20 text-white">
              <Icon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-700 rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{partnerName}</h3>
          <p className={cn(
            "text-[11px] truncate",
            isOnline ? "text-emerald-200" : "text-white/60"
          )}>
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Left Side - Actions */}
      <div className="flex items-center gap-0.5">
        {!isMobile && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15">
              <Video className="w-4 h-4" />
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Info className="w-4 h-4 ml-2" />
              {t('chat.orgInfo')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Search className="w-4 h-4 ml-2" />
              {t('chat.searchChat')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Paintbrush className="w-4 h-4 ml-2" />
              خلفية الدردشة
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
