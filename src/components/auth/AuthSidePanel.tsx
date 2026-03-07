import { motion } from 'framer-motion';
import { Shield, Leaf, BarChart3, Truck } from 'lucide-react';
import authIllustration from '@/assets/auth-side-illustration.png';

const features = [
  { icon: Leaf, label: 'إدارة المخلفات الذكية', desc: 'تتبع وتحليل دورة حياة المخلفات بالكامل' },
  { icon: Truck, label: 'تتبع الشحنات لحظياً', desc: 'مراقبة حركة المركبات والشحنات في الوقت الفعلي' },
  { icon: BarChart3, label: 'تقارير وتحليلات متقدمة', desc: 'لوحات تحكم ذكية مع رؤى بيانية شاملة' },
  { icon: Shield, label: 'أمان وحماية متكاملة', desc: 'تشفير شامل وحماية متعددة الطبقات' },
];

const AuthSidePanel = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-primary/95 via-eco-teal to-eco-ocean p-8 xl:p-12 text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-40 h-40 border border-white/30 rounded-full" />
        <div className="absolute bottom-20 left-10 w-60 h-60 border border-white/20 rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-20 h-20 border border-white/20 rounded-full" />
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl xl:text-3xl font-bold mb-2 leading-tight">
            منصة آي ريسايكل
          </h2>
          <p className="text-white/80 text-sm xl:text-base mb-1">
            iRecycle v2.0 — نظام إدارة المخلفات المتكامل
          </p>
          <div className="w-16 h-1 bg-eco-gold rounded-full mt-3" />
        </motion.div>
      </div>

      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 flex justify-center my-4"
      >
        <img
          src={authIllustration}
          alt="منصة إدارة المخلفات"
          className="w-full max-w-[320px] xl:max-w-[380px] drop-shadow-2xl"
        />
      </motion.div>

      {/* Features */}
      <div className="relative z-10 space-y-3">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <f.icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{f.label}</h4>
              <p className="text-[11px] text-white/70 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AuthSidePanel;
