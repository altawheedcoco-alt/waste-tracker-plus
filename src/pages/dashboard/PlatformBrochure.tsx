import { useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Printer, Download, Truck, Package, Recycle, Factory,
  Shield, Brain, BarChart3, FileText, Users, MapPin,
  Bell, Wallet, Award, Globe, Zap, Lock, Building2,
  CheckCircle2, Leaf, Scale, GraduationCap, Camera,
  Smartphone, Star, MessageSquare, Receipt, ClipboardList,
  Layers, Store, TrendingUp, Umbrella, Wrench, Eye,
  BookOpen, Network, Activity, Database, FileCheck,
} from 'lucide-react';

const sections = [
  {
    title: 'إدارة الشحنات والنقل',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    features: [
      { name: 'إنشاء الشحنات وتتبعها', desc: 'إنشاء شحنات نقل مخلفات مع تتبع لحظي عبر GPS ورموز QR فريدة لكل شحنة' },
      { name: 'سلسلة الموافقات المتعددة', desc: 'نظام موافقات متسلسل من المولد والناقل والمدور مع موافقة تلقائية بعد 6 ساعات' },
      { name: 'المانيفست الرقمي الموحد', desc: 'مستند رقمي شامل يرافق الشحنة من المصدر حتى الوجهة النهائية مع QR Chain' },
      { name: 'شهادات الاستلام والتسليم', desc: '7 مستندات قانونية تلقائية تصاحب دورة حياة كل شحنة من البداية للنهاية' },
      { name: 'إقرارات التسليم', desc: 'توثيق إلكتروني لعمليات التسليم مع توقيعات رقمية وصور إثبات' },
      { name: 'الشحنات المرفوضة', desc: 'نظام متكامل لإدارة ومعالجة الشحنات المرفوضة مع أسباب الرفض وإعادة التوجيه' },
    ]
  },
  {
    title: 'إدارة السائقين والأسطول',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    features: [
      { name: 'لوحة تحكم السائق الذكية', desc: 'واجهة Mobile-first بـ 14 تبويباً تشمل المهام والأداء والمكافآت والسلامة' },
      { name: 'التتبع اللحظي GPS', desc: 'تتبع مواقع السائقين والمركبات على خريطة حية مع تحديثات كل 30 ثانية' },
      { name: 'فحص ما قبل الرحلة', desc: 'قائمة فحص إلزامية للمركبة قبل بدء أي رحلة نقل لضمان السلامة' },
      { name: 'أكاديمية السائقين', desc: 'برنامج تدريبي متكامل بشهادات معتمدة ودورات إلزامية واختبارات تقييم' },
      { name: 'نظام المكافآت والتحفيز', desc: 'نقاط ومستويات وشارات وسلسلة أيام متتالية (Streaks) ولوحة متصدرين' },
      { name: 'محفظة أرباح السائق', desc: 'تتبع الأرباح والحوافز والخصومات مع تقارير يومية وشهرية مفصلة' },
      { name: 'الكاميرا الذكية AI', desc: 'تصنيف المخلفات بالكاميرا وتقدير الأوزان والتحقق من الحمولة بالذكاء الاصطناعي' },
      { name: 'زر الطوارئ SOS', desc: 'إبلاغ فوري في حالات الطوارئ مع إرسال الموقع تلقائياً لمركز التحكم' },
    ]
  },
  {
    title: 'إدارة المصانع والتدوير',
    icon: Recycle,
    color: 'from-emerald-500 to-green-500',
    features: [
      { name: 'التوأم الرقمي للمصنع', desc: 'Digital Twin لمراقبة أرضية المصنع وخطوط الإنتاج في الوقت الفعلي' },
      { name: 'أوامر التشغيل (Work Orders)', desc: 'إدارة الدُفعات (Batches) مع حساب التكلفة الفعلية للطن شاملة كل المصروفات' },
      { name: 'فحص الجودة بالـ AI', desc: 'منع التلوث الخلطي وضمان جودة المنتجات المعاد تدويرها بالذكاء الاصطناعي' },
      { name: 'الصيانة التنبؤية', desc: 'توقع الأعطال قبل حدوثها باستخدام بيانات الاستهلاك والتشغيل' },
      { name: 'شهادات المنتجات', desc: 'إصدار شهادات بـ QR Code تتبع سلسلة الحيازة من المصدر حتى المنتج النهائي' },
      { name: 'بورصة أسعار المواد', desc: 'أسعار لحظية للمواد المعاد تدويرها مع رسوم بيانية وتنبؤات سعرية' },
    ]
  },
  {
    title: 'عمليات التخلص الآمن',
    icon: Factory,
    color: 'from-red-500 to-rose-500',
    features: [
      { name: 'لوحة تحكم التخلص', desc: 'إدارة شاملة لعمليات التخلص الآمن من المخلفات الخطرة وغير الخطرة' },
      { name: 'مرافق التخلص', desc: 'تسجيل وإدارة مرافق التخلص مع التراخيص والسعات والمواصفات الفنية' },
      { name: 'شهادات التخلص', desc: 'إصدار شهادات تخلص آمن رسمية مع توثيق كامل لكل عملية' },
      { name: 'تقارير بيئية', desc: 'تقارير مفصلة عن التأثير البيئي لعمليات التخلص وفقاً للمعايير الدولية' },
    ]
  },
  {
    title: 'النظام المالي ERP',
    icon: Wallet,
    color: 'from-violet-500 to-purple-500',
    features: [
      { name: 'المحاسبة المالية', desc: 'نظام محاسبة متكامل مع دفتر أستاذ عام وقوائم مالية تلقائية (دخل، مركز مالي، تدفقات نقدية)' },
      { name: 'الفواتير الإلكترونية', desc: 'إصدار فواتير إلكترونية متوافقة مع المعايير المحلية مع ختم وتوقيع رقمي' },
      { name: 'حسابات الشركاء', desc: 'إدارة الأرصدة والإيداعات والمعاملات المالية مع كل شريك تجاري' },
      { name: 'إدارة المخازن', desc: 'تتبع المخزون بنظام FIFO والمتوسط المرجح مع حساب تكلفة البضاعة المباعة' },
      { name: 'الموارد البشرية', desc: 'إدارة الموظفين والرواتب والحضور والإجازات والتقييمات السنوية' },
      { name: 'المشتريات والمبيعات', desc: 'دورة مشتريات متكاملة من طلب الشراء حتى الاستلام والدفع' },
      { name: 'التأمين الذكي', desc: 'احتساب آلي لأقساط التأمين بناءً على المخاطر وقيمة الشحنة ونوع المخلفات' },
      { name: 'العقود الآجلة', desc: 'تأمين أسعار نقل مستقبلية لحماية الأعمال من تقلبات الأسعار' },
      { name: 'المحفظة الرقمية', desc: 'محفظة إلكترونية للمنظمة لتسهيل المعاملات المالية والتحويلات' },
    ]
  },
  {
    title: 'الامتثال والحوكمة',
    icon: Shield,
    color: 'from-teal-500 to-cyan-500',
    features: [
      { name: 'نظام ISO 14001 / 45001', desc: 'منصة اعتماد رقمية متكاملة تتبع معايير الجودة والسلامة البيئية الدولية' },
      { name: 'مصفوفة المخاطر', desc: 'تقييم المخاطر بنظام (الاحتمالية × التأثير) مع خطط استجابة وتتبع تلقائي' },
      { name: 'الأفعال التصحيحية (CAR)', desc: 'تذاكر عدم مطابقة مع سير عمل وتتبع حتى الإغلاق وسجل تدقيق كامل' },
      { name: 'بوابة المراجع الخارجي', desc: 'وصول آمن للمراجعين للتحقق من الأدلة (GPS، صور، موازين) مع توقيع رقمي' },
      { name: 'شهادات الامتثال', desc: 'إصدار شهادات ذهبية (≥90%) وفضية (≥80%) وبرونزية (≥70%) بـ QR مشفر' },
      { name: 'سجلات المخلفات الخطرة', desc: 'سجلات رقمية للمخلفات الخطرة وغير الخطرة وفقاً للوائح الوطنية' },
      { name: 'حماية بيانات GDPR', desc: 'أدوات الامتثال لقوانين حماية البيانات مع تشفير وحقوق الحذف' },
    ]
  },
  {
    title: 'الذكاء الاصطناعي',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    features: [
      { name: 'مساعد AI التفاعلي', desc: 'مساعد ذكي يفهم استفسارات المستخدمين ويقدم إجابات فورية ودقيقة عن العمليات' },
      { name: 'تصنيف المخلفات بالصور', desc: 'تحليل صور المخلفات وتصنيفها تلقائياً مع تحديد نسب التلوث والنقاء' },
      { name: 'التعرف على المعدات', desc: 'AI Vision لتحديد موديلات الماكينات وقدراتها وجداول صيانتها تلقائياً' },
      { name: 'تحسين المسارات', desc: 'خوارزميات ذكية لتحسين مسارات النقل وتقليل التكاليف والانبعاثات الكربونية' },
      { name: 'كشف الاحتيال', desc: 'محرك ذكي لرصد التلاعب بالأوزان والشحنات المشبوهة تلقائياً' },
      { name: 'التنبيهات الاستباقية', desc: 'إشعارات ذكية قبل انتهاء التراخيص والعقود ومواعيد الصيانة' },
      { name: 'محسّن الإنتاج الذكي', desc: 'Smart Optimizer لرفع كفاءة الاستخلاص وتقليل الهالك في خطوط الإنتاج' },
    ]
  },
  {
    title: 'التقارير والتحليلات',
    icon: BarChart3,
    color: 'from-indigo-500 to-blue-500',
    features: [
      { name: 'لوحة تحليلات متقدمة', desc: 'رسوم بيانية تفاعلية ومؤشرات أداء رئيسية (KPIs) لكافة العمليات' },
      { name: 'البصمة الكربونية', desc: 'حساب دقيق للبصمة الكربونية لكل شحنة مع تقارير الأثر البيئي' },
      { name: 'تقارير ESG', desc: 'تقارير الحوكمة البيئية والاجتماعية والمؤسسية وفقاً للمعايير الدولية' },
      { name: 'تحليل النفايات التفصيلي', desc: 'تصنيفات وإحصائيات مفصلة لأنواع وكميات المخلفات عبر الزمن' },
      { name: 'خريطة تدفق النفايات', desc: 'خرائط حرارية تفاعلية توضح تدفق المخلفات من المصادر للوجهات' },
      { name: 'تقارير السلامة المهنية', desc: 'إحصائيات الحوادث والإصابات ومعدلات الامتثال لمعايير السلامة' },
      { name: 'الاستدامة البيئية', desc: 'مؤشرات الاستدامة ومعدلات إعادة التدوير والأهداف البيئية' },
    ]
  },
  {
    title: 'العقود والوثائق',
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    features: [
      { name: 'إدارة العقود', desc: 'إنشاء وتتبع العقود التجارية مع شركاء الأعمال بقوالب جاهزة قابلة للتخصيص' },
      { name: 'خطابات الترسية', desc: 'إصدار خطابات ترسية رسمية مع تفاصيل الأسعار والكميات والبنود' },
      { name: 'التوقيعات الرقمية', desc: 'نظام توقيع إلكتروني للمفوضين بالتوقيع مع أختام المنظمة الرقمية' },
      { name: 'أرشفة المستندات الذكية', desc: 'أرشفة تلقائية لكل المستندات مع ملخصات AI وأكواد تتبع فريدة' },
      { name: 'التحقق من الوثائق', desc: 'نظام تحقق عام عبر QR Code لأي وثيقة أو شهادة صادرة من المنصة' },
      { name: 'التوقيع التلقائي', desc: 'إعداد توقيع وختم تلقائي على المستندات عند تغيير حالة الشحنة' },
    ]
  },
  {
    title: 'إدارة الشركاء والعلاقات',
    icon: Users,
    color: 'from-sky-500 to-blue-500',
    features: [
      { name: 'شبكة الشركاء', desc: 'بناء شبكة شركاء متكاملة (مولدين، ناقلين، مدورين) مع دعوات وربط آلي' },
      { name: 'بروفايل المنظمة العام', desc: 'صفحة عامة لكل منظمة مع معلومات الاتصال والخدمات والتقييمات' },
      { name: 'تقييم الشركاء', desc: 'نظام تقييم ومراجعات متبادلة لضمان جودة الخدمات والشفافية' },
      { name: 'بوابة العملاء', desc: 'بوابة خدمة ذاتية للعملاء لتتبع شحناتهم وفواتيرهم ومستنداتهم' },
      { name: 'تحليل مخاطر الشركاء', desc: 'تقييم آلي لمستوى مخاطر كل شريك تجاري بناءً على الأداء والسجل' },
      { name: 'الجدول الزمني المشترك', desc: 'تايملاين مشترك لآخر أنشطة وتحديثات كل الشركاء المرتبطين' },
    ]
  },
  {
    title: 'البورصة والتجارة',
    icon: Store,
    color: 'from-yellow-500 to-amber-500',
    features: [
      { name: 'بورصة المخلفات', desc: 'سوق إلكتروني لبيع وشراء المخلفات القابلة للتدوير بنظام المزايدة' },
      { name: 'بورصة السلع العالمية', desc: 'أسعار لحظية للمواد المعاد تدويرها عالمياً مع رسوم بيانية وتحليلات' },
      { name: 'سوق المعدات', desc: 'بيع وشراء وتأجير معدات إعادة التدوير المستعملة والجديدة' },
      { name: 'المزادات', desc: 'نظام مزادات إلكتروني شفاف لبيع المخلفات بأفضل الأسعار' },
      { name: 'طلبات الجمع', desc: 'نظام يشبه أوبر لطلب جمع المخلفات من المولدين بضغطة زر' },
    ]
  },
  {
    title: 'الإشعارات والتواصل',
    icon: Bell,
    color: 'from-orange-500 to-red-500',
    features: [
      { name: 'إشعارات متسلسلة', desc: 'نظام إخطار لحظي لكافة الأطراف عبر مشغلات قاعدة البيانات فور تغير حالة الشحنة' },
      { name: 'واتساب', desc: 'إرسال إشعارات وتحديثات آلية عبر واتساب للعملاء والسائقين والشركاء' },
      { name: 'الإشارات (@Mentions)', desc: 'نظام إشارة للمستخدمين في التعليقات والملاحظات مع إشعارات فورية' },
      { name: 'الدردشة الداخلية', desc: 'نظام محادثات فورية بين أعضاء الفريق والشركاء داخل المنصة' },
      { name: 'قصص المنصة', desc: 'مشاركة أخبار وتحديثات المنظمة عبر نظام قصص يشبه وسائل التواصل' },
    ]
  },
  {
    title: 'التوظيف والموارد البشرية',
    icon: GraduationCap,
    color: 'from-lime-500 to-green-500',
    features: [
      { name: 'منصة عُمالنا (Omaluna)', desc: 'منظومة توظيف شاملة تربط بين العمال والجهات ومكاتب التوظيف في قطاع إدارة المخلفات' },
      { name: 'إعلانات الوظائف', desc: 'نشر فرص عمل مع وصف تفصيلي ومتطلبات ونظام تقديم إلكتروني' },
      { name: 'السيرة الذاتية التلقائية', desc: 'بناء سير ذاتية آلية للعمال مع رفع المستندات القانونية والشهادات' },
      { name: 'المطابقة الذكية', desc: 'AI Matching لمطابقة المرشحين المناسبين مع الوظائف المتاحة تلقائياً' },
      { name: 'الهيكل التنظيمي', desc: 'إدارة الهيكل التنظيمي مع الأقسام والمسميات الوظيفية والتسلسل الإداري' },
    ]
  },
  {
    title: 'أدوات مدير النظام',
    icon: Lock,
    color: 'from-gray-600 to-slate-800',
    features: [
      { name: 'لوحة تحكم مركزية', desc: 'نظرة عامة شاملة على كل عمليات النظام مع 81 فحصاً آلياً للكفاءة' },
      { name: 'إدارة الشركات', desc: 'الموافقة على الجهات الجديدة وإدارة التراخيص والاشتراكات والتعليق' },
      { name: 'مراجعة الانضمام AI', desc: 'فحص آلي بالذكاء الاصطناعي لطلبات الانضمام مع تقييم المخاطر' },
      { name: 'الدخول الظلي', desc: 'محاكاة تجربة أي منظمة لدعمها فنياً دون الحاجة لبيانات اعتمادها' },
      { name: 'إدارة API', desc: 'مفاتيح API للتكامل مع أنظمة خارجية مع نطاقات وحدود استخدام محددة' },
      { name: 'سجلات التدقيق', desc: 'سجل كامل وغير قابل للتعديل لكل الإجراءات والعمليات في النظام' },
      { name: 'لوحة الرقابة التنظيمية', desc: 'أدوات رقابية للجهات التنظيمية لمتابعة الامتثال والأداء البيئي' },
    ]
  },
  {
    title: 'الخرائط والمواقع',
    icon: MapPin,
    color: 'from-emerald-600 to-teal-500',
    features: [
      { name: 'خرائط تفاعلية', desc: 'عرض مواقع المولدين والناقلين والمدورين ومرافق التخلص على خريطة تفاعلية' },
      { name: 'تتبع المركبات', desc: 'تتبع لحظي لمركبات الأسطول على الخريطة مع معلومات السرعة والاتجاه' },
      { name: 'المواقع المحفوظة', desc: 'حفظ وإدارة المواقع المتكررة لتسهيل إنشاء الشحنات' },
      { name: 'إعدادات GPS', desc: 'تهيئة أجهزة التتبع ونطاقات السياج الجغرافي (Geofencing)' },
    ]
  },
  {
    title: 'التكاملات والتقنيات',
    icon: Zap,
    color: 'from-cyan-500 to-blue-500',
    features: [
      { name: 'تكامل IoT', desc: 'ربط أجهزة إنترنت الأشياء (موازين، حساسات درجة حرارة، GPS) مع المنصة' },
      { name: 'تطبيق الهاتف (PWA)', desc: 'تطبيق ويب تقدمي يعمل بدون إنترنت مع إشعارات فورية وتثبيت على الجهاز' },
      { name: 'رموز QR الذكية', desc: 'نظام QR شامل للشحنات والمستندات والشهادات والتحقق العام' },
      { name: 'التوقيع البيومتري', desc: 'دعم المصادقة البيومترية (بصمة الإصبع، Face ID) لتأمين العمليات الحساسة' },
      { name: 'الإعلانات المنصية', desc: 'نظام إعلانات داخلي مع خطط اشتراك وتحليلات مشاهدات ونقرات' },
      { name: 'White Label Portal', desc: 'بوابة قابلة للتخصيص بهوية العميل التجارية لتقديم خدمات مخصصة' },
    ]
  },
];

