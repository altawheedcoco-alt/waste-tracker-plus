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
  // ===== البيئة والسلامة أولاً =====
  {
    title: '🌍 البصمة الكربونية وأرصدة الكربون',
    icon: Leaf,
    color: 'from-green-600 to-emerald-500',
    priority: true,
    features: [
      { name: 'حساب البصمة الكربونية للشحنة', desc: 'حساب تلقائي لانبعاثات CO₂ لكل شحنة بناءً على المسافة (Haversine)، الوزن، ونوع المخلف وفقاً لمعاملات IPCC 2006 و GHG Protocol' },
      { name: 'بصمة المنشأة الشاملة', desc: 'تجميع البصمة الكربونية على مستوى المنشأة شهرياً/سنوياً مع مقارنة الأداء عبر الفترات وتتبع التحسن' },
      { name: 'المكافئات البيئية الملموسة', desc: 'ترجمة الانبعاثات والوفورات إلى مكافئات مفهومة: عدد الأشجار، السيارات المُزالة، المنازل المصرية، فدادين الري' },
      { name: 'أرصدة الكربون (Carbon Credits)', desc: 'حساب أرصدة الكربون المُكتسبة من إعادة التدوير مع تقييم مالي بالأسعار العالمية ($/طن CO₂e)' },
      { name: 'شهادات البصمة الكربونية', desc: 'إصدار شهادات PCF (بصمة المنتج) و FCF (بصمة المنشأة) رقمية مشفرة بـ QR Code للتحقق العام' },
      { name: 'تقارير انبعاثات النقل', desc: 'تحليل مفصل لانبعاثات النقل البري مع تحسين المسارات لتقليل البصمة الكربونية اللوجستية' },
      { name: 'معاملات انبعاثات مُعتمدة', desc: 'قاعدة بيانات معاملات الانبعاثات لـ 10+ أنواع مخلفات (بلاستيك، ورق، معادن، إلكترونيات، طبية، كيميائية...)' },
    ]
  },
  {
    title: '♻️ الاقتصاد الدائري والتكافل الصناعي',
    icon: Recycle,
    color: 'from-emerald-500 to-teal-500',
    priority: true,
    features: [
      { name: 'مؤشر دائرية المواد (MCI)', desc: 'حساب Material Circularity Indicator لكل مادة وشحنة وفقاً لمنهجية Ellen MacArthur Foundation' },
      { name: 'جواز المنتج الرقمي (DPP)', desc: 'Digital Product Passport يتتبع دورة حياة المادة من المصدر حتى إعادة التدوير وفقاً لمتطلبات الاتحاد الأوروبي' },
      { name: 'شبكة التكافل الصناعي', desc: 'ربط المنشآت الصناعية لتبادل المخلفات كمدخلات إنتاج (مخرجات مصنع = مدخلات مصنع آخر)' },
      { name: 'المطابقة الذكية AI', desc: 'خوارزمية ذكاء اصطناعي تطابق تلقائياً بين عارضي المخلفات وطالبيها بناءً على النوع والموقع والكمية' },
      { name: 'لوحة الدائرية', desc: 'لوحة تحكم بصرية بمؤشرات: معدل الاسترداد، نسبة التحويل عن المدافن، كفاءة إعادة التدوير، وفورات المواد الخام' },
      { name: 'تدفق المواد Sankey', desc: 'رسوم بيانية تفاعلية تُظهر تدفق المخلفات من المصادر عبر المعالجة حتى الاستخدام النهائي أو التخلص' },
      { name: 'تقارير التحويل عن المدافن', desc: 'حساب دقيق لنسبة المخلفات المُحوّلة عن الدفن مع أهداف Zero-Waste قابلة للتتبع' },
    ]
  },
  {
    title: '📊 تقارير الاستدامة ESG',
    icon: BarChart3,
    color: 'from-teal-500 to-cyan-600',
    priority: true,
    features: [
      { name: 'تقارير GRI Standards', desc: 'إعداد تقارير متوافقة مع معايير Global Reporting Initiative لإفصاحات الاستدامة البيئية والاجتماعية' },
      { name: 'مؤشرات ESG الدولية', desc: 'أكثر من 30 مؤشر ESG (بيئي، اجتماعي، حوكمة) متوافقة مع GRI, ISO 14001, Basel Convention' },
      { name: 'أهداف التنمية المستدامة SDGs', desc: 'ربط أداء المنظمة بـ 8 أهداف للتنمية المستدامة (SDG 6,7,9,11,12,13,14,15) مع قياس المساهمة الفعلية' },
      { name: 'الاستدامة على 3 مستويات', desc: 'تقارير استدامة على مستوى: المنظمة (نظرة شاملة)، الشحنة (تفصيلي)، ونوع المخلف (تخصصي)' },
      { name: '7 محاور تقييم', desc: 'تقييم الأداء عبر: الامتثال، الأثر البيئي، كفاءة التشغيل، المسؤولية الاجتماعية، الابتكار، الشفافية، والحوكمة' },
      { name: 'شهادات الاستدامة الرقمية', desc: 'إصدار شهادات استدامة مشفرة بـ QR Code تضمن تتبع الأثر البيئي الدقيق لكل طن مخلفات' },
      { name: 'المكافئات البيئية المحلية', desc: 'حساب الأثر بوحدات محلية مفهومة: فدادين ري مصرية، منازل مصرية (كهرباء)، أشجار نخيل مزروعة' },
    ]
  },
  {
    title: '🛡️ السلامة المهنية والصحة',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    priority: true,
    features: [
      { name: 'نظام ISO 45001 متكامل', desc: 'منصة رقمية كاملة تطبق متطلبات ISO 45001 لنظام إدارة السلامة والصحة المهنية' },
      { name: 'مصفوفة المخاطر التفاعلية', desc: 'تقييم المخاطر بنظام (الاحتمالية × التأثير) مع 5 مستويات للخطورة وخطط استجابة ومتابعة تلقائية' },
      { name: 'الأفعال التصحيحية (CAR)', desc: 'نظام تذاكر عدم المطابقة مع سير عمل (فتح ← تحقيق ← إجراء تصحيحي ← تحقق ← إغلاق) وسجل تدقيق' },
      { name: 'فحص ما قبل الرحلة', desc: 'قائمة فحص إلزامية شاملة للمركبة والسائق قبل بدء أي رحلة نقل مخلفات (خاصة الخطرة)' },
      { name: 'تقارير الحوادث والإصابات', desc: 'توثيق إلكتروني لكل حادثة مع تحليل الأسباب الجذرية (RCA) وإجراءات المنع التكرارية' },
      { name: 'سجل المخلفات الخطرة', desc: 'سجل رقمي مفصل للمخلفات الخطرة يتوافق مع اللوائح الوطنية واتفاقية بازل الدولية' },
      { name: 'زر الطوارئ SOS', desc: 'إبلاغ فوري في حالات الطوارئ مع إرسال الموقع الحي تلقائياً لمركز التحكم والجهات المعنية' },
      { name: 'معدات الوقاية PPE', desc: 'تتبع التزام السائقين والعمال بمعدات الوقاية الشخصية مع تنبيهات عند عدم الامتثال' },
    ]
  },
  {
    title: '🏭 الرقابة البيئية للمنشآت',
    icon: Activity,
    color: 'from-orange-500 to-amber-500',
    priority: true,
    features: [
      { name: 'مراقبة انبعاثات المحارق', desc: 'تتبع لحظي لدرجات حرارة المحارق وانبعاثات CO₂ و NOx مع تنبيهات فورية عند تجاوز الحدود' },
      { name: 'إدارة خلايا الدفن', desc: 'خريطة رقمية لخلايا الدفن مع تتبع السعة والامتلاء والحالة (نشطة/مغلقة/فارغة) لكل خلية' },
      { name: 'مراقبة مستويات الترشيح', desc: 'رصد مستمر لمستويات الرشح (Leachate) في مدافن النفايات مع تنبيهات بيئية' },
      { name: 'التنبيهات البيئية الحية', desc: 'نظام تنبيهات آلي مستمر يراقب معايير الامتثال البيئي ويُنذر فوراً عند أي انحراف' },
      { name: 'سعة المنشآت', desc: 'تتبع لحظي للسعة المتبقية في كل منشأة تخلص مع تنبيهات عند الوصول لـ 80% من السعة القصوى' },
      { name: 'تتبع درجات الحرارة', desc: 'مراقبة درجات حرارة التخزين والمعالجة خاصة للمخلفات الطبية والكيميائية الحساسة' },
    ]
  },
  {
    title: '📋 الامتثال التنظيمي والتدقيق',
    icon: FileCheck,
    color: 'from-indigo-500 to-violet-500',
    priority: true,
    features: [
      { name: 'نظام ISO 14001 الكامل', desc: 'تطبيق رقمي شامل لمتطلبات نظام الإدارة البيئية ISO 14001:2015 مع قوائم فحص وأدلة' },
      { name: 'بوابة المراجع الخارجي', desc: 'وصول آمن محدد الزمن للمراجعين للتحقق من أدلة الامتثال (GPS، صور، موازين) مع توقيع رقمي' },
      { name: 'شهادات امتثال متدرجة', desc: 'إصدار شهادات ذهبية (≥90%) وفضية (≥80%) وبرونزية (≥70%) بناءً على درجة الامتثال مع QR تحقق' },
      { name: 'درجة الامتثال القانوني', desc: 'حساب تلقائي لدرجة امتثال كل شحنة وجهة بناءً على اكتمال البيانات والمستندات المطلوبة' },
      { name: 'سجلات المخلفات غير الخطرة', desc: 'سجلات رقمية منظمة للمخلفات غير الخطرة وفقاً لمتطلبات الجهات التنظيمية الوطنية' },
      { name: 'تنبيهات الشحنات العالقة', desc: 'نظام تنبيه آلي للشحنات المتأخرة أكثر من 48 ساعة مع تصعيد تلقائي للمسؤولين' },
      { name: 'حماية بيانات GDPR', desc: 'أدوات الامتثال لقوانين حماية البيانات مع تشفير شامل وحقوق الحذف والنسيان' },
      { name: 'سلسلة الحفظ Blockchain-lite', desc: 'تتبع سلسلة حيازة المخلفات بتقنية blockchain-lite تضمن عدم التلاعب بالسجلات' },
    ]
  },
  {
    title: '🌊 خريطة تدفق المخلفات والذكاء البيئي',
    icon: Network,
    color: 'from-cyan-500 to-blue-500',
    priority: true,
    features: [
      { name: 'خرائط حرارية تفاعلية', desc: 'خرائط حرارية توضح كثافة توليد المخلفات جغرافياً مع تحديد النقاط الساخنة (Hotspots)' },
      { name: 'تدفق المخلفات الحي', desc: 'تتبع تدفق المخلفات من المصادر (المولدين) عبر النقل حتى الوجهة النهائية (تدوير/تخلص)' },
      { name: 'تحليل أنواع المخلفات', desc: 'تصنيفات وإحصائيات مفصلة لأنواع وكميات المخلفات مع رسوم بيانية تفاعلية عبر الزمن' },
      { name: 'بورصة السلع البيئية', desc: 'أسعار لحظية للمواد المعاد تدويرها عالمياً (بلاستيك، ورق، معادن، زجاج) مع تحليلات واتجاهات' },
      { name: 'تقارير الأثر التراكمي', desc: 'دمج بيانات كافة الشركاء لتوفير رؤية تراكمية دقيقة للأثر البيئي الإجمالي' },
      { name: 'كشف الاحتيال البيئي', desc: 'محرك AI لرصد التلاعب بالأوزان والشحنات المشبوهة وضمان دقة البيانات البيئية' },
    ]
  },
  // ===== الأقسام التشغيلية =====
  {
    title: 'إدارة الشحنات والنقل',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    features: [
      { name: 'إنشاء الشحنات وتتبعها', desc: 'إنشاء شحنات نقل مخلفات مع تتبع لحظي عبر GPS ورموز QR فريدة لكل شحنة' },
      { name: 'سلسلة الموافقات المتعددة', desc: 'نظام موافقات متسلسل من المولد والناقل والمدور مع موافقة تلقائية بعد 6 ساعات' },
      { name: 'المانيفست الرقمي الموحد', desc: 'مستند رقمي شامل يرافق الشحنة من المصدر حتى الوجهة النهائية مع QR Chain' },
      { name: '7 مستندات قانونية تلقائية', desc: 'شهادات استلام وتسليم وإقرارات ومانيفست تُصدر تلقائياً مع كل شحنة' },
      { name: 'إدارة الشحنات المرفوضة', desc: 'نظام متكامل لمعالجة الشحنات المرفوضة مع أسباب الرفض وإعادة التوجيه' },
    ]
  },
  {
    title: 'إدارة السائقين والأسطول',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    features: [
      { name: 'لوحة تحكم السائق الذكية', desc: 'واجهة Mobile-first بـ 14+ تبويباً تشمل المهام والأداء والمكافآت والسلامة' },
      { name: 'التتبع اللحظي GPS', desc: 'تتبع مواقع السائقين والمركبات على خريطة حية مع تحديثات كل 30 ثانية' },
      { name: 'أكاديمية السائقين', desc: 'برنامج تدريبي متكامل بشهادات معتمدة ودورات إلزامية واختبارات تقييم' },
      { name: 'نظام المكافآت والتحفيز', desc: 'نقاط ومستويات وشارات وسلسلة أيام متتالية (Streaks) ولوحة متصدرين' },
      { name: 'الكاميرا الذكية AI', desc: 'تصنيف المخلفات بالكاميرا وتقدير الأوزان بالذكاء الاصطناعي' },
    ]
  },
  {
    title: 'إدارة المصانع والتدوير',
    icon: Factory,
    color: 'from-lime-500 to-green-500',
    features: [
      { name: 'التوأم الرقمي للمصنع', desc: 'Digital Twin لمراقبة أرضية المصنع وخطوط الإنتاج في الوقت الفعلي' },
      { name: 'أوامر التشغيل (Work Orders)', desc: 'إدارة الدُفعات مع حساب التكلفة الفعلية للطن شاملة كل المصروفات' },
      { name: 'فحص الجودة بالـ AI', desc: 'منع التلوث الخلطي وضمان جودة المنتجات المعاد تدويرها' },
      { name: 'الصيانة التنبؤية', desc: 'توقع الأعطال قبل حدوثها باستخدام بيانات الاستهلاك والتشغيل' },
      { name: 'شهادات المنتجات بـ QR', desc: 'شهادات تتبع سلسلة الحيازة من المصدر حتى المنتج النهائي' },
    ]
  },
  {
    title: 'النظام المالي ERP',
    icon: Wallet,
    color: 'from-violet-500 to-purple-500',
    features: [
      { name: 'المحاسبة المالية', desc: 'دفتر أستاذ وقوائم مالية تلقائية (دخل، مركز مالي، تدفقات نقدية)' },
      { name: 'الفواتير الإلكترونية', desc: 'فواتير متوافقة مع المعايير المحلية بختم وتوقيع رقمي' },
      { name: 'إدارة المخازن', desc: 'تتبع المخزون بنظام FIFO والمتوسط المرجح مع حساب COGS' },
      { name: 'الموارد البشرية', desc: 'إدارة الموظفين والرواتب والحضور والإجازات' },
      { name: 'التأمين والعقود الآجلة', desc: 'احتساب آلي لأقساط التأمين وتأمين أسعار نقل مستقبلية' },
    ]
  },
  {
    title: 'الذكاء الاصطناعي',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    features: [
      { name: 'مساعد AI التفاعلي', desc: 'مساعد ذكي يفهم استفسارات المستخدمين ويقدم إجابات فورية عن العمليات' },
      { name: 'تصنيف المخلفات بالصور', desc: 'تحليل صور المخلفات وتصنيفها تلقائياً مع تحديد نسب النقاء' },
      { name: 'تحسين المسارات', desc: 'خوارزميات ذكية لتحسين مسارات النقل وتقليل التكاليف والانبعاثات' },
      { name: 'محسّن الإنتاج الذكي', desc: 'Smart Optimizer لرفع كفاءة الاستخلاص وتقليل الهالك' },
    ]
  },
  {
    title: 'العقود والشركاء والتواصل',
    icon: Users,
    color: 'from-sky-500 to-blue-500',
    features: [
      { name: 'إدارة العقود والتوقيع الرقمي', desc: 'إنشاء عقود بقوالب جاهزة مع توقيعات وأختام رقمية وتوقيع تلقائي' },
      { name: 'شبكة الشركاء والتقييم', desc: 'بناء شبكة شركاء مع نظام تقييم متبادل وتحليل مخاطر الشركاء' },
      { name: 'بوابة العملاء والتتبع العام', desc: 'بوابة خدمة ذاتية للعملاء لتتبع شحناتهم وفواتيرهم' },
      { name: 'الإشعارات والدردشة', desc: 'إشعارات لحظية + واتساب + دردشة داخلية + قصص المنصة' },
    ]
  },
  {
    title: 'التوظيف والتكاملات',
    icon: Zap,
    color: 'from-cyan-500 to-teal-500',
    features: [
      { name: 'منصة عُمالنا (Omaluna)', desc: 'منظومة توظيف شاملة تربط العمال والجهات ومكاتب التوظيف في قطاع المخلفات' },
      { name: 'تكامل IoT', desc: 'ربط أجهزة إنترنت الأشياء (موازين، حساسات، GPS) مع المنصة' },
      { name: 'تطبيق PWA', desc: 'تطبيق ويب تقدمي يعمل بدون إنترنت مع إشعارات فورية' },
      { name: 'أدوات مدير النظام', desc: 'لوحة تحكم مركزية مع 81 فحصاً آلياً وإدارة الشركات وسجلات تدقيق كاملة' },
    ]
  },
];

