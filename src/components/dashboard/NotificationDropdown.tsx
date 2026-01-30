import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Info,
  CheckCheck,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const getNotificationIcon = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return Package;
    case 'shipment_status':
      return Truck;
    case 'shipment_approved':
      return CheckCircle;
    case 'shipment_delivered':
      return CheckCircle;
    case 'recycling_report':
      return CheckCircle;
    case 'document_uploaded':
      return Package;
    case 'warning':
      return AlertCircle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return 'text-blue-500';
    case 'shipment_status':
      return 'text-amber-500';
    case 'shipment_approved':
    case 'shipment_delivered':
      return 'text-green-500';
    case 'recycling_report':
      return 'text-emerald-500';
    case 'document_uploaded':
      return 'text-purple-500';
    case 'warning':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
};

const NotificationDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'approval_request' && notification.request_id) {
      navigate(`/dashboard/my-requests?highlight=${notification.request_id}`);
    } else if (notification.type === 'approval_request') {
      navigate('/dashboard/my-requests');
    } else if (notification.shipment_id) {
      navigate(`/dashboard/shipments?highlight=${notification.shipment_id}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" dir="rtl">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              قراءة الكل
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm line-clamp-1">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => navigate('/dashboard/notifications')}
          >
            عرض جميع الإشعارات
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
