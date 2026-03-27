import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, Search, Package, Truck, CheckCircle, AlertCircle, Info, CheckCheck,
  FileText, Inbox, Send, PackageCheck, MessageSquare, Download, Printer,
  Eye, Volume2, Clock, User, Building2, MapPin, Scale, Recycle, Phone,
  Car, PenTool, Wallet, Handshake, BarChart3, Shield, Stamp, Sparkles,
  AlertTriangle, Zap, TrendingUp, Flame, Timer, Filter, LayoutGrid,
  List, CalendarDays, BellRing, BellOff, Wrench, FileCheck, Gavel,
  Megaphone, Radar, Leaf, ClipboardCheck, UserCheck, Key, Settings,
  MessageCircle,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import BackButton from '@/components/ui/back-button';
import NotificationDetailDialog from '@/components/notifications/NotificationDetailDialog';
import { previewNotificationSound, isNotificationSoundEnabled } from '@/hooks/useNotificationSound';
import { normalizeRelation } from '@/lib/supabaseHelpers';
import { getNotificationRoute } from '@/lib/notificationRouting';

// ═══════════════════════════════════════════════════════
// Metadata labels
// ═══════════════════════════════════════════════════════
const getMetadataFieldLabel = (key: string): { label: string } => {
  const labels: Record<string, string> = {
    shipment_id: 'معرّف الشحنة', shipment_number: 'رقم الشحنة', waste_type: 'نوع المخلفات',
    quantity: 'الكمية', unit: 'وحدة القياس', weight: 'الوزن', status: 'الحالة',
    previous_status: 'الحالة السابقة', new_status: 'الحالة الجديدة',
    generator_name: 'الجهة المولدة', transporter_name: 'الجهة الناقلة', recycler_name: 'جهة المعالجة',
    driver_name: 'اسم السائق', partner_name: 'اسم الشريك', organization_name: 'اسم المنظمة',
    sender_name: 'المرسِل', receiver_name: 'المستلِم',
    pickup_location: 'موقع الاستلام', delivery_location: 'موقع التسليم',
    pickup_address: 'عنوان الاستلام', delivery_address: 'عنوان التسليم', location: 'الموقع',
    plate_number: 'رقم لوحة المركبة', vehicle_type: 'نوع المركبة', vehicle_plate: 'لوحة المركبة',
    amount: 'المبلغ', total_amount: 'المبلغ الإجمالي', invoice_number: 'رقم الفاتورة',
    invoice_id: 'معرّف الفاتورة', payment_method: 'طريقة الدفع', currency: 'العملة',
    price_per_unit: 'السعر لكل وحدة',
    document_type: 'نوع المستند', document_name: 'اسم المستند', document_id: 'معرّف المستند',
    file_name: 'اسم الملف', camera_event_id: 'معرّف حدث الكاميرا', photo_url: 'رابط الصورة',
    confidence_score: 'نسبة الثقة', arrival_verified: 'تأكيد الوصول',
    report_id: 'معرّف التقرير', certificate_id: 'معرّف الشهادة', recycling_rate: 'معدل التدوير',
    pickup_date: 'تاريخ الاستلام', delivery_date: 'تاريخ التسليم', due_date: 'تاريخ الاستحقاق',
    expires_at: 'تاريخ الانتهاء', scheduled_date: 'التاريخ المجدول',
    action: 'الإجراء', reason: 'السبب', notes: 'ملاحظات', priority: 'الأولوية',
    type: 'النوع', category: 'التصنيف', source: 'المصدر', event_type: 'نوع الحدث',
    count: 'العدد', total: 'الإجمالي', percentage: 'النسبة', description: 'الوصف',
    reference: 'المرجع', reference_number: 'الرقم المرجعي',
    approval_status: 'حالة الموافقة', request_type: 'نوع الطلب',
    matched: 'تطابق', verified: 'تم التحقق',
  };
  return { label: labels[key] || key };
};

// ═══════════════════════════════════════════════════════
// Icon & Color Mapping
// ═══════════════════════════════════════════════════════
const getNotificationIcon = (type: string | null) => {
  switch (type) {
    case 'shipment_created': return Package;
    case 'shipment_status': case 'status_update': case 'shipment_assigned': return Truck;
    case 'driver_assignment': return Car;
    case 'shipment_approved': case 'shipment_delivered': return CheckCircle;
    case 'document_uploaded': case 'signing_request': return FileText;
    case 'document_issued': return Send;
    case 'signature_request': case 'document_signed': return PenTool;
    case 'stamp_applied': return Stamp;
    case 'recycling_report': case 'report': case 'certificate': return BarChart3;
    case 'partner_post': case 'partner_linked': return Handshake;
    case 'partner_note': return FileText;
    case 'partner_message': return MessageCircle;
    case 'approval_request': return Inbox;
    case 'invoice': case 'payment': case 'deposit': case 'financial': return Wallet;
    case 'warning': case 'signal_lost': return AlertCircle;
    case 'chat_message': case 'message': case 'broadcast': return MessageSquare;
    case 'mention': return User;
    case 'shipment': return Package;
    case 'license_expiry': case 'license_warning': return Key;
    case 'compliance_alert': case 'compliance_update': return Shield;
    case 'fleet_alert': case 'maintenance': return Wrench;
    case 'work_order': case 'work_order_update': return ClipboardCheck;
    case 'ai_alert': case 'ai_insight': return Sparkles;
    case 'environmental': case 'carbon_report': return Leaf;
    case 'inspection': case 'violation': return Gavel;
    case 'announcement': return Megaphone;
    case 'geofence_alert': case 'gps_alert': return Radar;
    case 'identity_verified': case 'kyc_update': return UserCheck;
    default: return Info;
  }
};

