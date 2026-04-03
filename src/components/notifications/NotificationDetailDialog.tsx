import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package, Truck, CheckCircle, AlertCircle, Info, ExternalLink, Sparkles,
  Clock, FileText, Building2, User, ArrowLeftRight, Download, Printer,
  Eye, Scale, Tag, MessageCircle, Send, Phone, Car, PenTool, Wallet,
  Handshake, BarChart3, Shield, ClipboardCheck, Key, Leaf, Wrench,
  Recycle, MapPin, Globe,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeShipment, normalizeRelation } from '@/lib/supabaseHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/hooks/useBranding';
import DocumentVerificationPanel from './DocumentVerificationPanel';
import { getNotificationRoute } from '@/lib/notificationRouting';

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
  senderSubtitle: string | null;
  receiverName: string | null;
  receiverType: string | null;
  receiverLogo: string | null;
  receiverSubtitle: string | null;
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
  const map: Record<string, any> = {
    shipment_created: Package, shipment: Package, new_shipment: Package,
    shipment_status: Truck, status_update: Truck, shipment_assigned: Truck,
    driver_assignment: Car, shipment_approved: CheckCircle, shipment_delivered: CheckCircle,
    recycling_report: BarChart3, report: BarChart3, certificate: BarChart3,
    document_uploaded: FileText, document_issued: FileText, signing_request: PenTool,
    document_signed: PenTool, warning: AlertCircle, signal_lost: AlertCircle,
    mention: User, partner_post: Building2, partner_linked: Handshake,
    partner_note: FileText, partner_message: MessageCircle, chat_message: MessageCircle,
    message: MessageCircle, invoice: Wallet, payment: Wallet, deposit: Wallet,
    financial: Wallet, approval_request: ClipboardCheck, license_expiry: Key,
    compliance_alert: Shield, carbon_report: Leaf, environmental: Leaf,
    work_order: ClipboardCheck, fleet_alert: Car, maintenance: Wrench,
  };
  return map[type || ''] || Info;
};

const getNotificationColor = (type: string | null) => {
  const map: Record<string, string> = {
    shipment_created: 'bg-blue-500/10 text-blue-500', shipment: 'bg-blue-500/10 text-blue-500',
    shipment_status: 'bg-amber-500/10 text-amber-500', status_update: 'bg-amber-500/10 text-amber-500',
    shipment_approved: 'bg-green-500/10 text-green-500', shipment_delivered: 'bg-green-500/10 text-green-500',
    shipment_assigned: 'bg-purple-500/10 text-purple-500', driver_assignment: 'bg-purple-500/10 text-purple-500',
    recycling_report: 'bg-emerald-500/10 text-emerald-500', certificate: 'bg-emerald-500/10 text-emerald-500',
    document_uploaded: 'bg-indigo-500/10 text-indigo-500', signing_request: 'bg-indigo-500/10 text-indigo-500',
    warning: 'bg-red-500/10 text-red-500', signal_lost: 'bg-red-500/10 text-red-500',
    partner_message: 'bg-pink-500/10 text-pink-500', chat_message: 'bg-pink-500/10 text-pink-500',
    invoice: 'bg-emerald-500/10 text-emerald-500', payment: 'bg-emerald-500/10 text-emerald-500',
  };
  return map[type || ''] || 'bg-muted text-muted-foreground';
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
    recycling_report: { label: 'تقرير تدوير', variant: 'default' },
    document_uploaded: { label: 'وثيقة جديدة', variant: 'secondary' },
    signing_request: { label: 'طلب توقيع', variant: 'default' },
    document_signed: { label: 'تم التوقيع', variant: 'default' },
    warning: { label: 'تحذير', variant: 'destructive' },
    signal_lost: { label: 'انقطاع إشارة', variant: 'destructive' },
    partner_message: { label: 'رسالة', variant: 'secondary' },
    chat_message: { label: 'رسالة', variant: 'secondary' },
    message: { label: 'رسالة', variant: 'secondary' },
    invoice: { label: 'فاتورة', variant: 'default' },
    payment: { label: 'دفعة مالية', variant: 'default' },
    deposit: { label: 'إيداع', variant: 'default' },
    approval_request: { label: 'طلب موافقة', variant: 'secondary' },
    partner_linked: { label: 'ربط شريك', variant: 'default' },
  };
  return badges[type || ''] || { label: 'إشعار', variant: 'outline' as const };
};

