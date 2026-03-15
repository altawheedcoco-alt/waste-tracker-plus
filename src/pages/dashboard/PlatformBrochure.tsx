import { useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Printer, Truck, Package, Recycle, Factory,
  Shield, Brain, BarChart3, FileText, Users, MapPin,
  Bell, Wallet, Award, Globe, Zap, Lock, Building2,
  CheckCircle2, Leaf, Scale, GraduationCap, Camera,
  Smartphone, Star, MessageSquare, Receipt, ClipboardList,
  Layers, Store, TrendingUp, Umbrella, Wrench, Eye,
  BookOpen, Network, Activity, Database, FileCheck,
  Landmark, Target, Gauge, Megaphone, Handshake,
  CalendarCheck, PieChart, Settings, Wifi, Container,
  Route, Banknote, CircleDollarSign, ChevronLeft,
  Ship, Workflow, Radio, Fingerprint, HeartPulse,
  AlertTriangle, Flame, ThermometerSun, Droplets,
  Trees, Wind, Sparkles, BadgeCheck, Clock, Phone,
  Mail, FileSpreadsheet, Scan, QrCode, Boxes,
  Cog, Monitor, Cpu, Server, ShieldCheck,
} from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';

// ===== الأقسام البيئية والسلامة =====
const environmentSections = [
  {
    title: '🌍 البصمة الكربونية وأرصدة الكربون',
    icon: Leaf,
    color: 'from-green-600 to-emerald-500',
    subtitle: 'Carbon Footprint & Carbon Credits',
    features: [
      { name: 'حساب البصمة الكربونية للشحنة', desc: 'حساب تلقائي لانبعاثات CO₂ لكل شحنة بناءً على المسافة (Haversine)، الوزن، ونوع المخلف وفقاً لمعاملات IPCC 2006 و GHG Protocol' },
      { name: 'بصمة المنشأة الشاملة', desc: 'تجميع البصمة الكربونية على مستوى المنشأة شهرياً/سنوياً مع مقارنة الأداء عبر الفترات وتتبع التحسن' },
      { name: 'المكافئات البيئية الملموسة', desc: 'ترجمة الانبعاثات والوفورات إلى مكافئات مفهومة: عدد الأشجار، السيارات المُزالة، المنازل المصرية، فدادين الري' },
      { name: 'أرصدة الكربون (Carbon Credits)', desc: 'حساب أرصدة الكربون المُكتسبة من إعادة التدوير مع تقييم مالي بالأسعار العالمية ($/طن CO₂e)' },
      { name: 'شهادات البصمة الكربونية', desc: 'إصدار شهادات PCF (بصمة المنتج) و FCF (بصمة المنشأة) رقمية مشفرة بـ QR Code للتحقق العام' },
      { name: 'تقارير انبعاثات النقل', desc: 'تحليل مفصل لانبعاثات النقل البري مع تحسين المسارات لتقليل البصمة الكربونية اللوجستية' },
      { name: 'معاملات انبعاثات مُعتمدة', desc: 'قاعدة بيانات معاملات الانبعاثات لـ 10+ أنواع مخلفات (بلاستيك، ورق، معادن، إلكترونيات، طبية، كيميائية...)' },
      { name: 'تقرير الحياد الكربوني', desc: 'خارطة طريق لتحقيق الحياد الكربوني مع تتبع التقدم وتحديد فجوات الانبعاثات' },
    ]
  },
  {
    title: '♻️ الاقتصاد الدائري والتكافل الصناعي',
    icon: Recycle,
    color: 'from-emerald-500 to-teal-500',
    subtitle: 'Circular Economy & Industrial Symbiosis',
    features: [
      { name: 'مؤشر دائرية المواد (MCI)', desc: 'حساب Material Circularity Indicator لكل مادة وشحنة وفقاً لمنهجية Ellen MacArthur Foundation' },
      { name: 'جواز المنتج الرقمي (DPP)', desc: 'Digital Product Passport يتتبع دورة حياة المادة من المصدر حتى إعادة التدوير وفقاً لمتطلبات الاتحاد الأوروبي' },
      { name: 'شبكة التكافل الصناعي', desc: 'ربط المنشآت الصناعية لتبادل المخلفات كمدخلات إنتاج (مخرجات مصنع = مدخلات مصنع آخر)' },
      { name: 'المطابقة الذكية AI', desc: 'خوارزمية ذكاء اصطناعي تطابق تلقائياً بين عارضي المخلفات وطالبيها بناءً على النوع والموقع والكمية' },
      { name: 'لوحة الدائرية', desc: 'لوحة تحكم بصرية بمؤشرات: معدل الاسترداد، نسبة التحويل عن المدافن، كفاءة إعادة التدوير، وفورات المواد الخام' },
      { name: 'تدفق المواد Sankey', desc: 'رسوم بيانية تفاعلية تُظهر تدفق المخلفات من المصادر عبر المعالجة حتى الاستخدام النهائي أو التخلص' },
      { name: 'تقارير التحويل عن المدافن', desc: 'حساب دقيق لنسبة المخلفات المُحوّلة عن الدفن مع أهداف Zero-Waste قابلة للتتبع' },
      { name: 'تحليل دورة الحياة (LCA)', desc: 'تقييم الأثر البيئي الكامل للمادة عبر مراحل حياتها من الاستخراج حتى التخلص أو إعادة التدوير' },
    ]
  },
  {
    title: '📊 تقارير الاستدامة ESG',
    icon: BarChart3,
    color: 'from-teal-500 to-cyan-600',
    subtitle: 'ESG Reporting & Sustainability Intelligence',
    features: [
      { name: 'تقارير GRI Standards', desc: 'إعداد تقارير متوافقة مع معايير Global Reporting Initiative لإفصاحات الاستدامة البيئية والاجتماعية' },
      { name: 'مؤشرات ESG الدولية', desc: 'أكثر من 30 مؤشر ESG (بيئي، اجتماعي، حوكمة) متوافقة مع GRI, ISO 14001, Basel Convention' },
      { name: 'أهداف التنمية المستدامة SDGs', desc: 'ربط أداء المنظمة بـ 8 أهداف للتنمية المستدامة (SDG 6,7,9,11,12,13,14,15) مع قياس المساهمة الفعلية' },
      { name: 'الاستدامة على 3 مستويات', desc: 'تقارير استدامة على مستوى: المنظمة (نظرة شاملة)، الشحنة (تفصيلي)، ونوع المخلف (تخصصي)' },
      { name: '7 محاور تقييم', desc: 'تقييم الأداء عبر: الامتثال، الأثر البيئي، كفاءة التشغيل، المسؤولية الاجتماعية، الابتكار، الشفافية، والحوكمة' },
      { name: 'شهادات الاستدامة الرقمية', desc: 'إصدار شهادات استدامة مشفرة بـ QR Code تضمن تتبع الأثر البيئي الدقيق لكل طن مخلفات' },
      { name: 'المكافئات البيئية المحلية', desc: 'حساب الأثر بوحدات محلية مفهومة: فدادين ري مصرية، منازل مصرية (كهرباء)، أشجار نخيل مزروعة' },
      { name: 'لوحة ESG التنفيذية', desc: 'لوحة تحكم للإدارة العليا تعرض مؤشرات ESG الرئيسية مع مقارنة بمعايير الصناعة والمنافسين' },
    ]
  },
  {
    title: '🛡️ السلامة المهنية والصحة',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    subtitle: 'Occupational Health & Safety — ISO 45001',
    features: [
      { name: 'نظام ISO 45001 متكامل', desc: 'منصة رقمية كاملة تطبق متطلبات ISO 45001 لنظام إدارة السلامة والصحة المهنية' },
      { name: 'مصفوفة المخاطر التفاعلية', desc: 'تقييم المخاطر بنظام (الاحتمالية × التأثير) مع 5 مستويات للخطورة وخطط استجابة ومتابعة تلقائية' },
      { name: 'الأفعال التصحيحية (CAR)', desc: 'نظام تذاكر عدم المطابقة مع سير عمل (فتح ← تحقيق ← إجراء تصحيحي ← تحقق ← إغلاق) وسجل تدقيق' },
      { name: 'فحص ما قبل الرحلة', desc: 'قائمة فحص إلزامية شاملة للمركبة والسائق قبل بدء أي رحلة نقل مخلفات (خاصة الخطرة)' },
      { name: 'تقارير الحوادث والإصابات', desc: 'توثيق إلكتروني لكل حادثة مع تحليل الأسباب الجذرية (RCA) وإجراءات المنع التكرارية' },
      { name: 'سجل المخلفات الخطرة', desc: 'سجل رقمي مفصل للمخلفات الخطرة يتوافق مع اللوائح الوطنية واتفاقية بازل الدولية' },
      { name: 'زر الطوارئ SOS', desc: 'إبلاغ فوري في حالات الطوارئ مع إرسال الموقع الحي تلقائياً لمركز التحكم والجهات المعنية' },
      { name: 'معدات الوقاية PPE', desc: 'تتبع التزام السائقين والعمال بمعدات الوقاية الشخصية مع تنبيهات عند عدم الامتثال' },
      { name: 'الفحوصات الطبية الدورية', desc: 'جدولة وتتبع الفحوصات الطبية الدورية للعمال المتعاملين مع المواد الخطرة' },
    ]
  },
  {
    title: '🏭 الرقابة البيئية للمنشآت',
    icon: Activity,
    color: 'from-orange-500 to-amber-500',
    subtitle: 'Environmental Monitoring & Facility Management',
    features: [
      { name: 'مراقبة انبعاثات المحارق', desc: 'تتبع لحظي لدرجات حرارة المحارق وانبعاثات CO₂ و NOx مع تنبيهات فورية عند تجاوز الحدود' },
      { name: 'إدارة خلايا الدفن', desc: 'خريطة رقمية لخلايا الدفن مع تتبع السعة والامتلاء والحالة (نشطة/مغلقة/فارغة) لكل خلية' },
      { name: 'مراقبة مستويات الترشيح', desc: 'رصد مستمر لمستويات الرشح (Leachate) في مدافن النفايات مع تنبيهات بيئية' },
      { name: 'التنبيهات البيئية الحية', desc: 'نظام تنبيهات آلي مستمر يراقب معايير الامتثال البيئي ويُنذر فوراً عند أي انحراف' },
      { name: 'سعة المنشآت', desc: 'تتبع لحظي للسعة المتبقية في كل منشأة تخلص مع تنبيهات عند الوصول لـ 80% من السعة القصوى' },
      { name: 'تتبع درجات الحرارة', desc: 'مراقبة درجات حرارة التخزين والمعالجة خاصة للمخلفات الطبية والكيميائية الحساسة' },
      { name: 'جودة الهواء المحيط', desc: 'رصد مستمر لجودة الهواء حول المنشآت مع مؤشرات AQI وتنبيهات صحية' },
    ]
  },
  {
    title: '📋 الامتثال التنظيمي والتدقيق',
    icon: FileCheck,
    color: 'from-indigo-500 to-violet-500',
    subtitle: 'Regulatory Compliance & Audit Management',
    features: [
      { name: 'نظام ISO 14001 الكامل', desc: 'تطبيق رقمي شامل لمتطلبات نظام الإدارة البيئية ISO 14001:2015 مع قوائم فحص وأدلة' },
      { name: 'بوابة المراجع الخارجي', desc: 'وصول آمن محدد الزمن للمراجعين للتحقق من أدلة الامتثال (GPS، صور، موازين) مع توقيع رقمي' },
      { name: 'شهادات امتثال متدرجة', desc: 'إصدار شهادات ذهبية (≥90%) وفضية (≥80%) وبرونزية (≥70%) بناءً على درجة الامتثال مع QR تحقق' },
      { name: 'درجة الامتثال القانوني', desc: 'حساب تلقائي لدرجة امتثال كل شحنة وجهة بناءً على اكتمال البيانات والمستندات المطلوبة' },
      { name: 'سجلات المخلفات الرقمية', desc: 'سجلات رقمية منظمة للمخلفات الخطرة وغير الخطرة وفقاً لمتطلبات الجهات التنظيمية' },
      { name: 'تنبيهات الشحنات العالقة', desc: 'نظام تنبيه آلي للشحنات المتأخرة أكثر من 48 ساعة مع تصعيد تلقائي للمسؤولين' },
      { name: 'حماية بيانات GDPR', desc: 'أدوات الامتثال لقوانين حماية البيانات مع تشفير شامل وحقوق الحذف والنسيان' },
      { name: 'سلسلة الحفظ Blockchain-lite', desc: 'تتبع سلسلة حيازة المخلفات بتقنية blockchain-lite تضمن عدم التلاعب بالسجلات' },
    ]
  },
  {
    title: '🌊 الذكاء البيئي وخرائط التدفق',
    icon: Network,
    color: 'from-cyan-500 to-blue-500',
    subtitle: 'Environmental Intelligence & Waste Flow Mapping',
    features: [
      { name: 'خرائط حرارية تفاعلية', desc: 'خرائط حرارية توضح كثافة توليد المخلفات جغرافياً مع تحديد النقاط الساخنة (Hotspots)' },
      { name: 'تدفق المخلفات الحي', desc: 'تتبع تدفق المخلفات من المصادر (المولدين) عبر النقل حتى الوجهة النهائية (تدوير/تخلص)' },
      { name: 'تحليل أنواع المخلفات', desc: 'تصنيفات وإحصائيات مفصلة لأنواع وكميات المخلفات مع رسوم بيانية تفاعلية عبر الزمن' },
      { name: 'بورصة السلع البيئية', desc: 'أسعار لحظية للمواد المعاد تدويرها عالمياً (بلاستيك، ورق، معادن، زجاج) مع تحليلات واتجاهات' },
      { name: 'تقارير الأثر التراكمي', desc: 'دمج بيانات كافة الشركاء لتوفير رؤية تراكمية دقيقة للأثر البيئي الإجمالي' },
      { name: 'كشف الاحتيال البيئي', desc: 'محرك AI لرصد التلاعب بالأوزان والشحنات المشبوهة وضمان دقة البيانات البيئية' },
      { name: 'التنبؤ بتوليد المخلفات', desc: 'نماذج تنبؤية تتوقع كميات وأنواع المخلفات المستقبلية بناءً على الأنماط التاريخية' },
    ]
  },
];