const stats = [
  { label: 'نوع مستخدم', value: '5+', desc: 'مولد، ناقل، مدور، تخلص، سائق' },
  { label: 'وحدة وظيفية', value: '100+', desc: 'مديول ووظيفة متكاملة' },
  { label: 'تقرير وتحليل', value: '30+', desc: 'أنواع تقارير وتحليلات' },
  { label: 'نموذج AI', value: '10+', desc: 'نماذج ذكاء اصطناعي متخصصة' },
  { label: 'معيار امتثال', value: 'ISO', desc: '14001 و 45001 متكامل' },
  { label: 'مستند تلقائي', value: '7+', desc: 'لكل شحنة في دورة حياتها' },
];

export default function PlatformBrochure() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        {/* Header with print button */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold">بروشور المنصة</h1>
            <p className="text-muted-foreground text-sm">دليل شامل لكافة مزايا ووظائف منصة iRecycle</p>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة البروشور
          </Button>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="print-brochure space-y-6">
          {/* Cover */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="bg-gradient-to-bl from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Recycle className="w-12 h-12" />
                <h1 className="text-4xl font-black tracking-tight">iRecycle</h1>
              </div>
              <p className="text-xl font-semibold mb-2">منصة إدارة المخلفات المتكاملة</p>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                الحل الرقمي الشامل لإدارة سلسلة القيمة الكاملة للمخلفات — من المصدر حتى إعادة التدوير أو التخلص الآمن
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-black text-primary">{stat.value}</p>
                    <p className="text-xs font-semibold">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="overflow-hidden break-inside-avoid">
                <div className={`bg-gradient-to-l ${section.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                      {section.features.length} وظيفة
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <div key={feature.name} className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{feature.name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Footer */}
          <Card className="overflow-hidden break-inside-avoid">
            <CardContent className="p-6 text-center space-y-3">
              <Separator />
              <div className="flex items-center justify-center gap-2 text-primary">
                <Recycle className="w-6 h-6" />
                <span className="font-bold text-lg">iRecycle Platform</span>
              </div>
              <p className="text-sm text-muted-foreground">
                منصة سحابية آمنة • تحديثات مستمرة • دعم فني على مدار الساعة
              </p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} iRecycle — جميع الحقوق محفوظة
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print, nav, header, aside, footer,
          [data-sidebar], [data-radix-popper-content-wrapper] {
            display: none !important;
          }
          body { background: white !important; }
          .print-brochure {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-brochure > * {
            break-inside: avoid;
            margin-bottom: 12px !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
