import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Building2,
  User,
  ArrowLeftRight,
  Download,
  Printer,
  Eye,
  Scale,
  Tag,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeShipment, normalizeRelation } from '@/lib/supabaseHelpers';
import { useAuth } from '@/contexts/AuthContext';
import DocumentVerificationPanel from './DocumentVerificationPanel';

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
  organization_id?: string | null;
  document_id?: string | null;
  priority?: string | null;
  metadata?: Record<string, any> | null;
}

interface SenderReceiverInfo {
  senderName: string | null;
  senderType: string | null;
  senderLogo: string | null;
  receiverName: string | null;
  receiverType: string | null;
  receiverLogo: string | null;
}

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToShipment: (shipmentId: string) => void;
  onNavigateToRequest: (requestId?: string) => void;
  onNavigateToCarbonFootprint: () => void;
  onNavigateToSigningInbox?: () => void;
}

const getNotificationIcon = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
    case 'shipment':
      return Package;
    case 'shipment_status':
    case 'status_update':
    case 'shipment_assigned':
      return Truck;
    case 'driver_assignment':
      return Truck;
    case 'shipment_approved':
    case 'shipment_delivered':
      return CheckCircle;
    case 'recycling_report':
    case 'report':
    case 'certificate':
      return CheckCircle;
    case 'document_uploaded':
    case 'document_issued':
    case 'signing_request':
      return FileText;
    case 'warning':
    case 'signal_lost':
      return AlertCircle;
    case 'mention':
      return User;
    case 'partner_post':
    case 'partner_linked':
      return Building2;
    case 'partner_note':
      return FileText;
    case 'partner_message':
      return User;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string | null) => {
  switch (type) {
    case 'shipment_created':
    case 'shipment':
      return 'bg-blue-500/10 text-blue-500';
    case 'shipment_status':
    case 'status_update':
      return 'bg-amber-500/10 text-amber-500';
    case 'shipment_approved':
    case 'shipment_delivered':
      return 'bg-green-500/10 text-green-500';
    case 'shipment_assigned':
    case 'driver_assignment':
      return 'bg-purple-500/10 text-purple-500';
    case 'recycling_report':
    case 'report':
    case 'certificate':
      return 'bg-emerald-500/10 text-emerald-500';
    case 'document_uploaded':
    case 'document_issued':
    case 'signing_request':
      return 'bg-indigo-500/10 text-indigo-500';
    case 'warning':
    case 'signal_lost':
      return 'bg-red-500/10 text-red-500';
    case 'mention':
      return 'bg-teal-500/10 text-teal-500';
    case 'partner_post':
    case 'partner_linked':
      return 'bg-purple-500/10 text-purple-500';
    case 'partner_note':
      return 'bg-orange-500/10 text-orange-500';
    case 'partner_message':
      return 'bg-pink-500/10 text-pink-500';
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial':
      return 'bg-emerald-500/10 text-emerald-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getNotificationBadge = (type: string | null) => {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    shipment_created: { label: 'شحنة جديدة', variant: 'default' },
    shipment_status: { label: 'تحديث الحالة', variant: 'secondary' },
    status_update: { label: 'تحديث حالة', variant: 'secondary' },
    shipment_approved: { label: 'موافقة', variant: 'default' },
    shipment_delivered: { label: 'تم التسليم', variant: 'default' },
    shipment_assigned: { label: 'إسناد شحنة', variant: 'secondary' },
    driver_assignment: { label: 'تعيين سائق', variant: 'secondary' },
    shipment: { label: 'شحنة', variant: 'default' },
    recycling_report: { label: 'تقرير تدوير', variant: 'default' },
    report: { label: 'تقرير', variant: 'secondary' },
    certificate: { label: 'شهادة', variant: 'default' },
    document_uploaded: { label: 'وثيقة جديدة', variant: 'secondary' },
    document_issued: { label: 'مستند صادر', variant: 'default' },
    signing_request: { label: 'طلب توقيع', variant: 'default' },
    document_signed: { label: 'تم التوقيع', variant: 'default' },
    stamp_applied: { label: 'تم الختم', variant: 'default' },
    warning: { label: 'تحذير', variant: 'destructive' },
    signal_lost: { label: 'انقطاع إشارة', variant: 'destructive' },
    approval_request: { label: 'طلب موافقة', variant: 'secondary' },
    partner_post: { label: 'منشور شريك', variant: 'secondary' },
    partner_note: { label: 'ملاحظة شريك', variant: 'secondary' },
    partner_message: { label: 'رسالة شريك', variant: 'secondary' },
    partner_linked: { label: 'ربط شريك', variant: 'default' },
    invoice: { label: 'فاتورة', variant: 'default' },
    payment: { label: 'دفعة مالية', variant: 'default' },
    deposit: { label: 'إيداع', variant: 'default' },
    financial: { label: 'مالية', variant: 'secondary' },
    mention: { label: 'إشارة', variant: 'default' },
    chat_message: { label: 'رسالة', variant: 'secondary' },
    message: { label: 'رسالة', variant: 'secondary' },
    broadcast: { label: 'بث جماعي', variant: 'secondary' },
  };
  return badges[type || ''] || { label: 'إشعار', variant: 'outline' as const };
};

