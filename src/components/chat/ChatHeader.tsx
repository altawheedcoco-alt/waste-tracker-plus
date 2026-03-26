import { useState } from 'react';
import ClickableImage from '@/components/ui/ClickableImage';
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
  Paintbrush,
  HelpCircle,
  Slash,
  FileSearch,
  CreditCard,
  PenTool,
  FileText,
  Package,
  Receipt,
  MapPin,
  Stamp,
  AtSign
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
  conversationId?: string;
  isTyping?: boolean;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onShowPartnerInfo?: () => void;
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
  isMobile = false,
  conversationId,
  isTyping = false,
  onVoiceCall,
  onVideoCall,
  onShowPartnerInfo,
}: ChatHeaderProps) => {
  const { t } = useLanguage();
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const getOrgTypeIcon = () => {
    switch (partnerType) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getStatusText = () => {
    if (isTyping) return 'يكتب...';
    if (isOnline) return t('chat.onlineNow');
    if (lastSeen) return `${t('chat.lastSeen')} ${lastSeen}`;
    return partnerType === 'generator' ? t('chat.wasteGenerator') : 
           partnerType === 'transporter' ? t('chat.wasteTransporter') : 
           partnerType === 'recycler' ? t('chat.wasteRecycler') : t('chat.partner');
  };

  const Icon = getOrgTypeIcon();

  return (
    <>
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
            <ClickableImage src={partnerLogo || ''} protected>
              <Avatar className="h-10 w-10 ring-2 ring-white/20">
                {partnerLogo ? <AvatarImage src={partnerLogo} /> : null}
                <AvatarFallback className="bg-white/20 text-white">
                  <Icon className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </ClickableImage>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-wa-header rounded-full" />
            )}
          </div>

          <button className="min-w-0 text-right cursor-pointer" onClick={onShowPartnerInfo}>
            <h3 className="font-bold text-white text-sm truncate">{partnerName}</h3>
            <p className={cn(
              "text-[11px] truncate",
              isTyping ? "text-green-200 font-medium" : isOnline ? "text-green-200" : "text-white/60"
            )}>
              {getStatusText()}
            </p>
          </button>
        </div>

        {/* Left Side - Actions */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={onVideoCall}>
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={onVoiceCall}>
            <Phone className="w-4 h-4" />
          </Button>

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
              <DropdownMenuItem onClick={onSearch}>
                <Search className="w-4 h-4 ml-2" />
                {t('chat.searchChat')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowWallpaper(true)}>
                <Paintbrush className="w-4 h-4 ml-2" />
                خلفية الدردشة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGuide(true)}>
                <HelpCircle className="w-4 h-4 ml-2" />
                دليل الأوامر والوظائف
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

      {/* Wallpaper picker dialog triggered from dropdown */}
      {showWallpaper && (
        <ChatWallpaperPickerDialog 
          conversationId={conversationId} 
          open={showWallpaper} 
          onOpenChange={setShowWallpaper} 
        />
      )}

      {/* Chat Features Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-primary" />
              دليل وظائف الدردشة التفاعلية
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            {/* Slash Commands */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Slash className="w-4 h-4 text-primary" />
                </div>
                الأوامر السريعة (/)
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                اكتب <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">/</kbd> في حقل الإدخال لرؤية قائمة الأوامر:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { icon: Package, cmd: '/shipment', label: 'مشاركة بطاقة شحنة' },
                  { icon: Receipt, cmd: '/invoice', label: 'إرسال/طلب فاتورة' },
                  { icon: FileText, cmd: '/doc', label: 'إرفاق مستند من الأرشيف' },
                  { icon: PenTool, cmd: '/sign', label: 'طلب توقيع على مستند' },
                  { icon: Stamp, cmd: '/stamp', label: 'طلب ختم رسمي' },
                  { icon: MapPin, cmd: '/track', label: 'مشاركة رابط تتبع' },
                ].map(item => (
                  <div key={item.cmd} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <code className="text-[11px] font-mono text-primary font-bold">{item.cmd}</code>
                      <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rich Cards */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                البطاقات التفاعلية
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                عند مشاركة شحنة أو فاتورة أو مستند، تظهر كـ <strong>بطاقة تفاعلية</strong> داخل الرسالة مع أزرار مثل:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['فتح التفاصيل', 'وقّع الآن', 'اعتمد الفاتورة', 'تتبع الشحنة'].map(action => (
                  <span key={action} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                    {action}
                  </span>
                ))}
              </div>
            </div>

            {/* Resource Search */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-amber-600" />
                </div>
                البحث السياقي (🔍)
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                اضغط زر <strong>🔍</strong> بجانب حقل الإدخال للبحث في مواردك (شحنات، فواتير، مستندات، طلبات توقيع) وإرفاقها مباشرة في المحادثة.
              </p>
            </div>

            {/* Mentions */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <AtSign className="w-4 h-4 text-blue-600" />
                </div>
                الإشارات (@mention)
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                اكتب <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">@</kbd> لإشارة شخص أو جهة مرتبطة بك. سيتم إشعارهم فوراً.
              </p>
            </div>

            {/* Read receipts */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                علامات القراءة
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { mark: '✓', color: 'text-muted-foreground', desc: 'وصلت للخادم' },
                  { mark: '✓✓', color: 'text-muted-foreground', desc: 'وصلت للمستلم' },
                  { mark: '✓✓', color: 'text-blue-500', desc: 'تمت القراءة' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`font-bold ${item.color}`}>{item.mark}</span>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Separate dialog component so it can be triggered programmatically
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WALLPAPER_PRESETS, useChatWallpaper, type ChatWallpaper } from '@/hooks/useChatWallpaper';
import { Check } from 'lucide-react';

function ChatWallpaperPickerDialog({ 
  conversationId, 
  open, 
  onOpenChange 
}: { 
  conversationId?: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { wallpaper, setWallpaper } = useChatWallpaper(conversationId);

  const handleSelect = async (preset: typeof WALLPAPER_PRESETS[0]) => {
    await setWallpaper({ type: preset.type, value: preset.value }, conversationId);
    onOpenChange(false);
  };

  const isSelected = (preset: typeof WALLPAPER_PRESETS[0]) =>
    wallpaper?.type === preset.type && wallpaper?.value === preset.value;

  const getPreviewStyle = (preset: typeof WALLPAPER_PRESETS[0]): React.CSSProperties => {
    if (preset.type === 'gradient') return { background: preset.value };
    if (preset.type === 'pattern') return { backgroundColor: 'hsl(var(--muted))', backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.15) 1px, transparent 1px)`, backgroundSize: '8px 8px' };
    return { backgroundColor: preset.value };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>خلفية الدردشة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">ألوان</p>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'color').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105",
                    isSelected(preset) ? "border-primary shadow-md" : "border-transparent"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium" style={{ color: preset.value.startsWith('#1') || preset.value.startsWith('#0') ? '#fff' : '#333' }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">تدرجات</p>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'gradient').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105",
                    isSelected(preset) ? "border-primary shadow-md" : "border-transparent"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium text-white drop-shadow">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">أنماط</p>
            <div className="grid grid-cols-3 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'pattern').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-[4/3] rounded-xl border-2 transition-all hover:scale-105 bg-muted",
                    isSelected(preset) ? "border-primary shadow-md" : "border-border"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium text-muted-foreground">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChatHeader;
