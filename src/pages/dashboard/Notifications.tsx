import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Clock,
  User,
  Building2,
  MapPin,
  Scale,
  Recycle,
  Phone,
  Car,
  PenTool,
  Wallet,
  Handshake,
  BarChart3,
  Shield,
  Stamp,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import BackButton from '@/components/ui/back-button';
import NotificationDetailDialog from '@/components/notifications/NotificationDetailDialog';
import { previewNotificationSound, isNotificationSoundEnabled } from '@/hooks/useNotificationSound';
import { normalizeRelation } from '@/lib/supabaseHelpers';

const getNotificationIcon = (type: string | null) => {
  switch (type) {
    case 'shipment_created': return Package;
    case 'shipment_status':
    case 'status_update':
    case 'shipment_assigned': return Truck;
    case 'shipment_approved':
    case 'shipment_delivered': return CheckCircle;
    case 'document_uploaded':
    case 'signing_request': return FileText;
    case 'signature_request':
    case 'document_signed': return PenTool;
    case 'stamp_applied': return Stamp;
    case 'recycling_report':
    case 'report':
    case 'certificate': return BarChart3;
    case 'partner_post':
    case 'partner_note':
    case 'partner_message':
    case 'partner_linked': return Handshake;
    case 'approval_request': return Inbox;
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial': return Wallet;
    case 'warning': return AlertCircle;
    case 'chat_message':
    case 'message':
    case 'broadcast': return MessageSquare;
    case 'shipment': return Package;
    default: return Info;
  }
};

const getNotificationColor = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
    case 'shipment':
    case 'shipment_assigned': return 'bg-blue-500/10 text-blue-500';
    case 'shipment_status':
    case 'status_update': return 'bg-amber-500/10 text-amber-500';
    case 'shipment_approved':
    case 'shipment_delivered': return 'bg-green-500/10 text-green-500';
    case 'document_uploaded':
    case 'signing_request':
    case 'signature_request':
    case 'document_signed':
    case 'stamp_applied': return 'bg-indigo-500/10 text-indigo-500';
    case 'recycling_report':
    case 'report':
    case 'certificate': return 'bg-cyan-500/10 text-cyan-500';
    case 'partner_post':
    case 'partner_note':
    case 'partner_message':
    case 'partner_linked': return 'bg-purple-500/10 text-purple-500';
    case 'approval_request': return 'bg-amber-500/10 text-amber-500';
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial': return 'bg-emerald-500/10 text-emerald-500';
    case 'warning': return 'bg-red-500/10 text-red-500';
    case 'chat_message':
    case 'message':
    case 'broadcast': return 'bg-pink-500/10 text-pink-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getNotificationBadge = (type: string | null, t: (key: string) => string) => {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    shipment_created: { label: 'شحنة جديدة', variant: 'default' },
    shipment_status: { label: 'تحديث حالة', variant: 'secondary' },
    status_update: { label: 'تحديث حالة', variant: 'secondary' },
    shipment_approved: { label: 'موافقة', variant: 'default' },
    shipment_delivered: { label: 'تم التسليم', variant: 'default' },
    shipment_assigned: { label: 'تعيين شحنة', variant: 'secondary' },
    shipment: { label: 'شحنة', variant: 'default' },
    document_uploaded: { label: 'مستند جديد', variant: 'secondary' },
    signing_request: { label: 'طلب توقيع', variant: 'default' },
    signature_request: { label: 'طلب توقيع', variant: 'default' },
    document_signed: { label: 'تم التوقيع', variant: 'default' },
    stamp_applied: { label: 'تم الختم', variant: 'default' },
    recycling_report: { label: 'تقرير تدوير', variant: 'default' },
    report: { label: 'تقرير', variant: 'secondary' },
    certificate: { label: 'شهادة', variant: 'default' },
    approval_request: { label: 'طلب موافقة', variant: 'secondary' },
    partner_post: { label: 'منشور شريك', variant: 'secondary' },
    partner_note: { label: 'ملاحظة شريك', variant: 'secondary' },
    partner_message: { label: 'رسالة شريك', variant: 'secondary' },
    partner_linked: { label: 'ربط شريك', variant: 'default' },
    invoice: { label: 'فاتورة', variant: 'default' },
    payment: { label: 'دفعة مالية', variant: 'default' },
    deposit: { label: 'إيداع', variant: 'default' },
    financial: { label: 'مالية', variant: 'secondary' },
    warning: { label: 'تحذير', variant: 'destructive' },
    chat_message: { label: 'رسالة', variant: 'secondary' },
    message: { label: 'رسالة', variant: 'secondary' },
    broadcast: { label: 'بث جماعي', variant: 'secondary' },
  };
  return badges[type || ''] || { label: 'إشعار', variant: 'outline' as const };
};

