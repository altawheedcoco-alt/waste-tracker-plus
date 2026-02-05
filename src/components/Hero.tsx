import { motion } from "framer-motion";
import { ArrowLeft, Globe, Leaf, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-sm text-muted-foreground"
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