const getOrgTypeLabel = (type: string | null) => {
  switch (type) {
    case 'generator':
      return 'جهة مولدة';
    case 'transporter':
      return 'جهة ناقلة';
    case 'recycler':
      return 'جهة معالجة';
    case 'driver':
      return 'سائق';
    default:
      return 'مؤسسة';
  }
};

const getMetadataLabel = (key: string): string => {
  const labels: Record<string, string> = {
    shipment_id: 'معرّف الشحنة', shipment_number: 'رقم الشحنة', waste_type: 'نوع المخلفات',
    quantity: 'الكمية', unit: 'وحدة القياس', weight: 'الوزن', status: 'الحالة',
    previous_status: 'الحالة السابقة', new_status: 'الحالة الجديدة',
    generator_name: 'الجهة المولدة', transporter_name: 'الجهة الناقلة', recycler_name: 'جهة المعالجة',
    driver_name: 'اسم السائق', partner_name: 'اسم الشريك', organization_name: 'اسم المنظمة',
    plate_number: 'رقم لوحة المركبة', vehicle_type: 'نوع المركبة', vehicle_plate: 'لوحة المركبة',
    amount: 'المبلغ', total_amount: 'المبلغ الإجمالي', invoice_number: 'رقم الفاتورة',
    invoice_id: 'معرّف الفاتورة', payment_method: 'طريقة الدفع',
    document_type: 'نوع المستند', document_name: 'اسم المستند', document_id: 'معرّف المستند',
    file_name: 'اسم الملف', camera_event_id: 'حدث الكاميرا', photo_url: 'رابط الصورة',
    confidence_score: 'نسبة الثقة', arrival_verified: 'تأكيد الوصول',
    report_id: 'معرّف التقرير', certificate_id: 'معرّف الشهادة', recycling_rate: 'معدل التدوير',
    pickup_date: 'تاريخ الاستلام', delivery_date: 'تاريخ التسليم', due_date: 'تاريخ الاستحقاق',
    pickup_location: 'موقع الاستلام', delivery_location: 'موقع التسليم',
    pickup_address: 'عنوان الاستلام', delivery_address: 'عنوان التسليم',
    action: 'الإجراء', reason: 'السبب', notes: 'ملاحظات', priority: 'الأولوية',
    type: 'النوع', category: 'التصنيف', source: 'المصدر', event_type: 'نوع الحدث',
    count: 'العدد', total: 'الإجمالي', percentage: 'النسبة', description: 'الوصف',
    reference: 'المرجع', reference_number: 'الرقم المرجعي',
    approval_status: 'حالة الموافقة', request_type: 'نوع الطلب',
    matched: 'تطابق', verified: 'تم التحقق', sender_name: 'المرسِل', receiver_name: 'المستلِم',
  };
  return labels[key] || key;
};

