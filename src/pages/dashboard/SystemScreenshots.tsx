import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, ExternalLink,
  Building2, Truck, Recycle, Factory,
  Shield, User, Loader2,
  Globe, Briefcase, FileText,
  Scale, Building, Users,
  RefreshCw, Download, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// html2canvas loaded dynamically
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

interface ScreenItem {
  id: string;
  title: string;
  description: string;
  path: string;
}

interface ScreenCategory {
  id: string;
  label: string;
  icon: any;
  screens: ScreenItem[];
}

const screenshotCategories: ScreenCategory[] = [
  {
    id: 'public',
    label: 'الصفحات العامة',
    icon: Globe,
    screens: [
      { id: 'landing', title: 'الصفحة الرئيسية', description: 'صفحة الهبوط الرئيسية للمنصة', path: '/' },
      { id: 'auth', title: 'تسجيل الدخول', description: 'صفحة تسجيل دخول المستخدمين', path: '/auth' },
      { id: 'news', title: 'الأخبار', description: 'آخر أخبار المنصة', path: '/news' },
      { id: 'blog', title: 'المدونة', description: 'مقالات ومحتوى تعليمي', path: '/blog' },
      { id: 'academy', title: 'أكاديمية التدوير', description: 'دورات تدريبية وتعليمية', path: '/academy' },
      { id: 'map', title: 'الخريطة التفاعلية', description: 'خريطة مرافق إعادة التدوير', path: '/map' },
      { id: 'about', title: 'عن المنصة', description: 'معلومات عن المنصة', path: '/about' },
      { id: 'laws', title: 'التشريعات', description: 'القوانين والتشريعات البيئية', path: '/laws' },
      { id: 'partnerships', title: 'الشراكات', description: 'شركاء المنصة', path: '/partnerships' },
      { id: 'terms', title: 'الشروط والأحكام', description: 'شروط استخدام المنصة', path: '/terms' },
      { id: 'privacy', title: 'سياسة الخصوصية', description: 'سياسة حماية البيانات', path: '/privacy' },
      { id: 'help', title: 'المساعدة', description: 'مركز المساعدة والدعم', path: '/help' },
      { id: 'brochure', title: 'البروشور', description: 'الكتيب التعريفي للمنصة', path: '/brochure' },
      { id: 'verify', title: 'التحقق من المستندات', description: 'صفحة التحقق العامة', path: '/verify' },
      { id: 'track', title: 'تتبع الشحنات', description: 'تتبع الشحنات العام', path: '/track' },
    ],
  },
  {
    id: 'generator',
    label: 'مولد المخلفات',
    icon: Building2,
    screens: [
      { id: 'gen-dash', title: 'لوحة تحكم المولد', description: 'ملخص العمليات والإحصائيات', path: '/dashboard' },
      { id: 'gen-shipments', title: 'إدارة الشحنات', description: 'عرض وتتبع شحنات المخلفات', path: '/dashboard/shipments' },
      { id: 'gen-create-shipment', title: 'إنشاء شحنة', description: 'نموذج إنشاء شحنة جديدة', path: '/dashboard/shipments/new' },
      { id: 'gen-reports', title: 'التقارير', description: 'تقارير الامتثال والأداء', path: '/dashboard/reports' },
      { id: 'gen-receipts', title: 'إيصالات المولد', description: 'إيصالات استلام المخلفات', path: '/dashboard/generator-receipts' },
      { id: 'gen-contracts', title: 'العقود', description: 'إدارة العقود مع الناقلين', path: '/dashboard/contracts' },
      { id: 'gen-partners', title: 'الشركاء', description: 'إدارة شركاء الأعمال', path: '/dashboard/partners' },
      { id: 'gen-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية مع الشركاء', path: '/dashboard/partner-accounts' },
      { id: 'gen-employees', title: 'الموظفون', description: 'إدارة فريق العمل', path: '/dashboard/employees' },
      { id: 'gen-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'gen-org-profile', title: 'الملف التنظيمي', description: 'بيانات المنظمة', path: '/dashboard/organization-profile' },
      { id: 'gen-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
      { id: 'gen-collection', title: 'طلبات الجمع', description: 'طلبات جمع المخلفات', path: '/dashboard/collection-requests' },
      { id: 'gen-hazardous', title: 'سجل النفايات الخطرة', description: 'سجل المخلفات الخطرة', path: '/dashboard/hazardous-register' },
      { id: 'gen-nonhazardous', title: 'سجل النفايات غير الخطرة', description: 'سجل المخلفات غير الخطرة', path: '/dashboard/non-hazardous-register' },
      { id: 'gen-carbon', title: 'البصمة الكربونية', description: 'تحليل البصمة الكربونية', path: '/dashboard/carbon-footprint' },
      { id: 'gen-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للمولد', path: '/dashboard/ai-tools' },
      { id: 'gen-stationery', title: 'القرطاسية', description: 'قوالب المطبوعات', path: '/dashboard/stationery' },
    ],
  },
  {
    id: 'transporter',
    label: 'ناقل المخلفات',
    icon: Truck,
    screens: [
      { id: 'trans-dash', title: 'لوحة تحكم الناقل', description: 'مركز القيادة للعمليات اللوجستية', path: '/dashboard' },
      { id: 'trans-shipments', title: 'شحنات الناقل', description: 'إدارة ومتابعة الشحنات', path: '/dashboard/transporter-shipments' },
      { id: 'trans-drivers', title: 'إدارة السائقين', description: 'متابعة السائقين والمركبات', path: '/dashboard/transporter-drivers' },
      { id: 'trans-driver-tracking', title: 'تتبع السائقين', description: 'تتبع مواقع السائقين', path: '/dashboard/driver-tracking' },
      { id: 'trans-routes', title: 'مسارات الشحنات', description: 'خريطة المسارات', path: '/dashboard/shipment-routes' },
      { id: 'trans-receipts', title: 'إيصالات الناقل', description: 'إيصالات النقل', path: '/dashboard/transporter-receipts' },
      { id: 'trans-contracts', title: 'العقود', description: 'إدارة عقود النقل', path: '/dashboard/contracts' },
      { id: 'trans-partners', title: 'الشركاء', description: 'شركاء النقل', path: '/dashboard/partners' },
      { id: 'trans-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية', path: '/dashboard/partner-accounts' },
      { id: 'trans-employees', title: 'الموظفون', description: 'إدارة الموظفين', path: '/dashboard/employees' },
      { id: 'trans-reports', title: 'التقارير', description: 'تقارير النقل', path: '/dashboard/reports' },
      { id: 'trans-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للناقل', path: '/dashboard/transporter-ai-tools' },
      { id: 'trans-gps', title: 'إعدادات GPS', description: 'إعدادات التتبع', path: '/dashboard/gps-settings' },
      { id: 'trans-quick-driver', title: 'روابط السائقين السريعة', description: 'إنشاء روابط سريعة للسائقين', path: '/dashboard/quick-driver-links' },
      { id: 'trans-waze', title: 'خريطة Waze الحية', description: 'الخريطة الحية', path: '/dashboard/waze-live-map' },
      { id: 'trans-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'trans-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'recycler',
    label: 'معيد التدوير',
    icon: Recycle,
    screens: [
      { id: 'rec-dash', title: 'لوحة تحكم المعيد', description: 'ملخص عمليات إعادة التدوير', path: '/dashboard' },
      { id: 'rec-shipments', title: 'الشحنات الواردة', description: 'استقبال وإدارة المواد', path: '/dashboard/shipments' },
      { id: 'rec-certs', title: 'إصدار شهادات التدوير', description: 'إصدار الشهادات البيئية', path: '/dashboard/issue-recycling-certificates' },
      { id: 'rec-my-certs', title: 'شهاداتي', description: 'الشهادات الصادرة', path: '/dashboard/recycling-certificates' },
      { id: 'rec-contracts', title: 'العقود', description: 'إدارة العقود', path: '/dashboard/contracts' },
      { id: 'rec-partners', title: 'الشركاء', description: 'إدارة الشركاء', path: '/dashboard/partners' },
      { id: 'rec-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية', path: '/dashboard/partner-accounts' },
      { id: 'rec-employees', title: 'الموظفون', description: 'إدارة الموظفين', path: '/dashboard/employees' },
      { id: 'rec-reports', title: 'التقارير', description: 'تقارير إعادة التدوير', path: '/dashboard/reports' },
      { id: 'rec-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للمعيد', path: '/dashboard/recycler-ai-tools' },
      { id: 'rec-exchange', title: 'بورصة المواد', description: 'تبادل المواد القابلة للتدوير', path: '/dashboard/waste-exchange' },
      { id: 'rec-auctions', title: 'مزادات المخلفات', description: 'مزادات شراء المواد', path: '/dashboard/waste-auctions' },
      { id: 'rec-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'rec-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'disposal',
    label: 'التخلص الآمن',
    icon: Factory,
    screens: [
      { id: 'disp-dash', title: 'لوحة تحكم التخلص', description: 'إدارة مرافق التخلص الآمن', path: '/dashboard/disposal' },
      { id: 'disp-operations', title: 'عمليات التخلص', description: 'تسجيل عمليات التخلص', path: '/dashboard/disposal/operations' },
      { id: 'disp-new-op', title: 'عملية تخلص جديدة', description: 'إنشاء عملية تخلص', path: '/dashboard/disposal/operations/new' },
      { id: 'disp-incoming', title: 'الطلبات الواردة', description: 'طلبات التخلص الواردة', path: '/dashboard/disposal/incoming-requests' },
      { id: 'disp-certs', title: 'شهادات التخلص', description: 'الشهادات الصادرة', path: '/dashboard/disposal/certificates' },
      { id: 'disp-reports', title: 'تقارير التخلص', description: 'تقارير عمليات التخلص', path: '/dashboard/disposal/reports' },
      { id: 'disp-mission', title: 'غرفة العمليات', description: 'مركز التحكم بالعمليات', path: '/dashboard/disposal/mission-control' },
      { id: 'disp-shipments', title: 'الشحنات', description: 'متابعة شحنات التخلص', path: '/dashboard/shipments' },
      { id: 'disp-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'disp-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'driver',
    label: 'السائق',
    icon: User,
    screens: [
      { id: 'drv-dash', title: 'لوحة تحكم السائق', description: 'المهام اليومية وحالة الشحنات', path: '/dashboard' },
      { id: 'drv-shipments', title: 'شحنات السائق', description: 'الشحنات المسندة للسائق', path: '/dashboard/transporter-shipments' },
      { id: 'drv-location', title: 'موقعي', description: 'تتبع الموقع الحالي', path: '/dashboard/my-location' },
      { id: 'drv-notifications', title: 'الإشعارات', description: 'إشعارات المهام', path: '/dashboard/notifications' },
      { id: 'drv-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'transport_office',
    label: 'مكتب النقل',
    icon: Building,
    screens: [
      { id: 'to-dash', title: 'لوحة تحكم مكتب النقل', description: 'إدارة عمليات النقل', path: '/dashboard' },
      { id: 'to-shipments', title: 'الشحنات', description: 'إدارة جميع الشحنات', path: '/dashboard/shipments' },
      { id: 'to-drivers', title: 'السائقون', description: 'إدارة السائقين التابعين', path: '/dashboard/transporter-drivers' },
      { id: 'to-contracts', title: 'العقود', description: 'عقود النقل', path: '/dashboard/contracts' },
      { id: 'to-partners', title: 'الشركاء', description: 'شركاء مكتب النقل', path: '/dashboard/partners' },
      { id: 'to-reports', title: 'التقارير', description: 'تقارير العمليات', path: '/dashboard/reports' },
      { id: 'to-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'to-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'consultant',
    label: 'المستشار البيئي',
    icon: Briefcase,
    screens: [
      { id: 'con-dash', title: 'لوحة تحكم المستشار', description: 'ملخص الاستشارات والمشاريع', path: '/dashboard' },
      { id: 'con-clients', title: 'العملاء', description: 'إدارة العملاء', path: '/dashboard/partners' },
      { id: 'con-reports', title: 'التقارير', description: 'تقارير الاستشارات', path: '/dashboard/reports' },
      { id: 'con-consultants', title: 'المستشارون', description: 'إدارة فريق الاستشارات', path: '/dashboard/environmental-consultants' },
      { id: 'con-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'con-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'consulting_office',
    label: 'مكتب الاستشارات',
    icon: FileText,
    screens: [
      { id: 'co-dash', title: 'لوحة تحكم مكتب الاستشارات', description: 'إدارة مكتب الاستشارات', path: '/dashboard' },
      { id: 'co-clients', title: 'العملاء', description: 'إدارة العملاء', path: '/dashboard/partners' },
      { id: 'co-consultants', title: 'المستشارون', description: 'فريق المستشارين', path: '/dashboard/environmental-consultants' },
      { id: 'co-reports', title: 'التقارير', description: 'تقارير المكتب', path: '/dashboard/reports' },
      { id: 'co-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'co-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'iso_body',
    label: 'جهة ISO',
    icon: Scale,
    screens: [
      { id: 'iso-dash', title: 'لوحة تحكم ISO', description: 'إدارة التدقيقات والشهادات', path: '/dashboard' },
      { id: 'iso-regulated', title: 'الشركات المراقبة', description: 'الشركات تحت الرقابة', path: '/dashboard/regulated-companies' },
      { id: 'iso-reports', title: 'التقارير', description: 'تقارير التدقيق', path: '/dashboard/reports' },
      { id: 'iso-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications' },
      { id: 'iso-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'admin',
    label: 'مدير النظام',
    icon: Shield,
    screens: [
      { id: 'adm-dash', title: 'لوحة التحكم الرئيسية', description: 'نظرة عامة على كل العمليات', path: '/dashboard' },
      { id: 'adm-companies', title: 'إدارة الشركات', description: 'قبول ومراجعة الشركات', path: '/dashboard/company-management' },
      { id: 'adm-approvals', title: 'طلبات اعتماد الشركات', description: 'مراجعة طلبات الاعتماد', path: '/dashboard/company-approvals' },
      { id: 'adm-drivers', title: 'قبول السائقين', description: 'مراجعة طلبات السائقين', path: '/dashboard/driver-approvals' },
      { id: 'adm-drivers-map', title: 'خريطة السائقين', description: 'مواقع جميع السائقين', path: '/dashboard/admin-drivers-map' },
      { id: 'adm-shipments', title: 'إدارة الشحنات', description: 'جميع شحنات النظام', path: '/dashboard/shipments' },
      { id: 'adm-system', title: 'حالة النظام', description: 'مراقبة صحة النظام', path: '/dashboard/system-status' },
      { id: 'adm-overview', title: 'نظرة عامة', description: 'إحصائيات النظام الشاملة', path: '/dashboard/system-overview' },
      { id: 'adm-revenue', title: 'إدارة الإيرادات', description: 'إيرادات المنصة', path: '/dashboard/admin-revenue' },
      { id: 'adm-insights', title: 'العين الذكية', description: 'تحليلات وتوصيات ذكية', path: '/dashboard/smart-insights' },
      { id: 'adm-analytics', title: 'التحليلات المتقدمة', description: 'تحليلات معمقة', path: '/dashboard/advanced-analytics' },
      { id: 'adm-news', title: 'إدارة الأخبار', description: 'نشر وتعديل الأخبار', path: '/dashboard/news-manager' },
      { id: 'adm-blog', title: 'إدارة المدونة', description: 'نشر المقالات', path: '/dashboard/blog-manager' },
      { id: 'adm-testimonials', title: 'إدارة الشهادات', description: 'شهادات العملاء', path: '/dashboard/testimonials-management' },
      { id: 'adm-waste-types', title: 'تصنيف النفايات', description: 'أنواع وتصنيفات النفايات', path: '/dashboard/waste-types' },
      { id: 'adm-regulatory', title: 'التحديثات التنظيمية', description: 'القوانين والتحديثات', path: '/dashboard/regulatory-updates' },
      { id: 'adm-api', title: 'إدارة API', description: 'مفاتيح وإعدادات API', path: '/dashboard/api' },
      { id: 'adm-security', title: 'اختبار الأمان', description: 'اختبارات الاختراق', path: '/dashboard/security-testing' },
      { id: 'adm-gdpr', title: 'الامتثال GDPR', description: 'حماية البيانات', path: '/dashboard/gdpr-compliance' },
      { id: 'adm-db', title: 'تحسين قواعد البيانات', description: 'أداء قاعدة البيانات', path: '/dashboard/db-optimization' },
      { id: 'adm-subscription', title: 'إدارة الاشتراكات', description: 'خطط الاشتراك', path: '/dashboard/subscription' },
      { id: 'adm-onboarding', title: 'مراجعة التسجيل', description: 'مراجعة طلبات التسجيل', path: '/dashboard/onboarding-review' },
      { id: 'adm-stamping', title: 'ختم المستندات', description: 'ختم المستندات الرسمية', path: '/dashboard/admin-document-stamping' },
      { id: 'adm-attestations', title: 'التصديقات', description: 'تصديقات المنظمات', path: '/dashboard/admin-attestations' },
      { id: 'adm-commands', title: 'أوامر النظام', description: 'تنفيذ أوامر إدارية', path: '/dashboard/system-commands' },
      { id: 'adm-activity', title: 'سجل النشاطات', description: 'سجل كل الأنشطة', path: '/dashboard/activity-log' },
      { id: 'adm-settings', title: 'الإعدادات', description: 'إعدادات النظام', path: '/dashboard/settings' },
    ],
  },
  {
    id: 'shared',
    label: 'صفحات مشتركة',
    icon: Users,
    screens: [
      { id: 'sh-erp-accounting', title: 'ERP - المحاسبة', description: 'النظام المحاسبي', path: '/dashboard/erp/accounting' },
      { id: 'sh-erp-inventory', title: 'ERP - المخزون', description: 'إدارة المخزون', path: '/dashboard/erp/inventory' },
      { id: 'sh-erp-hr', title: 'ERP - الموارد البشرية', description: 'إدارة الموظفين', path: '/dashboard/erp/hr' },
      { id: 'sh-erp-sales', title: 'ERP - المشتريات والمبيعات', description: 'إدارة المبيعات', path: '/dashboard/erp/purchasing-sales' },
      { id: 'sh-erp-fin', title: 'ERP - اللوحة المالية', description: 'لوحة مالية شاملة', path: '/dashboard/erp/financial-dashboard' },
      { id: 'sh-gamification', title: 'التلعيب', description: 'نظام النقاط والمكافآت', path: '/dashboard/gamification' },
      { id: 'sh-omaluna', title: 'أمالونا للتوظيف', description: 'منصة التوظيف', path: '/dashboard/omaluna' },
      { id: 'sh-commodity', title: 'بورصة السلع', description: 'بورصة المواد القابلة للتدوير', path: '/dashboard/commodity-exchange' },
      { id: 'sh-waste-exchange', title: 'تبادل المخلفات', description: 'سوق تبادل المخلفات', path: '/dashboard/waste-exchange' },
      { id: 'sh-auctions', title: 'المزادات', description: 'مزادات المخلفات', path: '/dashboard/waste-auctions' },
      { id: 'sh-equipment', title: 'سوق المعدات', description: 'معدات إعادة التدوير', path: '/dashboard/equipment-marketplace' },
      { id: 'sh-vehicle', title: 'سوق المركبات', description: 'مركبات النقل', path: '/dashboard/vehicle-marketplace' },
      { id: 'sh-insurance', title: 'التأمين الذكي', description: 'تأمين الشحنات', path: '/dashboard/smart-insurance' },
      { id: 'sh-wallet', title: 'المحفظة الرقمية', description: 'المحفظة الإلكترونية', path: '/dashboard/digital-wallet' },
      { id: 'sh-circular', title: 'الاقتصاد الدائري', description: 'مؤشرات الاقتصاد الدائري', path: '/dashboard/circular-economy' },
      { id: 'sh-esg', title: 'تقارير ESG', description: 'تقارير الاستدامة', path: '/dashboard/esg-reports' },
      { id: 'sh-heatmap', title: 'خريطة تدفق النفايات', description: 'خريطة حرارية للتدفقات', path: '/dashboard/waste-flow-heatmap' },
      { id: 'sh-learning', title: 'مركز التعلم', description: 'دورات تدريبية', path: '/dashboard/learning-center' },
      { id: 'sh-smart-agent', title: 'الوكيل الذكي', description: 'روبوت المحادثة الذكي', path: '/dashboard/smart-agent' },
      { id: 'sh-document-archive', title: 'أرشيف المستندات', description: 'أرشفة المستندات', path: '/dashboard/document-archive' },
      { id: 'sh-chat', title: 'المحادثات', description: 'نظام المراسلة', path: '/dashboard/chat' },
      { id: 'sh-support', title: 'مركز الدعم', description: 'الدعم الفني', path: '/dashboard/support' },
    ],
  },
];

const BUCKET = 'system-screenshots';

// Screen card that shows saved screenshot or capture button
const ScreenCard = memo(({ screen, categoryIcon: CatIcon, screenshotUrl, onCapture, onNavigate, isCapturing }: {
  screen: ScreenItem;
  categoryIcon: any;
  screenshotUrl: string | null;
  onCapture: () => void;
  onNavigate: () => void;
  isCapturing: boolean;
}) => {
  return (
    <Card className="overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all">
      <div
        className="relative aspect-video bg-muted/30 overflow-hidden cursor-pointer"
        onClick={onNavigate}
      >
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={screen.title}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/5 via-muted/20 to-accent/10">
            <CatIcon className="w-8 h-8 text-primary/20" />
            <span className="text-[9px] text-muted-foreground/50">لم يتم التقاط بعد</span>
          </div>
        )}
        {screenshotUrl && (
          <div className="absolute top-1.5 left-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 drop-shadow" />
          </div>
        )}
        <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
      </div>

      <CardContent className="p-2.5">
        <div className="text-right">
          <h3 className="font-semibold text-xs">{screen.title}</h3>
          <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{screen.description}</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-[10px] gap-1 h-7"
            onClick={onCapture}
            disabled={isCapturing}
          >
            {isCapturing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            التقاط
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] gap-1 h-7 px-2"
            onClick={onNavigate}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const SystemScreenshots = () => {
  const navigate = useNavigate();
  const [capturing, setCapturing] = useState<string | null>(null);
  const [capturingAll, setCapturingAll] = useState(false);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState('public');

  // Load existing screenshots from storage
  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 500 });
      if (error) throw error;
      
      const urls: Record<string, string> = {};
      for (const file of data || []) {
        const screenId = file.name.replace('.png', '');
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
        urls[screenId] = urlData.publicUrl + '?t=' + file.updated_at;
      }
      setScreenshots(urls);
    } catch (err) {
      console.error('Failed to load screenshots:', err);
    }
  };

  const captureScreen = useCallback(async (screen: ScreenItem): Promise<boolean> => {
    setCapturing(screen.id);

    try {
      // Navigate to the target page in the same window (keeps auth session)
      navigate(screen.path);

      // Wait for page to render and data to load
      await new Promise(r => setTimeout(r, 4000));

      // Additional wait: check for loading indicators
      let retries = 0;
      while (retries < 8) {
        const spinners = document.querySelectorAll('.animate-spin, [data-loading="true"]');
        const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]');
        if (spinners.length === 0 && skeletons.length === 0) break;
        await new Promise(r => setTimeout(r, 1500));
        retries++;
      }

      // Final stabilization
      await new Promise(r => setTimeout(r, 1500));

      // Capture the actual rendered page
      const canvas = await html2canvas(document.body, {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/png'
        );
      });

      // Download to device
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${screen.id}-${screen.title}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Upload to storage for gallery
      await supabase.storage
        .from(BUCKET)
        .upload(`${screen.id}.png`, blob, { upsert: true, contentType: 'image/png' });

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${screen.id}.png`);
      setScreenshots(prev => ({ ...prev, [screen.id]: urlData.publicUrl + '?t=' + Date.now() }));

      setCapturing(null);
      return true;
    } catch (err) {
      console.error(`Failed to capture ${screen.id}:`, err);
      setCapturing(null);
      return false;
    }
  }, [navigate]);

  const captureAllInCategory = useCallback(async () => {
    const category = screenshotCategories.find(c => c.id === activeTab);
    if (!category) return;

    setCapturingAll(true);
    let success = 0;
    let failed = 0;
    const failedScreens: ScreenItem[] = [];

    toast.info(`بدء التقاط ${category.screens.length} صفحة — سيتم التنقل بين الصفحات تلقائياً...`);

    for (let i = 0; i < category.screens.length; i++) {
      const screen = category.screens[i];
      toast.loading(`التقاط ${i + 1}/${category.screens.length}: ${screen.title}`, { id: 'capture-progress' });
      
      const ok = await captureScreen(screen);
      if (ok) {
        success++;
      } else {
        failed++;
        failedScreens.push(screen);
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // Retry failed ones
    if (failedScreens.length > 0) {
      toast.loading(`إعادة محاولة ${failedScreens.length} صفحة فاشلة...`, { id: 'capture-progress' });
      for (const screen of failedScreens) {
        const ok = await captureScreen(screen);
        if (ok) { success++; failed--; }
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Navigate back to screenshots page
    navigate('/dashboard/system-screenshots');
    toast.dismiss('capture-progress');
    setCapturingAll(false);
    
    if (failed === 0) {
      toast.success(`✅ تم التقاط جميع الصفحات بنجاح (${success}/${category.screens.length})`);
    } else {
      toast.warning(`تم التقاط ${success} صورة — فشل ${failed}`);
    }

    // Reload screenshots from storage
    setTimeout(() => loadScreenshots(), 1000);
  }, [activeTab, captureScreen, navigate]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const totalScreens = screenshotCategories.reduce((a, c) => a + c.screens.length, 0);
  const capturedCount = Object.keys(screenshots).length;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-20"
      >
        <BackButton />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-right flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 justify-end">
              <Camera className="h-6 w-6 text-primary" />
              سكرين شوت النظام
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              التقاط صور لكافة واجهات المنصة — {capturedCount}/{totalScreens} تم التقاطها
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={loadScreenshots}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={captureAllInCategory}
              disabled={capturingAll}
            >
              {capturingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              التقاط الكل
            </Button>
          </div>
        </div>

        <Tabs defaultValue="public" className="w-full" dir="rtl" onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin" dir="rtl">
            <TabsList className="inline-flex w-max gap-1 bg-card border border-border/50 p-1 h-auto">
              {screenshotCategories.map((cat) => {
                const Icon = cat.icon;
                const catCaptured = cat.screens.filter(s => screenshots[s.id]).length;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="whitespace-nowrap text-[10px] sm:text-xs gap-1 px-2 py-1.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30"
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                    <Badge
                      variant={catCaptured === cat.screens.length ? 'default' : 'secondary'}
                      className="text-[7px] px-1 py-0 h-3.5 mr-0.5"
                    >
                      {catCaptured}/{cat.screens.length}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {screenshotCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {category.screens.map((screen) => (
                  <ScreenCard
                    key={screen.id}
                    screen={screen}
                    categoryIcon={category.icon}
                    screenshotUrl={screenshots[screen.id] || null}
                    onCapture={() => {
                      captureScreen(screen).then(ok => {
                        navigate('/dashboard/system-screenshots');
                        setTimeout(() => loadScreenshots(), 500);
                        if (ok) toast.success(`تم التقاط: ${screen.title}`);
                        else toast.error(`فشل التقاط: ${screen.title}`);
                      });
                    }}
                    onNavigate={() => handleNavigate(screen.path)}
                    isCapturing={capturing === screen.id}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default SystemScreenshots;
