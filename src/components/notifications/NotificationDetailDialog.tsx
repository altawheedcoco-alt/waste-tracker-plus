import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Sparkles,
  Clock,
  FileText,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  shipment_id: string | null;
  request_id: string | null;
}

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToShipment: (shipmentId: string) => void;
  onNavigateToRequest: (requestId?: string) => void;
  onNavigateToCarbonFootprint: () => void;
}

const getNotificationIcon = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return Package;
    case 'shipment_status':
      return Truck;
    case 'shipment_approved':
    case 'shipment_delivered':
      return CheckCircle;
    case 'shipment_assigned':
      return Truck;
    case 'recycling_report':
      return CheckCircle;
    case 'document_uploaded':
      return FileText;
    case 'warning':
      return AlertCircle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return 'bg-blue-500/10 text-blue-500';
    case 'shipment_status':
      return 'bg-amber-500/10 text-amber-500';
    case 'shipment_approved':
    case 'shipment_delivered':
      return 'bg-green-500/10 text-green-500';
    case 'shipment_assigned':
      return 'bg-purple-500/10 text-purple-500';
    case 'recycling_report':
      return 'bg-emerald-500/10 text-emerald-500';
    case 'document_uploaded':
      return 'bg-indigo-500/10 text-indigo-500';
    case 'warning':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getNotificationBadge = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return { label: 'شحنة جديدة', variant: 'default' as const };
    case 'shipment_status':
      return { label: 'تحديث الحالة', variant: 'secondary' as const };
    case 'shipment_approved':
      return { label: 'موافقة', variant: 'default' as const };
    case 'shipment_delivered':
      return { label: 'تم التسليم', variant: 'default' as const };
    case 'shipment_assigned':
      return { label: 'إسناد شحنة', variant: 'secondary' as const };
    case 'recycling_report':
      return { label: 'تقرير تدوير', variant: 'default' as const };
    case 'document_uploaded':
      return { label: 'وثيقة جديدة', variant: 'secondary' as const };
    case 'warning':
      return { label: 'تحذير', variant: 'destructive' as const };
    case 'approval_request':
      return { label: 'طلب موافقة', variant: 'secondary' as const };
    default:
      return { label: 'إشعار', variant: 'outline' as const };
  }
};

const NotificationDetailDialog = ({
  notification,
  open,
  onOpenChange,
  onNavigateToShipment,
  onNavigateToRequest,
  onNavigateToCarbonFootprint,
}: NotificationDetailDialogProps) => {
  if (!notification) return null;

  const Icon = getNotificationIcon(notification.type);
  const iconColorClass = getNotificationColor(notification.type);
  const badge = getNotificationBadge(notification.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span>تفاصيل الإشعار</span>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header with badge and status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {!notification.is_read && (
              <Badge variant="outline" className="gap-1 border-primary text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                غير مقروء
              </Badge>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold">{notification.title}</h3>
          </div>

          {/* Message */}
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(notification.created_at), 'EEEE، d MMMM yyyy - h:mm a', {
                locale: ar,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {notification.shipment_id && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onNavigateToShipment(notification.shipment_id!);
                }}
              >
                <Package className="w-4 h-4" />
                عرض تفاصيل الشحنة
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}

            {notification.type === 'approval_request' && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onNavigateToRequest(notification.request_id || undefined);
                }}
              >
                <FileText className="w-4 h-4" />
                عرض تفاصيل الطلب
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                onOpenChange(false);
                onNavigateToCarbonFootprint();
              }}
            >
              <Sparkles className="w-4 h-4" />
              تحليل البصمة الكربونية
            </Button>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              إغلاق
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailDialog;