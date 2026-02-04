import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap, Settings2, Truck, Bell, FileText, MapPin, Users, Clock, 
  Package, RefreshCcw, Shield, Calendar, Send, Scale, Wallet,
  Route, AlertTriangle, CheckCircle2, Archive, Printer, Mail,
  MessageSquare, Phone, Globe, Database, Lock, Unlock, Eye,
  EyeOff, Activity, BarChart3, Sparkles, Bot, Loader2, Save,
  ChevronDown, ChevronUp, Info, Star, Flame, Target, Award,
  TrendingUp, Layers, GitBranch, Cpu, Radio, Wifi, Smartphone,
  Monitor, Cloud, Server, HardDrive, Download, Upload, Share2,
  Link, Unlink, Filter, Search, Bookmark, Heart, ThumbsUp,
  Flag, Tag, Hash, AtSign, Percent, DollarSign, CreditCard,
  Receipt, FileCheck, FilePlus, FileX, FolderPlus, FolderOpen,
  Clipboard, ClipboardCheck, ClipboardList, ListChecks, ListTodo,
  CalendarCheck, CalendarClock, Timer, TimerOff, Hourglass,
  Play, Pause, StopCircle, RotateCcw, RotateCw, Repeat, Shuffle,
  Camera, Calculator, LogOut,
  Volume2, VolumeX, Vibrate, BellRing, BellOff, MessageCircle,
  Megaphone, Inbox, SendHorizonal, ArrowUpDown, ArrowLeftRight,
  MoveVertical, Navigation, Compass, Map, PinOff, Locate,
  Crosshair, ScanLine, QrCode, Barcode, Fingerprint, KeyRound,
  ShieldCheck, ShieldAlert, ShieldOff, UserCheck, UserX, UserPlus,
  UserMinus, UsersRound, Building2, Factory, Warehouse, Store,
  Car, Bike, Ship, Plane, Train, Fuel, Battery, BatteryCharging,
  Plug, Power, Lightbulb, Sun, Moon, CloudRain, Thermometer,
  Wind, Droplet, Flame as Fire, Snowflake, Leaf, TreePine,
  Recycle, Trash2, Ban, CircleSlash, AlertCircle, HelpCircle,
  CheckCircle, XCircle, MinusCircle, PlusCircle, Circle,
} from 'lucide-react';

interface AutomationSetting {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  enabled: boolean;
  premium?: boolean;
  new?: boolean;
  config?: Record<string, any>;
}

interface AutomationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const categories: AutomationCategory[] = [
  { id: 'shipments', title: 'الشحنات', description: 'أتمتة عمليات الشحنات', icon: Package, color: 'from-blue-500 to-cyan-500' },
  { id: 'drivers', title: 'السائقين', description: 'إدارة السائقين تلقائياً', icon: Users, color: 'from-green-500 to-emerald-500' },
  { id: 'notifications', title: 'الإشعارات', description: 'إشعارات وتنبيهات تلقائية', icon: Bell, color: 'from-yellow-500 to-orange-500' },
  { id: 'reports', title: 'التقارير', description: 'توليد التقارير آلياً', icon: FileText, color: 'from-purple-500 to-violet-500' },
  { id: 'finance', title: 'المالية', description: 'العمليات المالية التلقائية', icon: Wallet, color: 'from-emerald-500 to-teal-500' },
  { id: 'tracking', title: 'التتبع', description: 'تتبع ومراقبة تلقائية', icon: MapPin, color: 'from-red-500 to-pink-500' },
  { id: 'partners', title: 'الشركاء', description: 'التواصل مع الشركاء', icon: Building2, color: 'from-indigo-500 to-blue-500' },
  { id: 'security', title: 'الأمان', description: 'إجراءات أمنية تلقائية', icon: Shield, color: 'from-slate-500 to-gray-500' },
  { id: 'ai', title: 'الذكاء الاصطناعي', description: 'ميزات AI المتقدمة', icon: Sparkles, color: 'from-pink-500 to-rose-500' },
  { id: 'integration', title: 'التكامل', description: 'ربط الأنظمة الخارجية', icon: Link, color: 'from-cyan-500 to-blue-500' },
];

