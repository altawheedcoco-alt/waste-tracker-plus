import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lightbulb,
  Target,
  TrendingUp,
  Bug,
  Sparkles,
  Rocket,
  Shield,
  Database,
  Truck,
  Users,
  Package,
  FileText,
  MapPin,
  Bell,
  MessageCircle,
  BarChart3,
  Settings,
  Building2,
  Recycle,
  Navigation,
  Bot,
  Leaf,
  Scale,
  Banknote,
  FolderCheck,
  ClipboardList,
  Video,
  Search,
  Info,
  BookOpen,
  Layers,
  AlertCircle,
  Zap,
  Globe,
  Lock,
  Smartphone,
  MonitorSmartphone,
  RefreshCw,
  Award,
  Star,
  ThumbsUp,
} from 'lucide-react';

// Feature status types
type FeatureStatus = 'completed' | 'in_progress' | 'planned' | 'has_issues';

interface Feature {
  name: string;
  description: string;
  status: FeatureStatus;
  progress: number;
  issues?: string[];
  suggestions?: string[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface SystemModule {
  name: string;
  icon: React.ElementType;
  description: string;
  features: Feature[];
  overallProgress: number;
  strengths: string[];
  weaknesses: string[];
  futureVision: string;
}

// System modules data
const systemModules: SystemModule[] = [
  {
    name: 'إدارة الشحنات',
    icon: Package,
    description: 'نظام متكامل لإدارة شحنات النفايات من الإنشاء حتى التسليم',
    overallProgress: 92,
    strengths: [
      'واجهة سهلة الاستخدام لإنشاء الشحنات',
      'تتبع حالة الشحنات في الوقت الفعلي',
      'ربط الشحنات بين الجهات الثلاث (مولد، ناقل، مدور)',
      'طباعة تقارير الشحنات بتنسيقات متعددة',
      'دعم أنواع متعددة من المخلفات',
    ],
    weaknesses: [
      'عدم وجود نظام تنبيهات تلقائية عند تأخر الشحنات',
      'الحاجة لتحسين واجهة الفلترة المتقدمة',
    ],
    futureVision: 'تحويل النظام إلى منصة ذكية تستخدم AI للتنبؤ بأوقات التسليم وتحسين مسارات النقل تلقائياً',
    features: [
      { name: 'إنشاء شحنات جديدة', description: 'نموذج شامل لإنشاء الشحنات مع جميع التفاصيل', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'تتبع حالة الشحنات', description: 'Timeline تفاعلي لتتبع مراحل الشحنة', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'طباعة الشحنات', description: 'طباعة تقارير مفصلة بتنسيق PDF', status: 'completed', progress: 100, priority: 'medium', category: 'reporting' },
      { name: 'التنبيهات التلقائية', description: 'إشعارات عند تغيير حالة الشحنة', status: 'in_progress', progress: 70, priority: 'high', category: 'notifications', issues: ['تأخر الإشعارات أحياناً'], suggestions: ['استخدام WebSocket للإشعارات الفورية'] },
      { name: 'الفلترة المتقدمة', description: 'فلترة الشحنات حسب معايير متعددة', status: 'in_progress', progress: 80, priority: 'medium', category: 'ux', suggestions: ['إضافة حفظ الفلاتر المفضلة'] },
      { name: 'التغيير الجماعي للحالة', description: 'تغيير حالة عدة شحنات دفعة واحدة', status: 'completed', progress: 100, priority: 'medium', category: 'efficiency' },
    ],
  },
  {
    name: 'تتبع السائقين والمركبات',
    icon: Truck,
    description: 'نظام GPS متقدم لتتبع السائقين والمركبات على الخريطة',
    overallProgress: 88,
    strengths: [
      'تتبع مباشر لمواقع السائقين على الخريطة',
      'عرض سجل المسارات التاريخية',
      'دعم Mapbox للخرائط عالية الجودة',
      'تحديد المواقع الجغرافية بدقة',
    ],
    weaknesses: [
      'استهلاك عالي للبطارية في التطبيق',
      'الحاجة لتحسين دقة GPS في المناطق المغلقة',
    ],
    futureVision: 'إضافة نظام ملاحة متكامل مع تحسين المسارات وتجنب الازدحام',
    features: [
      { name: 'خريطة السائقين', description: 'عرض مواقع جميع السائقين النشطين', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'سجل المواقع', description: 'تتبع تاريخ حركة السائق', status: 'completed', progress: 100, priority: 'medium', category: 'history' },
      { name: 'الملاحة التفاعلية', description: 'نظام ملاحة متكامل للسائقين', status: 'completed', progress: 95, priority: 'high', category: 'navigation' },
      { name: 'تقدير وقت الوصول', description: 'حساب الوقت المتوقع للوصول', status: 'in_progress', progress: 75, priority: 'medium', category: 'estimation', suggestions: ['استخدام بيانات الازدحام الفعلية'] },
      { name: 'تنبيهات الخروج عن المسار', description: 'تنبيه عند انحراف السائق', status: 'planned', progress: 20, priority: 'low', category: 'alerts' },
    ],
  },
  {
    name: 'إدارة المستخدمين والجهات',
    icon: Users,
    description: 'نظام شامل لإدارة الجهات والموظفين والصلاحيات',
    overallProgress: 90,
    strengths: [
      'تسجيل الجهات بأنواعها الثلاث (مولد، ناقل، مدور)',
      'نظام صلاحيات متعدد المستويات',
      'إدارة الموظفين لكل جهة',
      'ملف تعريفي شامل للجهات',
    ],
    weaknesses: [
      'الحاجة لتبسيط عملية التسجيل',
      'عدم وجود نظام دعوات للموظفين الجدد',
    ],
    futureVision: 'تحويل ملفات الجهات إلى بورتفوليو تفاعلي مع تقييمات وشهادات',
    features: [
      { name: 'تسجيل الجهات', description: 'نموذج تسجيل شامل للجهات الجديدة', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'إدارة الموظفين', description: 'إضافة وإدارة موظفي الجهة', status: 'completed', progress: 100, priority: 'high', category: 'management' },
      { name: 'نظام الصلاحيات', description: 'تحديد صلاحيات كل موظف', status: 'completed', progress: 100, priority: 'high', category: 'security' },
      { name: 'ملف الجهة التعريفي', description: 'عرض معلومات الجهة الشاملة', status: 'completed', progress: 95, priority: 'medium', category: 'profile' },
      { name: 'نظام الدعوات', description: 'دعوة موظفين جدد عبر البريد', status: 'planned', progress: 10, priority: 'low', category: 'onboarding', suggestions: ['إضافة روابط دعوة مؤقتة'] },
    ],
  },
  {
    name: 'الشركاء والعقود',
    icon: Building2,
    description: 'إدارة العلاقات مع الشركاء والعقود القانونية',
    overallProgress: 85,
    strengths: [
      'ربط الجهات كشركاء',
      'إنشاء عقود قانونية تلقائياً',
      'قوالب عقود متعددة',
      'التحقق من العقود عبر QR Code',
    ],
    weaknesses: [
      'الحاجة لمزيد من قوالب العقود',
      'عدم وجود تنبيهات انتهاء العقود',
    ],
    futureVision: 'نظام ذكي لإدارة العقود مع تجديد تلقائي وتحليل بنود العقود',
    features: [
      { name: 'إضافة شركاء', description: 'ربط الجهات كشركاء تجاريين', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'إنشاء العقود', description: 'إنشاء عقود قانونية من القوالب', status: 'completed', progress: 100, priority: 'high', category: 'legal' },
      { name: 'قوالب العقود', description: 'مكتبة قوالب عقود جاهزة', status: 'completed', progress: 90, priority: 'medium', category: 'templates' },
      { name: 'التحقق من العقود', description: 'نظام QR للتحقق من صحة العقد', status: 'completed', progress: 100, priority: 'medium', category: 'verification' },
      { name: 'تنبيهات انتهاء العقود', description: 'إشعارات قبل انتهاء صلاحية العقد', status: 'in_progress', progress: 40, priority: 'medium', category: 'alerts', issues: ['لم يتم تفعيل الـ Cron Jobs بعد'], suggestions: ['استخدام Supabase Edge Functions للجدولة'] },
    ],
  },
  {
    name: 'التقارير والإحصائيات',
    icon: BarChart3,
    description: 'تقارير شاملة وإحصائيات تفاعلية للأداء',
    overallProgress: 87,
    strengths: [
      'تقارير مفصلة للشحنات',
      'رسوم بيانية تفاعلية',
      'تصدير PDF احترافي',
      'تقارير مجمعة للفترات الزمنية',
    ],
    weaknesses: [
      'الحاجة لمزيد من أنواع التقارير',
      'تحسين سرعة تحميل التقارير الكبيرة',
    ],
    futureVision: 'لوحة تحكم ذكية مع تحليلات AI وتوقعات مستقبلية',
    features: [
      { name: 'تقارير الشحنات', description: 'تقارير تفصيلية لكل شحنة', status: 'completed', progress: 100, priority: 'high', category: 'core' },
      { name: 'التقرير المجمع', description: 'تقرير شامل لفترة زمنية', status: 'completed', progress: 100, priority: 'high', category: 'aggregate' },
      { name: 'الرسوم البيانية', description: 'charts تفاعلية للإحصائيات', status: 'completed', progress: 95, priority: 'medium', category: 'visualization' },
      { name: 'تصدير Excel', description: 'تصدير البيانات لـ Excel', status: 'in_progress', progress: 60, priority: 'medium', category: 'export', suggestions: ['استخدام مكتبة xlsx'] },
      { name: 'تحليلات AI', description: 'تحليل ذكي للبيانات والتوقعات', status: 'in_progress', progress: 50, priority: 'high', category: 'ai', suggestions: ['ربط مع Gemini/GPT للتحليل'] },
    ],
  },
  {
    name: 'أدوات الذكاء الاصطناعي',
    icon: Bot,
    description: 'أدوات AI متقدمة لتحسين الكفاءة والدقة',
    overallProgress: 75,
    strengths: [
      'استخراج بيانات من الصور',
      'تصنيف المخلفات تلقائياً',
      'مساعد ذكي للإجابة عن الأسئلة',
      'تحليل البيانات والإحصائيات',
    ],
    weaknesses: [
      'دقة الاستخراج تحتاج تحسين',
      'بطء في بعض العمليات',
    ],
    futureVision: 'منصة AI متكاملة تتعلم من البيانات وتقدم توصيات استباقية',
    features: [
      { name: 'استخراج بيانات الوزن', description: 'استخراج البيانات من صور الإيصالات', status: 'completed', progress: 85, priority: 'high', category: 'extraction', suggestions: ['تحسين دقة OCR للغة العربية'] },
      { name: 'تصنيف المخلفات', description: 'تصنيف تلقائي لنوع المخلف', status: 'completed', progress: 80, priority: 'medium', category: 'classification' },
      { name: 'المساعد الذكي', description: 'chatbot للإجابة عن الاستفسارات', status: 'completed', progress: 90, priority: 'high', category: 'assistant' },
      { name: 'تحليلات متقدمة', description: 'تحليل الأنماط والتوقعات', status: 'in_progress', progress: 55, priority: 'medium', category: 'analytics' },
      { name: 'إنشاء الفيديوهات', description: 'إنشاء فيديوهات ترويجية بـ AI', status: 'completed', progress: 80, priority: 'low', category: 'content' },
    ],
  },
  {
    name: 'الإشعارات والمحادثات',
    icon: Bell,
    description: 'نظام إشعارات فوري ومحادثات بين الجهات',
    overallProgress: 82,
    strengths: [
      'إشعارات فورية عند الأحداث المهمة',
      'أصوات تنبيه قابلة للتخصيص',
      'محادثات بين الجهات',
      'سجل كامل للإشعارات',
    ],
    weaknesses: [
      'الحاجة لتحسين أداء الـ Realtime',
      'عدم دعم إشعارات Push للموبايل',
    ],
    futureVision: 'نظام تواصل متكامل مع دعم الوسائط المتعددة والاجتماعات',
    features: [
      { name: 'الإشعارات الفورية', description: 'تنبيهات لحظية عند الأحداث', status: 'completed', progress: 90, priority: 'high', category: 'realtime' },
      { name: 'أصوات التنبيه', description: 'أصوات مخصصة للإشعارات', status: 'completed', progress: 100, priority: 'low', category: 'customization' },
      { name: 'المحادثات', description: 'نظام محادثات بين الجهات', status: 'completed', progress: 85, priority: 'medium', category: 'chat' },
      { name: 'Push Notifications', description: 'إشعارات للهواتف المحمولة', status: 'planned', progress: 15, priority: 'high', category: 'mobile', issues: ['يتطلب Service Worker'], suggestions: ['استخدام Firebase Cloud Messaging'] },
    ],
  },
  {
    name: 'الأمان والتحقق',
    icon: Shield,
    description: 'نظام أمان متعدد الطبقات للحماية والتحقق',
    overallProgress: 88,
    strengths: [
      'مصادقة آمنة عبر Supabase Auth',
      'نظام RLS لحماية البيانات',
      'التحقق من الوثائق',
      'سجل النشاطات للتتبع',
    ],
    weaknesses: [
      'الحاجة لإضافة 2FA',
      'تحسين سياسات الجلسات',
    ],
    futureVision: 'نظام أمان متقدم مع التحقق البيومتري وتشفير شامل',
    features: [
      { name: 'المصادقة الآمنة', description: 'تسجيل دخول آمن ومشفر', status: 'completed', progress: 100, priority: 'high', category: 'auth' },
      { name: 'حماية البيانات RLS', description: 'سياسات أمان على مستوى الصفوف', status: 'completed', progress: 100, priority: 'high', category: 'security' },
      { name: 'التحقق من الوثائق', description: 'نظام AI للتحقق من صحة الوثائق', status: 'completed', progress: 85, priority: 'medium', category: 'verification' },
      { name: 'المصادقة الثنائية 2FA', description: 'طبقة حماية إضافية', status: 'planned', progress: 5, priority: 'high', category: 'auth', suggestions: ['استخدام TOTP أو SMS'] },
      { name: 'سجل النشاطات', description: 'تتبع جميع العمليات', status: 'completed', progress: 80, priority: 'medium', category: 'audit' },
    ],
  },
  {
    name: 'الاستدامة والبيئة',
    icon: Leaf,
    description: 'أدوات لقياس وتحسين الأثر البيئي',
    overallProgress: 78,
    strengths: [
      'حساب البصمة الكربونية',
      'شهادات إعادة التدوير',
      'تقارير الاستدامة',
      'إحصائيات بيئية شاملة',
    ],
    weaknesses: [
      'الحاجة لربط مع منظمات بيئية دولية',
      'تحسين دقة حسابات الكربون',
    ],
    futureVision: 'منصة استدامة شاملة مع شهادات دولية وتتبع أهداف SDGs',
    features: [
      { name: 'البصمة الكربونية', description: 'حساب انبعاثات CO2', status: 'completed', progress: 85, priority: 'medium', category: 'carbon' },
      { name: 'شهادات التدوير', description: 'إصدار شهادات معتمدة', status: 'completed', progress: 100, priority: 'high', category: 'certificates' },
      { name: 'تقارير الاستدامة', description: 'تقارير ESG شاملة', status: 'in_progress', progress: 60, priority: 'medium', category: 'reporting' },
      { name: 'أهداف SDGs', description: 'ربط مع أهداف التنمية المستدامة', status: 'planned', progress: 25, priority: 'low', category: 'global' },
    ],
  },
  {
    name: 'تجربة المستخدم UI/UX',
    icon: MonitorSmartphone,
    description: 'واجهة مستخدم حديثة ومتجاوبة',
    overallProgress: 90,
    strengths: [
      'تصميم عصري ومتجاوب',
      'دعم الوضع الداكن والفاتح',
      'رسوم متحركة سلسة',
      'واجهة عربية كاملة RTL',
    ],
    weaknesses: [
      'بعض الصفحات تحتاج تبسيط',
      'تحسين أداء التحميل الأولي',
    ],
    futureVision: 'تجربة مستخدم ممتازة مع personalization وإمكانية وصول كاملة',
    features: [
      { name: 'التصميم المتجاوب', description: 'يعمل على جميع الأجهزة', status: 'completed', progress: 95, priority: 'high', category: 'responsive' },
      { name: 'الوضع الداكن', description: 'دعم الثيمات المتعددة', status: 'completed', progress: 100, priority: 'medium', category: 'theming' },
      { name: 'الأنيميشن', description: 'حركات سلسة مع Framer Motion', status: 'completed', progress: 100, priority: 'low', category: 'animation' },
      { name: 'تخصيص الواجهة', description: 'إمكانية تخصيص الألوان والتخطيط', status: 'completed', progress: 85, priority: 'low', category: 'customization' },
      { name: 'إمكانية الوصول A11y', description: 'دعم ذوي الاحتياجات الخاصة', status: 'in_progress', progress: 50, priority: 'medium', category: 'accessibility', suggestions: ['إضافة قارئ شاشة ولوحة مفاتيح'] },
    ],
  },
];

// Calculate overall system progress
const calculateOverallProgress = () => {
  const total = systemModules.reduce((acc, module) => acc + module.overallProgress, 0);
  return Math.round(total / systemModules.length);
};

// Get status icon and color
const getStatusInfo = (status: FeatureStatus) => {
  switch (status) {
    case 'completed':
      return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'مكتمل' };
    case 'in_progress':
      return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'قيد التطوير' };
    case 'planned':
      return { icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'مخطط' };
    case 'has_issues':
      return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'يحتاج معالجة' };
  }
};

