import { motion } from "framer-motion";
import { ArrowLeft, Globe, Leaf, Truck, Factory, Recycle, Building2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const quickAccessItems = [
  { icon: Truck, label: 'ناقل مخلفات', desc: 'شركات نقل المخلفات', mode: 'register', type: 'transporter', color: 'from-primary to-emerald-600' },
  { icon: Factory, label: 'مولد مخلفات', desc: 'مصانع ومنشآت', mode: 'register', type: 'generator', color: 'from-amber-500 to-orange-600' },
  { icon: Recycle, label: 'معيد تدوير', desc: 'مرافق إعادة التدوير', mode: 'register', type: 'recycler', color: 'from-cyan-500 to-blue-600' },
  { icon: Building2, label: 'مرفق تخلص', desc: 'مدافن ومحارق', mode: 'register', type: 'disposal', color: 'from-purple-500 to-violet-600' },
  { icon: UserCog, label: 'دخول موظف', desc: 'موظفي الشركات', mode: 'employee', type: null, color: 'from-slate-500 to-slate-700' },
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="مرافق إعادة التدوير"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-20 hidden lg:block"
      >
        <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center shadow-eco-lg">
          <Leaf className="w-8 h-8 text-primary-foreground" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 left-20 hidden lg:block"
      >
        <div className="w-14 h-14 rounded-2xl bg-card shadow-eco-md flex items-center justify-center">
          <Truck className="w-7 h-7 text-primary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-60 left-32 hidden lg:block"
      >
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <Globe className="w-6 h-6 text-accent" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                iRecycle Waste Management System
              </h2>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground/80">
                نظام آي ريسايكل لإدارة المخلفات
              </h3>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                <Globe className="w-4 h-4" />
                حلول ذكية لبيئة نظيفة
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          >
            نظام متكامل{" "}
            <span className="text-gradient-eco">لإدارة النفايات</span>
            <br />
            والحفاظ على البيئة
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            تتبع ومراقبة شحنات النفايات في مصر من المصدر إلى وجهتها النهائية مع تقارير بيئية شاملة
            وتحليلات دقيقة تدعم اتخاذ القرار - متوافق مع متطلبات جهاز تنظيم إدارة المخلفات
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              variant="hero" 
              size="lg"
              className="group text-lg px-8 py-6" 
              onClick={() => navigate('/auth?mode=register')}
            >
              تسجيل شركة جديدة
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="heroOutline" 
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth?mode=login')}
            >
              تسجيل الدخول
            </Button>
          </motion.div>

          {/* Quick Access Icons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12"
          >
            <p className="text-sm text-muted-foreground mb-4">دخول سريع حسب نوع الحساب</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {quickAccessItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.type ? `/auth?mode=${item.mode}&type=${item.type}` : `/auth?mode=${item.mode}`)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{item.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-6 text-sm text-muted-foreground"
          >
            انضم إلينا الآن وابدأ في إدارة مخلفاتك بشكل ذكي ومستدام
          </motion.p>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
