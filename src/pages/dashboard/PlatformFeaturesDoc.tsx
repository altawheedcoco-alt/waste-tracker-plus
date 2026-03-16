import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Package, Truck, Recycle, Building2, Users, Shield, Brain, FileText,
  BarChart3, MapPin, Bell, Printer, QrCode, Lock, Workflow, Globe,
  Smartphone, Camera, Scale, Headphones, CreditCard, Award, Route,
  Search, ChevronDown, ChevronUp, Layers, Cpu, Database, CloudCog,
  MessageSquare, Share2, Zap, Calendar, ClipboardCheck, Factory,
  GraduationCap, Briefcase, Gavel, Network, Settings, Eye,
  BookOpen, Car, Wifi, BadgeCheck, PenTool, FileCheck, ScrollText,
  HardDrive, TrendingUp, Timer, ShieldCheck, Sparkles, Hash,
  CircleDollarSign, UserCheck, Landmark, Leaf, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  name: string;
  description: string;
  status: 'live' | 'beta' | 'coming_soon';
  path?: string;
}

interface FeatureCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  features: FeatureItem[];
}

const statusConfig = {
  live: { label: 'مُفعّل', variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  beta: { label: 'تجريبي', variant: 'secondary' as const, className: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  coming_soon: { label: 'قريباً', variant: 'outline' as const, className: 'bg-muted text-muted-foreground' },
};

const featureCategories: FeatureCategory[] = [
  {
    id: 'shipments',
    title: 'إدارة الشحنات',
    icon: Package,
    color: 'text-blue-500',
    description: 'دورة حياة كاملة للشحنة من الإنشاء حتى التأكيد مع تتبع لحظي',
    features: [
      { name: 'إنشاء شحنة جديدة', description: 'نموذج متقدم لإنشاء شحنات مع اختيار نوع النفايات والكميات والأطراف', status: 'live', path: '/dashboard/create-shipment' },
      { name: 'إنشاء يدوي (مسودات)', description: 'إدخال شحنات يدوية كمسودات للمراجعة والتدقيق قبل الاعتماد', status: 'live', path: '/dashboard/manual-shipment-create' },
      { name: 'تتبع حالات الشحنة', description: 'مبدل حالات داخلي (جديدة ← معتمدة ← جاري التجميع ← في الطريق ← تم التسليم ← مكتمل)', status: 'live' },
      { name: 'خط زمني أفقي', description: 'عرض مرئي لمراحل الشحنة بتوقيتات دقيقة', status: 'live' },
      { name: 'الشحنات المتكررة', description: 'جدولة شحنات دورية بتكرار يومي/أسبوعي/شهري', status: 'live', path: '/dashboard/recurring-shipments' },
      { name: 'الشحنات المرفوضة', description: 'إدارة ومعالجة الشحنات المرفوضة مع أسباب الرفض', status: 'live', path: '/dashboard/rejected-shipments' },
      { name: 'إقرارات التسليم', description: 'توقيع رقمي للاستلام والتسليم مع إثبات غير قابل للإنكار', status: 'live', path: '/dashboard/delivery-declarations' },
      { name: 'تقرير الشحنات المجمّع', description: 'عرض شامل لجميع الشحنات مع فلاتر متقدمة وتصدير', status: 'live', path: '/dashboard/aggregate-report' },
      { name: 'الروابط السريعة للشحن', description: 'إنشاء روابط مباشرة لعمليات الشحن المتكررة', status: 'live', path: '/dashboard/quick-shipment-links' },
      { name: 'خريطة مسارات الشحن', description: 'عرض خرائطي لمسارات الشحنات النشطة', status: 'live', path: '/dashboard/shipment-routes' },
    ],
  },
  {
    id: 'printing',
    title: 'الطباعة والتصدير',
    icon: Printer,
    color: 'text-violet-500',
    description: 'نظام طباعة موحد بأمان مستندي متقدم وقوالب A4 احترافية',
    features: [
      { name: 'نموذج تتبع A4', description: 'مستند A4 متكامل يتضمن بيانات الشحنة وجميع الأطراف والتوقيعات', status: 'live' },
      { name: 'أنماط جيلوشي أمنية', description: '7 طبقات حماية: خلفيات معقدة، حشو نصي ثلاثي اللغة، علامة مائية، MICR', status: 'live', path: '/dashboard/guilloche-patterns' },
      { name: 'تصدير PDF', description: 'تصدير بجودة عالية (PNG Scale 3) مع الحفاظ على الألوان والتنسيقات', status: 'live' },
      { name: 'إرسال للجهات', description: 'إشعارات مستهدفة لجميع الأطراف (مولد، ناقل، مدور، سائق) عبر واتساب ومنصة', status: 'live' },
      { name: 'قوالب طباعة متعددة', description: 'اختيار ثيمات طباعة مختلفة (eco-green, professional, etc.)', status: 'live' },
      { name: 'معاينة A4 حية', description: 'معاينة 1:1 كاملة قبل الطباعة مع كافة الطبقات الأمنية', status: 'live' },
      { name: 'مركز الطباعة', description: 'واجهة مركزية لطباعة جميع أنواع المستندات', status: 'live', path: '/dashboard/print-center' },
    ],
  },
  {
    id: 'organizations',
    title: 'إدارة الجهات والمؤسسات',
    icon: Building2,
    color: 'text-indigo-500',
    description: 'إدارة كاملة لبيانات الجهات المولدة والناقلة والمدورة',
    features: [
      { name: 'ملف الجهة الشامل', description: 'بيانات تفصيلية: تجاري، ضريبي، بيئي، تراخيص WMRA/IDA', status: 'live', path: '/dashboard/organization-profile' },
      { name: 'اعتماد الجهات', description: 'دورة اعتماد متعددة المراحل مع مراجعة المستندات', status: 'live', path: '/dashboard/company-approvals' },
      { name: 'إدارة الشركات', description: 'عرض وبحث وفلترة جميع الشركات المسجلة', status: 'live', path: '/dashboard/company-management' },
      { name: 'الهيكل التنظيمي', description: 'شجرة تنظيمية بصرية للأقسام والموظفين', status: 'live', path: '/dashboard/org-structure' },
      { name: 'الموقّعون المعتمدون', description: 'إدارة التوقيعات الرسمية والأختام مع صلاحيات التوقيع', status: 'live', path: '/dashboard/authorized-signatories' },
      { name: 'بوابة العميل', description: 'بوابة خارجية للعملاء لمتابعة شحناتهم وحساباتهم', status: 'live', path: '/dashboard/customer-portal' },
      { name: 'البروفايل العام', description: 'صفحة عامة لملف الجهة قابلة للمشاركة', status: 'live' },
    ],
  },
  {
    id: 'drivers',
    title: 'إدارة السائقين والأسطول',
    icon: Car,
    color: 'text-amber-500',
    description: 'منظومة متكاملة لإدارة السائقين والمركبات مع تتبع GPS',
    features: [
      { name: 'سجل السائقين', description: 'بيانات شاملة: رخصة، مركبة، لوحة، حالة التفعيل', status: 'live', path: '/dashboard/drivers' },
      { name: 'اعتماد السائقين', description: 'مراجعة واعتماد طلبات تسجيل السائقين الجدد', status: 'live', path: '/dashboard/driver-approvals' },
      { name: 'تتبع GPS لحظي', description: 'مواقع السائقين على الخريطة في الوقت الفعلي', status: 'live', path: '/dashboard/driver-tracking' },
      { name: 'خريطة السائقين (أدمن)', description: 'عرض إداري لجميع مواقع السائقين', status: 'live', path: '/dashboard/admin-drivers-map' },
      { name: 'عروض السائقين', description: 'نظام عروض للشحنات المتاحة مع قبول/رفض', status: 'live', path: '/dashboard/driver-offers' },
      { name: 'تصاريح السائقين', description: 'إدارة تصاريح العمل والتراخيص', status: 'live', path: '/dashboard/driver-permits' },
      { name: 'مكافآت السائقين', description: 'نظام نقاط ومكافآت مبني على الأداء', status: 'live', path: '/dashboard/driver-rewards' },
      { name: 'أكاديمية السائقين', description: 'محتوى تدريبي تفاعلي للسائقين الجدد', status: 'live', path: '/dashboard/driver-academy' },
      { name: 'الروابط السريعة (سائق)', description: 'إنشاء روابط تسجيل مباشرة للسائقين', status: 'live', path: '/dashboard/quick-driver-links' },
    ],
  },
  {
    id: 'ai',
    title: 'الذكاء الاصطناعي',
    icon: Brain,
    color: 'text-purple-500',
    description: 'مجموعة أدوات ذكية تعمل بنماذج Gemini & GPT',
    features: [
      { name: 'استوديو المستندات الذكي', description: '22 قالباً لتوليد مستندات A4 احترافية (عروض أسعار، عقود، خطابات)', status: 'live', path: '/dashboard/ai-document-studio' },
      { name: 'مساعد العمليات', description: 'توليد خطط عمل وتحليلات تشغيلية آلية', status: 'live' },
      { name: 'محرك تحليل الصور', description: 'Vision AI للتعرف على النفايات وحساب نسب النقاء والوزن', status: 'live' },
      { name: 'محلل المستندات', description: 'استخراج بيانات وتحليل مخاطر وامتثال من المستندات', status: 'live' },
      { name: 'الوكيل الذكي (Smart Agent)', description: 'خدمة عملاء آلية عبر واتساب/فيسبوك/تلجرام', status: 'live', path: '/dashboard/smart-agent' },
      { name: 'مساعد الامتثال', description: 'استشارات بيئية مبنية على القانون المصري 202/2020', status: 'live' },
      { name: 'التنبؤات الذكية', description: 'توقعات كميات النفايات والأسعار المستقبلية', status: 'live', path: '/dashboard/ai-forecasting' },
      { name: 'تصنيف النفايات الآلي', description: 'تصنيف تلقائي لنوع النفايات وخطورتها', status: 'live' },
      { name: 'رؤى ذكية', description: 'تحليلات واقتراحات مدعومة بالذكاء الاصطناعي', status: 'live', path: '/dashboard/smart-insights' },
    ],
  },
  {
    id: 'compliance',
    title: 'الامتثال والتنظيم',
    icon: Scale,
    color: 'text-red-500',
    description: 'منظومة ضمان الامتثال للقوانين البيئية المصرية والدولية',
    features: [
      { name: 'القوانين واللوائح', description: 'مكتبة شاملة للتشريعات البيئية (202/2020، 4/1994)', status: 'live', path: '/dashboard/laws-regulations' },
      { name: 'سجل النفايات الخطرة', description: 'سجل رسمي موثق للنفايات الخطرة وفق المعايير', status: 'live', path: '/dashboard/hazardous-register' },
      { name: 'سجل النفايات غير الخطرة', description: 'توثيق شامل للنفايات غير الخطرة', status: 'live', path: '/dashboard/non-hazardous-register' },
      { name: 'المخالفات التنظيمية', description: 'تتبع وإدارة المخالفات مع خطط التصحيح', status: 'live', path: '/dashboard/regulatory-violations' },
      { name: 'التحديثات التنظيمية', description: 'آخر التعديلات والقرارات من الجهات الرقابية', status: 'live', path: '/dashboard/regulatory-updates' },
      { name: 'المستندات التنظيمية', description: 'أرشيف المستندات الرسمية والنماذج المطلوبة', status: 'live', path: '/dashboard/regulatory-documents' },
      { name: 'التصاريح والتراخيص', description: 'إدارة تصاريح النقل والتشغيل مع تنبيهات الانتهاء', status: 'live', path: '/dashboard/permits' },
      { name: 'GDPR والخصوصية', description: 'أدوات الامتثال لقوانين حماية البيانات', status: 'live', path: '/dashboard/gdpr-compliance' },
      { name: 'تقارير ESG', description: 'تقارير الحوكمة البيئية والاجتماعية', status: 'live', path: '/dashboard/esg-reports' },
    ],
  },
  {
    id: 'contracts',
    title: 'العقود والفوترة',
    icon: FileText,
    color: 'text-teal-500',
    description: 'إدارة دورة حياة العقود والفواتير الإلكترونية',
    features: [
      { name: 'إدارة العقود', description: 'إنشاء ومتابعة عقود النقل والتدوير مع شروط مخصصة', status: 'live', path: '/dashboard/contracts' },
      { name: 'قوالب العقود', description: 'مكتبة قوالب عقود جاهزة قابلة للتخصيص', status: 'live', path: '/dashboard/contract-templates' },
      { name: 'الفوترة الإلكترونية', description: 'إصدار فواتير إلكترونية متوافقة مع هيئة الضرائب', status: 'live', path: '/dashboard/einvoice' },
      { name: 'عروض الأسعار', description: 'إنشاء وإدارة عروض أسعار احترافية', status: 'live', path: '/dashboard/quotations' },
      { name: 'حسابات الشركاء', description: 'إدارة حسابات مالية مع الشركاء والجدول الزمني', status: 'live', path: '/dashboard/partner-accounts' },
      { name: 'الإيداعات', description: 'تسجيل ومتابعة الإيداعات المالية', status: 'live', path: '/dashboard/deposits' },
      { name: 'خطابات الترسية', description: 'إصدار خطابات ترسية رسمية للمناقصات', status: 'live', path: '/dashboard/award-letters' },
      { name: 'الإيصالات', description: 'إنشاء وطباعة إيصالات استلام/تسليم', status: 'live', path: '/dashboard/receipts' },
    ],
  },
  {
    id: 'analytics',
    title: 'التقارير والتحليلات',
    icon: BarChart3,
    color: 'text-cyan-500',
    description: 'لوحات تحليلية متقدمة وتقارير شاملة',
    features: [
      { name: 'التقارير الشاملة', description: 'تقارير مفصلة عن الشحنات والعمليات والأداء', status: 'live', path: '/dashboard/reports' },
      { name: 'تحليلات متقدمة', description: 'رسوم بيانية تفاعلية ومؤشرات أداء رئيسية', status: 'live', path: '/dashboard/advanced-analytics' },
      { name: 'البصمة الكربونية', description: 'حساب وتتبع الانبعاثات الكربونية وتأثير التدوير', status: 'live', path: '/dashboard/carbon-footprint' },
      { name: 'خريطة تدفق النفايات', description: 'خريطة حرارية لحركة النفايات عبر المناطق', status: 'live', path: '/dashboard/waste-flow-heatmap' },
      { name: 'تحليل النفايات التفصيلي', description: 'تفاصيل أنواع وكميات واتجاهات النفايات', status: 'live', path: '/dashboard/detailed-waste-analysis' },
      { name: 'تقارير الشحنات', description: 'تقارير مخصصة لأداء الشحنات', status: 'live', path: '/dashboard/shipment-reports' },
      { name: 'لوحة التأثير المتبادل', description: 'تحليل العلاقات بين الوحدات المختلفة', status: 'live', path: '/dashboard/cross-impact' },
      { name: 'تحليل الزوار', description: 'إحصائيات زوار المنصة والصفحات', status: 'live', path: '/dashboard/visitor-analytics' },
      { name: 'لوحة التنفيذي', description: 'ملخص تنفيذي شامل للإدارة العليا', status: 'live', path: '/dashboard/executive-dashboard' },
    ],
  },
  {
    id: 'security',
    title: 'الأمان والتوثيق',
    icon: Shield,
    color: 'text-rose-500',
    description: 'طبقات أمان متعددة وتوثيق رقمي متقدم',
    features: [
      { name: 'أمان المستندات (7 طبقات)', description: 'جيلوشي، حشو ثلاثي اللغة، MICR، علامة مائية، SHA-256، QR مشفر', status: 'live' },
      { name: 'التوقيع الرقمي', description: 'توقيعات إلكترونية ملزمة قانونياً مع QR للتحقق', status: 'live' },
      { name: 'التحقق من المستندات', description: 'بوابة عامة للتحقق من صحة أي مستند عبر الكود', status: 'live', path: '/dashboard/document-verification' },
      { name: 'صندوق التوقيع', description: 'إدارة طلبات التوقيع الواردة والصادرة', status: 'live', path: '/dashboard/signing-inbox' },
      { name: 'قوالب التوقيع المتعدد', description: 'سير عمل لتوقيع مستند من عدة أطراف', status: 'live', path: '/dashboard/multi-sign-templates' },
      { name: 'المصادقة البيومترية', description: 'دعم البصمة والوجه للتوثيق', status: 'beta' },
      { name: 'اختبار الاختراق', description: 'أدوات فحص أمني للمنصة', status: 'live', path: '/dashboard/security-testing' },
      { name: 'مركز الأمن السيبراني', description: 'لوحة شاملة لمراقبة الحالة الأمنية', status: 'live', path: '/dashboard/cyber-security' },
    ],
  },
  {
    id: 'communication',
    title: 'التواصل والإشعارات',
    icon: MessageSquare,
    color: 'text-green-500',
    description: 'قنوات تواصل متعددة مع إشعارات ذكية',
    features: [
      { name: 'واتساب WA Pilot', description: 'إرسال إشعارات وتقارير ومستندات عبر واتساب', status: 'live', path: '/dashboard/wa-pilot' },
      { name: 'الإشعارات الداخلية', description: 'نظام تنبيهات لحظي داخل المنصة', status: 'live', path: '/dashboard/notifications' },
      { name: 'المحادثات', description: 'نظام محادثات داخلي بين الأطراف', status: 'live', path: '/dashboard/chat' },
      { name: 'الاجتماعات', description: 'جدولة وإدارة اجتماعات العمل', status: 'live', path: '/dashboard/meetings' },
      { name: 'المشاركة الذكية', description: 'روابط مشاركة ذكية مع مستويات وصول متدرجة', status: 'live', path: '/dashboard/scoped-access-links' },
      { name: 'القصص', description: 'نشر أخبار وتحديثات داخلية في شكل قصص', status: 'live', path: '/dashboard/stories' },
      { name: 'مركز الدعم', description: 'نظام تذاكر دعم فني متكامل', status: 'live', path: '/dashboard/support' },
    ],
  },
  {
    id: 'marketplace',
    title: 'الأسواق والتبادل',
    icon: Globe,
    color: 'text-orange-500',
    description: 'أسواق إلكترونية لتبادل النفايات والمعدات',
    features: [
      { name: 'سوق B2B للنفايات', description: 'منصة تبادل النفايات بين الشركات', status: 'live', path: '/dashboard/b2b-marketplace' },
      { name: 'بورصة النفايات', description: 'تداول النفايات بآلية العرض والطلب', status: 'live', path: '/dashboard/waste-exchange' },
      { name: 'مزادات النفايات', description: 'مزادات إلكترونية لكميات النفايات الكبيرة', status: 'live', path: '/dashboard/waste-auctions' },
      { name: 'سوق المعدات', description: 'بيع وشراء معدات التدوير والنقل', status: 'live', path: '/dashboard/equipment-marketplace' },
      { name: 'سوق المركبات', description: 'مركبات النقل المتاحة للبيع/الإيجار', status: 'live', path: '/dashboard/vehicle-marketplace' },
      { name: 'العقود الآجلة', description: 'تداول عقود مستقبلية للنفايات القابلة للتدوير', status: 'live', path: '/dashboard/futures-market' },
      { name: 'C2B (مواطن لشركة)', description: 'منصة جمع النفايات من المواطنين', status: 'live', path: '/dashboard/c2b' },
      { name: 'استخبارات سوق الأخشاب', description: 'بيانات وتحليلات سوق الأخشاب المُعاد تدويرها', status: 'live', path: '/dashboard/wood-market-intelligence' },
    ],
  },
  {
    id: 'maps',
    title: 'الخرائط والتتبع',
    icon: MapPin,
    color: 'text-emerald-600',
    description: 'خدمات جغرافية متقدمة وتتبع لحظي',
    features: [
      { name: 'مركز التتبع', description: 'لوحة مركزية لتتبع جميع الشحنات والسائقين', status: 'live', path: '/dashboard/tracking-center' },
      { name: 'مستكشف الخريطة', description: 'خريطة تفاعلية شاملة للجهات والمواقع', status: 'live', path: '/dashboard/map-explorer' },
      { name: 'خريطة Waze حية', description: 'تكامل مع Waze لمعلومات المرور اللحظية', status: 'live', path: '/dashboard/waze-live-map' },
      { name: 'إعدادات GPS', description: 'ضبط دقة وتكرار بيانات الموقع', status: 'live', path: '/dashboard/gps-settings' },
      { name: 'المواقع المحفوظة', description: 'حفظ وإدارة العناوين المتكررة', status: 'live', path: '/dashboard/my-location' },
      { name: 'التتبع العام', description: 'رابط تتبع عام للعملاء بدون تسجيل دخول', status: 'live' },
    ],
  },
  {
    id: 'documents',
    title: 'المستندات والأرشيف',
    icon: ScrollText,
    color: 'text-slate-500',
    description: 'إدارة مركزية للمستندات مع أرشفة ذكية',
    features: [
      { name: 'مركز المستندات', description: 'واجهة مركزية لجميع المستندات والنماذج', status: 'live', path: '/dashboard/document-center' },
      { name: 'أرشيف المستندات', description: 'أرشفة تلقائية مع بحث متقدم', status: 'live', path: '/dashboard/document-archive' },
      { name: 'الأرشيف الذكي', description: 'تصنيف آلي باستخدام الذكاء الاصطناعي', status: 'live', path: '/dashboard/smart-document-archive' },
      { name: 'السجل المركزي', description: 'سجل موحد لجميع المستندات الرسمية', status: 'live', path: '/dashboard/central-document-registry' },
      { name: 'مستندات الجهة', description: 'إدارة مستندات خاصة بكل جهة', status: 'live', path: '/dashboard/organization-documents' },
      { name: 'سجل النشاط', description: 'تتبع جميع العمليات والتغييرات', status: 'live', path: '/dashboard/activity-log' },
      { name: 'تصدير البيانات', description: 'تصدير شامل بصيغ متعددة (Excel, CSV, PDF)', status: 'live', path: '/dashboard/data-export' },
    ],
  },
  {
    id: 'regulators',
    title: 'الجهات الرقابية',
    icon: Landmark,
    color: 'text-red-600',
    description: 'لوحات مخصصة لكل جهة رقابية سيادية',
    features: [
      { name: 'لوحة المنظم العامة', description: 'واجهة شاملة للجهات الرقابية', status: 'live', path: '/dashboard/regulator' },
      { name: 'جهاز EEAA', description: 'لوحة جهاز شؤون البيئة', status: 'live', path: '/dashboard/regulator-eeaa' },
      { name: 'جهاز WMRA', description: 'لوحة جهاز تنظيم إدارة المخلفات', status: 'live', path: '/dashboard/regulator-wmra' },
      { name: 'هيئة IDA', description: 'لوحة هيئة التنمية الصناعية', status: 'live', path: '/dashboard/regulator-ida' },
      { name: 'هيئة LTRA', description: 'لوحة هيئة النقل البري', status: 'live', path: '/dashboard/regulator-ltra' },
      { name: 'الشركات المنظمة', description: 'قائمة الشركات الخاضعة للرقابة', status: 'live', path: '/dashboard/regulated-companies' },
      { name: 'الاستشاريون البيئيون', description: 'سجل المكاتب الاستشارية المعتمدة', status: 'live', path: '/dashboard/environmental-consultants' },
    ],
  },
  {
    id: 'hr',
    title: 'الموارد البشرية والتوظيف',
    icon: Users,
    color: 'text-pink-500',
    description: 'إدارة الموظفين والتوظيف ومنصة أومالونا',
    features: [
      { name: 'إدارة الموظفين', description: 'سجلات شاملة للموظفين والحضور', status: 'live', path: '/dashboard/employees' },
      { name: 'لوحة مهام الموظفين', description: 'توزيع وتتبع المهام اليومية', status: 'live', path: '/dashboard/employee-tasks' },
      { name: 'بيانات الاعتماد', description: 'إدارة شهادات وصلاحيات الفريق', status: 'live', path: '/dashboard/team-credentials' },
      { name: 'أومالونا (Omaluna)', description: 'منصة توظيف متخصصة في قطاع إدارة النفايات', status: 'live', path: '/dashboard/omaluna' },
      { name: 'بناء السيرة الذاتية', description: 'أداة ذكية لإنشاء CV احترافي', status: 'live', path: '/dashboard/cv-builder' },
      { name: 'توصيات الوظائف الذكية', description: 'مطابقة ذكية بين المرشحين والوظائف', status: 'live', path: '/dashboard/smart-job-recommendations' },
    ],
  },
  {
    id: 'sustainability',
    title: 'الاستدامة والاقتصاد الدائري',
    icon: Leaf,
    color: 'text-emerald-500',
    description: 'أدوات قياس الأثر البيئي والاقتصاد الدائري',
    features: [
      { name: 'الاستدامة البيئية', description: 'مؤشرات ولوحات الأداء البيئي', status: 'live', path: '/dashboard/environmental-sustainability' },
      { name: 'الاقتصاد الدائري', description: 'تتبع دورة حياة المواد وإعادة استخدامها', status: 'live', path: '/dashboard/circular-economy' },
      { name: 'شهادات التدوير', description: 'إصدار شهادات إعادة تدوير معتمدة', status: 'live', path: '/dashboard/recycling-certificates' },
      { name: 'شهادات الفخر', description: 'شهادات تقدير للشركات المتميزة بيئياً', status: 'live', path: '/dashboard/pride-certificates' },
      { name: 'تصنيف النفايات', description: 'تصنيف شامل لأنواع النفايات ومعالجتها', status: 'live', path: '/dashboard/waste-classification' },
      { name: 'إدارة الطاقة الإنتاجية', description: 'مراقبة وتحسين طاقة التدوير', status: 'live', path: '/dashboard/capacity-management' },
    ],
  },
  {
    id: 'iot',
    title: 'إنترنت الأشياء والكاميرات',
    icon: Wifi,
    color: 'text-sky-500',
    description: 'تكامل مع الأجهزة الذكية وكاميرات المراقبة',
    features: [
      { name: 'إعدادات IoT', description: 'ربط وإدارة أجهزة استشعار الوزن والحرارة', status: 'live', path: '/dashboard/iot-settings' },
      { name: 'الكاميرات', description: 'ربط كاميرات المراقبة بعمليات الوزن والتحميل', status: 'live', path: '/dashboard/cameras' },
      { name: 'كشف الاحتيال IoT', description: 'تنبيهات تلقائية عند اكتشاف تلاعب في الأوزان', status: 'live' },
      { name: 'الصيانة الوقائية', description: 'جدولة صيانة المعدات بناءً على بيانات IoT', status: 'live', path: '/dashboard/preventive-maintenance' },
    ],
  },
  {
    id: 'platform',
    title: 'إدارة المنصة',
    icon: Settings,
    color: 'text-gray-500',
    description: 'أدوات إدارية وتخصيص المنصة',
    features: [
      { name: 'الإعلانات', description: 'نظام إعلانات داخلية مع خطط وإحصائيات', status: 'live', path: '/dashboard/advertiser' },
      { name: 'إدارة المدونة', description: 'نشر وإدارة المقالات والأخبار', status: 'live', path: '/dashboard/blog-manager' },
      { name: 'إدارة الأخبار', description: 'شريط أخبار متحرك وإدارة الأخبار', status: 'live', path: '/dashboard/news-manager' },
      { name: 'بطاقة الهوية الرقمية', description: 'بطاقة رقمية لكل مستخدم/جهة', status: 'live', path: '/dashboard/digital-identity-card' },
      { name: 'المحفظة الرقمية', description: 'محفظة إلكترونية للمدفوعات', status: 'live', path: '/dashboard/digital-wallet' },
      { name: 'التلعيب (Gamification)', description: 'نقاط وشارات ولوحة صدارة للتحفيز', status: 'live', path: '/dashboard/gamification' },
      { name: 'الاشتراكات', description: 'إدارة خطط الاشتراك والمدفوعات', status: 'live', path: '/dashboard/subscription-management' },
      { name: 'قوالب القرطاسية', description: 'هوية بصرية موحدة للمستندات الرسمية', status: 'live', path: '/dashboard/stationery-templates' },
      { name: 'إدارة API', description: 'مفاتيح ونقاط وصول API للتكامل الخارجي', status: 'live', path: '/dashboard/api' },
      { name: 'النسخ الاحتياطي', description: 'أدوات نسخ احتياطي واستعادة البيانات', status: 'live' },
      { name: 'الوضع بلا اتصال', description: 'عمل المنصة بدون إنترنت مع مزامنة لاحقة', status: 'beta', path: '/dashboard/offline-mode' },
    ],
  },
];

// Count totals
const totalFeatures = featureCategories.reduce((sum, cat) => sum + cat.features.length, 0);
const liveFeatures = featureCategories.reduce((sum, cat) => sum + cat.features.filter(f => f.status === 'live').length, 0);

const PlatformFeaturesDoc = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('all');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    featureCategories.forEach(c => { all[c.id] = true; });
    setExpandedCategories(all);
  };

  const collapseAll = () => setExpandedCategories({});

  const filteredCategories = featureCategories
    .map(cat => ({
      ...cat,
      features: cat.features.filter(f =>
        !searchQuery || f.name.includes(searchQuery) || f.description.includes(searchQuery)
      ),
    }))
    .filter(cat => {
      if (activeTab === 'all') return cat.features.length > 0;
      return cat.features.some(f => f.status === activeTab) && cat.features.length > 0;
    })
    .map(cat => ({
      ...cat,
      features: activeTab === 'all' ? cat.features : cat.features.filter(f => f.status === activeTab),
    }));

  const filteredTotal = filteredCategories.reduce((sum, cat) => sum + cat.features.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary" />
                توثيق ميزات المنصة
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                دليل شامل ومنظم لجميع الميزات والوظائف المتاحة في منصة iRecycle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1">
              <Hash className="w-3 h-3" />
              {totalFeatures} ميزة
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 gap-1">
              <Sparkles className="w-3 h-3" />
              {liveFeatures} مفعّلة
            </Badge>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الميزات', value: totalFeatures, icon: Layers, color: 'text-primary' },
            { label: 'الأقسام', value: featureCategories.length, icon: LayoutDashboard, color: 'text-blue-500' },
            { label: 'مفعّلة', value: liveFeatures, icon: Zap, color: 'text-emerald-500' },
            { label: 'تجريبية', value: totalFeatures - liveFeatures, icon: Timer, color: 'text-amber-500' },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <stat.icon className={cn('w-8 h-8', stat.color)} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن ميزة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-xs text-primary hover:underline">عرض الكل</button>
            <span className="text-muted-foreground">|</span>
            <button onClick={collapseAll} className="text-xs text-primary hover:underline">طي الكل</button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">الكل ({totalFeatures})</TabsTrigger>
            <TabsTrigger value="live">مفعّل ({liveFeatures})</TabsTrigger>
            <TabsTrigger value="beta">تجريبي</TabsTrigger>
            <TabsTrigger value="coming_soon">قريباً</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-3">
                عدد النتائج: <strong>{filteredTotal}</strong> ميزة في <strong>{filteredCategories.length}</strong> قسم
              </p>
            )}

            <div className="space-y-4">
              {filteredCategories.map((category, catIdx) => {
                const isExpanded = expandedCategories[category.id] ?? (searchQuery.length > 0);
                const Icon = category.icon;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.03 }}
                  >
                    <Card className="border-border/60 overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full text-right"
                      >
                        <CardHeader className="pb-2 hover:bg-muted/30 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50')}>
                                <Icon className={cn('w-5 h-5', category.color)} />
                              </div>
                              <div className="text-right">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                  {category.title}
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {category.features.length}
                                  </Badge>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                      </button>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-3">
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/40 border-b">
                                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground w-8">#</th>
                                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الميزة</th>
                                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground hidden md:table-cell">الوصف</th>
                                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground w-20">الحالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.features.map((feature, idx) => {
                                  const st = statusConfig[feature.status];
                                  return (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                      <td className="py-2 px-3 text-muted-foreground text-xs">{idx + 1}</td>
                                      <td className="py-2 px-3">
                                        <span className="font-medium text-foreground">{feature.name}</span>
                                        <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{feature.description}</p>
                                      </td>
                                      <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell">
                                        {feature.description}
                                      </td>
                                      <td className="py-2 px-3">
                                        <Badge variant={st.variant} className={cn('text-[10px] px-1.5 py-0', st.className)}>
                                          {st.label}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <p>
              آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' • '}
              منصة iRecycle لإدارة المخلفات الصناعية — الإصدار 3.0
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PlatformFeaturesDoc;
