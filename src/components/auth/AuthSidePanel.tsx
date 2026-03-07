import { motion } from 'framer-motion';
import { Shield, Leaf, BarChart3, Truck, Recycle, Globe, CheckCircle2 } from 'lucide-react';
import authIllustration from '@/assets/auth-side-illustration.png';

const features = [
  { icon: Recycle, label: 'إدارة المخلفات الذكية', desc: 'تتبع وتحليل دورة حياة المخلفات بالكامل' },
  { icon: Truck, label: 'تتبع الشحنات لحظياً', desc: 'مراقبة حركة المركبات والشحنات في الوقت الفعلي' },
  { icon: BarChart3, label: 'تقارير وتحليلات متقدمة', desc: 'لوحات تحكم ذكية مع رؤى بيانية شاملة' },
  { icon: Shield, label: 'أمان وحماية متكاملة', desc: 'تشفير شامل وحماية متعددة الطبقات' },
];

const stats = [
  { value: '+500', label: 'مؤسسة مسجلة' },
  { value: '+10K', label: 'شحنة شهرياً' },
  { value: '99.9%', label: 'وقت التشغيل' },
];

const AuthSidePanel = () => {
  return (
    <div className="relative flex flex-col justify-between h-full bg-gradient-to-br from-primary via-primary/90 to-eco-teal p-8 xl:p-12 text-white overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 border border-white/10 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 border border-white/5 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl xl:text-2xl font-bold leading-tight">iRecycle</h2>
              <p className="text-white/60 text-xs">نظام إدارة المخلفات المتكامل v2.0</p>
            </div>
          </div>

          <h3 className="text-lg xl:text-xl font-semibold mb-2 leading-relaxed">
            منصة رقمية شاملة لإدارة
            <br />
            <span className="text-eco-gold">سلسلة التوريد البيئية</span>
          </h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            نظام متكامل للتتبع والتوثيق والامتثال القانوني لكافة عمليات إدارة المخلفات في مصر
          </p>
        </motion.div>
      </div>

      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative z-10 flex justify-center my-4"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl scale-90" />
          <img
            src={authIllustration}
            alt="منصة إدارة المخلفات"
            className="relative w-full max-w-[300px] xl:max-w-[350px] drop-shadow-2xl"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 grid grid-cols-3 gap-3 mb-4"
      >
        {stats.map((stat, i) => (
          <div key={i} className="text-center p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-lg xl:text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-white/60">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="relative z-10 space-y-2">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-center gap-3 bg-white/[0.07] backdrop-blur-sm rounded-xl p-2.5 hover:bg-white/[0.12] transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
              <f.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{f.label}</h4>
              <p className="text-[10px] text-white/50 leading-relaxed truncate">{f.desc}</p>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-eco-gold/60 shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10"
      >
        <Globe className="w-3.5 h-3.5 text-white/40" />
        <p className="text-[10px] text-white/40">متوافق مع القانون 202 لسنة 2020 ومعايير WMRA</p>
      </motion.div>
    </div>
  );
};

export default AuthSidePanel;