const getNotificationColor = (type: string | null) => {
  switch (type) {
    case 'shipment_created': case 'shipment': case 'shipment_assigned': return 'bg-blue-500/10 text-blue-500';
    case 'shipment_status': case 'status_update': return 'bg-amber-500/10 text-amber-500';
    case 'shipment_approved': case 'shipment_delivered': return 'bg-green-500/10 text-green-500';
    case 'driver_assignment': return 'bg-orange-500/10 text-orange-500';
    case 'document_uploaded': case 'signing_request': case 'signature_request':
    case 'document_signed': case 'document_issued': case 'stamp_applied': return 'bg-indigo-500/10 text-indigo-500';
    case 'recycling_report': case 'report': case 'certificate': return 'bg-cyan-500/10 text-cyan-500';
    case 'partner_post': case 'partner_linked': return 'bg-purple-500/10 text-purple-500';
    case 'partner_note': return 'bg-orange-500/10 text-orange-500';
    case 'partner_message': return 'bg-pink-500/10 text-pink-500';
    case 'approval_request': return 'bg-amber-500/10 text-amber-500';
    case 'invoice': case 'payment': case 'deposit': case 'financial': return 'bg-emerald-500/10 text-emerald-500';
    case 'warning': case 'signal_lost': case 'violation': return 'bg-red-500/10 text-red-500';
    case 'chat_message': case 'message': case 'broadcast': return 'bg-pink-500/10 text-pink-500';
    case 'mention': return 'bg-teal-500/10 text-teal-500';
    case 'license_expiry': case 'license_warning': return 'bg-orange-500/10 text-orange-500';
    case 'compliance_alert': case 'compliance_update': return 'bg-violet-500/10 text-violet-500';
    case 'fleet_alert': case 'maintenance': return 'bg-slate-500/10 text-slate-500';
    case 'work_order': case 'work_order_update': return 'bg-sky-500/10 text-sky-500';
    case 'ai_alert': case 'ai_insight': return 'bg-fuchsia-500/10 text-fuchsia-500';
    case 'environmental': case 'carbon_report': return 'bg-lime-500/10 text-lime-600';
    case 'inspection': return 'bg-amber-500/10 text-amber-600';
    case 'announcement': return 'bg-blue-500/10 text-blue-600';
    case 'geofence_alert': case 'gps_alert': return 'bg-rose-500/10 text-rose-500';
    case 'identity_verified': case 'kyc_update': return 'bg-teal-500/10 text-teal-600';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getNotificationBadge = (type: string | null) => {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    shipment_created: { label: 'شحنة جديدة', variant: 'default' },
    shipment_status: { label: 'تحديث حالة', variant: 'secondary' },
    status_update: { label: 'تحديث حالة', variant: 'secondary' },
    shipment_approved: { label: 'موافقة', variant: 'default' },
    shipment_delivered: { label: 'تم التسليم', variant: 'default' },
    shipment_assigned: { label: 'تعيين شحنة', variant: 'secondary' },
    driver_assignment: { label: 'تعيين سائق', variant: 'secondary' },
    shipment: { label: 'شحنة', variant: 'default' },
    document_uploaded: { label: 'مستند جديد', variant: 'secondary' },
    document_issued: { label: 'مستند صادر', variant: 'default' },
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
    signal_lost: { label: 'انقطاع إشارة', variant: 'destructive' },
    chat_message: { label: 'رسالة', variant: 'secondary' },
    message: { label: 'رسالة', variant: 'secondary' },
    broadcast: { label: 'بث جماعي', variant: 'secondary' },
    mention: { label: 'إشارة', variant: 'default' },
    license_expiry: { label: 'انتهاء ترخيص', variant: 'destructive' },
    license_warning: { label: 'تنبيه ترخيص', variant: 'secondary' },
    compliance_alert: { label: 'تنبيه امتثال', variant: 'destructive' },
    compliance_update: { label: 'تحديث امتثال', variant: 'secondary' },
    fleet_alert: { label: 'تنبيه أسطول', variant: 'secondary' },
    maintenance: { label: 'صيانة', variant: 'secondary' },
    work_order: { label: 'أمر شغل', variant: 'default' },
    work_order_update: { label: 'تحديث أمر شغل', variant: 'secondary' },
    ai_alert: { label: 'تنبيه ذكي', variant: 'default' },
    ai_insight: { label: 'رؤية ذكية', variant: 'secondary' },
    environmental: { label: 'بيئي', variant: 'default' },
    carbon_report: { label: 'تقرير كربوني', variant: 'secondary' },
    inspection: { label: 'تفتيش', variant: 'secondary' },
    violation: { label: 'مخالفة', variant: 'destructive' },
    announcement: { label: 'إعلان', variant: 'default' },
    geofence_alert: { label: 'تنبيه جغرافي', variant: 'destructive' },
    gps_alert: { label: 'تنبيه GPS', variant: 'destructive' },
    identity_verified: { label: 'تحقق هوية', variant: 'default' },
    kyc_update: { label: 'تحديث KYC', variant: 'secondary' },
  };
  return badges[type || ''] || { label: 'إشعار', variant: 'outline' as const };
};

// ═══════════════════════════════════════════════════════
// ENHANCED Category System with Sub-categories
// ═══════════════════════════════════════════════════════

const categorizeNotification = (type: string | null): string => {
  switch (type) {
    case 'shipment_created': case 'shipment_status': case 'status_update':
    case 'shipment_assigned': case 'shipment_delivered': case 'shipment_approved':
    case 'shipment': case 'driver_assignment':
      return 'shipments';
    case 'document_uploaded': case 'document_issued': case 'signature_request':
    case 'document_signed': case 'stamp_applied': case 'signing_request':
      return 'documents';
    case 'invoice': case 'payment': case 'deposit': case 'financial':
      return 'finance';
    case 'partner_post': case 'partner_request': case 'partner_linked':
      return 'partners';
    case 'partner_note':
      return 'notes';
    case 'partner_message':
      return 'messages';
    case 'approval_request': case 'approval_granted': case 'approval_rejected':
      return 'approvals';
    case 'recycling_report': case 'report': case 'certificate': case 'compliance':
      return 'reports';
    case 'chat_message': case 'message': case 'broadcast': case 'mention':
      return 'messages';
    case 'license_expiry': case 'license_warning': case 'compliance_alert':
    case 'compliance_update': case 'inspection': case 'violation':
      return 'compliance';
    case 'fleet_alert': case 'maintenance': case 'geofence_alert': case 'gps_alert':
      return 'fleet';
    case 'work_order': case 'work_order_update':
      return 'operations';
    case 'ai_alert': case 'ai_insight':
      return 'smart';
    case 'environmental': case 'carbon_report':
      return 'environmental';
    case 'identity_verified': case 'kyc_update':
      return 'identity';
    case 'announcement':
      return 'announcements';
    case 'warning': case 'system': case 'security': case 'info': case 'signal_lost':
      return 'system';
    default:
      return 'other';
  }
};

// Get sub-category for more granular filtering within a category
const getSubCategory = (type: string | null): string => {
  switch (type) {
    case 'shipment_created': return 'created';
    case 'shipment_status': case 'status_update': return 'status';
    case 'shipment_assigned': case 'driver_assignment': return 'assignment';
    case 'shipment_delivered': case 'shipment_approved': return 'completed';
    case 'document_uploaded': return 'upload';
    case 'document_issued': case 'document_signed': case 'stamp_applied': return 'signed';
    case 'signing_request': case 'signature_request': return 'request';
    case 'invoice': return 'invoice';
    case 'payment': case 'deposit': return 'payment';
    case 'license_expiry': return 'expiry';
    case 'license_warning': return 'warning';
    case 'compliance_alert': case 'violation': return 'alert';
    case 'inspection': case 'compliance_update': return 'update';
    default: return 'all';
  }
};

// Get priority level from notification
const getPriorityLevel = (notification: Notification): 'urgent' | 'high' | 'normal' | 'low' => {
  if (notification.priority === 'urgent') return 'urgent';
  if (notification.priority === 'high') return 'high';
  if (notification.priority === 'low') return 'low';
  // Auto-detect priority from type
  const urgentTypes = ['violation', 'signal_lost', 'geofence_alert', 'gps_alert', 'compliance_alert', 'license_expiry'];
  if (urgentTypes.includes(notification.type || '')) return 'urgent';
  const highTypes = ['warning', 'approval_request', 'signing_request', 'signature_request', 'license_warning', 'fleet_alert'];
  if (highTypes.includes(notification.type || '')) return 'high';
  return 'normal';
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
  priority?: string | null;
  metadata?: Record<string, any> | null;
  organization_id?: string | null;
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
  subCategories?: { id: string; label: string }[];
}

const getCategories = (): CategoryConfig[] => [
  { id: 'all', label: 'الكل', icon: Bell, color: 'text-primary', bgColor: 'bg-primary/10' },
  {
    id: 'shipments', label: 'الشحنات', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-500/10',
    subCategories: [
      { id: 'all', label: 'الكل' },
      { id: 'created', label: 'جديدة' },
      { id: 'status', label: 'تحديث حالة' },
      { id: 'assignment', label: 'تعيينات' },
      { id: 'completed', label: 'مكتملة' },
    ],
  },
  {
    id: 'documents', label: 'المستندات', icon: FileText, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10',
    subCategories: [
      { id: 'all', label: 'الكل' },
      { id: 'upload', label: 'مستندات جديدة' },
      { id: 'request', label: 'طلبات توقيع' },
      { id: 'signed', label: 'مُوقعة' },
    ],
  },
  {
    id: 'approvals', label: 'الموافقات', icon: CheckCircle, color: 'text-amber-500', bgColor: 'bg-amber-500/10',
  },
  {
    id: 'finance', label: 'المالية', icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
    subCategories: [
      { id: 'all', label: 'الكل' },
      { id: 'invoice', label: 'فواتير' },
      { id: 'payment', label: 'مدفوعات' },
    ],
  },
  {
    id: 'compliance', label: 'الامتثال والتراخيص', icon: Shield, color: 'text-violet-500', bgColor: 'bg-violet-500/10',
    subCategories: [
      { id: 'all', label: 'الكل' },
      { id: 'expiry', label: 'انتهاء صلاحية' },
      { id: 'warning', label: 'تحذيرات' },
      { id: 'alert', label: 'مخالفات' },
      { id: 'update', label: 'تحديثات' },
    ],
  },
  {
    id: 'fleet', label: 'الأسطول والتتبع', icon: Car, color: 'text-slate-500', bgColor: 'bg-slate-500/10',
  },
  {
    id: 'operations', label: 'أوامر الشغل', icon: ClipboardCheck, color: 'text-sky-500', bgColor: 'bg-sky-500/10',
  },
  { id: 'messages', label: 'الرسائل', icon: MessageCircle, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { id: 'notes', label: 'الملاحظات', icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 'partners', label: 'الشركاء', icon: Handshake, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'reports', label: 'التقارير والشهادات', icon: BarChart3, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { id: 'environmental', label: 'البيئة والكربون', icon: Leaf, color: 'text-lime-600', bgColor: 'bg-lime-500/10' },
  {
    id: 'smart', label: 'التنبيهات الذكية', icon: Sparkles, color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10',
  },
  { id: 'announcements', label: 'الإعلانات', icon: Megaphone, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  { id: 'identity', label: 'التحقق والهوية', icon: UserCheck, color: 'text-teal-600', bgColor: 'bg-teal-500/10' },
  { id: 'system', label: 'النظام', icon: Settings, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'other', label: 'أخرى', icon: Info, color: 'text-muted-foreground', bgColor: 'bg-muted' },
];

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

// ═══════════════════════════════════════════════════════
// Group notifications by date
// ═══════════════════════════════════════════════════════
const groupByDate = (notifications: Notification[]) => {
  const groups: { label: string; date: Date; items: Notification[] }[] = [];
  const map = new Map<string, Notification[]>();

  for (const n of notifications) {
    const d = startOfDay(new Date(n.created_at));
    const key = d.toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }

  for (const [key, items] of map) {
    const date = new Date(key);
    let label: string;
    if (isToday(date)) label = 'اليوم';
    else if (isYesterday(date)) label = 'أمس';
    else label = format(date, 'EEEE d MMMM', { locale: arLocale });
    groups.push({ label, date, items });
  }

  return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// ═══════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════
const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const categories = getCategories();
  const dateLocale = language === 'ar' ? arLocale : enUS;
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  // Get unique shipment IDs
  const shipmentIds = useMemo(() => {
    return notifications
      .filter(n => n.shipment_id)
      .map(n => n.shipment_id!)
      .filter((id, index, arr) => arr.indexOf(id) === index);
  }, [notifications]);

  // Fetch shipment details
  const { data: shipmentsData } = useQuery({
    queryKey: ['notification-shipments', shipmentIds],
    queryFn: async () => {
      if (shipmentIds.length === 0) return {};
      const { data } = await supabase
        .from('shipments')
        .select(`id, shipment_number, status, waste_type, quantity, unit, pickup_address, delivery_address, created_at,
          generator:generator_id(name), recycler:recycler_id(name), transporter:transporter_id(name),
          driver:driver_id(id, vehicle_type, vehicle_plate, profiles(full_name, phone))`)
        .in('id', shipmentIds);
      const map: Record<string, ShipmentDetails> = {};
      (data || []).forEach((s: any) => {
        map[s.id] = { ...s, generator: normalizeRelation(s.generator), recycler: normalizeRelation(s.recycler), transporter: normalizeRelation(s.transporter), driver: normalizeRelation(s.driver) };
      });
      return map;
    },
    enabled: shipmentIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const shipmentDetailsMap = shipmentsData || {};

  useEffect(() => { setSoundEnabled(isNotificationSoundEnabled()); }, []);

  // Auto-mark all as read when viewing notifications page
  useEffect(() => {
    if (unreadCount > 0 && !loading) {
      markAllAsRead();
    }
  }, [loading]); // Only on initial load

  // Stats
  const stats = useMemo(() => {
    const urgent = notifications.filter(n => getPriorityLevel(n) === 'urgent' && !n.is_read).length;
    const high = notifications.filter(n => getPriorityLevel(n) === 'high' && !n.is_read).length;
    const todayCount = notifications.filter(n => isToday(new Date(n.created_at))).length;
    return { urgent, high, todayCount, total: notifications.length, unread: unreadCount };
  }, [notifications, unreadCount]);

  // Reset sub-category when category changes
  useEffect(() => { setActiveSubCategory('all'); }, [activeCategory]);

  // Filter
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesCat = activeCategory === 'all' || categorizeNotification(n.type) === activeCategory;
      const matchesSub = activeSubCategory === 'all' || getSubCategory(n.type) === activeSubCategory;
      const matchesRead = readFilter === 'all' || (readFilter === 'unread' ? !n.is_read : n.is_read);
      const matchesSearch = !searchQuery ||
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSub && matchesRead && matchesSearch;
    });
  }, [notifications, activeCategory, activeSubCategory, readFilter, searchQuery]);

  const getCategoryCount = (id: string) => {
    if (id === 'all') return notifications.length;
    return notifications.filter(n => categorizeNotification(n.type) === id).length;
  };
  const getUnreadCategoryCount = (id: string) => {
    if (id === 'all') return unreadCount;
    return notifications.filter(n => categorizeNotification(n.type) === id && !n.is_read).length;
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Smart Routing: try direct navigation first
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
      return;
    }
    
    // Fallback: open detail dialog
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
  };

  const getQuickAction = (notification: Notification) => {
    const type = notification.type;
    if (type === 'signing_request' || type === 'signature_request')
      return { label: 'وقّع الآن', icon: PenTool, action: () => navigate('/dashboard/signing-inbox') };
    if (type === 'approval_request')
      return { label: 'راجع الطلب', icon: CheckCircle, action: () => navigate('/dashboard/my-requests') };
    if (['shipment_created', 'shipment_assigned', 'shipment_status', 'shipment'].includes(type || '') && notification.shipment_id)
      return { label: 'عرض الشحنة', icon: Package, action: () => navigate(`/dashboard/shipments/${notification.shipment_id}`) };
    if (type === 'partner_message') {
      const convId = (notification as any).metadata?.conversation_id;
      return { label: 'فتح المحادثة', icon: MessageCircle, action: () => navigate(convId ? `/dashboard/chat?conv=${convId}` : '/dashboard/chat') };
    }
    if (type === 'partner_note') {
      return { label: 'مركز الملاحظات', icon: FileText, action: () => navigate('/dashboard/notes') };
    }
    if (type === 'partner_linked')
      return { label: 'عرض الشركاء', icon: Handshake, action: () => navigate('/dashboard/partners') };
    if (['invoice', 'payment', 'deposit'].includes(type || ''))
      return { label: 'المالية', icon: Wallet, action: () => navigate('/dashboard/accounting') };
    if (type === 'license_expiry' || type === 'license_warning')
      return { label: 'التراخيص', icon: Key, action: () => navigate('/dashboard/organization-profile') };
    if (type === 'work_order' || type === 'work_order_update')
      return { label: 'أمر الشغل', icon: ClipboardCheck, action: () => navigate('/dashboard/work-orders') };
    if (type === 'fleet_alert' || type === 'maintenance')
      return { label: 'الأسطول', icon: Car, action: () => navigate('/dashboard/fleet') };
    if (type === 'carbon_report' || type === 'environmental')
      return { label: 'البصمة الكربونية', icon: Leaf, action: () => navigate('/dashboard/carbon-footprint') };
    return null;
  };

  const activeCatConfig = categories.find(c => c.id === activeCategory);
  const dateGroups = viewMode === 'timeline' ? groupByDate(filteredNotifications) : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        <ResponsivePageContainer
          title={isMobile ? undefined : t('notifications.title')}
          subtitle={isMobile ? undefined : 'مركز الإشعارات المتقدم — تصنيف وتتبع شامل'}
          actions={
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button onClick={() => previewNotificationSound('default')} variant="outline" size="sm" className="gap-1 text-xs h-8 px-2 sm:px-3" disabled={!soundEnabled}>
                <Volume2 className="w-3.5 h-3.5" />
                {!isMobile && 'اختبار الصوت'}
              </Button>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm" className="gap-1 text-xs h-8 px-2 sm:px-3">
                  <CheckCheck className="w-3.5 h-3.5" />
                  {isMobile ? `(${unreadCount})` : `قراءة الكل (${unreadCount})`}
                </Button>
              )}
            </div>
          }
        >
          {!isMobile && <BackButton />}

          {/* ═══ Stats Dashboard ═══ */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-3">
            {[
              { label: 'الإجمالي', value: stats.total, icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'غير مقروء', value: stats.unread, icon: BellRing, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'اليوم', value: stats.todayCount, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'عاجل', value: stats.urgent, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'مهم', value: stats.high, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-card border border-border/50">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-xl font-black">{s.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ Urgent Banner ═══ */}
          {stats.urgent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <Flame className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  لديك {stats.urgent} إشعار عاجل يتطلب إجراءً فورياً
                </p>
                <p className="text-xs text-red-500/70">مخالفات، انقطاع إشارة، أو تنبيهات امتثال حرجة</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="shrink-0 h-8 text-xs"
                onClick={() => { setActiveCategory('all'); setReadFilter('unread'); }}
              >
                عرض العاجل
              </Button>
            </motion.div>
          )}

          {/* ═══ Category Cards ═══ */}
          <div className={isMobile ? 'overflow-x-auto pb-2 -mx-1' : ''}>
            <div className={isMobile
              ? 'flex gap-2 px-1 min-w-max'
              : 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2'
            }>
              {categories.filter(c => getCategoryCount(c.id) > 0 || c.id === 'all').map((category) => {
                const CategoryIcon = category.icon;
                const count = getCategoryCount(category.id);
                const unreadCat = getUnreadCategoryCount(category.id);
                const isActive = activeCategory === category.id;

                return (
                  <motion.div key={category.id} whileTap={{ scale: 0.95 }} className={isMobile ? 'flex-shrink-0 w-[90px]' : ''}>
                    <Card
                      className={`cursor-pointer transition-all h-full ${isActive ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:shadow-md hover:border-primary/50'}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <CardContent className="p-2 sm:p-2.5">
                        <div className="flex flex-col items-center text-center gap-1">
                          <div className={`w-8 h-8 rounded-full ${category.bgColor} flex items-center justify-center relative`}>
                            <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                            {unreadCat > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center font-medium">
                                {unreadCat > 9 ? '9+' : unreadCat}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] sm:text-[10px] font-medium truncate max-w-[80px] sm:max-w-none leading-tight">{category.label}</p>
                          <p className="text-sm font-bold">{count}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ═══ Sub-categories ═══ */}
          {activeCatConfig?.subCategories && activeCatConfig.subCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {activeCatConfig.subCategories.map(sub => (
                <Button
                  key={sub.id}
                  size="sm"
                  variant={activeSubCategory === sub.id ? 'default' : 'outline'}
                  onClick={() => setActiveSubCategory(sub.id)}
                  className="h-7 text-[10px] px-2.5 shrink-0"
                >
                  {sub.label}
                </Button>
              ))}
            </div>
          )}

          {/* ═══ Search, Filter & View Toggle ═══ */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في الإشعارات..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-9 h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {(['all', 'unread', 'read'] as const).map(f => (
                <Button key={f} size="sm" variant={readFilter === f ? 'default' : 'outline'} onClick={() => setReadFilter(f)} className="h-8 sm:h-9 text-[11px] sm:text-xs px-2 sm:px-3 shrink-0">
                  {f === 'all' ? 'الكل' : f === 'unread' ? `غير مقروء (${unreadCount})` : 'مقروء'}
                </Button>
              ))}
            </div>
            {!isMobile && (
              <div className="flex gap-1 border border-border rounded-lg p-0.5">
                <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-7 w-7 p-0">
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant={viewMode === 'timeline' ? 'default' : 'ghost'} onClick={() => setViewMode('timeline')} className="h-7 w-7 p-0">
                  <CalendarDays className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ═══ Notifications List ═══ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const ActiveIcon = activeCatConfig?.icon || Bell;
                  return (
                    <>
                      <ActiveIcon className={`w-5 h-5 ${activeCatConfig?.color || ''}`} />
                      {activeCatConfig?.label || 'جميع الإشعارات'}
                      {filteredNotifications.length > 0 && (
                        <Badge variant="secondary" className="mr-2">{filteredNotifications.length}</Badge>
                      )}
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <BellOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                  <h3 className="text-lg font-medium mb-1">{t('notifications.noNotifications')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeCategory === 'all' ? t('notifications.willAppearHere') : 'لا توجد إشعارات في هذا التصنيف'}
                  </p>
                </div>
              ) : viewMode === 'timeline' ? (
                /* ═══ Timeline View ═══ */
                <div className="space-y-6">
                  {dateGroups.map(group => (
                    <div key={group.label}>
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">{group.label}</h3>
                        <Badge variant="outline" className="text-[10px]">{group.items.length}</Badge>
                        <Separator className="flex-1" />
                      </div>
                      <div className="space-y-2 relative pr-4 border-r-2 border-border/40 mr-2">
                        {group.items.map((notification, index) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            index={index}
                            isMobile={isMobile}
                            dateLocale={dateLocale}
                            shipmentDetailsMap={shipmentDetailsMap}
                            t={t}
                            onClick={handleNotificationClick}
                            markAsRead={markAsRead}
                            getQuickAction={getQuickAction}
                            isTimeline
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ═══ List View ═══ */
                <div className="space-y-2.5">
                  {filteredNotifications.map((notification, index) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      index={index}
                      isMobile={isMobile}
                      dateLocale={dateLocale}
                      shipmentDetailsMap={shipmentDetailsMap}
                      t={t}
                      onClick={handleNotificationClick}
                      markAsRead={markAsRead}
                      getQuickAction={getQuickAction}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Detail Dialog */}
          <NotificationDetailDialog
            notification={selectedNotification}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            onNavigateToShipment={(id) => navigate(`/dashboard/shipments?highlight=${id}`)}
            onNavigateToRequest={(id) => navigate(id ? `/dashboard/my-requests?highlight=${id}` : '/dashboard/my-requests')}
            onNavigateToCarbonFootprint={() => navigate('/dashboard/carbon-footprint')}
            onNavigateToSigningInbox={() => navigate('/dashboard/signing-inbox')}
          />
        </ResponsivePageContainer>
      </div>
    </DashboardLayout>
  );
};

// ═══════════════════════════════════════════════════════
// NotificationCard Component
// ═══════════════════════════════════════════════════════
interface NotificationCardProps {
  notification: Notification;
  index: number;
  isMobile: boolean;
  dateLocale: any;
  shipmentDetailsMap: Record<string, ShipmentDetails>;
  t: (key: string) => string;
  onClick: (n: Notification) => void;
  markAsRead: (id: string) => void;
  getQuickAction: (n: Notification) => { label: string; icon: React.ElementType; action: () => void } | null;
  isTimeline?: boolean;
}

const NotificationCard = ({
  notification, index, isMobile, dateLocale, shipmentDetailsMap, t,
  onClick, markAsRead, getQuickAction, isTimeline,
}: NotificationCardProps) => {
  const Icon = getNotificationIcon(notification.type);
  const iconColorClass = getNotificationColor(notification.type);
  const badge = getNotificationBadge(notification.type);
  const priority = getPriorityLevel(notification);
  const isRecyclingReport = notification.type === 'recycling_report' && notification.pdf_url;
  const shipmentDetails = notification.shipment_id ? shipmentDetailsMap[notification.shipment_id] : null;
  const driverProfile = shipmentDetails?.driver?.profiles
    ? (Array.isArray(shipmentDetails.driver.profiles) ? shipmentDetails.driver.profiles[0] : shipmentDetails.driver.profiles)
    : null;

  const priorityBorder = priority === 'urgent' ? 'border-r-4 border-r-red-500' : priority === 'high' ? 'border-r-4 border-r-orange-400' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={() => onClick(notification)}
      className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg group ${priorityBorder} ${
        !notification.is_read
          ? 'bg-gradient-to-l from-primary/5 to-transparent border-primary/30 shadow-sm'
          : 'bg-card hover:bg-muted/30 border-border/50'
      } ${isTimeline ? 'relative' : ''}`}
    >
      {/* Timeline dot */}
      {isTimeline && (
        <div className={`absolute -right-[29px] top-4 w-3 h-3 rounded-full border-2 border-background ${!notification.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold leading-tight ${isMobile ? 'text-sm' : 'text-[15px]'}`}>
                {notification.title}
              </h4>
              {!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5">
              {priority === 'urgent' && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 gap-0.5">
                  <Flame className="w-2.5 h-2.5" /> عاجل
                </Badge>
              )}
              {priority === 'high' && (
                <Badge className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0 gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> مهم
                </Badge>
              )}
              {shipmentDetails?.status && (
                <Badge className={`${getStatusLabel(shipmentDetails.status, t).color} text-[9px]`}>
                  {getStatusLabel(shipmentDetails.status, t).label}
                </Badge>
              )}
              <Badge variant={badge.variant} className={`shrink-0 ${isMobile ? 'text-[9px] px-1.5 py-0' : 'text-[10px]'}`}>
                {badge.label}
              </Badge>
            </div>
          </div>

          {/* Message */}
          <p className={`text-muted-foreground leading-relaxed whitespace-pre-wrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {notification.message}
          </p>

          {/* Shipment-specific detail card */}
          {['shipment_created', 'shipment_assigned', 'shipment_status', 'status_update', 'shipment_approved', 'shipment_delivered'].includes(notification.type || '') && !shipmentDetails && notification.metadata && (
            <div className="bg-blue-500/5 rounded-lg p-2.5 border border-blue-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">تفاصيل الشحنة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                {notification.metadata.shipment_number && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-muted-foreground/60">رقم الشحنة:</span>
                    <span className="font-medium font-mono">{notification.metadata.shipment_number}</span>
                  </div>
                )}
                {notification.metadata.waste_type && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-muted-foreground/60">نوع المخلفات:</span>
                    <span className="font-medium">{notification.metadata.waste_type}</span>
                  </div>
                )}
                {notification.metadata.quantity && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-muted-foreground/60">الكمية:</span>
                    <span className="font-medium">{notification.metadata.quantity} {notification.metadata.unit || 'كجم'}</span>
                  </div>
                )}
                {(notification.metadata.new_status || notification.metadata.status) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-muted-foreground/60">الحالة:</span>
                    <span className="font-medium">{notification.metadata.new_status || notification.metadata.status}</span>
                  </div>
                )}
                {notification.metadata.driver_name && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="font-medium">{notification.metadata.driver_name}</span>
                  </div>
                )}
                {notification.metadata.generator_name && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span className="font-medium">{notification.metadata.generator_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document-specific detail card */}
          {['document_uploaded', 'document_issued', 'signing_request', 'signature_request', 'document_signed', 'stamp_applied'].includes(notification.type || '') && (
            <div className="bg-indigo-500/5 rounded-lg p-2.5 border border-indigo-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {notification.type === 'signing_request' || notification.type === 'signature_request' ? 'طلب توقيع' : 
                   notification.type === 'document_signed' ? 'تم التوقيع' :
                   notification.type === 'stamp_applied' ? 'تم الختم' : 'تفاصيل المستند'}
                </span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.document_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">المستند:</span>
                      <span className="font-medium">{notification.metadata.document_name}</span>
                    </div>
                  )}
                  {notification.metadata.document_type && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">النوع:</span>
                      <span className="font-medium">{notification.metadata.document_type}</span>
                    </div>
                  )}
                  {notification.metadata.sender_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{notification.metadata.sender_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Finance-specific detail card */}
          {['invoice', 'payment', 'deposit', 'financial'].includes(notification.type || '') && (
            <div className="bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">تفاصيل مالية</span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.amount && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">المبلغ:</span>
                      <span className="font-bold text-emerald-600">{notification.metadata.amount} {notification.metadata.currency || 'ج.م'}</span>
                    </div>
                  )}
                  {notification.metadata.invoice_number && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">رقم الفاتورة:</span>
                      <span className="font-medium font-mono">{notification.metadata.invoice_number}</span>
                    </div>
                  )}
                  {notification.metadata.payment_method && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">طريقة الدفع:</span>
                      <span className="font-medium">{notification.metadata.payment_method}</span>
                    </div>
                  )}
                  {notification.metadata.organization_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span className="font-medium">{notification.metadata.organization_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compliance/License detail card */}
          {['license_expiry', 'license_warning', 'compliance_alert', 'compliance_update', 'violation', 'inspection'].includes(notification.type || '') && (
            <div className="bg-violet-500/5 rounded-lg p-2.5 border border-violet-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {notification.type === 'violation' ? 'تفاصيل المخالفة' : 
                   notification.type === 'inspection' ? 'تفاصيل التفتيش' : 'تفاصيل الامتثال'}
                </span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.expires_at && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3 text-red-500" />
                      <span className="font-medium text-red-500">{notification.metadata.expires_at}</span>
                    </div>
                  )}
                  {notification.metadata.reason && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-full">
                      <span className="text-muted-foreground/60">السبب:</span>
                      <span className="font-medium">{notification.metadata.reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fleet/GPS detail card */}
          {['fleet_alert', 'maintenance', 'geofence_alert', 'gps_alert'].includes(notification.type || '') && (
            <div className="bg-slate-500/5 rounded-lg p-2.5 border border-slate-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-600 dark:text-slate-400">تفاصيل الأسطول</span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.plate_number && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">لوحة المركبة:</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{notification.metadata.plate_number}</Badge>
                    </div>
                  )}
                  {notification.metadata.driver_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{notification.metadata.driver_name}</span>
                    </div>
                  )}
                  {notification.metadata.location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-full">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium">{notification.metadata.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Work Order detail card */}
          {['work_order', 'work_order_update'].includes(notification.type || '') && (
            <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <ClipboardCheck className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-semibold text-sky-600 dark:text-sky-400">تفاصيل أمر الشغل</span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.reference_number && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">الرقم المرجعي:</span>
                      <span className="font-medium font-mono">{notification.metadata.reference_number}</span>
                    </div>
                  )}
                  {notification.metadata.status && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">الحالة:</span>
                      <span className="font-medium">{notification.metadata.status}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI/Smart detail card */}
          {['ai_alert', 'ai_insight'].includes(notification.type || '') && (
            <div className="bg-fuchsia-500/5 rounded-lg p-2.5 border border-fuchsia-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
                <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">تحليل ذكي</span>
              </div>
              {notification.metadata?.description && (
                <p className="text-xs text-muted-foreground">{notification.metadata.description}</p>
              )}
              {notification.metadata?.confidence_score && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/60">نسبة الثقة:</span>
                  <span className="font-bold">{notification.metadata.confidence_score}%</span>
                </div>
              )}
            </div>
          )}

          {/* Environmental detail card */}
          {['environmental', 'carbon_report'].includes(notification.type || '') && (
            <div className="bg-lime-500/5 rounded-lg p-2.5 border border-lime-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Leaf className="w-3.5 h-3.5 text-lime-600" />
                <span className="font-semibold text-lime-700 dark:text-lime-400">تفاصيل بيئية</span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.recycling_rate && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">معدل التدوير:</span>
                      <span className="font-bold text-lime-600">{notification.metadata.recycling_rate}%</span>
                    </div>
                  )}
                  {notification.metadata.weight && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">الوزن:</span>
                      <span className="font-medium">{notification.metadata.weight} كجم</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Partner detail card */}
          {notification.type === 'partner_linked' && (
            <div className="bg-purple-500/5 rounded-lg p-2.5 border border-purple-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Handshake className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-semibold text-purple-600 dark:text-purple-400">تفاصيل الشريك</span>
              </div>
              {notification.metadata?.partner_name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">{notification.metadata.partner_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Recycling Report detail card */}
          {['recycling_report', 'report', 'certificate'].includes(notification.type || '') && (
            <div className="bg-cyan-500/5 rounded-lg p-2.5 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {notification.type === 'certificate' ? 'تفاصيل الشهادة' : 'تفاصيل التقرير'}
                </span>
              </div>
              {notification.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {notification.metadata.recycler_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Recycle className="w-3 h-3 text-green-500" />
                      <span className="font-medium">{notification.metadata.recycler_name}</span>
                    </div>
                  )}
                  {notification.metadata.recycling_rate && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60">معدل التدوير:</span>
                      <span className="font-bold text-cyan-600">{notification.metadata.recycling_rate}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shipment Details */}
          {shipmentDetails && (
            <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 mt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {shipmentDetails.shipment_number && (
                  <Badge variant="outline" className="gap-1 text-[9px] font-mono bg-primary/5">
                    <Package className="w-3 h-3" />{shipmentDetails.shipment_number}
                  </Badge>
                )}
                {shipmentDetails.waste_type && (
                  <Badge variant="secondary" className="gap-1 text-[9px]">
                    <Recycle className="w-3 h-3" />{shipmentDetails.waste_type}
                  </Badge>
                )}
                {shipmentDetails.quantity && (
                  <Badge variant="outline" className="gap-1 text-[9px]">
                    <Scale className="w-3 h-3" />{shipmentDetails.quantity} {shipmentDetails.unit || 'كجم'}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                {shipmentDetails.generator?.name && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    <span className="font-medium truncate">{shipmentDetails.generator.name}</span>
                  </div>
                )}
                {shipmentDetails.transporter?.name && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="w-3 h-3 text-purple-500" />
                    <span className="font-medium truncate">{shipmentDetails.transporter.name}</span>
                  </div>
                )}
                {shipmentDetails.recycler?.name && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Recycle className="w-3 h-3 text-green-500" />
                    <span className="font-medium truncate">{shipmentDetails.recycler.name}</span>
                  </div>
                )}
              </div>
              {shipmentDetails.driver && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-500" />
                    <span className="font-medium">{driverProfile?.full_name || 'غير معين'}</span>
                  </div>
                  {driverProfile?.phone && <span className="text-muted-foreground" dir="ltr">{driverProfile.phone}</span>}
                  {shipmentDetails.driver.vehicle_plate && (
                    <Badge variant="outline" className="text-[9px] font-mono">{shipmentDetails.driver.vehicle_plate}</Badge>
                  )}
                </div>
              )}
              {(shipmentDetails.pickup_address || shipmentDetails.delivery_address) && (
                <div className="space-y-1 pt-1 border-t border-border/50 text-xs">
                  {shipmentDetails.pickup_address && (
                    <div className="flex items-start gap-1.5"><MapPin className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" /><span className="text-muted-foreground line-clamp-1">{shipmentDetails.pickup_address}</span></div>
                  )}
                  {shipmentDetails.delivery_address && (
                    <div className="flex items-start gap-1.5"><MapPin className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /><span className="text-muted-foreground line-clamp-1">{shipmentDetails.delivery_address}</span></div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="bg-muted/20 rounded-lg p-2 space-y-1 border border-border/30">
              <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> بيانات تفصيلية
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {Object.entries(notification.metadata).map(([key, value]) => {
                  if (value === null || value === undefined || value === '' || (typeof value === 'object' && !Array.isArray(value))) return null;
                  // Hide raw UUIDs for message/note notifications - show human-readable info instead
                  const isUUID = typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
                  if (isUUID && ['sender_id', 'message_id', 'conversation_id'].includes(key)) return null;
                  return (
                    <div key={key} className="flex items-start gap-1 text-[10px]">
                      <span className="text-muted-foreground/70 shrink-0">{getMetadataFieldLabel(key).label}:</span>
                      <span className="font-medium text-foreground/80 truncate">{Array.isArray(value) ? value.join('، ') : String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message-specific detail card */}
          {notification.type === 'partner_message' && (
            <div className="bg-pink-500/5 rounded-lg p-2.5 border border-pink-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                <span className="font-semibold text-pink-600 dark:text-pink-400">تفاصيل الرسالة</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="font-medium">{notification.title?.replace('رسالة جديدة من ', '') || 'مرسل غير معروف'}</span>
              </div>
            </div>
          )}

          {/* Note-specific detail card */}
          {notification.type === 'partner_note' && (
            <div className="bg-orange-500/5 rounded-lg p-2.5 border border-orange-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold text-orange-600 dark:text-orange-400">تفاصيل الملاحظة</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="font-medium">{notification.title?.replace('ملاحظة جديدة من ', '') || 'شريك'}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
            </div>
          )}

          {/* Time + Quick Action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
            </div>
            {(() => {
              const qa = getQuickAction(notification);
              if (!qa) return null;
              const QAIcon = qa.icon;
              return (
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); qa.action(); }}>
                  <QAIcon className="w-3 h-3" />{qa.label}
                </Button>
              );
            })()}
          </div>

          {/* PDF Actions */}
          {isRecyclingReport && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); window.open(notification.pdf_url!, '_blank'); }}>
                <Eye className="w-3 h-3" /> عرض
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); const a = document.createElement('a'); a.href = notification.pdf_url!; a.download = `تقرير-${notification.shipment_id || ''}.pdf`; a.click(); }}>
                <Download className="w-3 h-3" /> تحميل
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Notifications;