// ===== الأقسام التشغيلية والإدارية =====
const operationSections = [
  {
    title: 'إدارة الشحنات واللوجستيات',
    icon: Package,
    color: 'from-blue-600 to-cyan-500',
    subtitle: 'Shipment & Logistics Management',
    features: [
      { name: 'إنشاء الشحنات الذكي', desc: 'إنشاء شحنات نقل مخلفات مع تعبئة تلقائية للبيانات وتتبع لحظي عبر GPS ورموز QR فريدة' },
      { name: 'سلسلة الموافقات المتعددة', desc: 'نظام موافقات متسلسل من المولد والناقل والمدور مع موافقة تلقائية بعد 6 ساعات' },
      { name: 'المانيفست الرقمي الموحد', desc: 'مستند رقمي شامل يرافق الشحنة من المصدر حتى الوجهة النهائية مع QR Chain' },
      { name: '7 مستندات قانونية تلقائية', desc: 'شهادات استلام وتسليم وإقرارات ومانيفست تُصدر تلقائياً مع كل شحنة بختم وتوقيع رقمي' },
      { name: 'إدارة الشحنات المرفوضة', desc: 'نظام متكامل لمعالجة الشحنات المرفوضة مع أسباب الرفض وإعادة التوجيه التلقائي' },
      { name: 'تتبع سلسلة الحيازة', desc: 'Chain of Custody تتبع كامل لحيازة المخلفات من نقطة التوليد حتى التخلص النهائي' },
      { name: 'الشحنات المجمّعة', desc: 'تجميع عدة شحنات صغيرة في رحلة واحدة لتحسين الكفاءة وتقليل التكاليف والانبعاثات' },
      { name: 'بوابة طلبات الجمع', desc: 'نظام يشبه أوبر يمكّن المولدين من طلب جمع المخلفات مع تتبع لحظي لوصول المركبة' },
    ]
  },
  {
    title: 'إدارة السائقين والأسطول',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    subtitle: 'Fleet & Driver Management',
    features: [
      { name: 'لوحة تحكم السائق الذكية', desc: 'واجهة Mobile-first بـ 14+ تبويباً تشمل المهام والأداء والمكافآت والسلامة والأكاديمية' },
      { name: 'التتبع اللحظي GPS', desc: 'تتبع مواقع السائقين والمركبات على خريطة حية مع تحديثات كل 30 ثانية وسجل المسارات' },
      { name: 'أكاديمية السائقين', desc: 'برنامج تدريبي متكامل بدورات إلزامية وشهادات معتمدة واختبارات تقييم ومحتوى تفاعلي' },
      { name: 'نظام المكافآت والتحفيز', desc: 'نقاط ومستويات وشارات وسلسلة أيام متتالية (Streaks) ولوحة متصدرين ومكافآت مادية' },
      { name: 'الكاميرا الذكية AI', desc: 'تصنيف المخلفات بالكاميرا وتقدير الأوزان بالذكاء الاصطناعي مع تقرير فوري' },
      { name: 'إدارة المركبات', desc: 'سجل كامل لكل مركبة: الرخص، التأمين، الصيانة، استهلاك الوقود، تاريخ الشحنات' },
      { name: 'تقييم أداء السائقين', desc: 'مؤشرات أداء شاملة: السرعة، الالتزام بالمواعيد، جودة الخدمة، السلامة، رضا العملاء' },
      { name: 'تنبيهات السائق الاستباقية', desc: 'تنبيهات ذكية قبل انتهاء الرخص والتأمين والفحوصات مع جدولة تلقائية للتجديد' },
      { name: 'الصيانة التنبؤية للأسطول', desc: 'توقع الأعطال قبل حدوثها بناءً على بيانات التشغيل والاستهلاك مع جدولة صيانة ذكية' },
    ]
  },
  {
    title: 'إدارة المصانع والتدوير',
    icon: Factory,
    color: 'from-lime-500 to-green-500',
    subtitle: 'Factory & Recycling Operations',
    features: [
      { name: 'التوأم الرقمي للمصنع', desc: 'Digital Twin لمراقبة أرضية المصنع وخطوط الإنتاج في الوقت الفعلي مع تنبيهات ذكية' },
      { name: 'أوامر التشغيل (Work Orders)', desc: 'إدارة الدُفعات مع حساب التكلفة الفعلية للطن شاملة المواد والعمالة والطاقة والنفقات العامة' },
      { name: 'فحص الجودة بالـ AI', desc: 'منع التلوث الخلطي وضمان جودة المنتجات المعاد تدويرها مع معايير قبول تلقائية' },
      { name: 'الصيانة التنبؤية', desc: 'توقع الأعطال قبل حدوثها باستخدام بيانات الاستهلاك والتشغيل وتقليل وقت التوقف' },
      { name: 'شهادات المنتجات بـ QR', desc: 'شهادات تتبع سلسلة الحيازة من المصدر حتى المنتج النهائي مع كود تحقق عام' },
      { name: 'إدارة الطاقة', desc: 'تتبع استهلاك الطاقة لكل خط إنتاج مع تحديد فرص التوفير وحساب كثافة الطاقة لكل طن' },
      { name: 'التحليل المتقدم للإنتاج', desc: 'مؤشرات OEE (فعالية المعدات الكلية) مع تحليل أسباب التوقف وخسائر الجودة' },
    ]
  },
  {
    title: 'النظام المالي ERP المتكامل',
    icon: Wallet,
    color: 'from-violet-500 to-purple-500',
    subtitle: 'Enterprise Resource Planning & Finance',
    features: [
      { name: 'المحاسبة المالية الكاملة', desc: 'دفتر أستاذ وقوائم مالية تلقائية (دخل، مركز مالي، تدفقات نقدية) مع ترحيل آلي' },
      { name: 'الفواتير الإلكترونية', desc: 'فواتير متوافقة مع المعايير المحلية والدولية بختم وتوقيع رقمي وإرسال تلقائي' },
      { name: 'إدارة المخازن', desc: 'تتبع المخزون بنظام FIFO والمتوسط المرجح مع حساب COGS وتنبيهات المخزون' },
      { name: 'الموارد البشرية', desc: 'إدارة الموظفين والرواتب والحضور والإجازات والمزايا مع تقارير شاملة' },
      { name: 'التأمين الذكي', desc: 'احتساب آلي لأقساط التأمين بناءً على تحليل مخاطر الشحنة (نوع المخلف، المسافة، القيمة)' },
      { name: 'العقود الآجلة للنقل', desc: 'تأمين أسعار نقل مستقبلية مع عقود آجلة (Transport Futures) للتحوط ضد تقلبات الأسعار' },
      { name: 'المحفظة الإلكترونية', desc: 'محفظة رقمية لكل منظمة مع تحويلات فورية وسجل معاملات شامل ورصيد لحظي' },
      { name: 'فترات الحساب المالية', desc: 'إدارة فترات محاسبية مع ترصيد تلقائي وترحيل أرصدة وتقارير مقارنة بين الفترات' },
      { name: 'تسعير ديناميكي', desc: 'Dynamic Pricing يحسب أسعار النقل تلقائياً بناءً على المسافة والوزن والطلب والموسم' },
    ]
  },
  {
    title: 'الوساطة وبورصة المخلفات',
    icon: TrendingUp,
    color: 'from-fuchsia-500 to-pink-500',
    subtitle: 'Waste Brokerage & Exchange Platform',
    features: [
      { name: 'لوحة تحكم الوسيط', desc: 'Mission Control للوسطاء مع رؤية شاملة للصفقات والأرباح والشركاء وفرص السوق' },
      { name: 'بورصة المخلفات المفتوحة', desc: 'Marketplace لتداول المخلفات القابلة للتدوير مع عروض بيع وشراء وتفاوض فوري' },
      { name: 'المزادات الإلكترونية', desc: 'مزادات عكسية وعادية للمخلفات مع نظام مزايدات آلي وإشعارات للمنافسين' },
      { name: 'تحليل الأرباح والهوامش', desc: 'تقارير ربحية مفصلة لكل صفقة مع حساب الهامش بعد خصم التكاليف التشغيلية' },
      { name: 'إدارة صفقات الشراء والبيع', desc: 'متابعة صفقات الشراء من المولدين والبيع للمدورين مع ربط الفواتير والشحنات' },
      { name: 'أسعار السوق اللحظية', desc: 'متابعة أسعار المواد المعاد تدويرها عالمياً ومحلياً مع رسوم بيانية واتجاهات' },
    ]
  },
  {
    title: 'الذكاء الاصطناعي المتقدم',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    subtitle: 'Advanced AI & Machine Learning',
    features: [
      { name: 'مساعد AI التفاعلي', desc: 'مساعد ذكي يفهم الاستفسارات باللغة العربية والإنجليزية ويقدم إجابات فورية ويحلل البيانات' },
      { name: 'تصنيف المخلفات بالصور', desc: 'تحليل صور المخلفات وتصنيفها تلقائياً مع تحديد نسب النقاء والتلوث بدقة عالية' },
      { name: 'تحسين المسارات', desc: 'خوارزميات ذكية لتحسين مسارات النقل وتقليل التكاليف والانبعاثات والوقت' },
      { name: 'محسّن الإنتاج الذكي', desc: 'Smart Optimizer لرفع كفاءة الاستخلاص وتقليل الهالك وتحسين جودة المخرجات' },
      { name: 'تحليل المشاعر والمكالمات', desc: 'تحليل AI لمكالمات خدمة العملاء مع تقييم الأداء والمشاعر والاقتراحات التلقائية' },
      { name: 'التنبؤات والتوقعات', desc: 'نماذج تنبؤية لحجم المخلفات والأسعار والطلب مع دقة تتجاوز 85%' },
      { name: 'كشف الاحتيال الذكي', desc: 'محرك AI لرصد التلاعب بالأوزان والبيانات المشبوهة وضمان دقة السجلات' },
      { name: '10+ نماذج AI متاحة', desc: 'دعم أحدث نماذج الذكاء الاصطناعي: GPT-5, Gemini 2.5 Pro, Gemini Flash للمهام المختلفة' },
    ]
  },
  {
    title: 'العقود والشركاء والتواصل',
    icon: Handshake,
    color: 'from-sky-500 to-blue-500',
    subtitle: 'Contracts, Partners & Communication',
    features: [
      { name: 'إدارة العقود الرقمية', desc: 'إنشاء عقود بقوالب جاهزة مع بنود تلقائية وتوقيعات وأختام رقمية وتجديد آلي' },
      { name: 'خطابات الترسية', desc: 'إصدار خطابات ترسية مع بنود تفصيلية وأسعار وكميات مع ربط بالعقود والشحنات' },
      { name: 'شبكة الشركاء والتقييم', desc: 'بناء شبكة شركاء مع نظام تقييم متبادل (5 نجوم) وتحليل مخاطر الشركاء ودرجة الموثوقية' },
      { name: 'الشركاء الخارجيون', desc: 'إدارة الشركاء خارج المنصة مع بيانات تواصل وحسابات مالية مستقلة' },
      { name: 'بوابة العملاء والتتبع العام', desc: 'بوابة خدمة ذاتية للعملاء لتتبع شحناتهم وفواتيرهم وطلب خدمات جديدة' },
      { name: 'الملف التعريفي العام', desc: 'صفحة عامة قابلة للمشاركة تعرض بيانات المنظمة المسموح بها مع كود تحقق فريد' },
      { name: 'نظام الإشعارات المتعدد', desc: 'إشعارات لحظية + واتساب + بريد إلكتروني + SMS + إشعارات PWA' },
      { name: 'الدردشة الداخلية', desc: 'نظام رسائل فورية بين أطراف الشحنة مع مرفقات وإشعارات وسجل محفوظ' },
      { name: 'قصص المنصة', desc: 'نظام قصص (Stories) للإعلانات والتحديثات مع تفاعلات ومشاهدات' },
    ]
  },
  {
    title: 'مركز الاتصال الذكي',
    icon: Phone,
    color: 'from-green-500 to-emerald-600',
    subtitle: 'Smart Call Center & CRM',
    features: [
      { name: 'تسجيل المكالمات', desc: 'تسجيل وأرشفة كافة مكالمات خدمة العملاء مع ربطها بالعملاء والشحنات والشكاوى' },
      { name: 'تحليل AI للمكالمات', desc: 'تحليل تلقائي لمحتوى المكالمة ونبرة العميل مع استخراج النقاط الرئيسية والمهام' },
      { name: 'أداء الموظفين (KPI)', desc: 'مؤشرات أداء فردية وجماعية: متوسط المدة، رضا العملاء، معدل الحل من أول اتصال' },
      { name: 'سجل التذاكر والشكاوى', desc: 'نظام تذاكر متكامل مع تصنيف وأولوية وتتبع حالة وتصعيد تلقائي' },
      { name: 'تنبيهات الجودة', desc: 'تنبيهات فورية عند انخفاض جودة الخدمة أو ارتفاع وقت الانتظار' },
    ]
  },
  {
    title: 'التوظيف ومنصة عُمالنا',
    icon: Users,
    color: 'from-indigo-500 to-blue-600',
    subtitle: 'Omaluna Recruitment Platform',
    features: [
      { name: 'منصة عُمالنا (Omaluna)', desc: 'منظومة توظيف شاملة تربط العمال وأصحاب العمل ومكاتب التوظيف في قطاع المخلفات' },
      { name: 'ملفات العمال التعريفية', desc: 'ملفات شاملة للعمال: المهارات، الخبرات، الشهادات، التقييمات، الموقع، التوفر' },
      { name: 'وكالات التوظيف', desc: 'لوحة تحكم خاصة بوكالات التوظيف لإدارة المرشحين والعقود والعمولات' },
      { name: 'البحث الذكي عن العمال', desc: 'بحث متقدم بالمهارات والموقع والخبرة والتقييم مع ترتيب حسب الملاءمة' },
      { name: 'التطبيق والمطابقة', desc: 'تقديم طلبات توظيف ومطابقة ذكية بين متطلبات الوظيفة ومهارات العمال' },
    ]
  },
  {
    title: 'الإعلانات والتسويق',
    icon: Megaphone,
    color: 'from-rose-500 to-red-500',
    subtitle: 'Advertising & Marketing Platform',
    features: [
      { name: 'نظام إعلانات متكامل', desc: 'منصة إعلانية داخلية مع خطط متعددة (أساسية، متقدمة، مميزة) وأسعار مرنة' },
      { name: 'تحليلات الإعلانات', desc: 'تتبع المشاهدات والنقرات ومعدل التحويل مع تقارير أداء مفصلة لكل إعلان' },
      { name: 'كوبونات وعروض', desc: 'نظام كوبونات خصم مع تتبع الاستخدام والصلاحية وحدود الاستخدام' },
      { name: 'استهداف الجمهور', desc: 'استهداف الإعلانات حسب نوع المنظمة والموقع والنشاط مع وصول دقيق' },
    ]
  },
  {
    title: 'التكاملات والتقنيات',
    icon: Zap,
    color: 'from-cyan-500 to-teal-500',
    subtitle: 'Integrations & Technology Stack',
    features: [
      { name: 'تكامل إنترنت الأشياء IoT', desc: 'ربط أجهزة الموازين والحساسات وأجهزة GPS مع المنصة لتغذية آلية بالبيانات' },
      { name: 'تطبيق PWA متقدم', desc: 'تطبيق ويب تقدمي يعمل بدون إنترنت مع إشعارات فورية وأداء يشبه التطبيقات الأصلية' },
      { name: 'ماسح QR / Barcode', desc: 'قراءة أكواد QR والباركود عبر كاميرا الهاتف لتتبع الشحنات والمنتجات فوراً' },
      { name: 'API مفتوح للتكامل', desc: 'واجهة برمجة تطبيقات RESTful مع مفاتيح API وصلاحيات دقيقة وتوثيق شامل' },
      { name: 'خرائط Google متقدمة', desc: 'تكامل كامل مع خرائط Google: تتبع حي، حساب مسافات، Geocoding، مسارات مُحسّنة' },
      { name: 'تصدير Excel وPDF', desc: 'تصدير كافة التقارير والبيانات بصيغ Excel وPDF مع تنسيقات احترافية وعلامة مائية' },
      { name: 'الوقت الحقيقي (Realtime)', desc: 'تحديثات فورية للبيانات عبر WebSocket مع إشعارات لحظية دون تحديث الصفحة' },
    ]
  },
  {
    title: 'إدارة النظام والحوكمة',
    icon: Settings,
    color: 'from-gray-600 to-slate-700',
    subtitle: 'System Administration & Governance',
    features: [
      { name: 'لوحة مدير النظام', desc: 'لوحة تحكم مركزية بـ 81+ فحصاً آلياً لسلامة النظام مع تقارير حالة شاملة' },
      { name: 'إدارة المنظمات', desc: 'إنشاء وإدارة منظمات متعددة مع أنواع مختلفة (مولد، ناقل، مدور، وسيط، مدفن)' },
      { name: 'الصلاحيات والأدوار', desc: 'نظام صلاحيات دقيق بأدوار متعددة (مالك، مدير، مشغل، سائق، مراقب) مع تخصيص كامل' },
      { name: 'سجلات التدقيق', desc: 'تسجيل كامل لكل إجراء على النظام: من فعل ماذا ومتى وأين مع بيانات IP والجهاز' },
      { name: 'النسخ الاحتياطي', desc: 'نسخ احتياطي تلقائي ويدوي مع أرشفة ذكية للبيانات القديمة وسياسات احتفاظ مرنة' },
      { name: 'المصادقة البيومترية', desc: 'تسجيل دخول ببصمة الإصبع و Face ID مع مصادقة ثنائية لأقصى درجات الأمان' },
      { name: 'التوقيع والختم الرقمي', desc: 'إدارة التوقيعات والأختام الرسمية مع توقيع تلقائي للمستندات حسب الإعدادات' },
      { name: 'المفوضون بالتوقيع', desc: 'إدارة قائمة المفوضين بالتوقيع على العقود والشهادات والفواتير مع صلاحيات محددة' },
    ]
  },
];

