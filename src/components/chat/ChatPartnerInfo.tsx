import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Bell,
  BellOff,
  Star,
  Trash2,
  ChevronLeft,
  Building2,
  Truck,
  Recycle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatPartnerInfoProps {
  partner: {
    id: string;
    name: string;
    organization_type: string;
    logo_url: string | null;
  };
  mediaCount?: number;
  filesCount?: number;
  linksCount?: number;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onViewMedia?: () => void;
  onViewFiles?: () => void;
  onViewLinks?: () => void;
  onBack: () => void;
  isMobile?: boolean;
}

const ChatPartnerInfo = ({
  partner,
  mediaCount = 0,
  filesCount = 0,
  linksCount = 0,
  notificationsEnabled,
  onToggleNotifications,
  onViewMedia,
  onViewFiles,
  onViewLinks,
  onBack,
  isMobile = false
}: ChatPartnerInfoProps) => {
  
  const getOrgTypeIcon = () => {
    switch (partner.organization_type) {
      case 'generator': return Building2;
      case 'transporter': return Truck;
      case 'recycler': return Recycle;
      default: return Building2;
    }
  };

  const getOrgTypeName = () => {
    switch (partner.organization_type) {
      case 'generator': return 'مُنتج نفايات';
      case 'transporter': return 'ناقل نفايات';
      case 'recycler': return 'مُعالج نفايات';
      default: return 'شريك';
    }
  };

  const Icon = getOrgTypeIcon();

  return (
    <ScrollArea className="h-full">
      <div className={cn("space-y-6", isMobile ? "p-4" : "p-6")}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold">معلومات المحادثة</h3>
        </div>

        {/* Partner Info */}
        <div className="text-center space-y-3">
          <Avatar className="w-24 h-24 mx-auto">
            {partner.logo_url ? (
              <AvatarImage src={partner.logo_url} />
            ) : null}
            <AvatarFallback className="bg-primary/10">
              <Icon className="w-10 h-10 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{partner.name}</h2>
            <Badge variant="outline" className="mt-1">
              {getOrgTypeName()}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Media Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">الوسائط والملفات</h4>
          
          <button 
            onClick={onViewMedia}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium">الصور والفيديو</span>
            </div>
            <Badge variant="secondary">{mediaCount}</Badge>
          </button>

          <button 
            onClick={onViewFiles}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="font-medium">المستندات</span>
            </div>
            <Badge variant="secondary">{filesCount}</Badge>
          </button>

          <button 
            onClick={onViewLinks}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-purple-500" />
              </div>
              <span className="font-medium">الروابط</span>
            </div>
            <Badge variant="secondary">{linksCount}</Badge>
          </button>
        </div>

        <Separator />

        {/* Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">الإعدادات</h4>
          
          <div className="flex items-center justify-between p-3 rounded-lg">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-muted-foreground" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="font-medium">الإشعارات</span>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={onToggleNotifications}
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Star className="w-4 h-4" />
            إضافة للمفضلة
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
            حذف المحادثة
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ChatPartnerInfo;