const stats = [
  { label: 'مؤشر بيئي', value: '30+', desc: 'ESG, GRI, ISO, Basel' },
  { label: 'هدف SDG', value: '8', desc: 'أهداف تنمية مستدامة' },
  { label: 'نوع مخلف', value: '10+', desc: 'بمعاملات IPCC معتمدة' },
  { label: 'شهادة رقمية', value: '5+', desc: 'كربون، استدامة، امتثال' },
  { label: 'معيار دولي', value: 'ISO', desc: '14001 + 45001 متكامل' },
  { label: 'وحدة وظيفية', value: '100+', desc: 'مديول ووظيفة متكاملة' },
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
              <p className="text-xl font-semibold mb-2">نظام التشغيل الصناعي لإدارة المخلفات والاستدامة البيئية</p>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                الحل الرقمي الشامل لإدارة سلسلة القيمة الكاملة للمخلفات مع رقابة بيئية متقدمة، بصمة كربونية، اقتصاد دائري، وامتثال ISO 14001 / 45001
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
            const isPriority = (section as any).priority;
            return (
              <Card key={section.title} className={`overflow-hidden break-inside-avoid ${isPriority ? 'border-2 border-emerald-500/30 ring-1 ring-emerald-500/10' : ''}`}>
                <div className={`bg-gradient-to-l ${section.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                      {section.features.length} وظيفة
                    </Badge>
                    {isPriority && (
                      <Badge className="bg-white text-emerald-700 border-0 text-[10px] font-bold mr-auto">
                        🌿 بيئة وسلامة
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <div key={feature.name} className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isPriority ? 'text-emerald-600' : 'text-primary'}`} />
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
          /* Hide ALL non-content elements */
          .no-print, nav, header, aside, footer,
          [data-sidebar], [data-radix-popper-content-wrapper],
          [role="navigation"], [role="banner"],
          button, .fixed, .sticky,
          [class*="Sidebar"], [class*="sidebar"],
          [class*="Toaster"], [class*="toast"] {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Reset the entire page layout */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Force full-width layout, remove sidebar offset */
          main, [role="main"], .flex, .flex-1,
          [class*="SidebarInset"], [class*="dashboard"] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            transform: none !important;
            position: static !important;
            display: block !important;
          }

          /* Brochure content styling */
          .print-brochure {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          .print-brochure > * {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 8px !important;
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
          }

          /* Force gradient colors to print */
          .print-brochure [class*="bg-gradient"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Two-column grid prints correctly */
          .print-brochure .grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
          }

          /* Stats row */
          .print-brochure .grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-6 {
            grid-template-columns: repeat(6, 1fr) !important;
          }

          /* Smaller text for density */
          .print-brochure p.text-xs {
            font-size: 9pt !important;
            line-height: 1.3 !important;
          }
          .print-brochure p.text-sm {
            font-size: 10pt !important;
          }
          .print-brochure h2 {
            font-size: 13pt !important;
          }

          /* Page settings */
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }

          /* First page cover section */
          @page :first {
            margin-top: 10mm;
          }

          /* Remove space between elements */
          .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 8px !important;
          }
          .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
