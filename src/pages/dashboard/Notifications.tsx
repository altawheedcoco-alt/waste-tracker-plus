import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import ResponsiveGrid from '@/components/dashboard/ResponsiveGrid';
import { useDisplayMode } from '@/hooks/useDisplayMode';
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
  Inbox,
  Send,
  PackageCheck,
  MessageSquare,
  Download,
  Printer,
  Eye,
  Volume2,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import BackButton from '@/components/ui/back-button';
import NotificationDetailDialog from '@/components/notifications/NotificationDetailDialog';
import { previewNotificationSound, isNotificationSoundEnabled } from '@/hooks/useNotificationSound';

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

// Categorize notifications
const categorizeNotification = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
      return 'new_shipments';
    case 'shipment_delivered':
    case 'shipment_status':
    case 'shipment_assigned':
      return 'delivered_shipments';
    case 'approval_request':
      return 'received_requests';
    case 'shipment_approved':
      return 'sent_requests';
    case 'chat_message':
    case 'message':
      return 'messages';
    default:
      return 'all';
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
  pdf_url?: string | null;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const categories: CategoryConfig[] = [
  { id: 'all', label: 'الكل', icon: Bell, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'new_shipments', label: 'شحنات جديدة', icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'received_requests', label: 'طلبات مستلمة', icon: Inbox, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'sent_requests', label: 'طلبات مرسلة', icon: Send, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'delivered_shipments', label: 'شحنات مستلمة', icon: PackageCheck, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'messages', label: 'المحادثات', icon: MessageSquare, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
];

const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Use display mode for responsive layout
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  const handleTestSound = async () => {
    await previewNotificationSound('default');
  };

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

  // Filter notifications by category
  const filteredNotifications = notifications.filter((notification) => {
    if (activeCategory === 'all') return true;
    return categorizeNotification(notification.type) === activeCategory;
  });

  // Count notifications per category
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return notifications.length;
    return notifications.filter(n => categorizeNotification(n.type) === categoryId).length;
  };

  const getUnreadCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return unreadCount;
    return notifications.filter(n => 
      categorizeNotification(n.type) === categoryId && !n.is_read
    ).length;
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

  // Get responsive grid columns for categories
  const categoryGridCols = isMobile ? 2 : isTablet ? 3 : 6;
  const iconSize = getResponsiveClass({
    mobile: 'w-8 h-8',
    tablet: 'w-10 h-10',
    desktop: 'w-12 h-12',
  });
  const iconInnerSize = getResponsiveClass({
    mobile: 'w-4 h-4',
    tablet: 'w-5 h-5',
    desktop: 'w-6 h-6',
  });

  return (
    <DashboardLayout>
      <ResponsivePageContainer
        title="الإشعارات"
        subtitle="جميع الإشعارات والتنبيهات الخاصة بك"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleTestSound}
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              className="gap-2"
              disabled={!soundEnabled}
            >
              <Volume2 className="w-4 h-4" />
              {!isMobile && 'اختبار الصوت'}
            </Button>
            {unreadCount > 0 && (
              <Button 
                onClick={markAllAsRead} 
                variant="outline" 
                size={isMobile ? 'sm' : 'default'}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {isMobile ? `(${unreadCount})` : `تحديد الكل كمقروء (${unreadCount})`}
              </Button>
            )}
          </div>
        }
      >
        {/* Back Button */}
        <BackButton />

        {/* Category Cards - Responsive Grid */}
        <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 6 }} gap="sm">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            const count = getCategoryCount(category.id);
            const unreadCategoryCount = getUnreadCategoryCount(category.id);
            const isActive = activeCategory === category.id;

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all ${
                    isActive 
                      ? 'ring-2 ring-primary border-primary shadow-md' 
                      : 'hover:shadow-md hover:border-primary/50'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <CardContent className={isMobile ? 'p-2' : 'p-3'}>
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className={`${iconSize} rounded-full ${category.bgColor} flex items-center justify-center relative`}>
                        <CategoryIcon className={`${iconInnerSize} ${category.color}`} />
                        {unreadCategoryCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                            {unreadCategoryCount > 9 ? '9+' : unreadCategoryCount}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium truncate`}>{category.label}</p>
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </ResponsiveGrid>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const activeCat = categories.find(c => c.id === activeCategory);
                const ActiveIcon = activeCat?.icon || Bell;
                return (
                  <>
                    <ActiveIcon className={`w-5 h-5 ${activeCat?.color || ''}`} />
                    {activeCat?.label || 'جميع الإشعارات'}
                    {filteredNotifications.length > 0 && (
                      <Badge variant="secondary" className="mr-2">
                        {filteredNotifications.length}
                      </Badge>
                    )}
                  </>
                );
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                {(() => {
                  const activeCat = categories.find(c => c.id === activeCategory);
                  const EmptyIcon = activeCat?.icon || Bell;
                  return (
                    <>
                      <EmptyIcon className={`w-16 h-16 mx-auto mb-4 ${activeCat?.color || 'text-muted-foreground/30'} opacity-30`} />
                      <h3 className="text-lg font-medium mb-2">لا توجد إشعارات</h3>
                      <p className="text-muted-foreground">
                        {activeCategory === 'all' 
                          ? 'ستظهر هنا الإشعارات الخاصة بك'
                          : `لا توجد إشعارات في فئة "${activeCat?.label}"`
                        }
                      </p>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColorClass = getNotificationColor(notification.type);
                  const badge = getNotificationBadge(notification.type);
                  const isRecyclingReport = notification.type === 'recycling_report' && notification.pdf_url;

                  const handlePdfView = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (notification.pdf_url) {
                      window.open(notification.pdf_url, '_blank');
                    }
                  };

                  const handlePdfDownload = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (notification.pdf_url) {
                      const link = document.createElement('a');
                      link.href = notification.pdf_url;
                      link.download = `شهادة-تدوير-${notification.shipment_id || 'report'}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  };

                  const handlePdfPrint = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (notification.pdf_url) {
                      const printWindow = window.open(notification.pdf_url, '_blank');
                      if (printWindow) {
                        printWindow.onload = () => {
                          printWindow.print();
                        };
                      }
                    }
                  };

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
                          
                          {/* PDF Actions for Recycling Reports */}
                          {isRecyclingReport && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs mb-2 w-full">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">شهادة إعادة التدوير مرفقة</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                                onClick={handlePdfView}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                عرض
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                                onClick={handlePdfDownload}
                              >
                                <Download className="w-3.5 h-3.5" />
                                تنزيل
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                                onClick={handlePdfPrint}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                طباعة
                              </Button>
                            </div>
                          )}
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
      </ResponsivePageContainer>
    </DashboardLayout>
  );
};

export default Notifications;