const getStatusLabel = (status: string | null, t: (key: string) => string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: t('notificationDetails.pending'), color: 'bg-amber-100 text-amber-700' },
    approved: { label: t('notificationDetails.approved'), color: 'bg-blue-100 text-blue-700' },
    in_transit: { label: t('notificationDetails.in_transit'), color: 'bg-purple-100 text-purple-700' },
    picked_up: { label: t('notificationDetails.picked_up'), color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: t('notificationDetails.delivered'), color: 'bg-green-100 text-green-700' },
    confirmed: { label: t('notificationDetails.confirmed'), color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: t('notificationDetails.cancelled'), color: 'bg-red-100 text-red-700' },
  };
  return statusMap[status || ''] || { label: status || t('notificationDetails.notAssigned'), color: 'bg-muted text-muted-foreground' };
};

// Categorize notifications by nature/type
const categorizeNotification = (type: string | null) => {
  switch (type) {
    // Shipments category
    case 'shipment_created':
    case 'shipment_status':
    case 'status_update':
    case 'shipment_assigned':
    case 'shipment_delivered':
    case 'shipment_approved':
    case 'shipment':
      return 'shipments';
    // Documents & Signatures category
    case 'document_uploaded':
    case 'signature_request':
    case 'document_signed':
    case 'stamp_applied':
    case 'signing_request':
      return 'documents';
    // Finance category
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial':
      return 'finance';
    // Partners category
    case 'partner_post':
    case 'partner_note':
    case 'partner_message':
    case 'partner_request':
    case 'partner_linked':
      return 'partners';
    // Approvals category
    case 'approval_request':
    case 'approval_granted':
    case 'approval_rejected':
      return 'approvals';
    // Reports category
    case 'recycling_report':
    case 'report':
    case 'certificate':
    case 'compliance':
      return 'reports';
    // Messages category
    case 'chat_message':
    case 'message':
    case 'broadcast':
      return 'messages';
    // System category
    case 'warning':
    case 'system':
    case 'security':
    case 'info':
      return 'system';
    default:
      return 'other';
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

interface ShipmentDetails {
  id: string;
  shipment_number: string | null;
  status: string | null;
  waste_type: string | null;
  quantity: number | null;
  unit: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  created_at: string;
  generator?: { name: string } | null;
  recycler?: { name: string } | null;
  transporter?: { name: string } | null;
  driver?: { 
    id: string;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    profiles?: { full_name: string | null; phone: string | null } | null;
  } | null;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const getCategories = (t: (key: string) => string): CategoryConfig[] => [
  { id: 'all', label: 'الكل', icon: Bell, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'shipments', label: 'الشحنات', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'documents', label: 'المستندات والتوقيعات', icon: PenTool, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  { id: 'approvals', label: 'الموافقات', icon: CheckCircle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'finance', label: 'المالية', icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { id: 'partners', label: 'الشركاء', icon: Handshake, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'reports', label: 'التقارير والشهادات', icon: BarChart3, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { id: 'messages', label: 'الرسائل', icon: MessageSquare, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { id: 'system', label: 'النظام', icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'other', label: 'أخرى', icon: Info, color: 'text-muted-foreground', bgColor: 'bg-muted' },
];

const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const categories = getCategories(t);
  const dateLocale = language === 'ar' ? arLocale : enUS;
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Use display mode for responsive layout - MUST be before any early returns
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  // Get unique shipment IDs from notifications
  const shipmentIds = useMemo(() => {
    return notifications
      .filter(n => n.shipment_id)
      .map(n => n.shipment_id!)
      .filter((id, index, arr) => arr.indexOf(id) === index);
  }, [notifications]);

  // Fetch shipment details for all shipments in notifications
  const { data: shipmentsData } = useQuery({
    queryKey: ['notification-shipments', shipmentIds],
    queryFn: async () => {
      if (shipmentIds.length === 0) return {};
      
      const { data } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          status,
          waste_type,
          quantity,
          unit,
          pickup_address,
          delivery_address,
          created_at,
          generator:generator_id(name),
          recycler:recycler_id(name),
          transporter:transporter_id(name),
          driver:driver_id(
            id,
            vehicle_type,
            vehicle_plate,
            profiles(full_name, phone)
          )
        `)
        .in('id', shipmentIds);

      const map: Record<string, ShipmentDetails> = {};
      (data || []).forEach((s: any) => {
        map[s.id] = {
          ...s,
          generator: normalizeRelation(s.generator),
          recycler: normalizeRelation(s.recycler),
          transporter: normalizeRelation(s.transporter),
          driver: normalizeRelation(s.driver),
        };
      });
      return map;
    },
    enabled: shipmentIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const shipmentDetailsMap = shipmentsData || {};

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
      <div className="w-full max-w-full overflow-x-hidden">
        <ResponsivePageContainer
          title={isMobile ? undefined : t('notifications.title')}
          subtitle={isMobile ? undefined : t('notifications.subtitle')}
          actions={
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                onClick={handleTestSound}
                variant="outline"
                size="sm"
                className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                disabled={!soundEnabled}
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {!isMobile && t('notifications.testSound')}
              </Button>
              {unreadCount > 0 && (
                <Button 
                  onClick={markAllAsRead} 
                  variant="outline" 
                  size="sm"
                  className="gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {isMobile ? `(${unreadCount})` : `${t('notifications.markAllRead')} (${unreadCount})`}
                </Button>
              )}
            </div>
          }
        >
          {/* Back Button - hidden on mobile since we have bottom nav */}
          {!isMobile && <BackButton />}

          {/* Category Cards - Responsive Grid with horizontal scroll on mobile */}
          <div className={isMobile ? 'overflow-x-auto pb-2 -mx-1' : ''}>
            <div className={isMobile 
              ? 'flex gap-2 px-1 min-w-max' 
              : 'grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3'
            }>
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                const count = getCategoryCount(category.id);
                const unreadCategoryCount = getUnreadCategoryCount(category.id);
                const isActive = activeCategory === category.id;

                return (
                  <motion.div
                    key={category.id}
                    whileTap={{ scale: 0.95 }}
                    className={isMobile ? 'flex-shrink-0 w-[100px]' : ''}
                  >
                    <Card 
                      className={`cursor-pointer transition-all h-full ${
                        isActive 
                          ? 'ring-2 ring-primary border-primary shadow-md' 
                          : 'hover:shadow-md hover:border-primary/50'
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex flex-col items-center text-center gap-1">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${category.bgColor} flex items-center justify-center relative`}>
                            <CategoryIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${category.color}`} />
                            {unreadCategoryCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] sm:text-[10px] flex items-center justify-center font-medium">
                                {unreadCategoryCount > 9 ? '9+' : unreadCategoryCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] sm:text-xs font-medium truncate max-w-[80px] sm:max-w-none">{category.label}</p>
                            <p className="text-sm sm:text-lg font-bold">{count}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

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
              <div className="py-6 sm:py-12 text-center">
                {(() => {
                  const activeCat = categories.find(c => c.id === activeCategory);
                  const EmptyIcon = activeCat?.icon || Bell;
                  return (
                    <>
                      <EmptyIcon className={`w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${activeCat?.color || 'text-muted-foreground/30'} opacity-30`} />
                      <h3 className="text-lg font-medium mb-2">{t('notifications.noNotifications')}</h3>
                      <p className="text-muted-foreground">
                        {activeCategory === 'all' 
                          ? t('notifications.willAppearHere')
                          : t('notifications.noNotificationsInCategory')
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
                  const badge = getNotificationBadge(notification.type, t);
                  const isRecyclingReport = notification.type === 'recycling_report' && notification.pdf_url;
                  const shipmentDetails = notification.shipment_id ? shipmentDetailsMap[notification.shipment_id] : null;
                  const driverProfile = shipmentDetails?.driver?.profiles 
                    ? (Array.isArray(shipmentDetails.driver.profiles) 
                        ? shipmentDetails.driver.profiles[0] 
                        : shipmentDetails.driver.profiles)
                    : null;

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

                  // Responsive notification card sizing
                  const cardPadding = isMobile ? 'p-3' : 'p-4';
                  const iconContainerSize = isMobile ? 'w-10 h-10' : 'w-12 h-12';
                  const iconSizeInCard = isMobile ? 'w-5 h-5' : 'w-6 h-6';

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`${cardPadding} rounded-xl border cursor-pointer transition-all hover:shadow-lg group ${
                        !notification.is_read
                          ? 'bg-gradient-to-l from-primary/5 to-transparent border-primary/30 shadow-sm'
                          : 'bg-card hover:bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`${iconContainerSize} rounded-xl flex items-center justify-center shrink-0 ${iconColorClass} transition-transform group-hover:scale-105`}>
                          <Icon className={iconSizeInCard} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-semibold leading-tight ${isMobile ? 'text-sm' : 'text-base'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {shipmentDetails?.status && (
                                <Badge className={`${getStatusLabel(shipmentDetails.status, t).color} text-[10px]`}>
                                  {getStatusLabel(shipmentDetails.status, t).label}
                                </Badge>
                              )}
                              <Badge variant={badge.variant} className={`shrink-0 ${isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs'}`}>
                                {badge.label}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Message - Full details */}
                          <div className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            <p className="whitespace-pre-wrap">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Shipment Details Section */}
                          {shipmentDetails && (
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2 mt-2">
                              {/* Shipment Number & Waste Type */}
                              <div className="flex flex-wrap items-center gap-2">
                                {shipmentDetails.shipment_number && (
                                  <Badge variant="outline" className="gap-1 text-[10px] font-mono bg-primary/5">
                                    <Package className="w-3 h-3" />
                                    {shipmentDetails.shipment_number}
                                  </Badge>
                                )}
                                {shipmentDetails.waste_type && (
                                  <Badge variant="secondary" className="gap-1 text-[10px]">
                                    <Recycle className="w-3 h-3" />
                                    {shipmentDetails.waste_type}
                                  </Badge>
                                )}
                                {shipmentDetails.quantity && (
                                  <Badge variant="outline" className="gap-1 text-[10px]">
                                    <Scale className="w-3 h-3" />
                                    {shipmentDetails.quantity} {shipmentDetails.unit || t('notificationDetails.kg')}
                                  </Badge>
                                )}
                              </div>

                              {/* Parties Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                {shipmentDetails.generator?.name && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[10px] text-muted-foreground/70">{t('notificationDetails.generator')}:</span>
                                    <span className="font-medium truncate">{shipmentDetails.generator.name}</span>
                                  </div>
                                )}
                                {shipmentDetails.transporter?.name && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Truck className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-[10px] text-muted-foreground/70">{t('notificationDetails.transporter')}:</span>
                                    <span className="font-medium truncate">{shipmentDetails.transporter.name}</span>
                                  </div>
                                )}
                                {shipmentDetails.recycler?.name && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Recycle className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-[10px] text-muted-foreground/70">{t('notificationDetails.recyclerLabel')}:</span>
                                    <span className="font-medium truncate">{shipmentDetails.recycler.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Driver Info */}
                              {shipmentDetails.driver && (
                                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 mt-1">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <User className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-muted-foreground/70">{t('notificationDetails.driverLabel')}:</span>
                                    <span className="font-medium">{driverProfile?.full_name || t('notificationDetails.notAssigned')}</span>
                                  </div>
                                  {driverProfile?.phone && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Phone className="w-3 h-3" />
                                      <span dir="ltr">{driverProfile.phone}</span>
                                    </div>
                                  )}
                                  {shipmentDetails.driver.vehicle_type && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Car className="w-3 h-3" />
                                      <span>{shipmentDetails.driver.vehicle_type}</span>
                                    </div>
                                  )}
                                  {shipmentDetails.driver.vehicle_plate && (
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {shipmentDetails.driver.vehicle_plate}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Locations */}
                              {(shipmentDetails.pickup_address || shipmentDetails.delivery_address) && (
                                <div className="space-y-1 pt-1 border-t border-border/50 mt-1">
                                  {shipmentDetails.pickup_address && (
                                    <div className="flex items-start gap-1.5 text-xs">
                                      <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                      <span className="text-muted-foreground/70">{t('notificationDetails.from')}:</span>
                                      <span className="text-muted-foreground line-clamp-1">{shipmentDetails.pickup_address}</span>
                                    </div>
                                  )}
                                  {shipmentDetails.delivery_address && (
                                    <div className="flex items-start gap-1.5 text-xs">
                                      <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                      <span className="text-muted-foreground/70">{t('notificationDetails.to')}:</span>
                                      <span className="text-muted-foreground line-clamp-1">{shipmentDetails.delivery_address}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Additional Details (for non-shipment notifications) */}
                          {!shipmentDetails && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                              {notification.shipment_id && (
                                <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                                  <Package className="w-3 h-3" />
                                  {notification.shipment_id.slice(0, 8)}
                                </Badge>
                              )}
                              {notification.request_id && (
                                <Badge variant="outline" className="gap-1 text-[10px] font-mono">
                                   <FileText className="w-3 h-3" />
                                   {t('notificationDetails.request')}: {notification.request_id.slice(0, 6)}
                                 </Badge>
                              )}
                            </div>
                          )}

                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </div>
                          
                          {/* PDF Actions for Recycling Reports */}
                          {isRecyclingReport && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-2 text-primary text-xs mb-1 w-full">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">{t('notificationDetails.recyclingCertAttached')}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8"
                                onClick={handlePdfView}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {t('notificationDetails.view')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8"
                                onClick={handlePdfDownload}
                              >
                                <Download className="w-3.5 h-3.5" />
                                {t('notificationDetails.download')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8"
                                onClick={handlePdfPrint}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                {t('notificationDetails.print')}
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
          onNavigateToSigningInbox={() => navigate('/dashboard/signing-inbox')}
        />
      </ResponsivePageContainer>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
