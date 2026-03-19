import { useState } from 'react';
import ClickableImage from '@/components/ui/ClickableImage';
import { 
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
  Recycle,
  Package,
  PenTool,
  ExternalLink,
  Play,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSharedMedia, type SharedMediaItem, type SharedLink } from '@/hooks/useSharedMedia';
import { useSharedShipments, type SharedShipment } from '@/hooks/useSharedShipments';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatPartnerInfoProps {
  partner: {
    id: string;
    name: string;
    organization_type: string;
    logo_url: string | null;
  };
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onBack: () => void;
  isMobile?: boolean;
}

const ChatPartnerInfo = ({
  partner,
  notificationsEnabled,
  onToggleNotifications,
  onBack,
  isMobile = false
}: ChatPartnerInfoProps) => {
  const navigate = useNavigate();
  const { media, files, links, loading: mediaLoading } = useSharedMedia(partner.id);
  const { shipments, loading: shipmentsLoading } = useSharedShipments(partner.id);
  const [signatureFilter, setSignatureFilter] = useState<'all' | 'signed'>('all');
  
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

  // Since shipments table doesn't have signature columns directly, we show all as "shared"
  const signedShipments = shipments.filter(s => s.status === 'delivered' || s.status === 'completed');
  const Icon = getOrgTypeIcon();

  return (
    <ScrollArea className="h-full">
      <div className={cn("space-y-4", isMobile ? "p-3" : "p-4")}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold text-sm">معلومات الشريك</h3>
        </div>

        {/* Partner Profile Card */}
        <div className="text-center space-y-3">
          <ClickableImage src={partner.logo_url || ''} protected>
            <Avatar className="w-20 h-20 mx-auto ring-2 ring-primary/20">
              {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
              <AvatarFallback className="bg-primary/10">
                <Icon className="w-8 h-8 text-primary" />
              </AvatarFallback>
            </Avatar>
          </ClickableImage>
          <div>
            <h2 className="text-lg font-bold">{partner.name}</h2>
            <Badge variant="outline" className="mt-1 text-[10px]">{getOrgTypeName()}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => navigate(`/dashboard/org-profile/${partner.id}`)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            عرض الملف الكامل
          </Button>
        </div>

        <Separator />

        {/* Tabbed Content */}
        <Tabs defaultValue="media" dir="rtl" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-9">
            <TabsTrigger value="media" className="text-[10px] px-1 gap-0.5 data-[state=active]:text-primary">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">وسائط</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="text-[10px] px-1 gap-0.5 data-[state=active]:text-primary">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مستندات</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="text-[10px] px-1 gap-0.5 data-[state=active]:text-primary">
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">روابط</span>
            </TabsTrigger>
            <TabsTrigger value="shipments" className="text-[10px] px-1 gap-0.5 data-[state=active]:text-primary">
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شحنات</span>
            </TabsTrigger>
            <TabsTrigger value="signed" className="text-[10px] px-1 gap-0.5 data-[state=active]:text-primary">
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">موقّعة</span>
            </TabsTrigger>
          </TabsList>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-3">
            {mediaLoading ? (
              <LoadingState />
            ) : media.length === 0 ? (
              <EmptyState text="لا توجد وسائط مشتركة" />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {media.map(item => (
                  <MediaThumbnail key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-3">
            {mediaLoading ? (
              <LoadingState />
            ) : files.length === 0 ? (
              <EmptyState text="لا توجد مستندات مشتركة" />
            ) : (
              <div className="space-y-1.5">
                {files.map(item => (
                  <FileItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-3">
            {mediaLoading ? (
              <LoadingState />
            ) : links.length === 0 ? (
              <EmptyState text="لا توجد روابط مشتركة" />
            ) : (
              <div className="space-y-1.5">
                {links.map(item => (
                  <LinkItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="mt-3">
            {shipmentsLoading ? (
              <LoadingState />
            ) : shipments.length === 0 ? (
              <EmptyState text="لا توجد شحنات مشتركة" />
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">{shipments.length} شحنة مشتركة</p>
                {shipments.slice(0, 20).map(s => (
                  <ShipmentItem key={s.id} shipment={s} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Signed Tab */}
          <TabsContent value="signed" className="mt-3">
            {shipmentsLoading ? (
              <LoadingState />
            ) : signedShipments.length === 0 ? (
              <EmptyState text="لا توجد شحنات موقّعة" />
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">{signedShipments.length} شحنة موقّعة</p>
                {signedShipments.slice(0, 20).map(s => (
                  <ShipmentItem key={s.id} shipment={s} showSignature />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Settings */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">الإعدادات</h4>
          <div className="flex items-center justify-between p-2.5 rounded-lg">
            <div className="flex items-center gap-2.5">
              {notificationsEnabled ? <Bell className="w-4 h-4 text-muted-foreground" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm font-medium">الإشعارات</span>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={onToggleNotifications} />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <Star className="w-3.5 h-3.5" />
            إضافة للمفضلة
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
            حذف المحادثة
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

// Sub-components

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function MediaThumbnail({ item }: { item: SharedMediaItem }) {
  const isVideo = item.message_type === 'video';
  return (
    <a
      href={item.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity block"
    >
      {isVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Play className="w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <img src={item.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
    </a>
  );
}

function FileItem({ item }: { item: SharedMediaItem }) {
  return (
    <a
      href={item.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{item.file_name || 'ملف'}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
    </a>
  );
}

function LinkItem({ item }: { item: SharedLink }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
        <Link2 className="w-4 h-4 text-purple-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-primary">{item.url}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
    </a>
  );
}

function ShipmentItem({ shipment, showSignature = false }: { shipment: SharedShipment; showSignature?: boolean }) {
  const statusColors: Record<string, string> = {
    delivered: 'bg-emerald-500/10 text-emerald-600',
    in_transit: 'bg-blue-500/10 text-blue-600',
    pending: 'bg-amber-500/10 text-amber-600',
    cancelled: 'bg-destructive/10 text-destructive',
  };
  const color = statusColors[shipment.status || ''] || 'bg-muted text-muted-foreground';

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Package className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium truncate">{shipment.shipment_number}</p>
          <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0", color)}>
            {shipment.status || 'غير محدد'}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {shipment.waste_type || 'غير محدد'} • {shipment.quantity || '—'} {shipment.unit || ''}
        </p>
        {showSignature && (
          <Badge variant="outline" className="text-[8px] px-1 py-0 mt-1">مكتملة ✓</Badge>
        )}
      </div>
    </div>
  );
}

export default ChatPartnerInfo;
