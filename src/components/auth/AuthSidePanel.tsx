import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Leaf, BarChart3, Truck, Recycle, Globe, CheckCircle2, Sparkles, Zap, Brain, FileCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

const illustrations = [
  { src: authIllustration, alt: 'منصة iRecycle الرقمية', title: 'التحول الرقمي البيئي', desc: 'رقمنة كاملة لعمليات إدارة المخلفات' },
  { src: authIllustration2, alt: 'لوحة تحكم رقمية ذكية', title: 'لوحة التحكم الذكية', desc: 'تحليلات لحظية وبيانات مباشرة' },
  { src: authIllustration3, alt: 'فرز ذكي بالروبوتات', title: 'الفرز الآلي بالذكاء الاصطناعي', desc: 'تصنيف المخلفات تلقائياً بدقة عالية' },
  { src: authIllustration4, alt: 'تتبع أسطول النقل', title: 'تتبع GPS لحظي', desc: 'مراقبة الأسطول والشحنات في الوقت الفعلي' },
  { src: authIllustration5, alt: 'الاقتصاد الدائري الرقمي', title: 'الاقتصاد الدائري', desc: 'تتبع رقمي من المصدر حتى إعادة التدوير' },
  { src: authIllustration6, alt: 'الامتثال والتوثيق الرقمي', title: 'الامتثال الرقمي', desc: 'توثيق إلكتروني وشهادات ISO رقمية' },
  { src: authIllustration7, alt: 'المدن الذكية وإنترنت الأشياء', title: 'المدينة الذكية', desc: 'حاويات ذكية متصلة بمستشعرات IoT' },
  { src: authIllustration8, alt: 'مختبر التحليل الرقمي', title: 'تحليل بيئي رقمي', desc: 'فحوصات وتصنيفات مدعومة بالذكاء الاصطناعي' },
  { src: authIllustration9, alt: 'محطة تحويل النفايات لطاقة', title: 'تحويل النفايات لطاقة', desc: 'مراقبة رقمية لمحطات الطاقة المتجددة' },
  { src: authIllustration10, alt: 'مستودع آلي ذكي', title: 'المستودعات الذكية', desc: 'أتمتة كاملة بالروبوتات وباركود رقمي' },
  { src: authIllustration11, alt: 'شبكة الامتثال العالمية', title: 'الامتثال الدولي', desc: 'ربط رقمي بمعايير بيئية عالمية' },
  { src: authIllustration12, alt: 'الفوترة الإلكترونية', title: 'الفوترة الإلكترونية', desc: 'فواتير ومحفظة رقمية وتسويات آلية' },
  { src: authIllustration13, alt: 'اللوجستيات الذكية', title: 'لوجستيات ذكية', desc: 'بوليصة شحن رقمية وميزان ذكي' },
  { src: authIllustration14, alt: 'الرصد البيئي الرقمي', title: 'الرصد البيئي', desc: 'محطات رصد متصلة بالسحابة' },
  { src: authIllustration15, alt: 'سوق المواد المعاد تدويرها', title: 'سوق إلكتروني', desc: 'منصة مزادات رقمية للمواد المعاد تدويرها' },
  { src: authIllustration16, alt: 'أكاديمية التدريب الرقمية', title: 'الأكاديمية الرقمية', desc: 'تدريب إلكتروني وشهادات معتمدة' },
];

const pillars = [
  { icon: Recycle, label: 'سلسلة التوريد البيئية', desc: 'تتبع رقمي شامل من التوليد حتى التخلص' },
  { icon: Truck, label: 'أسطول ذكي ثلاثي', desc: 'سائقون تابعون ومستقلون ومؤجرون' },
  { icon: Brain, label: 'ذكاء اصطناعي متقدم', desc: 'تحليلات وتوصيات مدعومة بـ AI' },
  { icon: Shield, label: 'أمان وامتثال', desc: 'تشفير E2E وتوقيع رقمي وقانون 202' },
  { icon: BarChart3, label: 'تقارير ولوحات بيانية', desc: 'تقارير آلية للجهات الرقابية الأربع' },
  { icon: Zap, label: 'سوق شحنات ومزادات', desc: 'مزايدة عكسية ومحفظة رقمية' },
];

const stats = [
  { value: '+500', label: 'جهة مسجلة', icon: Users },
  { value: '+10K', label: 'عملية شهرياً', icon: FileCheck },
  { value: '99.9%', label: 'وقت التشغيل', icon: Zap },
];

const AuthSidePanel = () => {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * illustrations.length));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % illustrations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentIllustration = illustrations[currentIndex];

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
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-5 pt-4 pb-2 shrink-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/10 border border-white/10">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold leading-tight text-white tracking-tight">iRecycle</h2>
                <Badge className="bg-white/15 text-white/90 text-[8px] px-1.5 py-0 border-white/20 gap-0.5 hover:bg-white/20">
                  <Sparkles className="w-2 h-2" />
                  v5.1
                </Badge>
              </div>
              <p className="text-white/45 text-[10px]">المنصة الرقمية الأولى لإدارة المخلفات في مصر</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.08]">
            <h3 className="text-sm font-bold mb-1 leading-snug text-white">
              رقمنة شاملة لإدارة{' '}
              <span className="bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">سلسلة التوريد البيئية</span>
            </h3>
            <p className="text-white/40 text-[10px] leading-relaxed">
              تحول رقمي متكامل: تتبع إلكتروني · فوترة رقمية · امتثال قانوني · ذكاء اصطناعي · سوق شحنات
            </p>
          </div>
        </motion.div>
      </div>

      {/* Illustration */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 min-h-0 py-2">
        <div className="relative w-full max-w-[200px] xl:max-w-[240px] flex-1 min-h-0 max-h-[220px]">
          <div className="absolute inset-0 bg-white/8 rounded-3xl blur-2xl scale-90" />
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={currentIllustration.src}
              alt={currentIllustration.alt}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </AnimatePresence>
        </div>
        {/* Title + dots */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center mt-2 shrink-0"
          >
            <p className="text-xs font-bold text-white/90">{currentIllustration.title}</p>
            <p className="text-[9px] text-white/45 mt-0.5">{currentIllustration.desc}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1 mt-2 shrink-0">
          {illustrations.map((_, i) => (
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

      {/* Stats */}
      <div className="relative z-10 shrink-0 px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-1.5 mb-2"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center py-2 px-1 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.06] group hover:bg-white/[0.12] transition-colors">
              <stat.icon className="w-3 h-3 text-amber-300/60 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-white leading-tight">{stat.value}</p>
              <p className="text-[8px] text-white/45">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Pillars - 2 columns */}
        <div className="grid grid-cols-2 gap-1 mb-2">
          {pillars.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
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
        </div>
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