// Get priority badge variant
const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

const SystemStatus = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const overallProgress = calculateOverallProgress();

  const completedFeatures = systemModules.flatMap(m => m.features.filter(f => f.status === 'completed'));
  const inProgressFeatures = systemModules.flatMap(m => m.features.filter(f => f.status === 'in_progress'));
  const plannedFeatures = systemModules.flatMap(m => m.features.filter(f => f.status === 'planned'));
  const issueFeatures = systemModules.flatMap(m => m.features.filter(f => f.issues && f.issues.length > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">حالة النظام</h1>
            <p className="text-muted-foreground">تقرير شامل عن حالة المنصة والتطويرات</p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="text-lg font-semibold">نسبة اكتمال النظام</span>
              </div>
              <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
            <div className="flex justify-between mt-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{completedFeatures.length} ميزة مكتملة</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>{inProgressFeatures.length} قيد التطوير</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>{plannedFeatures.length} مخطط لها</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{issueFeatures.length} تحتاج معالجة</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">المميزات</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            <span className="hidden sm:inline">العيوب</span>
          </TabsTrigger>
          <TabsTrigger value="future" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">التطوير</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">اقتراحات</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemModules.map((module) => {
              const ModuleIcon = module.icon;
              return (
                <Card key={module.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ModuleIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">التقدم</span>
                      <span className="font-semibold text-primary">{module.overallProgress}%</span>
                    </div>
                    <Progress value={module.overallProgress} className="h-2" />
                    <div className="flex gap-2 mt-3 text-xs">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        {module.features.filter(f => f.status === 'completed').length} مكتمل
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                        {module.features.filter(f => f.status === 'in_progress').length} قيد العمل
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                مميزات النظام الحالية
              </CardTitle>
              <CardDescription>قائمة بجميع المميزات المكتملة والفعالة</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <Accordion type="multiple" className="w-full">
                  {systemModules.map((module, idx) => (
                    <AccordionItem key={idx} value={`module-${idx}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <module.icon className="w-5 h-5 text-primary" />
                          <span>{module.name}</span>
                          <Badge variant="secondary" className="mr-2">
                            {module.features.filter(f => f.status === 'completed').length}/{module.features.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {/* Strengths */}
                          <div className="bg-green-500/5 rounded-lg p-3">
                            <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                              <ThumbsUp className="w-4 h-4" />
                              نقاط القوة
                            </h4>
                            <ul className="space-y-1">
                              {module.strengths.map((strength, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Features list */}
                          <div className="space-y-2">
                            {module.features.filter(f => f.status === 'completed').map((feature, i) => {
                              const statusInfo = getStatusInfo(feature.status);
                              return (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                                    <span className="text-sm font-medium">{feature.name}</span>
                                  </div>
                                  <Badge variant={getPriorityVariant(feature.priority) as any}>
                                    {feature.progress}%
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="mt-6">
          <div className="grid gap-6">
            {/* Current Weaknesses */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  العيوب الحالية ونقاط الضعف
                </CardTitle>
                <CardDescription>المشاكل التي تحتاج معالجة لتحسين النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {systemModules.map((module, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <module.icon className="w-5 h-5 text-muted-foreground" />
                          <h4 className="font-semibold">{module.name}</h4>
                        </div>
                        
                        {/* Module Weaknesses */}
                        {module.weaknesses.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-red-600 mb-2">نقاط الضعف:</h5>
                            <ul className="space-y-1">
                              {module.weaknesses.map((weakness, i) => (
                                <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Feature Issues */}
                        {module.features.filter(f => f.issues && f.issues.length > 0).map((feature, i) => (
                          <div key={i} className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Bug className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-sm">{feature.name}</span>
                            </div>
                            <ul className="space-y-1">
                              {feature.issues?.map((issue, j) => (
                                <li key={j} className="text-sm text-red-600 flex items-start gap-2">
                                  <span className="shrink-0">•</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Features in Progress */}
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Clock className="w-5 h-5" />
                  الميزات قيد التطوير
                </CardTitle>
                <CardDescription>الميزات التي يتم العمل عليها حالياً</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inProgressFeatures.map((feature, idx) => {
                    const module = systemModules.find(m => m.features.includes(feature));
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          {module && <module.icon className="w-4 h-4 text-yellow-600" />}
                          <div>
                            <span className="font-medium">{feature.name}</span>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={feature.progress} className="w-20 h-2" />
                          <span className="text-sm font-medium">{feature.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Future Development Tab */}
        <TabsContent value="future" className="mt-6">
          <div className="grid gap-6">
            {/* Vision Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemModules.map((module, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white">
                        <module.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Rocket className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p>{module.futureVision}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Planned Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  الميزات المخططة للمستقبل
                </CardTitle>
                <CardDescription>الميزات التي سيتم تطويرها في الإصدارات القادمة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plannedFeatures.map((feature, idx) => {
                    const module = systemModules.find(m => m.features.includes(feature));
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          {module && <module.icon className="w-4 h-4 text-blue-600" />}
                          <div>
                            <span className="font-medium">{feature.name}</span>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Badge variant={getPriorityVariant(feature.priority) as any}>
                          {feature.priority === 'high' ? 'أولوية عالية' : feature.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                الاقتراحات والتوصيات
              </CardTitle>
              <CardDescription>توصيات لتحسين النظام وتطويره</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {systemModules.map((module, idx) => {
                    const featuresWithSuggestions = module.features.filter(f => f.suggestions && f.suggestions.length > 0);
                    if (featuresWithSuggestions.length === 0) return null;
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <module.icon className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold">{module.name}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {featuresWithSuggestions.map((feature, i) => (
                            <div key={i} className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-sm">{feature.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {feature.progress}% مكتمل
                                </Badge>
                              </div>
                              <ul className="space-y-1">
                                {feature.suggestions?.map((suggestion, j) => (
                                  <li key={j} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* General Recommendations */}
                  <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        توصيات عامة للتطوير
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">تحسين الأداء:</span>
                            <p className="text-sm text-muted-foreground">تطبيق lazy loading وتحسين bundle size لتسريع التحميل الأولي</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">تطبيق موبايل:</span>
                            <p className="text-sm text-muted-foreground">تحويل المنصة لـ PWA أو تطبيق React Native للاستخدام الأمثل على الموبايل</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">التوسع الإقليمي:</span>
                            <p className="text-sm text-muted-foreground">إضافة دعم للغات أخرى (الإنجليزية) والتوسع لدول الخليج</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Lock className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">شهادات الأمان:</span>
                            <p className="text-sm text-muted-foreground">الحصول على شهادة ISO 27001 وSOC 2 لتعزيز الثقة</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SystemStatus;
