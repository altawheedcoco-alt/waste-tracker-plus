import { useState, useCallback, useRef, memo } from 'react';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

interface ScreenItem {
  id: string;
  title: string;
  description: string;
  path: string;
  image: string | null;
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
      { id: 'landing', title: 'الصفحة الرئيسية', description: 'صفحة الهبوط الرئيسية للمنصة', path: '/', image: '/screenshots/landing-page.png' },
      { id: 'auth', title: 'تسجيل الدخول', description: 'صفحة تسجيل دخول المستخدمين', path: '/auth', image: '/screenshots/auth-page.png' },
      { id: 'news', title: 'الأخبار', description: 'آخر أخبار المنصة', path: '/news', image: null },
      { id: 'blog', title: 'المدونة', description: 'مقالات ومحتوى تعليمي', path: '/blog', image: null },
      { id: 'academy', title: 'أكاديمية التدوير', description: 'دورات تدريبية وتعليمية', path: '/academy', image: null },
      { id: 'map', title: 'الخريطة التفاعلية', description: 'خريطة مرافق إعادة التدوير', path: '/map', image: null },
      { id: 'about', title: 'عن المنصة', description: 'معلومات عن المنصة', path: '/about', image: null },
      { id: 'laws', title: 'التشريعات', description: 'القوانين والتشريعات البيئية', path: '/laws', image: null },
      { id: 'partnerships', title: 'الشراكات', description: 'شركاء المنصة', path: '/partnerships', image: null },
      { id: 'terms', title: 'الشروط والأحكام', description: 'شروط استخدام المنصة', path: '/terms', image: null },
      { id: 'privacy', title: 'سياسة الخصوصية', description: 'سياسة حماية البيانات', path: '/privacy', image: null },
      { id: 'help', title: 'المساعدة', description: 'مركز المساعدة والدعم', path: '/help', image: null },
      { id: 'brochure', title: 'البروشور', description: 'الكتيب التعريفي للمنصة', path: '/brochure', image: null },
      { id: 'verify', title: 'التحقق من المستندات', description: 'صفحة التحقق العامة', path: '/verify', image: null },
      { id: 'track', title: 'تتبع الشحنات', description: 'تتبع الشحنات العام', path: '/track', image: null },
    ],
  },
  {
    id: 'generator',
    label: 'مولد المخلفات',
    icon: Building2,
    screens: [
      { id: 'gen-dash', title: 'لوحة تحكم المولد', description: 'ملخص العمليات والإحصائيات', path: '/dashboard', image: null },
      { id: 'gen-shipments', title: 'إدارة الشحنات', description: 'عرض وتتبع شحنات المخلفات', path: '/dashboard/shipments', image: null },
      { id: 'gen-create-shipment', title: 'إنشاء شحنة', description: 'نموذج إنشاء شحنة جديدة', path: '/dashboard/shipments/new', image: null },
      { id: 'gen-reports', title: 'التقارير', description: 'تقارير الامتثال والأداء', path: '/dashboard/reports', image: null },
      { id: 'gen-receipts', title: 'إيصالات المولد', description: 'إيصالات استلام المخلفات', path: '/dashboard/generator-receipts', image: null },
      { id: 'gen-contracts', title: 'العقود', description: 'إدارة العقود مع الناقلين', path: '/dashboard/contracts', image: null },
      { id: 'gen-partners', title: 'الشركاء', description: 'إدارة شركاء الأعمال', path: '/dashboard/partners', image: null },
      { id: 'gen-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية مع الشركاء', path: '/dashboard/partner-accounts', image: null },
      { id: 'gen-employees', title: 'الموظفون', description: 'إدارة فريق العمل', path: '/dashboard/employees', image: null },
      { id: 'gen-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'gen-org-profile', title: 'الملف التنظيمي', description: 'بيانات المنظمة', path: '/dashboard/organization-profile', image: null },
      { id: 'gen-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
      { id: 'gen-collection', title: 'طلبات الجمع', description: 'طلبات جمع المخلفات', path: '/dashboard/collection-requests', image: null },
      { id: 'gen-hazardous', title: 'سجل النفايات الخطرة', description: 'سجل المخلفات الخطرة', path: '/dashboard/hazardous-register', image: null },
      { id: 'gen-nonhazardous', title: 'سجل النفايات غير الخطرة', description: 'سجل المخلفات غير الخطرة', path: '/dashboard/non-hazardous-register', image: null },
      { id: 'gen-carbon', title: 'البصمة الكربونية', description: 'تحليل البصمة الكربونية', path: '/dashboard/carbon-footprint', image: null },
      { id: 'gen-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للمولد', path: '/dashboard/ai-tools', image: null },
      { id: 'gen-stationery', title: 'القرطاسية', description: 'قوالب المطبوعات', path: '/dashboard/stationery', image: null },
    ],
  },
  {
    id: 'transporter',
    label: 'ناقل المخلفات',
    icon: Truck,
    screens: [
      { id: 'trans-dash', title: 'لوحة تحكم الناقل', description: 'مركز القيادة للعمليات اللوجستية', path: '/dashboard', image: null },
      { id: 'trans-shipments', title: 'شحنات الناقل', description: 'إدارة ومتابعة الشحنات', path: '/dashboard/transporter-shipments', image: null },
      { id: 'trans-drivers', title: 'إدارة السائقين', description: 'متابعة السائقين والمركبات', path: '/dashboard/transporter-drivers', image: null },
      { id: 'trans-driver-tracking', title: 'تتبع السائقين', description: 'تتبع مواقع السائقين', path: '/dashboard/driver-tracking', image: null },
      { id: 'trans-routes', title: 'مسارات الشحنات', description: 'خريطة المسارات', path: '/dashboard/shipment-routes', image: null },
      { id: 'trans-receipts', title: 'إيصالات الناقل', description: 'إيصالات النقل', path: '/dashboard/transporter-receipts', image: null },
      { id: 'trans-contracts', title: 'العقود', description: 'إدارة عقود النقل', path: '/dashboard/contracts', image: null },
      { id: 'trans-partners', title: 'الشركاء', description: 'شركاء النقل', path: '/dashboard/partners', image: null },
      { id: 'trans-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية', path: '/dashboard/partner-accounts', image: null },
      { id: 'trans-employees', title: 'الموظفون', description: 'إدارة الموظفين', path: '/dashboard/employees', image: null },
      { id: 'trans-reports', title: 'التقارير', description: 'تقارير النقل', path: '/dashboard/reports', image: null },
      { id: 'trans-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للناقل', path: '/dashboard/transporter-ai-tools', image: null },
      { id: 'trans-gps', title: 'إعدادات GPS', description: 'إعدادات التتبع', path: '/dashboard/gps-settings', image: null },
      { id: 'trans-quick-driver', title: 'روابط السائقين السريعة', description: 'إنشاء روابط سريعة للسائقين', path: '/dashboard/quick-driver-links', image: null },
      { id: 'trans-waze', title: 'خريطة Waze الحية', description: 'الخريطة الحية', path: '/dashboard/waze-live-map', image: null },
      { id: 'trans-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'trans-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'recycler',
    label: 'معيد التدوير',
    icon: Recycle,
    screens: [
      { id: 'rec-dash', title: 'لوحة تحكم المعيد', description: 'ملخص عمليات إعادة التدوير', path: '/dashboard', image: null },
      { id: 'rec-shipments', title: 'الشحنات الواردة', description: 'استقبال وإدارة المواد', path: '/dashboard/shipments', image: null },
      { id: 'rec-certs', title: 'إصدار شهادات التدوير', description: 'إصدار الشهادات البيئية', path: '/dashboard/issue-recycling-certificates', image: null },
      { id: 'rec-my-certs', title: 'شهاداتي', description: 'الشهادات الصادرة', path: '/dashboard/recycling-certificates', image: null },
      { id: 'rec-contracts', title: 'العقود', description: 'إدارة العقود', path: '/dashboard/contracts', image: null },
      { id: 'rec-partners', title: 'الشركاء', description: 'إدارة الشركاء', path: '/dashboard/partners', image: null },
      { id: 'rec-partner-accounts', title: 'حسابات الشركاء', description: 'الحسابات المالية', path: '/dashboard/partner-accounts', image: null },
      { id: 'rec-employees', title: 'الموظفون', description: 'إدارة الموظفين', path: '/dashboard/employees', image: null },
      { id: 'rec-reports', title: 'التقارير', description: 'تقارير إعادة التدوير', path: '/dashboard/reports', image: null },
      { id: 'rec-ai', title: 'أدوات الذكاء الاصطناعي', description: 'أدوات AI للمعيد', path: '/dashboard/recycler-ai-tools', image: null },
      { id: 'rec-exchange', title: 'بورصة المواد', description: 'تبادل المواد القابلة للتدوير', path: '/dashboard/waste-exchange', image: null },
      { id: 'rec-auctions', title: 'مزادات المخلفات', description: 'مزادات شراء المواد', path: '/dashboard/waste-auctions', image: null },
      { id: 'rec-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'rec-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'disposal',
    label: 'التخلص الآمن',
    icon: Factory,
    screens: [
      { id: 'disp-dash', title: 'لوحة تحكم التخلص', description: 'إدارة مرافق التخلص الآمن', path: '/dashboard/disposal', image: null },
      { id: 'disp-operations', title: 'عمليات التخلص', description: 'تسجيل عمليات التخلص', path: '/dashboard/disposal/operations', image: null },
      { id: 'disp-new-op', title: 'عملية تخلص جديدة', description: 'إنشاء عملية تخلص', path: '/dashboard/disposal/operations/new', image: null },
      { id: 'disp-incoming', title: 'الطلبات الواردة', description: 'طلبات التخلص الواردة', path: '/dashboard/disposal/incoming-requests', image: null },
      { id: 'disp-certs', title: 'شهادات التخلص', description: 'الشهادات الصادرة', path: '/dashboard/disposal/certificates', image: null },
      { id: 'disp-reports', title: 'تقارير التخلص', description: 'تقارير عمليات التخلص', path: '/dashboard/disposal/reports', image: null },
      { id: 'disp-mission', title: 'غرفة العمليات', description: 'مركز التحكم بالعمليات', path: '/dashboard/disposal/mission-control', image: null },
      { id: 'disp-shipments', title: 'الشحنات', description: 'متابعة شحنات التخلص', path: '/dashboard/shipments', image: null },
      { id: 'disp-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'disp-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'driver',
    label: 'السائق',
    icon: User,
    screens: [
      { id: 'drv-dash', title: 'لوحة تحكم السائق', description: 'المهام اليومية وحالة الشحنات', path: '/dashboard', image: null },
      { id: 'drv-shipments', title: 'شحنات السائق', description: 'الشحنات المسندة للسائق', path: '/dashboard/transporter-shipments', image: null },
      { id: 'drv-location', title: 'موقعي', description: 'تتبع الموقع الحالي', path: '/dashboard/my-location', image: null },
      { id: 'drv-notifications', title: 'الإشعارات', description: 'إشعارات المهام', path: '/dashboard/notifications', image: null },
      { id: 'drv-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'transport_office',
    label: 'مكتب النقل',
    icon: Building,
    screens: [
      { id: 'to-dash', title: 'لوحة تحكم مكتب النقل', description: 'إدارة عمليات النقل', path: '/dashboard', image: null },
      { id: 'to-shipments', title: 'الشحنات', description: 'إدارة جميع الشحنات', path: '/dashboard/shipments', image: null },
      { id: 'to-drivers', title: 'السائقون', description: 'إدارة السائقين التابعين', path: '/dashboard/transporter-drivers', image: null },
      { id: 'to-contracts', title: 'العقود', description: 'عقود النقل', path: '/dashboard/contracts', image: null },
      { id: 'to-partners', title: 'الشركاء', description: 'شركاء مكتب النقل', path: '/dashboard/partners', image: null },
      { id: 'to-reports', title: 'التقارير', description: 'تقارير العمليات', path: '/dashboard/reports', image: null },
      { id: 'to-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'to-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'consultant',
    label: 'المستشار البيئي',
    icon: Briefcase,
    screens: [
      { id: 'con-dash', title: 'لوحة تحكم المستشار', description: 'ملخص الاستشارات والمشاريع', path: '/dashboard', image: null },
      { id: 'con-clients', title: 'العملاء', description: 'إدارة العملاء', path: '/dashboard/partners', image: null },
      { id: 'con-reports', title: 'التقارير', description: 'تقارير الاستشارات', path: '/dashboard/reports', image: null },
      { id: 'con-consultants', title: 'المستشارون', description: 'إدارة فريق الاستشارات', path: '/dashboard/environmental-consultants', image: null },
      { id: 'con-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'con-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'consulting_office',
    label: 'مكتب الاستشارات',
    icon: FileText,
    screens: [
      { id: 'co-dash', title: 'لوحة تحكم مكتب الاستشارات', description: 'إدارة مكتب الاستشارات', path: '/dashboard', image: null },
      { id: 'co-clients', title: 'العملاء', description: 'إدارة العملاء', path: '/dashboard/partners', image: null },
      { id: 'co-consultants', title: 'المستشارون', description: 'فريق المستشارين', path: '/dashboard/environmental-consultants', image: null },
      { id: 'co-reports', title: 'التقارير', description: 'تقارير المكتب', path: '/dashboard/reports', image: null },
      { id: 'co-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'co-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'iso_body',
    label: 'جهة ISO',
    icon: Scale,
    screens: [
      { id: 'iso-dash', title: 'لوحة تحكم ISO', description: 'إدارة التدقيقات والشهادات', path: '/dashboard', image: null },
      { id: 'iso-regulated', title: 'الشركات المراقبة', description: 'الشركات تحت الرقابة', path: '/dashboard/regulated-companies', image: null },
      { id: 'iso-reports', title: 'التقارير', description: 'تقارير التدقيق', path: '/dashboard/reports', image: null },
      { id: 'iso-notifications', title: 'الإشعارات', description: 'مركز الإشعارات', path: '/dashboard/notifications', image: null },
      { id: 'iso-settings', title: 'الإعدادات', description: 'إعدادات الحساب', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'admin',
    label: 'مدير النظام',
    icon: Shield,
    screens: [
      { id: 'adm-dash', title: 'لوحة التحكم الرئيسية', description: 'نظرة عامة على كل العمليات', path: '/dashboard', image: null },
      { id: 'adm-companies', title: 'إدارة الشركات', description: 'قبول ومراجعة الشركات', path: '/dashboard/company-management', image: null },
      { id: 'adm-approvals', title: 'طلبات اعتماد الشركات', description: 'مراجعة طلبات الاعتماد', path: '/dashboard/company-approvals', image: null },
      { id: 'adm-drivers', title: 'قبول السائقين', description: 'مراجعة طلبات السائقين', path: '/dashboard/driver-approvals', image: null },
      { id: 'adm-drivers-map', title: 'خريطة السائقين', description: 'مواقع جميع السائقين', path: '/dashboard/admin-drivers-map', image: null },
      { id: 'adm-shipments', title: 'إدارة الشحنات', description: 'جميع شحنات النظام', path: '/dashboard/shipments', image: null },
      { id: 'adm-system', title: 'حالة النظام', description: 'مراقبة صحة النظام', path: '/dashboard/system-status', image: null },
      { id: 'adm-overview', title: 'نظرة عامة', description: 'إحصائيات النظام الشاملة', path: '/dashboard/system-overview', image: null },
      { id: 'adm-revenue', title: 'إدارة الإيرادات', description: 'إيرادات المنصة', path: '/dashboard/admin-revenue', image: null },
      { id: 'adm-insights', title: 'العين الذكية', description: 'تحليلات وتوصيات ذكية', path: '/dashboard/smart-insights', image: null },
      { id: 'adm-analytics', title: 'التحليلات المتقدمة', description: 'تحليلات معمقة', path: '/dashboard/advanced-analytics', image: null },
      { id: 'adm-news', title: 'إدارة الأخبار', description: 'نشر وتعديل الأخبار', path: '/dashboard/news-manager', image: null },
      { id: 'adm-blog', title: 'إدارة المدونة', description: 'نشر المقالات', path: '/dashboard/blog-manager', image: null },
      { id: 'adm-testimonials', title: 'إدارة الشهادات', description: 'شهادات العملاء', path: '/dashboard/testimonials-management', image: null },
      { id: 'adm-waste-types', title: 'تصنيف النفايات', description: 'أنواع وتصنيفات النفايات', path: '/dashboard/waste-types', image: null },
      { id: 'adm-regulatory', title: 'التحديثات التنظيمية', description: 'القوانين والتحديثات', path: '/dashboard/regulatory-updates', image: null },
      { id: 'adm-api', title: 'إدارة API', description: 'مفاتيح وإعدادات API', path: '/dashboard/api', image: null },
      { id: 'adm-security', title: 'اختبار الأمان', description: 'اختبارات الاختراق', path: '/dashboard/security-testing', image: null },
      { id: 'adm-gdpr', title: 'الامتثال GDPR', description: 'حماية البيانات', path: '/dashboard/gdpr-compliance', image: null },
      { id: 'adm-db', title: 'تحسين قواعد البيانات', description: 'أداء قاعدة البيانات', path: '/dashboard/db-optimization', image: null },
      { id: 'adm-subscription', title: 'إدارة الاشتراكات', description: 'خطط الاشتراك', path: '/dashboard/subscription', image: null },
      { id: 'adm-onboarding', title: 'مراجعة التسجيل', description: 'مراجعة طلبات التسجيل', path: '/dashboard/onboarding-review', image: null },
      { id: 'adm-stamping', title: 'ختم المستندات', description: 'ختم المستندات الرسمية', path: '/dashboard/admin-document-stamping', image: null },
      { id: 'adm-attestations', title: 'التصديقات', description: 'تصديقات المنظمات', path: '/dashboard/admin-attestations', image: null },
      { id: 'adm-commands', title: 'أوامر النظام', description: 'تنفيذ أوامر إدارية', path: '/dashboard/system-commands', image: null },
      { id: 'adm-activity', title: 'سجل النشاطات', description: 'سجل كل الأنشطة', path: '/dashboard/activity-log', image: null },
      { id: 'adm-settings', title: 'الإعدادات', description: 'إعدادات النظام', path: '/dashboard/settings', image: null },
    ],
  },
  {
    id: 'shared',
    label: 'صفحات مشتركة',
    icon: Users,
    screens: [
      { id: 'sh-erp-accounting', title: 'ERP - المحاسبة', description: 'النظام المحاسبي', path: '/dashboard/erp/accounting', image: null },
      { id: 'sh-erp-inventory', title: 'ERP - المخزون', description: 'إدارة المخزون', path: '/dashboard/erp/inventory', image: null },
      { id: 'sh-erp-hr', title: 'ERP - الموارد البشرية', description: 'إدارة الموظفين', path: '/dashboard/erp/hr', image: null },
      { id: 'sh-erp-sales', title: 'ERP - المشتريات والمبيعات', description: 'إدارة المبيعات', path: '/dashboard/erp/purchasing-sales', image: null },
      { id: 'sh-erp-fin', title: 'ERP - اللوحة المالية', description: 'لوحة مالية شاملة', path: '/dashboard/erp/financial-dashboard', image: null },
      { id: 'sh-gamification', title: 'التلعيب', description: 'نظام النقاط والمكافآت', path: '/dashboard/gamification', image: null },
      { id: 'sh-omaluna', title: 'أمالونا للتوظيف', description: 'منصة التوظيف', path: '/dashboard/omaluna', image: null },
      { id: 'sh-commodity', title: 'بورصة السلع', description: 'بورصة المواد القابلة للتدوير', path: '/dashboard/commodity-exchange', image: null },
      { id: 'sh-waste-exchange', title: 'تبادل المخلفات', description: 'سوق تبادل المخلفات', path: '/dashboard/waste-exchange', image: null },
      { id: 'sh-auctions', title: 'المزادات', description: 'مزادات المخلفات', path: '/dashboard/waste-auctions', image: null },
      { id: 'sh-equipment', title: 'سوق المعدات', description: 'معدات إعادة التدوير', path: '/dashboard/equipment-marketplace', image: null },
      { id: 'sh-vehicle', title: 'سوق المركبات', description: 'مركبات النقل', path: '/dashboard/vehicle-marketplace', image: null },
      { id: 'sh-insurance', title: 'التأمين الذكي', description: 'تأمين الشحنات', path: '/dashboard/smart-insurance', image: null },
      { id: 'sh-wallet', title: 'المحفظة الرقمية', description: 'المحفظة الإلكترونية', path: '/dashboard/digital-wallet', image: null },
      { id: 'sh-circular', title: 'الاقتصاد الدائري', description: 'مؤشرات الاقتصاد الدائري', path: '/dashboard/circular-economy', image: null },
      { id: 'sh-esg', title: 'تقارير ESG', description: 'تقارير الاستدامة', path: '/dashboard/esg-reports', image: null },
      { id: 'sh-heatmap', title: 'خريطة تدفق النفايات', description: 'خريطة حرارية للتدفقات', path: '/dashboard/waste-flow-heatmap', image: null },
      { id: 'sh-learning', title: 'مركز التعلم', description: 'دورات تدريبية', path: '/dashboard/learning-center', image: null },
      { id: 'sh-smart-agent', title: 'الوكيل الذكي', description: 'روبوت المحادثة الذكي', path: '/dashboard/smart-agent', image: null },
      { id: 'sh-document-archive', title: 'أرشيف المستندات', description: 'أرشفة المستندات', path: '/dashboard/document-archive', image: null },
      { id: 'sh-chat', title: 'المحادثات', description: 'نظام المراسلة', path: '/dashboard/chat', image: null },
      { id: 'sh-support', title: 'مركز الدعم', description: 'الدعم الفني', path: '/dashboard/support', image: null },
    ],
  },
];

const SystemScreenshots = () => {
  const navigate = useNavigate();
  const [capturing, setCapturing] = useState<string | null>(null);

  const handleCapture = useCallback((screenId: string, path: string) => {
    setCapturing(screenId);
    setTimeout(() => {
      navigate(path);
      setCapturing(null);
    }, 500);
  }, [navigate]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-20"
      >
        <BackButton />

        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 justify-end">
              <Camera className="h-6 w-6 text-primary" />
              سكرين شوت النظام
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              عرض شامل لكافة واجهات وصفحات المنصة لكل جهة — {screenshotCategories.reduce((a, c) => a + c.screens.length, 0)} صفحة
            </p>
          </div>
        </div>

        <Tabs defaultValue="public" className="w-full" dir="rtl">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin" dir="rtl">
            <TabsList className="inline-flex w-max gap-1 bg-card border border-border/50 p-1 h-auto">
              {screenshotCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="whitespace-nowrap text-[10px] sm:text-xs gap-1 px-2 py-1.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30"
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                    <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5 mr-0.5">{cat.screens.length}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {screenshotCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {category.screens.map((screen) => (
                  <Card key={screen.id} className="overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="relative aspect-video bg-muted/30 overflow-hidden">
                      <iframe
                        src={screen.path}
                        title={screen.title}
                        className="w-[1920px] h-[1080px] origin-top-left pointer-events-none border-0"
                        style={{ transform: 'scale(0.15)', transformOrigin: 'top left' }}
                        loading="lazy"
                        sandbox="allow-same-origin allow-scripts"
                        tabIndex={-1}
                      />
                      <div
                        className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors cursor-pointer"
                        onClick={() => handleCapture(screen.id, screen.path)}
                      />
                    </div>

                    <CardContent className="p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-xs">{screen.title}</h3>
                          <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{screen.description}</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-[10px] gap-1.5 h-7"
                        onClick={() => handleCapture(screen.id, screen.path)}
                        disabled={capturing === screen.id}
                      >
                        {capturing === screen.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3 h-3" />
                        )}
                        فتح الصفحة
                      </Button>
                    </CardContent>
                  </Card>
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
