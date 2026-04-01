import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Lock, MoreVertical, Ban,
  Building2, StickyNote, Bell, Download, Timer,
  Info, Image as ImageIcon, Pin, Star, Clock, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ClickableImage from '@/components/ui/ClickableImage';
import ChatWallpaperPicker from '@/components/chat/ChatWallpaperPicker';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { PrivateConversation } from '@/hooks/usePrivateChat';

interface ChatHeaderBarProps {
  selectedConvo: PrivateConversation;
  selectedConvoId: string | null;
  isMobile: boolean;
  isPartnerTyping: boolean;
  partnerOnline: { isOnline: boolean; lastSeen: string | null };
  disappearActive: boolean;
  showNotes: boolean;
  notifSettings: { level: string };
  pinnedMessagesCount: number;
  starredMessagesCount: number;
  galleryImagesCount: number;
  onShowSidebar: () => void;
  onToggleChatSearch: () => void;
  onTogglePartnerInfo: () => void;
  onToggleNotes: () => void;
  onOpenGallery: () => void;
  onOpenStarredPanel: () => void;
  onTogglePinnedBar: () => void;
  onExport: () => void;
  onOpenNotifDialog: () => void;
  onOpenScheduleDialog: () => void;
  onOpenDisappearDialog: () => void;
  onBlock: () => void;
}

const ChatHeaderBar = memo(({
  selectedConvo, selectedConvoId, isMobile,
  isPartnerTyping, partnerOnline, disappearActive,
  showNotes, notifSettings, pinnedMessagesCount, starredMessagesCount, galleryImagesCount,
  onShowSidebar, onToggleChatSearch, onTogglePartnerInfo, onToggleNotes,
  onOpenGallery, onOpenStarredPanel, onTogglePinnedBar,
  onExport, onOpenNotifDialog, onOpenScheduleDialog, onOpenDisappearDialog, onBlock,
}: ChatHeaderBarProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-14 px-3 flex items-center justify-between border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowSidebar}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        <ClickableImage src={selectedConvo.partner?.avatar_url || ''} protected>
          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarImage src={selectedConvo.partner?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{selectedConvo.partner?.full_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
        </ClickableImage>
        <div className="text-right">
          <button className="text-sm font-semibold hover:underline cursor-pointer"
            onClick={() => { if (selectedConvo.partner?.user_id) navigate(`/dashboard/profile?userId=${selectedConvo.partner.user_id}`); }}>
            {selectedConvo.partner?.full_name}
          </button>
          <div className="flex items-center gap-1 text-[10px]">
            <AnimatePresence mode="wait">
              {isPartnerTyping ? (
                <motion.span key="typing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-primary font-medium">يكتب الآن...</motion.span>
              ) : partnerOnline.isOnline ? (
                <motion.span key="online" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-green-500 flex items-center gap-1">
                  <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  متصل الآن
                </motion.span>
              ) : partnerOnline.lastSeen ? (
                <motion.span key="lastseen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground">
                  آخر ظهور {(() => {
                    const d = new Date(partnerOnline.lastSeen);
                    if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
                    if (isYesterday(d)) return 'أمس ' + format(d, 'hh:mm a', { locale: ar });
                    return format(d, 'd/M hh:mm a', { locale: ar });
                  })()}
                </motion.span>
              ) : (
                <motion.button key="org" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground flex items-center gap-1 hover:underline cursor-pointer" onClick={() => navigate('/dashboard/organization-profile')}>
                  <Building2 className="w-2.5 h-2.5" />
                  {selectedConvo.partner?.organization_name || 'غير محدد'}
                </motion.button>
              )}
            </AnimatePresence>
            <span className="mx-1 text-muted-foreground">·</span>
            <Lock className="w-2.5 h-2.5 text-primary" />
            <span className="text-primary">E2E</span>
            {disappearActive && (
              <>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Timer className="w-2.5 h-2.5 text-primary" />
                <span className="text-primary text-[9px]">مؤقتة</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleChatSearch} title="بحث في الرسائل">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onTogglePartnerInfo} title="معلومات الشريك">
          <Info className="w-4 h-4" />
        </Button>
        <ChatWallpaperPicker conversationId={selectedConvoId || undefined} />
        {galleryImagesCount > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenGallery} title="معرض الصور">
            <ImageIcon className="w-4 h-4" />
          </Button>
        )}
        <Button variant={showNotes ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={onToggleNotes}>
          <StickyNote className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onOpenStarredPanel}>
              <Star className="w-4 h-4 ml-2" /> الرسائل المميزة
              {starredMessagesCount > 0 && <Badge className="h-4 text-[9px] px-1 bg-amber-500/20 text-amber-600 mr-auto">{starredMessagesCount}</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTogglePinnedBar}>
              <Pin className="w-4 h-4 ml-2" /> الرسائل المثبتة
              {pinnedMessagesCount > 0 && <Badge className="h-4 text-[9px] px-1 bg-primary/20 text-primary mr-auto">{pinnedMessagesCount}</Badge>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}><Download className="w-4 h-4 ml-2" /> تصدير المحادثة</DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenNotifDialog}>
              <Bell className="w-4 h-4 ml-2" /> إعدادات الإشعارات
              {notifSettings.level !== 'all' && <Badge className="h-4 text-[9px] px-1 bg-primary/20 text-primary mr-auto">{notifSettings.level === 'none' ? 'مكتوم' : 'إشارات'}</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenScheduleDialog}>
              <Clock className="w-4 h-4 ml-2" /> جدولة رسالة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenDisappearDialog}>
              <Timer className="w-4 h-4 ml-2" /> الرسائل المؤقتة
              {disappearActive && <Badge className="h-4 text-[9px] px-1 bg-primary/20 text-primary mr-auto">مفعّل</Badge>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBlock} className="text-destructive"><Ban className="w-4 h-4 ml-2" /> حظر</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

ChatHeaderBar.displayName = 'ChatHeaderBar';
export default ChatHeaderBar;