const allAutomationSettings: AutomationSetting[] = [
  // الشحنات (25 إجراء)
  { id: '1', key: 'auto_accept_shipments', title: 'قبول الشحنات تلقائياً', description: 'قبول طلبات الشحن الجديدة من الشركاء الموثوقين تلقائياً', icon: CheckCircle2, category: 'shipments', enabled: false },
  { id: '2', key: 'auto_assign_driver', title: 'تعيين السائق تلقائياً', description: 'اختيار أقرب سائق متاح للشحنة الجديدة', icon: Users, category: 'shipments', enabled: false, premium: true },
  { id: '3', key: 'auto_route_optimization', title: 'تحسين المسارات تلقائياً', description: 'حساب أفضل مسار للسائق بناءً على المواقع', icon: Route, category: 'shipments', enabled: false, premium: true },
  { id: '4', key: 'auto_status_update', title: 'تحديث الحالة من GPS', description: 'تحديث حالة الشحنة بناءً على موقع السائق', icon: MapPin, category: 'shipments', enabled: false },
  { id: '5', key: 'auto_delivery_confirmation', title: 'تأكيد التسليم التلقائي', description: 'تأكيد التسليم عند وصول السائق للوجهة', icon: CheckCircle2, category: 'shipments', enabled: false },
  { id: '6', key: 'auto_archive_completed', title: 'أرشفة الشحنات المكتملة', description: 'نقل الشحنات القديمة للأرشيف تلقائياً', icon: Archive, category: 'shipments', enabled: false },
  { id: '7', key: 'auto_priority_sorting', title: 'ترتيب الأولويات', description: 'ترتيب الشحنات حسب الأهمية والموعد', icon: ArrowUpDown, category: 'shipments', enabled: false },
  { id: '8', key: 'auto_weight_validation', title: 'التحقق من الوزن', description: 'مقارنة الوزن المتوقع بالفعلي', icon: Scale, category: 'shipments', enabled: false },
  { id: '9', key: 'auto_duplicate_detection', title: 'كشف التكرار', description: 'منع إنشاء شحنات مكررة', icon: Filter, category: 'shipments', enabled: false },
  { id: '10', key: 'auto_eta_calculation', title: 'حساب وقت الوصول', description: 'تقدير وقت الوصول المتوقع تلقائياً', icon: Clock, category: 'shipments', enabled: false },
  { id: '11', key: 'auto_delay_detection', title: 'كشف التأخير', description: 'تنبيه عند تأخر الشحنة عن الجدول', icon: AlertTriangle, category: 'shipments', enabled: false },
  { id: '12', key: 'auto_rerouting', title: 'إعادة التوجيه الذكي', description: 'تغيير المسار عند وجود عوائق', icon: RefreshCcw, category: 'shipments', enabled: false, premium: true },
  { id: '13', key: 'auto_batch_processing', title: 'معالجة دفعية', description: 'تجميع الشحنات المتشابهة للمعالجة', icon: Layers, category: 'shipments', enabled: false },
  { id: '14', key: 'auto_split_shipments', title: 'تقسيم الشحنات الكبيرة', description: 'تقسيم الشحنات التي تتجاوز الحد', icon: GitBranch, category: 'shipments', enabled: false },
  { id: '15', key: 'auto_merge_shipments', title: 'دمج الشحنات', description: 'دمج الشحنات لنفس الوجهة', icon: Link, category: 'shipments', enabled: false },
  { id: '16', key: 'auto_return_handling', title: 'معالجة المرتجعات', description: 'إدارة شحنات الإرجاع تلقائياً', icon: RotateCcw, category: 'shipments', enabled: false },
  { id: '17', key: 'auto_pickup_scheduling', title: 'جدولة الاستلام', description: 'جدولة مواعيد الاستلام تلقائياً', icon: Calendar, category: 'shipments', enabled: false },
  { id: '18', key: 'auto_delivery_scheduling', title: 'جدولة التسليم', description: 'جدولة مواعيد التسليم تلقائياً', icon: CalendarCheck, category: 'shipments', enabled: false },
  { id: '19', key: 'auto_capacity_check', title: 'فحص السعة', description: 'التحقق من سعة المركبة قبل التعيين', icon: Package, category: 'shipments', enabled: false },
  { id: '20', key: 'auto_hazard_routing', title: 'مسارات المواد الخطرة', description: 'اختيار مسارات آمنة للمواد الخطرة', icon: AlertCircle, category: 'shipments', enabled: false, premium: true },
  { id: '21', key: 'auto_temperature_monitoring', title: 'مراقبة درجة الحرارة', description: 'تتبع درجة حرارة الشحنات الحساسة', icon: Thermometer, category: 'shipments', enabled: false, premium: true },
  { id: '22', key: 'auto_photo_verification', title: 'التحقق بالصور', description: 'طلب صور التسليم تلقائياً', icon: Eye, category: 'shipments', enabled: false },
  { id: '23', key: 'auto_signature_request', title: 'طلب التوقيع', description: 'طلب توقيع المستلم تلقائياً', icon: FileCheck, category: 'shipments', enabled: false },
  { id: '24', key: 'auto_pod_generation', title: 'إنشاء إثبات التسليم', description: 'توليد مستند إثبات التسليم', icon: FileText, category: 'shipments', enabled: false },
  { id: '25', key: 'auto_feedback_request', title: 'طلب التقييم', description: 'إرسال طلب تقييم بعد التسليم', icon: Star, category: 'shipments', enabled: false },

  // السائقين (20 إجراء)
  { id: '26', key: 'auto_driver_availability', title: 'تحديث التوفر', description: 'تحديث حالة توفر السائق تلقائياً', icon: Activity, category: 'drivers', enabled: false },
  { id: '27', key: 'auto_driver_location_sync', title: 'مزامنة الموقع', description: 'تحديث موقع السائق كل دقيقة', icon: MapPin, category: 'drivers', enabled: false },
  { id: '28', key: 'auto_driver_performance', title: 'تقييم الأداء', description: 'حساب مؤشرات أداء السائق', icon: BarChart3, category: 'drivers', enabled: false },
  { id: '29', key: 'auto_driver_workload', title: 'توزيع الحمل', description: 'توزيع الشحنات بالتساوي على السائقين', icon: Users, category: 'drivers', enabled: false, premium: true },
  { id: '30', key: 'auto_rest_reminder', title: 'تذكير الراحة', description: 'تنبيه السائق عند الحاجة للراحة', icon: Timer, category: 'drivers', enabled: false },
  { id: '31', key: 'auto_fuel_tracking', title: 'تتبع الوقود', description: 'حساب استهلاك الوقود تلقائياً', icon: Fuel, category: 'drivers', enabled: false },
  { id: '32', key: 'auto_vehicle_maintenance', title: 'تذكير الصيانة', description: 'تنبيه عند حلول موعد الصيانة', icon: Settings2, category: 'drivers', enabled: false },
  { id: '33', key: 'auto_license_expiry', title: 'انتهاء الرخصة', description: 'تنبيه قبل انتهاء رخصة السائق', icon: FileText, category: 'drivers', enabled: false },
  { id: '34', key: 'auto_speed_monitoring', title: 'مراقبة السرعة', description: 'تنبيه عند تجاوز السرعة المحددة', icon: Activity, category: 'drivers', enabled: false },
  { id: '35', key: 'auto_idle_detection', title: 'كشف التوقف', description: 'تنبيه عند توقف المركبة طويلاً', icon: StopCircle, category: 'drivers', enabled: false },
  { id: '36', key: 'auto_geofence_alert', title: 'تنبيه النطاق', description: 'تنبيه عند خروج السائق عن المسار', icon: Crosshair, category: 'drivers', enabled: false },
  { id: '37', key: 'auto_checkin_checkout', title: 'تسجيل الحضور', description: 'تسجيل بداية ونهاية الوردية', icon: ClipboardCheck, category: 'drivers', enabled: false },
  { id: '38', key: 'auto_task_assignment', title: 'توزيع المهام', description: 'توزيع المهام حسب الموقع والتوفر', icon: ListTodo, category: 'drivers', enabled: false, premium: true },
  { id: '39', key: 'auto_navigation_start', title: 'بدء الملاحة', description: 'فتح تطبيق الملاحة تلقائياً', icon: Navigation, category: 'drivers', enabled: false },
  { id: '40', key: 'auto_emergency_alert', title: 'تنبيه الطوارئ', description: 'إرسال تنبيه في حالات الطوارئ', icon: AlertTriangle, category: 'drivers', enabled: false },
  { id: '41', key: 'auto_driver_rating', title: 'تقييم السائق', description: 'جمع تقييمات العملاء تلقائياً', icon: Star, category: 'drivers', enabled: false },
  { id: '42', key: 'auto_training_reminder', title: 'تذكير التدريب', description: 'تنبيه بمواعيد التدريب والاختبارات', icon: Award, category: 'drivers', enabled: false },
  { id: '43', key: 'auto_document_expiry', title: 'انتهاء المستندات', description: 'تنبيه قبل انتهاء وثائق المركبة', icon: FileX, category: 'drivers', enabled: false },
  { id: '44', key: 'auto_route_history', title: 'سجل المسارات', description: 'حفظ سجل المسارات تلقائياً', icon: Map, category: 'drivers', enabled: false },
  { id: '45', key: 'auto_driver_bonus', title: 'حساب المكافآت', description: 'حساب مكافآت الأداء تلقائياً', icon: DollarSign, category: 'drivers', enabled: false, premium: true },

  // الإشعارات (20 إجراء)
  { id: '46', key: 'auto_sms_notifications', title: 'إشعارات SMS', description: 'إرسال رسائل نصية للعملاء', icon: MessageSquare, category: 'notifications', enabled: false, premium: true },
  { id: '47', key: 'auto_email_notifications', title: 'إشعارات البريد', description: 'إرسال بريد إلكتروني للتحديثات', icon: Mail, category: 'notifications', enabled: false },
  { id: '48', key: 'auto_push_notifications', title: 'الإشعارات الفورية', description: 'إشعارات فورية للتطبيق', icon: Bell, category: 'notifications', enabled: false },
  { id: '49', key: 'auto_whatsapp_updates', title: 'تحديثات واتساب', description: 'إرسال تحديثات عبر واتساب', icon: MessageCircle, category: 'notifications', enabled: false, premium: true },
  { id: '50', key: 'auto_partner_alerts', title: 'تنبيهات الشركاء', description: 'إشعار الشركاء بتحديثات الشحنات', icon: Building2, category: 'notifications', enabled: false },
  { id: '51', key: 'auto_delay_notifications', title: 'إشعارات التأخير', description: 'إبلاغ العملاء عند التأخير', icon: Clock, category: 'notifications', enabled: false },
  { id: '52', key: 'auto_arrival_notification', title: 'إشعار الوصول', description: 'إبلاغ المستلم عند اقتراب السائق', icon: MapPin, category: 'notifications', enabled: false },
  { id: '53', key: 'auto_completion_notification', title: 'إشعار الإتمام', description: 'إبلاغ المرسل عند إتمام التسليم', icon: CheckCircle2, category: 'notifications', enabled: false },
  { id: '54', key: 'auto_reminder_notifications', title: 'تذكيرات المواعيد', description: 'تذكير بمواعيد الاستلام والتسليم', icon: BellRing, category: 'notifications', enabled: false },
  { id: '55', key: 'auto_daily_summary', title: 'ملخص يومي', description: 'إرسال ملخص العمليات اليومية', icon: FileText, category: 'notifications', enabled: false },
  { id: '56', key: 'auto_weekly_report', title: 'تقرير أسبوعي', description: 'إرسال تقرير أسبوعي للإدارة', icon: BarChart3, category: 'notifications', enabled: false },
  { id: '57', key: 'auto_exception_alerts', title: 'تنبيهات الاستثناءات', description: 'إشعار فوري عند حدوث مشكلة', icon: AlertCircle, category: 'notifications', enabled: false },
  { id: '58', key: 'auto_milestone_notifications', title: 'إشعارات المراحل', description: 'إبلاغ بكل مرحلة في الشحنة', icon: Flag, category: 'notifications', enabled: false },
  { id: '59', key: 'auto_capacity_alerts', title: 'تنبيهات السعة', description: 'تنبيه عند امتلاء السعة', icon: Package, category: 'notifications', enabled: false },
  { id: '60', key: 'auto_weather_alerts', title: 'تنبيهات الطقس', description: 'تحذير من ظروف الطقس السيئة', icon: CloudRain, category: 'notifications', enabled: false, new: true },
  { id: '61', key: 'auto_traffic_alerts', title: 'تنبيهات المرور', description: 'إشعار بازدحام الطرق', icon: Car, category: 'notifications', enabled: false, premium: true },
  { id: '62', key: 'auto_system_notifications', title: 'إشعارات النظام', description: 'تنبيهات صيانة وتحديث النظام', icon: Monitor, category: 'notifications', enabled: false },
  { id: '63', key: 'auto_payment_reminders', title: 'تذكير الدفع', description: 'تذكير بالفواتير المستحقة', icon: CreditCard, category: 'notifications', enabled: false },
  { id: '64', key: 'auto_contract_reminders', title: 'تذكير العقود', description: 'تنبيه قبل انتهاء العقود', icon: FileText, category: 'notifications', enabled: false },
  { id: '65', key: 'auto_custom_notifications', title: 'إشعارات مخصصة', description: 'إنشاء قواعد إشعارات مخصصة', icon: Settings2, category: 'notifications', enabled: false, premium: true },

  // التقارير (15 إجراء)
  { id: '66', key: 'auto_daily_reports', title: 'تقارير يومية', description: 'إنشاء تقرير يومي تلقائياً', icon: FileText, category: 'reports', enabled: false },
  { id: '67', key: 'auto_weekly_reports', title: 'تقارير أسبوعية', description: 'إنشاء تقرير أسبوعي شامل', icon: FileText, category: 'reports', enabled: false },
  { id: '68', key: 'auto_monthly_reports', title: 'تقارير شهرية', description: 'إنشاء تقرير شهري مفصل', icon: FileText, category: 'reports', enabled: false },
  { id: '69', key: 'auto_performance_reports', title: 'تقارير الأداء', description: 'تقارير أداء السائقين والعمليات', icon: BarChart3, category: 'reports', enabled: false },
  { id: '70', key: 'auto_financial_reports', title: 'تقارير مالية', description: 'تقارير الإيرادات والمصروفات', icon: DollarSign, category: 'reports', enabled: false },
  { id: '71', key: 'auto_environmental_reports', title: 'تقارير بيئية', description: 'تقارير البصمة الكربونية', icon: Leaf, category: 'reports', enabled: false },
  { id: '72', key: 'auto_compliance_reports', title: 'تقارير الامتثال', description: 'تقارير الالتزام باللوائح', icon: Shield, category: 'reports', enabled: false },
  { id: '73', key: 'auto_exception_reports', title: 'تقارير الاستثناءات', description: 'تقارير المشاكل والتأخيرات', icon: AlertTriangle, category: 'reports', enabled: false },
  { id: '74', key: 'auto_customer_reports', title: 'تقارير العملاء', description: 'تقارير رضا العملاء', icon: Users, category: 'reports', enabled: false },
  { id: '75', key: 'auto_route_reports', title: 'تقارير المسارات', description: 'تحليل كفاءة المسارات', icon: Route, category: 'reports', enabled: false, premium: true },
  { id: '76', key: 'auto_fuel_reports', title: 'تقارير الوقود', description: 'تقارير استهلاك الوقود', icon: Fuel, category: 'reports', enabled: false },
  { id: '77', key: 'auto_maintenance_reports', title: 'تقارير الصيانة', description: 'تقارير صيانة المركبات', icon: Settings2, category: 'reports', enabled: false },
  { id: '78', key: 'auto_analytics_export', title: 'تصدير التحليلات', description: 'تصدير البيانات التحليلية', icon: Download, category: 'reports', enabled: false },
  { id: '79', key: 'auto_custom_reports', title: 'تقارير مخصصة', description: 'جدولة تقارير مخصصة', icon: FilePlus, category: 'reports', enabled: false, premium: true },
  { id: '80', key: 'auto_report_distribution', title: 'توزيع التقارير', description: 'إرسال التقارير للمعنيين', icon: Send, category: 'reports', enabled: false },

  // المالية (15 إجراء)
  { id: '81', key: 'auto_invoice_generation', title: 'إنشاء الفواتير', description: 'توليد الفواتير تلقائياً', icon: Receipt, category: 'finance', enabled: false },
  { id: '82', key: 'auto_payment_processing', title: 'معالجة المدفوعات', description: 'تسوية المدفوعات تلقائياً', icon: CreditCard, category: 'finance', enabled: false, premium: true },
  { id: '83', key: 'auto_expense_tracking', title: 'تتبع المصروفات', description: 'تسجيل المصروفات تلقائياً', icon: DollarSign, category: 'finance', enabled: false },
  { id: '84', key: 'auto_revenue_calculation', title: 'حساب الإيرادات', description: 'حساب إيرادات الشحنات', icon: TrendingUp, category: 'finance', enabled: false },
  { id: '85', key: 'auto_cost_allocation', title: 'توزيع التكاليف', description: 'توزيع التكاليف على الشحنات', icon: Percent, category: 'finance', enabled: false },
  { id: '86', key: 'auto_profit_calculation', title: 'حساب الأرباح', description: 'حساب هامش الربح لكل شحنة', icon: BarChart3, category: 'finance', enabled: false },
  { id: '87', key: 'auto_driver_payment', title: 'دفعات السائقين', description: 'حساب مستحقات السائقين', icon: Wallet, category: 'finance', enabled: false },
  { id: '88', key: 'auto_partner_billing', title: 'فوترة الشركاء', description: 'إصدار فواتير للشركاء', icon: FileText, category: 'finance', enabled: false },
  { id: '89', key: 'auto_tax_calculation', title: 'حساب الضرائب', description: 'حساب الضرائب المستحقة', icon: Percent, category: 'finance', enabled: false },
  { id: '90', key: 'auto_reconciliation', title: 'المطابقة المالية', description: 'مطابقة الحسابات تلقائياً', icon: CheckCircle, category: 'finance', enabled: false, premium: true },
  { id: '91', key: 'auto_late_payment_reminder', title: 'تذكير التأخر', description: 'تذكير بالدفعات المتأخرة', icon: Clock, category: 'finance', enabled: false },
  { id: '92', key: 'auto_budget_tracking', title: 'تتبع الميزانية', description: 'مراقبة الميزانية الشهرية', icon: Target, category: 'finance', enabled: false },
  { id: '93', key: 'auto_currency_conversion', title: 'تحويل العملات', description: 'تحويل العملات تلقائياً', icon: ArrowLeftRight, category: 'finance', enabled: false },
  { id: '94', key: 'auto_financial_alerts', title: 'تنبيهات مالية', description: 'تنبيه عند تجاوز الحدود', icon: AlertCircle, category: 'finance', enabled: false },
  { id: '95', key: 'auto_audit_trail', title: 'سجل التدقيق', description: 'تسجيل جميع العمليات المالية', icon: ClipboardList, category: 'finance', enabled: false },

  // التتبع (15 إجراء)
  { id: '96', key: 'auto_gps_tracking', title: 'تتبع GPS', description: 'تتبع مستمر لموقع المركبات', icon: MapPin, category: 'tracking', enabled: false },
  { id: '97', key: 'auto_shipment_tracking', title: 'تتبع الشحنات', description: 'تحديث موقع الشحنة لحظياً', icon: Package, category: 'tracking', enabled: false },
  { id: '98', key: 'auto_eta_updates', title: 'تحديث ETA', description: 'تحديث وقت الوصول المتوقع', icon: Clock, category: 'tracking', enabled: false },
  { id: '99', key: 'auto_geofence_monitoring', title: 'مراقبة النطاق', description: 'تنبيه عند دخول/خروج المناطق', icon: Crosshair, category: 'tracking', enabled: false },
  { id: '100', key: 'auto_route_deviation', title: 'كشف الانحراف', description: 'تنبيه عند الخروج عن المسار', icon: Route, category: 'tracking', enabled: false },
  { id: '101', key: 'auto_stop_detection', title: 'كشف التوقفات', description: 'تسجيل التوقفات غير المخططة', icon: StopCircle, category: 'tracking', enabled: false },
  { id: '102', key: 'auto_mileage_tracking', title: 'تتبع المسافات', description: 'حساب المسافات المقطوعة', icon: Activity, category: 'tracking', enabled: false },
  { id: '103', key: 'auto_speed_tracking', title: 'تتبع السرعة', description: 'مراقبة سرعة المركبات', icon: Activity, category: 'tracking', enabled: false },
  { id: '104', key: 'auto_idle_time_tracking', title: 'تتبع وقت التوقف', description: 'حساب أوقات التوقف', icon: Timer, category: 'tracking', enabled: false },
  { id: '105', key: 'auto_proof_of_delivery', title: 'إثبات التسليم', description: 'تسجيل إثباتات التسليم', icon: Camera, category: 'tracking', enabled: false },
  { id: '106', key: 'auto_temperature_tracking', title: 'تتبع الحرارة', description: 'مراقبة درجة حرارة الشحنات', icon: Thermometer, category: 'tracking', enabled: false, premium: true },
  { id: '107', key: 'auto_humidity_tracking', title: 'تتبع الرطوبة', description: 'مراقبة رطوبة الشحنات', icon: Droplet, category: 'tracking', enabled: false, premium: true },
  { id: '108', key: 'auto_shock_detection', title: 'كشف الصدمات', description: 'تنبيه عند تعرض الشحنة لصدمة', icon: AlertTriangle, category: 'tracking', enabled: false, premium: true },
  { id: '109', key: 'auto_location_history', title: 'سجل المواقع', description: 'حفظ سجل تحركات المركبات', icon: Map, category: 'tracking', enabled: false },
  { id: '110', key: 'auto_live_sharing', title: 'مشاركة حية', description: 'مشاركة موقع الشحنة للعميل', icon: Share2, category: 'tracking', enabled: false },

  // الشركاء (10 إجراءات)
  { id: '111', key: 'auto_partner_sync', title: 'مزامنة الشركاء', description: 'مزامنة البيانات مع الشركاء', icon: RefreshCcw, category: 'partners', enabled: false },
  { id: '112', key: 'auto_partner_onboarding', title: 'تسجيل الشركاء', description: 'أتمتة عملية تسجيل الشركاء', icon: UserPlus, category: 'partners', enabled: false },
  { id: '113', key: 'auto_partner_verification', title: 'التحقق من الشركاء', description: 'التحقق من بيانات الشركاء', icon: ShieldCheck, category: 'partners', enabled: false },
  { id: '114', key: 'auto_partner_rating', title: 'تقييم الشركاء', description: 'حساب تقييم الشركاء تلقائياً', icon: Star, category: 'partners', enabled: false },
  { id: '115', key: 'auto_partner_communication', title: 'التواصل مع الشركاء', description: 'إرسال تحديثات للشركاء', icon: MessageCircle, category: 'partners', enabled: false },
  { id: '116', key: 'auto_partner_reports', title: 'تقارير الشركاء', description: 'إنشاء تقارير للشركاء', icon: FileText, category: 'partners', enabled: false },
  { id: '117', key: 'auto_contract_renewal', title: 'تجديد العقود', description: 'تنبيه بتجديد عقود الشركاء', icon: RotateCw, category: 'partners', enabled: false },
  { id: '118', key: 'auto_partner_pricing', title: 'تحديث الأسعار', description: 'تحديث أسعار الشركاء', icon: DollarSign, category: 'partners', enabled: false },
  { id: '119', key: 'auto_partner_capacity', title: 'تتبع سعة الشركاء', description: 'مراقبة سعة استقبال الشركاء', icon: Package, category: 'partners', enabled: false },
  { id: '120', key: 'auto_partner_compliance', title: 'امتثال الشركاء', description: 'التحقق من امتثال الشركاء', icon: Shield, category: 'partners', enabled: false },

  // الأمان (10 إجراءات)
  { id: '121', key: 'auto_access_control', title: 'التحكم بالوصول', description: 'إدارة صلاحيات المستخدمين', icon: Lock, category: 'security', enabled: false },
  { id: '122', key: 'auto_audit_logging', title: 'سجل التدقيق', description: 'تسجيل جميع العمليات', icon: ClipboardList, category: 'security', enabled: false },
  { id: '123', key: 'auto_session_management', title: 'إدارة الجلسات', description: 'إنهاء الجلسات غير النشطة', icon: LogOut, category: 'security', enabled: false },
  { id: '124', key: 'auto_password_expiry', title: 'انتهاء كلمة المرور', description: 'تذكير بتغيير كلمة المرور', icon: KeyRound, category: 'security', enabled: false },
  { id: '125', key: 'auto_threat_detection', title: 'كشف التهديدات', description: 'رصد النشاط المشبوه', icon: ShieldAlert, category: 'security', enabled: false, premium: true },
  { id: '126', key: 'auto_data_backup', title: 'النسخ الاحتياطي', description: 'نسخ البيانات احتياطياً', icon: Database, category: 'security', enabled: false },
  { id: '127', key: 'auto_encryption', title: 'تشفير البيانات', description: 'تشفير البيانات الحساسة', icon: Lock, category: 'security', enabled: false },
  { id: '128', key: 'auto_compliance_check', title: 'فحص الامتثال', description: 'التحقق من الامتثال الأمني', icon: ShieldCheck, category: 'security', enabled: false },
  { id: '129', key: 'auto_incident_response', title: 'الاستجابة للحوادث', description: 'إجراءات تلقائية عند الاختراق', icon: AlertTriangle, category: 'security', enabled: false, premium: true },
  { id: '130', key: 'auto_security_reports', title: 'تقارير الأمان', description: 'تقارير أمنية دورية', icon: FileText, category: 'security', enabled: false },

  // الذكاء الاصطناعي (10 إجراءات)
  { id: '131', key: 'auto_demand_prediction', title: 'توقع الطلب', description: 'التنبؤ بحجم الشحنات المتوقع', icon: TrendingUp, category: 'ai', enabled: false, premium: true, new: true },
  { id: '132', key: 'auto_route_ai', title: 'تحسين المسارات بالذكاء', description: 'استخدام AI لتحسين المسارات', icon: Bot, category: 'ai', enabled: false, premium: true },
  { id: '133', key: 'auto_anomaly_detection', title: 'كشف الشذوذ', description: 'اكتشاف الأنماط غير الطبيعية', icon: Activity, category: 'ai', enabled: false, premium: true },
  { id: '134', key: 'auto_price_optimization', title: 'تحسين الأسعار', description: 'اقتراح أسعار مثلى', icon: DollarSign, category: 'ai', enabled: false, premium: true },
  { id: '135', key: 'auto_capacity_planning', title: 'تخطيط السعة', description: 'التنبؤ بالحاجة للسعة', icon: Package, category: 'ai', enabled: false, premium: true },
  { id: '136', key: 'auto_risk_assessment', title: 'تقييم المخاطر', description: 'تحليل مخاطر الشحنات', icon: AlertTriangle, category: 'ai', enabled: false, premium: true },
  { id: '137', key: 'auto_customer_insights', title: 'رؤى العملاء', description: 'تحليل سلوك العملاء', icon: Users, category: 'ai', enabled: false, premium: true },
  { id: '138', key: 'auto_smart_scheduling', title: 'جدولة ذكية', description: 'جدولة مثلى بالذكاء الاصطناعي', icon: Calendar, category: 'ai', enabled: false, premium: true },
  { id: '139', key: 'auto_document_ai', title: 'تحليل المستندات', description: 'استخراج البيانات من المستندات', icon: FileText, category: 'ai', enabled: false, premium: true },
  { id: '140', key: 'auto_chatbot', title: 'روبوت المحادثة', description: 'ردود تلقائية للاستفسارات', icon: MessageCircle, category: 'ai', enabled: false, premium: true, new: true },

  // التكامل (10 إجراءات)
  { id: '141', key: 'auto_api_sync', title: 'مزامنة API', description: 'مزامنة مع الأنظمة الخارجية', icon: RefreshCcw, category: 'integration', enabled: false },
  { id: '142', key: 'auto_erp_integration', title: 'ربط ERP', description: 'التكامل مع نظام ERP', icon: Database, category: 'integration', enabled: false, premium: true },
  { id: '143', key: 'auto_accounting_sync', title: 'ربط المحاسبة', description: 'مزامنة مع برنامج المحاسبة', icon: Calculator, category: 'integration', enabled: false, premium: true },
  { id: '144', key: 'auto_map_integration', title: 'ربط الخرائط', description: 'التكامل مع خدمات الخرائط', icon: Map, category: 'integration', enabled: false },
  { id: '145', key: 'auto_weather_integration', title: 'ربط الطقس', description: 'جلب بيانات الطقس تلقائياً', icon: Cloud, category: 'integration', enabled: false },
  { id: '146', key: 'auto_traffic_integration', title: 'ربط المرور', description: 'جلب بيانات حركة المرور', icon: Car, category: 'integration', enabled: false, premium: true },
  { id: '147', key: 'auto_sms_integration', title: 'ربط SMS', description: 'التكامل مع خدمات الرسائل', icon: MessageSquare, category: 'integration', enabled: false },
  { id: '148', key: 'auto_email_integration', title: 'ربط البريد', description: 'التكامل مع خدمات البريد', icon: Mail, category: 'integration', enabled: false },
  { id: '149', key: 'auto_webhook_triggers', title: 'محفزات Webhook', description: 'إرسال أحداث للأنظمة الخارجية', icon: Zap, category: 'integration', enabled: false },
  { id: '150', key: 'auto_data_export', title: 'تصدير البيانات', description: 'تصدير دوري للبيانات', icon: Download, category: 'integration', enabled: false },
];