const NotificationDetailDialog = ({
  notification,
  open,
  onOpenChange,
  onNavigateToShipment,
  onNavigateToRequest,
  onNavigateToCarbonFootprint,
  onNavigateToSigningInbox,
}: NotificationDetailDialogProps) => {
  const { profile } = useAuth();
  const [senderReceiverInfo, setSenderReceiverInfo] = useState<SenderReceiverInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [documentOrgId, setDocumentOrgId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSenderReceiverInfo = async () => {
      if (!notification || !open) return;

      setLoading(true);
      try {
        let info: SenderReceiverInfo = {
          senderName: 'النظام',
          senderType: null,
          senderLogo: null,
          receiverName: profile?.full_name || 'المستخدم',
          receiverType: null,
          receiverLogo: profile?.avatar_url || null,
        };

        // Get receiver's organization info
        if (profile?.organization_id) {
          const { data: receiverOrg } = await supabase
            .from('organizations')
            .select('name, organization_type, logo_url')
            .eq('id', profile.organization_id)
            .single();

          if (receiverOrg) {
            info.receiverName = receiverOrg.name;
            info.receiverType = receiverOrg.organization_type;
            info.receiverLogo = receiverOrg.logo_url;
          }
        }

        // For shipment-related notifications
        if (notification.shipment_id) {
          const { data: shipment } = await supabase
            .from('shipments')
            .select(`
              driver_id,
              generator:organizations!shipments_generator_id_fkey(name, organization_type, logo_url),
              transporter:organizations!shipments_transporter_id_fkey(name, organization_type, logo_url),
              recycler:organizations!shipments_recycler_id_fkey(name, organization_type, logo_url)
            `)
            .eq('id', notification.shipment_id)
            .single();

          if (shipment) {
            // Normalize shipment relations
            const normalizedShipment = normalizeShipment(shipment as any);
            
            // Check if notification is from a driver (shipment_assigned type)
            if (notification.type === 'shipment_assigned' && normalizedShipment.driver_id) {
              // Get driver info
              const { data: driver } = await supabase
                .from('drivers')
                .select(`
                  profile:profiles!drivers_profile_id_fkey(full_name, avatar_url)
                `)
                .eq('id', normalizedShipment.driver_id)
                .single();

              if (driver?.profile) {
                const profile = normalizeRelation(driver.profile);
                info.senderName = profile?.full_name || 'سائق';
                info.senderType = 'driver';
                info.senderLogo = profile?.avatar_url || null;
              }
            } else if (notification.type === 'shipment_created' || notification.type === 'shipment_status') {
              // Check if created by a driver
              if (normalizedShipment.driver_id) {
                const { data: driver } = await supabase
                  .from('drivers')
                  .select(`
                    profile:profiles!drivers_profile_id_fkey(full_name, avatar_url)
                  `)
                  .eq('id', normalizedShipment.driver_id)
                  .single();

                if (driver?.profile) {
                  const profile = normalizeRelation(driver.profile);
                  info.senderName = profile?.full_name || 'سائق';
                  info.senderType = 'driver';
                  info.senderLogo = profile?.avatar_url || null;
                } else {
                  info.senderName = normalizedShipment.transporter?.name || 'جهة ناقلة';
                  info.senderType = 'transporter';
                  info.senderLogo = normalizedShipment.transporter?.logo_url || null;
                }
              } else {
                info.senderName = normalizedShipment.transporter?.name || 'جهة ناقلة';
                info.senderType = 'transporter';
                info.senderLogo = normalizedShipment.transporter?.logo_url || null;
              }
            } else if (notification.type === 'recycling_report') {
              info.senderName = normalizedShipment.recycler?.name || 'جهة معالجة';
              info.senderType = 'recycler';
              info.senderLogo = normalizedShipment.recycler?.logo_url || null;
            }
          }
        }

        // For document uploaded notifications, get organization ID
        if (notification.type === 'document_uploaded') {
          // Try to extract organization_id from notification data
          if (notification.organization_id) {
            setDocumentOrgId(notification.organization_id);
          } else if (notification.request_id) {
            // Get from approval request
            const { data: request } = await supabase
              .from('approval_requests')
              .select('requester_organization_id')
              .eq('id', notification.request_id)
              .single();
            
            if (request?.requester_organization_id) {
              setDocumentOrgId(request.requester_organization_id);
              info.senderType = 'organization';
            }
          } else {
            // Try to find recent documents from message parsing
            const orgNameMatch = notification.message.match(/من جهة (.+)/);
            if (orgNameMatch) {
              const { data: org } = await supabase
                .from('organizations')
                .select('id, name, organization_type, logo_url')
                .ilike('name', `%${orgNameMatch[1]}%`)
                .limit(1)
                .single();
              
              if (org) {
                setDocumentOrgId(org.id);
                info.senderName = org.name;
                info.senderType = org.organization_type;
                info.senderLogo = org.logo_url;
              }
            }
          }
        }

        // For approval requests, get the requester organization
        if (notification.request_id) {
          const { data: request } = await supabase
            .from('approval_requests')
            .select(`
              requester_organization_id,
              requester_organization:organizations!approval_requests_requester_organization_id_fkey(name, organization_type, logo_url)
            `)
            .eq('id', notification.request_id)
            .single();

          if (request?.requester_organization) {
            info.senderName = request.requester_organization.name;
            info.senderType = request.requester_organization.organization_type;
            info.senderLogo = request.requester_organization.logo_url;
            
            // For document-related approval requests
            if (notification.type === 'document_uploaded' && request.requester_organization_id) {
              setDocumentOrgId(request.requester_organization_id);
            }
          }
        }

        setSenderReceiverInfo(info);
      } catch (error) {
        console.error('Error fetching sender/receiver info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSenderReceiverInfo();
  }, [notification, open, profile]);

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

          {/* Sender and Receiver Info */}
          {loading ? (
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : senderReceiverInfo && (
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              {/* Sender */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={senderReceiverInfo.senderLogo || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{senderReceiverInfo.senderName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>المُرسِل</span>
                    {senderReceiverInfo.senderType && (
                      <>
                        <span>•</span>
                        <span>{getOrgTypeLabel(senderReceiverInfo.senderType)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-primary rotate-90" />
                </div>
              </div>

              {/* Receiver */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={senderReceiverInfo.receiverLogo || undefined} />
                  <AvatarFallback className="bg-green-500/10 text-green-600">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{senderReceiverInfo.receiverName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>المُستلِم</span>
                    {senderReceiverInfo.receiverType && (
                      <>
                        <span>•</span>
                        <span>{getOrgTypeLabel(senderReceiverInfo.receiverType)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold">{notification.title}</h3>
          </div>

          {/* Message */}
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>

          {/* Priority */}
          {notification.priority && notification.priority !== 'normal' && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">الأولوية:</span>
              <Badge variant={notification.priority === 'high' || notification.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {notification.priority === 'high' ? 'عالية' : notification.priority === 'urgent' ? 'عاجل' : notification.priority === 'low' ? 'منخفضة' : notification.priority}
              </Badge>
            </div>
          )}

          {/* Metadata Analysis */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>تحليل البيانات التفصيلية</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(notification.metadata).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  if (typeof value === 'object' && !Array.isArray(value)) return null;
                  const label = getMetadataLabel(key);
                  const displayValue = Array.isArray(value) ? value.join('، ') : String(value);
                  return (
                    <div key={key} className="flex flex-col gap-0.5 p-2 rounded bg-background border border-border/50">
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium truncate" title={displayValue}>{displayValue}</span>
                    </div>
                  );
                })}
              </div>
              {/* Nested objects */}
              {Object.entries(notification.metadata).map(([key, value]) => {
                if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
                const label = getMetadataLabel(key);
                return (
                  <div key={key} className="pt-2 border-t space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(value as Record<string, any>).map(([sk, sv]) => {
                        if (sv === null || sv === undefined || sv === '') return null;
                        return (
                          <div key={sk} className="flex flex-col gap-0.5 p-2 rounded bg-background border border-border/50">
                            <span className="text-[10px] text-muted-foreground">{getMetadataLabel(sk)}</span>
                            <span className="text-sm font-medium truncate">{String(sv)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PDF Attachment Section */}
          {notification.pdf_url && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">شهادة إعادة التدوير</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">ملف PDF مرفق</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => window.open(notification.pdf_url!, '_blank')}
                >
                  <Eye className="w-4 h-4" />
                  عرض الملف
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = notification.pdf_url!;
                    link.download = `شهادة-تدوير-${notification.shipment_id || 'report'}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-4 h-4" />
                  تنزيل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => {
                    import('@/services/documentService').then(({ PrintService }) => {
                      const printWindow = window.open(notification.pdf_url!, '_blank');
                      if (printWindow) {
                        printWindow.addEventListener('load', () => { printWindow.print(); });
                      }
                    });
                  }}
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
              </div>
            </div>
          )}

          {/* Document Verification Panel for Admin */}
          {notification.type === 'document_uploaded' && documentOrgId && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Scale className="w-4 h-4 text-primary" />
                  <span>التحقق القانوني من المستندات</span>
                </div>
                <DocumentVerificationPanel
                  organizationId={documentOrgId}
                  documentId={notification.document_id || undefined}
                  onVerificationComplete={() => {
                    // Optionally refresh or show success
                  }}
                />
              </div>
            </>
          )}

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

            {notification.type === 'signing_request' && onNavigateToSigningInbox && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onNavigateToSigningInbox();
                }}
              >
                <FileText className="w-4 h-4" />
                فتح صندوق التوقيعات
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}

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