import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Leaf, BarChart3, Truck, Recycle, Globe, CheckCircle2, Sparkles } from 'lucide-react';
import authIllustration from '@/assets/auth-side-illustration.png';
import authIllustration2 from '@/assets/auth-illustration-2.png';
import authIllustration3 from '@/assets/auth-illustration-3.png';
import authIllustration4 from '@/assets/auth-illustration-4.png';
import authIllustration5 from '@/assets/auth-illustration-5.png';
import authIllustration6 from '@/assets/auth-illustration-6.png';
import authIllustration7 from '@/assets/auth-illustration-7.png';
import authIllustration8 from '@/assets/auth-illustration-8.png';
import authIllustration9 from '@/assets/auth-illustration-9.png';
import authIllustration10 from '@/assets/auth-illustration-10.png';
import authIllustration11 from '@/assets/auth-illustration-11.png';
import authIllustration12 from '@/assets/auth-illustration-12.png';
import authIllustration13 from '@/assets/auth-illustration-13.png';
import authIllustration14 from '@/assets/auth-illustration-14.png';
import authIllustration15 from '@/assets/auth-illustration-15.png';
import authIllustration16 from '@/assets/auth-illustration-16.png';

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

const features = [
  { icon: Recycle, label: 'رقمنة سلسلة التوريد', desc: 'تتبع رقمي شامل من التوليد حتى التخلص الآمن' },
  { icon: Truck, label: 'تتبع GPS لحظي', desc: 'مراقبة الأسطول والشحنات بتقنية إنترنت الأشياء' },
  { icon: BarChart3, label: 'تحليلات ذكية بالـ AI', desc: 'تقارير آلية ولوحات بيانية مدعومة بالذكاء الاصطناعي' },
  { icon: Shield, label: 'أمان سيبراني متقدم', desc: 'تشفير E2E وتوقيع رقمي وسجل تدقيق كامل' },
];

const stats = [
  { value: '+500', label: 'جهة مسجلة رقمياً' },
  { value: '+10K', label: 'عملية رقمية شهرياً' },
  { value: '99.9%', label: 'وقت التشغيل' },
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
    <div className="relative flex flex-col justify-between h-full overflow-hidden" style={{
      background: 'linear-gradient(160deg, hsl(160, 68%, 36%) 0%, hsl(178, 60%, 32%) 40%, hsl(205, 78%, 36%) 100%)',
    }}>
      {/* v3.0 Geometric decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 border border-white/[0.08] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] border border-white/[0.04] rounded-full" />
        <div className="absolute top-1/4 right-1/3 w-52 h-52 bg-white/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-white/[0.06] rounded-full blur-2xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        {/* Diagonal accent line */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 60px, white 60px, white 61px)',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 p-8 xl:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/10">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl xl:text-3xl font-bold leading-tight text-white tracking-tight">iRecycle</h2>
              <div className="flex items-center gap-2">
                <p className="text-white/50 text-xs">المنصة الرقمية الأولى لإدارة المخلفات</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[9px] font-bold text-white/80 tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  v3.0
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-xl xl:text-2xl font-bold mb-3 leading-relaxed text-white">
            رقمنة شاملة لإدارة
            <br />
            <span className="bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">سلسلة التوريد البيئية في مصر</span>
          </h3>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            تحول رقمي متكامل: تتبع إلكتروني، فوترة رقمية، امتثال قانوني، وذكاء اصطناعي لكافة عمليات المخلفات
          </p>
        </motion.div>
      </div>

      {/* Illustration - Auto-rotating */}
      <div className="relative z-10 flex justify-center px-8 h-[280px] xl:h-[320px]">
        <div className="relative w-full max-w-[280px] xl:max-w-[320px]">
          <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl scale-95" />
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={currentIllustration.src}
              alt={currentIllustration.alt}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </AnimatePresence>
          {/* Title overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="absolute -bottom-8 left-0 right-0 text-center"
            >
              <p className="text-xs font-bold text-white/90">{currentIllustration.title}</p>
              <p className="text-[10px] text-white/50">{currentIllustration.desc}</p>
            </motion.div>
          </AnimatePresence>
          {/* Dot indicators */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
            {illustrations.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 grid grid-cols-3 gap-3 px-8 xl:px-12 my-5"
      >
        {stats.map((stat, i) => (
          <div key={i} className="text-center p-3 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.12] transition-colors duration-300">
            <p className="text-xl xl:text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/50 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="relative z-10 space-y-2 px-8 xl:px-12">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-md rounded-xl p-3 hover:bg-white/[0.1] transition-all duration-300 group border border-white/[0.04]"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
              <f.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold leading-tight text-white">{f.label}</h4>
              <p className="text-[10px] text-white/40 leading-relaxed truncate">{f.desc}</p>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300/60 shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 flex items-center justify-center gap-2 px-8 xl:px-12 py-6 mt-4"
      >
        <div className="w-full h-px bg-white/10" />
        <div className="flex items-center gap-2 shrink-0">
          <Globe className="w-3.5 h-3.5 text-white/30" />
          <p className="text-[10px] text-white/30 whitespace-nowrap">متوافق مع القانون 202 لسنة 2020</p>
        </div>
        <div className="w-full h-px bg-white/10" />
      </motion.div>
    </div>
  );
};

export default AuthSidePanel;
