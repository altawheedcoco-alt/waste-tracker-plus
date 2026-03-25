import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Leaf, BarChart3, Truck, Recycle, Globe, CheckCircle2, Sparkles, Zap, Brain, FileCheck, Users, Factory, Wallet, MapPin, Scale, GraduationCap, ClipboardCheck, Cpu, Layers, Building2, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PlatformLogo from '@/components/common/PlatformLogo';

import authIllustration from '@/assets/auth-side-illustration.webp';
import authIllustration2 from '@/assets/auth-illustration-2.webp';
import authIllustration3 from '@/assets/auth-illustration-3.webp';
import authIllustration4 from '@/assets/auth-illustration-4.webp';
import authIllustration5 from '@/assets/auth-illustration-5.webp';
import authIllustration6 from '@/assets/auth-illustration-6.webp';
import authIllustration7 from '@/assets/auth-illustration-7.webp';
import authIllustration8 from '@/assets/auth-illustration-8.webp';
import authIllustration9 from '@/assets/auth-illustration-9.webp';
import authIllustration10 from '@/assets/auth-illustration-10.webp';
import authIllustration11 from '@/assets/auth-illustration-11.webp';
import authIllustration12 from '@/assets/auth-illustration-12.webp';
import authIllustration13 from '@/assets/auth-illustration-13.webp';
import authIllustration14 from '@/assets/auth-illustration-14.webp';
import authIllustration15 from '@/assets/auth-illustration-15.webp';
import authIllustration16 from '@/assets/auth-illustration-16.webp';

interface SlideData {
  src: string;
  alt: string;
  headline: string;
  highlightText: string;
  subtitle: string;
  stats: { value: string; label: string; icon: any }[];
  features: { icon: any; label: string; desc: string }[];
}