const stats = [
  { label: 'مؤشر بيئي', value: '30+', desc: 'ESG, GRI, ISO, Basel' },
  { label: 'هدف SDG', value: '8', desc: 'أهداف تنمية مستدامة' },
  { label: 'نوع مخلف', value: '10+', desc: 'بمعاملات IPCC معتمدة' },
  { label: 'شهادة رقمية', value: '5+', desc: 'كربون، استدامة، امتثال' },
  { label: 'معيار دولي', value: 'ISO', desc: '14001 + 45001 متكامل' },
  { label: 'وحدة وظيفية', value: '150+', desc: 'مديول ووظيفة متكاملة' },
  { label: 'نموذج AI', value: '10+', desc: 'GPT-5, Gemini, Flash' },
  { label: 'تكامل خارجي', value: '15+', desc: 'IoT, GPS, خرائط, API' },
];

const whyUs = [
  { title: 'حل شامل متكامل', desc: 'منصة واحدة تغطي سلسلة القيمة الكاملة: من توليد المخلفات حتى التدوير النهائي، بدلاً من 10+ أنظمة منفصلة', icon: Layers },
  { title: 'امتثال دولي ومحلي', desc: 'متوافقة مع ISO 14001, ISO 45001, GRI Standards, Basel Convention, GDPR واللوائح المصرية', icon: ShieldCheck },
  { title: 'ذكاء اصطناعي متقدم', desc: '10+ نماذج AI لتصنيف المخلفات وتحسين المسارات وكشف الاحتيال والتنبؤ بالأسعار', icon: Brain },
  { title: 'استدامة بيئية حقيقية', desc: 'بصمة كربونية IPCC، اقتصاد دائري MCI، أرصدة كربون، تقارير ESG — ليست مجرد شعارات', icon: Leaf },
  { title: 'أمان على أعلى مستوى', desc: 'تشفير شامل، مصادقة بيومترية، blockchain-lite، سجلات تدقيق كاملة، حماية GDPR', icon: Lock },
  { title: 'سحابية وسريعة', desc: 'تعمل على أي جهاز، PWA بدون تثبيت، تحديثات فورية، بيانات لحظية، أداء عالٍ', icon: Globe },
];