const getOrgTypeLabel = (type: string | null) => {
  const map: Record<string, string> = {
    generator: 'جهة مولدة', transporter: 'جهة ناقلة', recycler: 'جهة معالجة',
    disposal: 'جهة تخلص نهائي', driver: 'سائق', consultant: 'مكتب استشاري',
    regulator: 'جهة رقابية', admin: 'مدير النظام',
  };
  return map[type || ''] || 'مؤسسة';
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
    payment_method: 'طريقة الدفع', document_type: 'نوع المستند', document_name: 'اسم المستند',
    file_name: 'اسم الملف', confidence_score: 'نسبة الثقة', arrival_verified: 'تأكيد الوصول',
    report_id: 'معرّف التقرير', certificate_id: 'معرّف الشهادة', recycling_rate: 'معدل التدوير',
    pickup_date: 'تاريخ الاستلام', delivery_date: 'تاريخ التسليم', due_date: 'تاريخ الاستحقاق',
    pickup_location: 'موقع الاستلام', delivery_location: 'موقع التسليم',
    pickup_address: 'عنوان الاستلام', delivery_address: 'عنوان التسليم',
    action: 'الإجراء', reason: 'السبب', notes: 'ملاحظات', priority: 'الأولوية',
    type: 'النوع', category: 'التصنيف', source: 'المصدر', event_type: 'نوع الحدث',
    count: 'العدد', total: 'الإجمالي', percentage: 'النسبة', description: 'الوصف',
    reference: 'المرجع', reference_number: 'الرقم المرجعي',
    approval_status: 'حالة الموافقة', request_type: 'نوع الطلب',
    sender_name: 'المرسِل', receiver_name: 'المستلِم',
    call_type: 'نوع المكالمة', duration: 'المدة', media_type: 'نوع الوسائط',
  };
  return labels[key] || key;
};