const slides: SlideData[] = [
  {
    src: authIllustration,
    alt: 'منصة iRecycle الرقمية',
    headline: 'رقمنة شاملة لإدارة',
    highlightText: 'سلسلة التوريد البيئية',
    subtitle: 'تحول رقمي متكامل · تتبع إلكتروني · فوترة رقمية · امتثال قانوني',
    stats: [
      { value: '+500', label: 'جهة مسجلة', icon: Users },
      { value: '+10K', label: 'عملية شهرياً', icon: FileCheck },
      { value: '99.9%', label: 'وقت التشغيل', icon: Zap },
    ],
    features: [
      { icon: Recycle, label: 'سلسلة التوريد البيئية', desc: 'تتبع رقمي شامل من المصدر حتى التخلص' },
      { icon: Brain, label: 'ذكاء اصطناعي متقدم', desc: 'تحليلات وتوصيات مدعومة بـ AI' },
      { icon: Shield, label: 'أمان وامتثال', desc: 'تشفير E2E وتوقيع رقمي وقانون 202' },
      { icon: Zap, label: 'سوق شحنات ومزادات', desc: 'مزايدة عكسية ومحفظة رقمية' },
    ],
  },
  {
    src: authIllustration2,
    alt: 'لوحة تحكم ذكية',
    headline: 'مركز قيادة وسيطرة',
    highlightText: 'لحظي وشامل',
    subtitle: 'لوحات بيانية تفاعلية · مؤشرات أداء · تنبيهات ذكية · تقارير آلية',
    stats: [
      { value: '+50', label: 'مؤشر أداء', icon: BarChart3 },
      { value: '24/7', label: 'رصد مستمر', icon: Zap },
      { value: '+20', label: 'تقرير آلي', icon: FileCheck },
    ],
    features: [
      { icon: BarChart3, label: 'تقارير ولوحات بيانية', desc: 'تقارير آلية للجهات الرقابية الأربع' },
      { icon: Zap, label: 'تنبيهات لحظية', desc: 'إشعارات فورية عند حدوث أي تغيير' },
      { icon: Brain, label: 'تحليل ذكي', desc: 'رؤى استباقية بالذكاء الاصطناعي' },
      { icon: ClipboardCheck, label: 'تقارير الامتثال', desc: 'توليد آلي لتقارير الجهاز التنظيمي' },
    ],
  },
  {
    src: authIllustration3,
    alt: 'فرز ذكي بالروبوتات',
    headline: 'فرز وتصنيف آلي بـ',
    highlightText: 'الذكاء الاصطناعي',
    subtitle: 'تصنيف تلقائي للمخلفات · تحليل جودة · كشف تلوث · تقييم بصري',
    stats: [
      { value: '95%', label: 'دقة التصنيف', icon: Brain },
      { value: '+40', label: 'نوع مخلفات', icon: Layers },
      { value: '<3s', label: 'زمن التحليل', icon: Zap },
    ],
    features: [
      { icon: Brain, label: 'رؤية حاسوبية', desc: 'تحليل صور المخلفات وتصنيفها تلقائياً' },
      { icon: Scale, label: 'تقييم الجودة', desc: 'فحص نقاء المواد ونسبة التلوث' },
      { icon: ClipboardCheck, label: 'توثيق آلي', desc: 'تسجيل نتائج الفحص رقمياً' },
      { icon: Factory, label: 'ربط بالمصانع', desc: 'إرسال المواد المصنفة للمدور المناسب' },
    ],
  },
  {
    src: authIllustration4,
    alt: 'تتبع أسطول النقل',
    headline: 'أسطول ذكي ثلاثي',
    highlightText: 'بتتبع GPS لحظي',
    subtitle: 'سائقون تابعون · مستقلون · مؤجرون · تتبع حي · مسارات ذكية',
    stats: [
      { value: '+300', label: 'مركبة نشطة', icon: Truck },
      { value: '+1K', label: 'رحلة يومياً', icon: Route },
      { value: '100%', label: 'تتبع GPS', icon: MapPin },
    ],
    features: [
      { icon: Truck, label: 'أسطول ذكي ثلاثي', desc: 'سائقون تابعون ومستقلون ومؤجرون' },
      { icon: MapPin, label: 'تتبع GPS لحظي', desc: 'مراقبة الموقع والسرعة والمسار' },
      { icon: Route, label: 'تحسين المسارات', desc: 'خوارزميات ذكية لأقصر مسار' },
      { icon: Scale, label: 'ميزان إلكتروني', desc: 'وزن رقمي عند التحميل والتفريغ' },
    ],
  },
  {
    src: authIllustration5,
    alt: 'الاقتصاد الدائري',
    headline: 'منظومة متكاملة لـ',
    highlightText: 'الاقتصاد الدائري',
    subtitle: 'تتبع دورة حياة المواد · من المصدر حتى إعادة التصنيع · صفر نفايات',
    stats: [
      { value: '+85%', label: 'معدل تدوير', icon: Recycle },
      { value: '0', label: 'هدر مواد', icon: Leaf },
      { value: '+200', label: 'مادة معاد تدويرها', icon: Layers },
    ],
    features: [
      { icon: Recycle, label: 'تتبع دورة الحياة', desc: 'رصد المواد من التوليد حتى التدوير' },
      { icon: Leaf, label: 'بصمة كربونية', desc: 'حساب وتقليل الانبعاثات البيئية' },
      { icon: Factory, label: 'ربط المصانع', desc: 'توصيل المواد الخام بالمصانع المناسبة' },
      { icon: BarChart3, label: 'تقارير الاستدامة', desc: 'مؤشرات بيئية وتقارير ESG' },
    ],
  },
  {
    src: authIllustration6,
    alt: 'الامتثال الرقمي',
    headline: 'امتثال قانوني رقمي',
    highlightText: 'بتوقيع إلكتروني',
    subtitle: 'عقود رقمية · شهادات ISO · تراخيص إلكترونية · تقارير رقابية',
    stats: [
      { value: '100%', label: 'توثيق رقمي', icon: Shield },
      { value: '+15', label: 'نوع شهادة', icon: FileCheck },
      { value: '202', label: 'امتثال قانون', icon: ClipboardCheck },
    ],
    features: [
      { icon: Shield, label: 'توقيع إلكتروني', desc: 'توقيع رقمي معتمد وآمن' },
      { icon: FileCheck, label: 'شهادات رقمية', desc: 'إصدار شهادات ISO وEPR إلكترونياً' },
      { icon: ClipboardCheck, label: 'تراخيص إلكترونية', desc: 'إدارة ومتابعة التراخيص البيئية' },
      { icon: Globe, label: 'معايير دولية', desc: 'متوافق مع اتفاقية بازل ومعايير EU' },
    ],
  },
  {
    src: authIllustration7,
    alt: 'المدن الذكية وIoT',
    headline: 'حاويات ذكية بـ',
    highlightText: 'إنترنت الأشياء',
    subtitle: 'مستشعرات IoT · تنبيهات امتلاء · جدولة آلية · صيانة تنبؤية',
    stats: [
      { value: '+5K', label: 'حاوية متصلة', icon: Cpu },
      { value: '80%', label: 'توفير وقود', icon: Leaf },
      { value: '0', label: 'فيضان حاويات', icon: Zap },
    ],
    features: [
      { icon: Cpu, label: 'مستشعرات IoT', desc: 'قياس مستوى الامتلاء والحرارة' },
      { icon: MapPin, label: 'خريطة حية', desc: 'عرض حالة كافة الحاويات لحظياً' },
      { icon: Zap, label: 'تنبيهات ذكية', desc: 'إشعار تلقائي عند الامتلاء' },
      { icon: Route, label: 'جدولة تلقائية', desc: 'تحسين مواعيد الجمع بالذكاء' },
    ],
  },
  {
    src: authIllustration8,
    alt: 'مختبر التحليل',
    headline: 'تحليل بيئي رقمي',
    highlightText: 'مدعوم بالذكاء',
    subtitle: 'فحوصات معملية · تصنيفات دقيقة · اعتماد رقمي · شهادات فحص',
    stats: [
      { value: '+30', label: 'اختبار معملي', icon: Brain },
      { value: '99%', label: 'دقة النتائج', icon: CheckCircle2 },
      { value: '<24h', label: 'زمن الاعتماد', icon: Zap },
    ],
    features: [
      { icon: Brain, label: 'تحليل AI للصور', desc: 'تحليل بصري ذكي لعينات المخلفات' },
      { icon: Scale, label: 'اختبارات الجودة', desc: 'فحص نسبة الرطوبة والتلوث' },
      { icon: FileCheck, label: 'شهادات الفحص', desc: 'إصدار شهادات اعتماد رقمية' },
      { icon: ClipboardCheck, label: 'سجل المختبر', desc: 'أرشيف رقمي لكافة الفحوصات' },
    ],
  },
  {
    src: authIllustration9,
    alt: 'تحويل نفايات لطاقة',
    headline: 'تحويل المخلفات إلى',
    highlightText: 'طاقة متجددة',
    subtitle: 'محطات WtE · مراقبة الانبعاثات · كفاءة الطاقة · تقارير بيئية',
    stats: [
      { value: '+50MW', label: 'طاقة مولدة', icon: Zap },
      { value: '-60%', label: 'خفض انبعاثات', icon: Leaf },
      { value: '24/7', label: 'مراقبة مستمرة', icon: BarChart3 },
    ],
    features: [
      { icon: Zap, label: 'محطات الطاقة', desc: 'مراقبة رقمية لمحطات تحويل النفايات' },
      { icon: Leaf, label: 'خفض الانبعاثات', desc: 'رصد ومعالجة الغازات الدفيئة' },
      { icon: BarChart3, label: 'كفاءة الإنتاج', desc: 'تحسين معدلات تحويل الطاقة' },
      { icon: Globe, label: 'اعتمادات كربونية', desc: 'توليد شهادات خفض الانبعاثات' },
    ],
  },
  {
    src: authIllustration10,
    alt: 'المستودعات الذكية',
    headline: 'مستودعات ذكية بـ',
    highlightText: 'أتمتة كاملة',
    subtitle: 'روبوتات فرز · باركود رقمي · جرد آلي · تتبع المخزون',
    stats: [
      { value: '+100', label: 'مستودع متصل', icon: Building2 },
      { value: '0', label: 'خطأ جرد', icon: CheckCircle2 },
      { value: '<1min', label: 'زمن البحث', icon: Zap },
    ],
    features: [
      { icon: Building2, label: 'إدارة المخزون', desc: 'جرد آلي وتتبع لحظي للمواد' },
      { icon: Layers, label: 'باركود وQR', desc: 'ترميز رقمي لكافة المواد' },
      { icon: Cpu, label: 'أتمتة ذكية', desc: 'روبوتات فرز وتصنيف آلية' },
      { icon: BarChart3, label: 'تقارير المخزون', desc: 'تنبيهات نفاد وتقارير دورية' },
    ],
  },
  {
    src: authIllustration11,
    alt: 'الامتثال الدولي',
    headline: 'امتثال دولي لـ',
    highlightText: 'المعايير البيئية',
    subtitle: 'اتفاقية بازل · معايير EU · شهادات EPR · تقارير ESG',
    stats: [
      { value: '+12', label: 'معيار دولي', icon: Globe },
      { value: '100%', label: 'امتثال بيئي', icon: Shield },
      { value: '+8', label: 'شهادة ISO', icon: FileCheck },
    ],
    features: [
      { icon: Globe, label: 'اتفاقية بازل', desc: 'توثيق نقل المخلفات عبر الحدود' },
      { icon: Shield, label: 'معايير EU', desc: 'متوافق مع التوجيهات الأوروبية' },
      { icon: FileCheck, label: 'شهادات EPR', desc: 'مسؤولية المنتج الممتدة' },
      { icon: BarChart3, label: 'تقارير ESG', desc: 'تقارير الحوكمة البيئية والاجتماعية' },
    ],
  },
  {
    src: authIllustration12,
    alt: 'الفوترة الإلكترونية',
    headline: 'فوترة إلكترونية و',
    highlightText: 'محفظة رقمية',
    subtitle: 'فواتير ضريبية · تسويات آلية · إيصالات رقمية · محاسبة سحابية',
    stats: [
      { value: '+50K', label: 'فاتورة شهرياً', icon: Wallet },
      { value: '0', label: 'خطأ محاسبي', icon: CheckCircle2 },
      { value: '<5s', label: 'زمن الإصدار', icon: Zap },
    ],
    features: [
      { icon: Wallet, label: 'محفظة رقمية', desc: 'رصيد إلكتروني وتسويات فورية' },
      { icon: FileCheck, label: 'فواتير ضريبية', desc: 'متوافقة مع مصلحة الضرائب' },
      { icon: BarChart3, label: 'تقارير مالية', desc: 'كشوف حساب وميزانيات آلية' },
      { icon: ClipboardCheck, label: 'مراجعة حسابات', desc: 'سجل محاسبي شفاف وقابل للتدقيق' },
    ],
  },
  {
    src: authIllustration13,
    alt: 'اللوجستيات الذكية',
    headline: 'لوجستيات ذكية بـ',
    highlightText: 'بوليصة شحن رقمية',
    subtitle: 'أوامر نقل · وزن إلكتروني · تأكيد استلام · تتبع الشحنات',
    stats: [
      { value: '+5K', label: 'شحنة شهرياً', icon: Truck },
      { value: '100%', label: 'توثيق رقمي', icon: Shield },
      { value: '<10min', label: 'زمن المعالجة', icon: Zap },
    ],
    features: [
      { icon: Truck, label: 'بوليصة رقمية', desc: 'إصدار وتوقيع إلكتروني فوري' },
      { icon: Scale, label: 'وزن ذكي', desc: 'ربط بالموازين الإلكترونية' },
      { icon: MapPin, label: 'تتبع الشحنة', desc: 'معرفة موقع الشحنة لحظياً' },
      { icon: CheckCircle2, label: 'تأكيد الاستلام', desc: 'توقيع رقمي عند التسليم' },
    ],
  },
  {
    src: authIllustration14,
    alt: 'الرصد البيئي',
    headline: 'محطات رصد بيئي',
    highlightText: 'متصلة بالسحابة',
    subtitle: 'قياس الهواء · مراقبة المياه · تحليل التربة · إنذار مبكر',
    stats: [
      { value: '+200', label: 'محطة رصد', icon: MapPin },
      { value: '5min', label: 'تحديث البيانات', icon: Zap },
      { value: '0', label: 'تجاوز حدود', icon: Shield },
    ],
    features: [
      { icon: Leaf, label: 'جودة الهواء', desc: 'قياس مستمر للملوثات والغبار' },
      { icon: Globe, label: 'مراقبة المياه', desc: 'تحليل جودة المياه الجوفية' },
      { icon: Brain, label: 'تنبؤات ذكية', desc: 'توقع مستويات التلوث مسبقاً' },
      { icon: Zap, label: 'إنذار مبكر', desc: 'تنبيه فوري عند تجاوز الحدود' },
    ],
  },
  {
    src: authIllustration15,
    alt: 'سوق إلكتروني',
    headline: 'سوق B2B ومزادات',
    highlightText: 'للمواد المعاد تدويرها',
    subtitle: 'مزايدة عكسية · عروض أسعار · تفاوض رقمي · صفقات آمنة',
    stats: [
      { value: '+1K', label: 'عرض نشط', icon: Layers },
      { value: '+200M', label: 'جنيه تداول', icon: Wallet },
      { value: '+50', label: 'نوع مادة', icon: Recycle },
    ],
    features: [
      { icon: Layers, label: 'سوق المواد', desc: 'عرض وشراء المواد المعاد تدويرها' },
      { icon: Scale, label: 'مزايدة عكسية', desc: 'نظام مزادات تنافسي وشفاف' },
      { icon: Wallet, label: 'صفقات آمنة', desc: 'ضمان الدفع والتسليم الرقمي' },
      { icon: BarChart3, label: 'تحليل الأسعار', desc: 'مؤشرات سوقية ورسوم بيانية' },
    ],
  },
  {
    src: authIllustration16,
    alt: 'أكاديمية التدريب',
    headline: 'أكاديمية تدريب',
    highlightText: 'رقمية معتمدة',
    subtitle: 'دورات تفاعلية · شهادات معتمدة · تدريب عملي · اختبارات تقييم',
    stats: [
      { value: '+30', label: 'دورة تدريبية', icon: GraduationCap },
      { value: '+2K', label: 'متدرب', icon: Users },
      { value: '100%', label: 'شهادات رقمية', icon: FileCheck },
    ],
    features: [
      { icon: GraduationCap, label: 'دورات تفاعلية', desc: 'محتوى تعليمي متخصص بالمخلفات' },
      { icon: FileCheck, label: 'شهادات معتمدة', desc: 'شهادات إلكترونية بباركود التحقق' },
      { icon: Brain, label: 'تقييم ذكي', desc: 'اختبارات تقييم وتتبع التقدم' },
      { icon: Users, label: 'تدريب الفرق', desc: 'برامج تأهيل للمؤسسات والأفراد' },
    ],
  },
];

