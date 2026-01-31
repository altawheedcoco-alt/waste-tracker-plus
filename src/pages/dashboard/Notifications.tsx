import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Info,
  CheckCheck,
  FileText,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import BackButton from '@/components/ui/back-button';
import NotificationDetailDialog from '@/components/notifications/NotificationDetailDialog';

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

const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
  };

  const handleNavigateToShipment = (shipmentId: string) => {
    navigate(`/dashboard/shipments?highlight=${shipmentId}`);
  };

  const handleNavigateToRequest = (requestId?: string) => {
    if (requestId) {
      navigate(`/dashboard/my-requests?highlight=${requestId}`);
    } else {
      navigate('/dashboard/my-requests');
    }
  };

  const handleNavigateToCarbonFootprint = () => {
    navigate('/dashboard/carbon-footprint');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground">
              جميع الإشعارات والتنبيهات الخاصة بك
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" className="gap-2">
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء ({unreadCount})
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">غير مقروءة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                <p className="text-sm text-muted-foreground">مقروءة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              جميع الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">لا توجد إشعارات</h3>
                <p className="text-muted-foreground">
                  ستظهر هنا الإشعارات الخاصة بك
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColorClass = getNotificationColor(notification.type);
                  const badge = getNotificationBadge(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        !notification.is_read
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconColorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{notification.title}</h4>
                              <Badge variant={badge.variant} className="text-xs">
                                {badge.label}
                              </Badge>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Detail Dialog */}
        <NotificationDetailDialog
          notification={selectedNotification}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onNavigateToShipment={handleNavigateToShipment}
          onNavigateToRequest={handleNavigateToRequest}
          onNavigateToCarbonFootprint={handleNavigateToCarbonFootprint}
        />
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