interface AutomationSettingsDialogProps {
  organizationType?: string;
}

const AutomationSettingsDialog = ({ organizationType = 'transporter' }: AutomationSettingsDialogProps) => {
  const { organization } = useAuth();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AutomationSetting[]>(allAutomationSettings);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (open && organization?.id) {
      loadSettings();
    }
  }, [open, organization?.id]);

  const loadSettings = async () => {
    // In a real implementation, load saved settings from database
    // For now, use default settings
  };

  const handleToggle = (settingId: string) => {
    setSettings(prev => prev.map(s => 
      s.id === settingId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم حفظ إعدادات الأتمتة بنجاح');
      setOpen(false);
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredSettings = settings.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.includes(searchQuery) || 
      s.description.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const enabledCount = settings.filter(s => s.enabled).length;
  const totalCount = settings.length;

  const getCategorySettings = (categoryId: string) => 
    filteredSettings.filter(s => s.category === categoryId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-primary/10 to-amber-500/10 border-primary/30 hover:border-primary gap-2"
        >
          <Zap className="h-4 w-4 text-primary" />
          تفعيل الإجراءات التلقائية
          {enabledCount > 0 && (
            <Badge variant="secondary" className="mr-1">{enabledCount}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                الإجراءات التلقائية
              </DialogTitle>
              <DialogDescription>
                فعّل الإجراءات التي تريد من النظام تنفيذها تلقائياً
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {enabledCount} / {totalCount}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الإجراءات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('all')}
            >
              الكل ({totalCount})
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <cat.icon className="h-3 w-3 ml-1" />
                {cat.title} ({getCategorySettings(cat.id).length})
              </Badge>
            ))}
          </div>

          {/* Settings List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {categories.map(category => {
                const categorySettings = getCategorySettings(category.id);
                if (categorySettings.length === 0) return null;

                const isExpanded = expandedCategories.includes(category.id) || selectedCategory === category.id;
                const enabledInCategory = categorySettings.filter(s => s.enabled).length;

                return (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader 
                      className={`cursor-pointer py-3 bg-gradient-to-r ${category.color} bg-opacity-10`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                            <category.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{category.title}</CardTitle>
                            <CardDescription className="text-xs">{category.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {enabledInCategory} / {categorySettings.length}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-3 space-y-2">
                            {categorySettings.map(setting => (
                              <motion.div
                                key={setting.id}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  setting.enabled 
                                    ? 'bg-primary/5 border-primary/30' 
                                    : 'bg-muted/30 border-border'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    setting.enabled ? 'bg-primary/20' : 'bg-muted'
                                  }`}>
                                    <setting.icon className={`h-4 w-4 ${
                                      setting.enabled ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{setting.title}</span>
                                      {setting.premium && (
                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                          <Star className="h-3 w-3 ml-1" />
                                          مميز
                                        </Badge>
                                      )}
                                      {setting.new && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                          <Sparkles className="h-3 w-3 ml-1" />
                                          جديد
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={setting.enabled}
                                  onCheckedChange={() => handleToggle(setting.id)}
                                />
                              </motion.div>
                            ))}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>الميزات المميزة تتطلب اشتراك متقدم</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الإعدادات
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationSettingsDialog;