const AuthSidePanel = () => {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * slides.length));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentIndex];

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{
      background: 'linear-gradient(160deg, hsl(160 68% 32%) 0%, hsl(168 60% 26%) 30%, hsl(180 55% 22%) 60%, hsl(205 68% 28%) 100%)',
    }}>
      {/* Geometric decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] border border-white/[0.06] rounded-full" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-emerald-400/[0.06] rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
      </div>

      {/* Logo Header */}
      <div className="relative z-10 px-5 pt-4 pb-2 shrink-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-center mb-3">
            <PlatformLogo size="md" inverted showSubtitle />
          </div>

          {/* Dynamic headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`headline-${currentIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="p-3 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.08]"
            >
              <h3 className="text-sm font-bold mb-1 leading-snug text-white text-center">
                {slide.headline}{' '}
                <span className="bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">{slide.highlightText}</span>
              </h3>
              <p className="text-white/40 text-[10px] leading-relaxed text-center">
                {slide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Illustration */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 min-h-0 py-2">
        <div className="relative w-full max-w-[200px] xl:max-w-[240px] flex-1 min-h-0 max-h-[220px]">
          <div className="absolute inset-0 bg-white/8 rounded-3xl blur-2xl scale-90" />
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={slide.src}
              alt={slide.alt}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </AnimatePresence>
        </div>
        {/* Dots */}
        <div className="flex gap-1 mt-2 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-white w-4' : 'bg-white/25 hover:bg-white/40 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Stats */}
      <div className="relative z-10 shrink-0 px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`stats-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-3 gap-1.5 mb-2"
          >
            {slide.stats.map((stat, i) => (
              <div key={i} className="text-center py-2 px-1 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.06] group hover:bg-white/[0.12] transition-colors">
                <stat.icon className="w-3 h-3 text-amber-300/60 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-white leading-tight">{stat.value}</p>
                <p className="text-[8px] text-white/45">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Features */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`features-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-1 mb-2"
          >
            {slide.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-2 bg-white/[0.05] backdrop-blur-md rounded-lg py-1.5 px-2 group border border-white/[0.04] hover:bg-white/[0.09] transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[9px] font-semibold leading-tight text-white">{f.label}</h4>
                  <p className="text-[7px] text-white/35 truncate">{f.desc}</p>
                </div>
                <CheckCircle2 className="w-2.5 h-2.5 text-amber-300/50 shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 shrink-0 flex items-center justify-center gap-2 px-5 py-2 border-t border-white/[0.06]">
        <Globe className="w-2.5 h-2.5 text-white/25 shrink-0" />
        <p className="text-[8px] text-white/25 whitespace-nowrap">متوافق مع القانون 202 لسنة 2020 · الركائز الست لمنظومة v5.1</p>
      </div>
    </div>
  );
};

export default AuthSidePanel;