// Get all navigation actions for the notification
const getNavigationActions = (notification: Notification, navigate: ReturnType<typeof useNavigate>) => {
  const actions: { label: string; icon: any; action: () => void; variant?: 'default' | 'outline' | 'secondary' }[] = [];
  const type = notification.type;

  if (notification.shipment_id) {
    actions.push({ label: 'عرض الشحنة', icon: Package, action: () => navigate(`/dashboard/shipments/${notification.shipment_id}`), variant: 'default' });
  }
  if (type === 'approval_request' && notification.request_id) {
    actions.push({ label: 'عرض الطلب', icon: FileText, action: () => navigate(`/dashboard/my-requests?highlight=${notification.request_id}`), variant: 'default' });
  }
  if (type === 'signing_request' || type === 'signature_request') {
    actions.push({ label: 'صندوق التوقيعات', icon: PenTool, action: () => navigate('/dashboard/signing-inbox'), variant: 'default' });
  }
  if (['partner_message', 'chat_message', 'message'].includes(type || '')) {
    const convId = notification.metadata?.conversation_id;
    actions.push({ label: 'فتح المحادثة', icon: MessageCircle, action: () => navigate(convId ? `/dashboard/chat?conv=${convId}` : '/dashboard/chat'), variant: 'default' });
  }
  if (type === 'partner_linked' || type === 'partnership_request') {
    actions.push({ label: 'عرض الشركاء', icon: Handshake, action: () => navigate('/dashboard/partners'), variant: 'outline' });
  }
  if (['invoice', 'payment', 'deposit', 'financial'].includes(type || '')) {
    actions.push({ label: 'المحاسبة', icon: Wallet, action: () => navigate('/dashboard/accounting'), variant: 'outline' });
  }
  if (type === 'work_order' || type === 'work_order_update') {
    actions.push({ label: 'أوامر العمل', icon: ClipboardCheck, action: () => navigate('/dashboard/work-orders'), variant: 'outline' });
  }
  if (type === 'fleet_alert' || type === 'maintenance') {
    actions.push({ label: 'إدارة الأسطول', icon: Car, action: () => navigate('/dashboard/fleet'), variant: 'outline' });
  }
  if (type === 'carbon_report' || type === 'environmental') {
    actions.push({ label: 'البصمة الكربونية', icon: Leaf, action: () => navigate('/dashboard/carbon-footprint'), variant: 'outline' });
  }
  if (type === 'license_expiry' || type === 'license_warning') {
    actions.push({ label: 'التراخيص', icon: Key, action: () => navigate('/dashboard/organization-profile'), variant: 'outline' });
  }
  if (['compliance_alert', 'violation', 'inspection'].includes(type || '')) {
    actions.push({ label: 'الامتثال', icon: Shield, action: () => navigate('/dashboard/compliance'), variant: 'outline' });
  }
  if (type === 'recycling_report' || type === 'certificate') {
    actions.push({ label: 'التقارير', icon: BarChart3, action: () => navigate('/dashboard/reports'), variant: 'outline' });
  }
  if (type === 'partner_note') {
    actions.push({ label: 'مركز الملاحظات', icon: FileText, action: () => navigate('/dashboard/notes'), variant: 'outline' });
  }

  // Fallback: try smart route
  if (actions.length === 0) {
    const route = getNotificationRoute(notification as any);
    if (route) {
      actions.push({ label: 'الانتقال للتفاصيل', icon: ExternalLink, action: () => navigate(route), variant: 'default' });
    }
  }

  return actions;
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
  const navigate = useNavigate();
  const { data: branding } = useBranding();
  const [senderReceiverInfo, setSenderReceiverInfo] = useState<SenderReceiverInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [documentOrgId, setDocumentOrgId] = useState<string | null>(null);
  const [quickReply, setQuickReply] = useState('');

  useEffect(() => {
    const fetchSenderReceiverInfo = async () => {
      if (!notification || !open) return;

      setLoading(true);
      try {
        let info: SenderReceiverInfo = {
          senderName: branding?.system_name || 'منصة iRecycle',
          senderType: null,
          senderLogo: branding?.logo_url || branding?.notification_logo_url || null,
          senderSubtitle: 'النظام',
          receiverName: profile?.full_name || 'المستخدم',
          receiverType: null,
          receiverLogo: profile?.avatar_url || null,
          receiverSubtitle: null,
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
            info.receiverSubtitle = profile?.full_name || null;
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
            const normalizedShipment = normalizeShipment(shipment as any);
            
            if (notification.type === 'shipment_assigned' && normalizedShipment.driver_id) {
              const { data: driver } = await supabase
                .from('drivers')
                .select('profile:profiles!drivers_profile_id_fkey(full_name, avatar_url)')
                .eq('id', normalizedShipment.driver_id)
                .single();
              if (driver?.profile) {
                const p = normalizeRelation(driver.profile);
                info.senderName = p?.full_name || 'سائق';
                info.senderType = 'driver';
                info.senderLogo = p?.avatar_url || null;
                info.senderSubtitle = 'سائق مُسند';
              }
            } else if (['shipment_created', 'shipment_status', 'status_update'].includes(notification.type || '')) {
              if (normalizedShipment.transporter) {
                info.senderName = normalizedShipment.transporter.name || 'جهة ناقلة';
                info.senderType = 'transporter';
                info.senderLogo = normalizedShipment.transporter.logo_url || null;
                info.senderSubtitle = getOrgTypeLabel('transporter');
              }
            } else if (notification.type === 'recycling_report') {
              info.senderName = normalizedShipment.recycler?.name || 'جهة معالجة';
              info.senderType = 'recycler';
              info.senderLogo = normalizedShipment.recycler?.logo_url || null;
              info.senderSubtitle = getOrgTypeLabel('recycler');
            }
          }
        }

        // For document uploaded notifications
        if (notification.type === 'document_uploaded') {
          if (notification.organization_id) {
            setDocumentOrgId(notification.organization_id);
          } else if (notification.request_id) {
            const { data: request } = await supabase
              .from('approval_requests')
              .select('requester_organization_id')
              .eq('id', notification.request_id)
              .single();
            if (request?.requester_organization_id) setDocumentOrgId(request.requester_organization_id);
          }
        }

        // For approval requests
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
            info.senderSubtitle = getOrgTypeLabel(request.requester_organization.organization_type);
            if (notification.type === 'document_uploaded' && request.requester_organization_id) {
              setDocumentOrgId(request.requester_organization_id);
            }
          }
        }

        // Extract sender from metadata if available
        if (notification.metadata?.sender_name && !info.senderType) {
          info.senderName = notification.metadata.sender_name;
          info.senderSubtitle = notification.metadata.sender_type ? getOrgTypeLabel(notification.metadata.sender_type) : null;
        }

        setSenderReceiverInfo(info);
      } catch (error) {
        console.error('Error fetching sender/receiver info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSenderReceiverInfo();
  }, [notification, open, profile, branding]);

  if (!notification) return null;

  const Icon = getNotificationIcon(notification.type);
  const iconColorClass = getNotificationColor(notification.type);
  const badge = getNotificationBadge(notification.type);
  const isChatType = ['partner_message', 'chat_message', 'message', 'group_message'].includes(notification.type || '');
  const navigationActions = getNavigationActions(notification, navigate);

  const handleQuickReply = () => {
    if (!quickReply.trim()) return;
    const convId = notification.metadata?.conversation_id;
    navigate(convId ? `/dashboard/chat?conv=${convId}&reply=${encodeURIComponent(quickReply)}` : '/dashboard/chat');
    onOpenChange(false);
    setQuickReply('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-hidden" dir="rtl">
        {/* System Branding Header */}
        <div className="bg-gradient-to-l from-primary/5 via-primary/10 to-primary/5 px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-3 mb-3">
            {branding?.logo_url || branding?.notification_logo_url ? (
              <Avatar className="h-10 w-10 rounded-lg border border-primary/20">
                <AvatarImage src={branding.notification_logo_url || branding.logo_url} className="object-contain p-0.5" />
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                  <Recycle className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Recycle className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {branding?.system_name || 'منصة iRecycle'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {branding?.tagline || 'نحو مستقبل أنظف'}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconColorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              تفاصيل الإشعار
              <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
              {!notification.is_read && (
                <Badge variant="outline" className="gap-1 border-primary text-primary text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  جديد
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 px-5 py-4"
          >
            {/* Sender and Receiver */}
            {loading ? (
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : senderReceiverInfo && (
              <div className="p-3 rounded-xl bg-muted/30 space-y-2.5">
                {/* Sender */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage src={senderReceiverInfo.senderLogo || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {senderReceiverInfo.senderType === 'driver' ? <Car className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{senderReceiverInfo.senderName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">المُرسِل</Badge>
                      {senderReceiverInfo.senderType && (
                        <span>{getOrgTypeLabel(senderReceiverInfo.senderType)}</span>
                      )}
                      {senderReceiverInfo.senderSubtitle && !senderReceiverInfo.senderType && (
                        <span>{senderReceiverInfo.senderSubtitle}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-primary rotate-90" />
                  </div>
                </div>

                {/* Receiver */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage src={senderReceiverInfo.receiverLogo || undefined} />
                    <AvatarFallback className="bg-green-500/10 text-green-600">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{senderReceiverInfo.receiverName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">المُستلِم</Badge>
                      {senderReceiverInfo.receiverType && (
                        <span>{getOrgTypeLabel(senderReceiverInfo.receiverType)}</span>
                      )}
                      {senderReceiverInfo.receiverSubtitle && (
                        <span className="text-muted-foreground/70">({senderReceiverInfo.receiverSubtitle})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <h3 className="text-base font-bold">{notification.title}</h3>
            </div>

            {/* Message */}
            <div className="p-3.5 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{notification.message}</p>
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
            {notification.metadata && Object.keys(notification.metadata).filter(k => {
              const v = notification.metadata![k];
              return v !== null && v !== undefined && v !== '' && !['conversation_id'].includes(k);
            }).length > 0 && (
              <div className="p-3.5 rounded-lg bg-muted/30 border space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>تحليل البيانات التفصيلية</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(notification.metadata).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null;
                    if (typeof value === 'object' && !Array.isArray(value)) return null;
                    if (['conversation_id'].includes(key)) return null;
                    const label = getMetadataLabel(key);
                    const displayValue = Array.isArray(value) ? value.join('، ') : String(value);
                    return (
                      <div key={key} className="flex flex-col gap-0.5 p-2 rounded-lg bg-background border border-border/50">
                        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                        <span className="text-sm font-semibold truncate" title={displayValue}>{displayValue}</span>
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
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(value as Record<string, any>).map(([sk, sv]) => {
                          if (sv === null || sv === undefined || sv === '') return null;
                          return (
                            <div key={sk} className="flex flex-col gap-0.5 p-2 rounded-lg bg-background border border-border/50">
                              <span className="text-[10px] text-muted-foreground">{getMetadataLabel(sk)}</span>
                              <span className="text-sm font-semibold truncate">{String(sv)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PDF Attachment */}
            {notification.pdf_url && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">مرفق PDF</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">ملف مرفق بالإشعار</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => window.open(notification.pdf_url!, '_blank')}>
                    <Eye className="w-4 h-4" /> عرض
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => {
                    const link = document.createElement('a');
                    link.href = notification.pdf_url!;
                    link.download = `مرفق-${notification.id}.pdf`;
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                  }}>
                    <Download className="w-4 h-4" /> تنزيل
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => {
                    const w = window.open(notification.pdf_url!, '_blank');
                    if (w) w.addEventListener('load', () => w.print());
                  }}>
                    <Printer className="w-4 h-4" /> طباعة
                  </Button>
                </div>
              </div>
            )}

            {/* Document Verification */}
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
                    onVerificationComplete={() => {}}
                  />
                </div>
              </>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {format(new Date(notification.created_at), 'EEEE، d MMMM yyyy - h:mm a', { locale: ar })}
              </span>
            </div>

            {/* Quick Reply for Chat Notifications */}
            {isChatType && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  رد سريع
                </p>
                <div className="flex gap-2">
                  <Input
                    value={quickReply}
                    onChange={e => setQuickReply(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="h-9 text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleQuickReply()}
                  />
                  <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={handleQuickReply} disabled={!quickReply.trim()}>
                    <Send className="w-3.5 h-3.5" />
                    إرسال
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </ScrollArea>

        {/* Navigation Actions Footer */}
        <div className="border-t bg-muted/20 px-5 py-3">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium">التوجيه السريع</p>
          <div className="flex flex-wrap gap-2">
            {navigationActions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={i}
                  variant={action.variant || 'outline'}
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => {
                    onOpenChange(false);
                    action.action();
                  }}
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                  {action.label}
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </Button>
              );
            })}
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailDialog;