export default function PlatformBrochure() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      import('@/services/documentService').then(({ PrintService }) => {
        PrintService.printHTML(printRef.current!.innerHTML, { title: 'بروشور المنصة' });
      });
    }
  };

  const totalFeatures = [...environmentSections, ...operationSections].reduce((sum, s) => sum + s.features.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        <BackButton />
        {/* Header with print button */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold">بروشور المنصة الشامل</h1>
            <p className="text-muted-foreground text-sm">دليل تسويقي شامل لعرضه على الشركات والعملاء المحتملين — {totalFeatures} وظيفة مفصّلة</p>
          </div>
          <Button onClick={handlePrint} className="gap-2" size="lg">
            <Printer className="w-5 h-5" />
            طباعة البروشور
          </Button>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="print-brochure space-y-5" style={{ width: '210mm', margin: '0 auto' }}>
          {/* ===== Cover Page ===== */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="bg-gradient-to-bl from-primary via-primary/90 to-primary/70 p-10 text-primary-foreground text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <PlatformLogo size="xl" showText inverted showSubtitle />
              </div>
              <p className="text-2xl font-bold mb-3">نظام التشغيل الصناعي لإدارة المخلفات والاستدامة البيئية</p>
              <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-2">
                Industrial Operating System for Waste Management & Environmental Sustainability
              </p>
              <Separator className="bg-primary-foreground/20 my-5 max-w-xl mx-auto" />
              <p className="text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
                الحل الرقمي الشامل لإدارة سلسلة القيمة الكاملة للمخلفات: من التوليد والنقل حتى التدوير والتخلص الآمن، 
                مع رقابة بيئية متقدمة، بصمة كربونية IPCC، اقتصاد دائري، تقارير ESG، 
                وامتثال كامل لمعايير ISO 14001 / ISO 45001 / GRI Standards / Basel Convention
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50 border">
                    <p className="text-2xl font-black text-primary">{stat.value}</p>
                    <p className="text-xs font-semibold">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ===== Why Choose Us ===== */}
          <Card className="overflow-hidden break-inside-avoid">
            <div className="bg-gradient-to-l from-primary/90 to-primary p-4 text-primary-foreground">
              <h2 className="text-xl font-bold text-center">لماذا iRecycle؟ — ميزتنا التنافسية</h2>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {whyUs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0 h-fit">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ===== Environment & Safety Section Header ===== */}
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 break-inside-avoid">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-400">القسم الأول: البيئة والاستدامة والسلامة</h2>
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">
              {environmentSections.length} منظومات بيئية متكاملة • {environmentSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة متخصصة
            </p>
          </div>

          {/* ===== Environment Sections ===== */}
          {environmentSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="overflow-hidden break-inside-avoid border-2 border-emerald-500/20 ring-1 ring-emerald-500/10">
                <div className={`bg-gradient-to-l ${section.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold">{section.title}</h2>
                      <p className="text-white/70 text-xs">{section.subtitle}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                      {section.features.length} وظيفة
                    </Badge>
                    <Badge className="bg-white text-emerald-700 border-0 text-[10px] font-bold">
                      🌿 بيئة وسلامة
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <div key={feature.name} className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
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

          {/* ===== Operations Section Header ===== */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800 break-inside-avoid">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Cog className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-black text-blue-700 dark:text-blue-400">القسم الثاني: العمليات والإدارة والتكنولوجيا</h2>
              <Cog className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-500">
              {operationSections.length} منظومات تشغيلية • {operationSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة متكاملة
            </p>
          </div>

          {/* ===== Operation Sections ===== */}
          {operationSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="overflow-hidden break-inside-avoid">
                <div className={`bg-gradient-to-l ${section.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold">{section.title}</h2>
                      <p className="text-white/70 text-xs">{section.subtitle}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                      {section.features.length} وظيفة
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <div key={feature.name} className="flex gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
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

          {/* ===== Summary Stats ===== */}
          <Card className="overflow-hidden break-inside-avoid border-2 border-primary/20">
            <div className="bg-gradient-to-l from-primary to-primary/80 p-4 text-primary-foreground text-center">
              <h2 className="text-xl font-bold">ملخص المنصة بالأرقام</h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                  <p className="text-3xl font-black text-emerald-600">{environmentSections.length}</p>
                  <p className="text-sm font-bold">منظومة بيئية</p>
                  <p className="text-xs text-muted-foreground">{environmentSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة متخصصة</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                  <p className="text-3xl font-black text-blue-600">{operationSections.length}</p>
                  <p className="text-sm font-bold">منظومة تشغيلية</p>
                  <p className="text-xs text-muted-foreground">{operationSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة متكاملة</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200">
                  <p className="text-3xl font-black text-purple-600">{totalFeatures}</p>
                  <p className="text-sm font-bold">إجمالي الوظائف</p>
                  <p className="text-xs text-muted-foreground">في منصة واحدة متكاملة</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                  <p className="text-3xl font-black text-amber-600">{environmentSections.length + operationSections.length}</p>
                  <p className="text-sm font-bold">قسم رئيسي</p>
                  <p className="text-xs text-muted-foreground">يغطي كافة الاحتياجات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Footer ===== */}
          <Card className="overflow-hidden break-inside-avoid">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-primary">
                <PlatformLogo size="lg" showText showSubtitle />
              </div>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                نظام التشغيل الصناعي الأول من نوعه لقطاع إدارة المخلفات وإعادة التدوير في مصر والشرق الأوسط
              </p>
              <Separator className="max-w-md mx-auto" />
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> منصة سحابية آمنة</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> تحديثات مستمرة</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> دعم فني 24/7</span>
                <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> تشفير شامل</span>
              </div>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} iRecycle — جميع الحقوق محفوظة • هذا البروشور للاستخدام التعريفي والتسويقي
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
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

          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

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

          .print-brochure {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          .print-brochure > * {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 6px !important;
            box-shadow: none !important;
          }

          .print-brochure [class*="bg-gradient"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-brochure .grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4px !important;
          }

          .print-brochure .grid-cols-2.sm\\:grid-cols-4.md\\:grid-cols-8 {
            grid-template-columns: repeat(8, 1fr) !important;
          }

          .print-brochure .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          .print-brochure .md\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          .print-brochure p.text-xs {
            font-size: 8pt !important;
            line-height: 1.3 !important;
          }
          .print-brochure p.text-sm {
            font-size: 9pt !important;
          }
          .print-brochure h2 {
            font-size: 12pt !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          .space-y-5 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 6px !important;
          }
          .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
