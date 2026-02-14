import { motion } from "framer-motion";
import { ArrowLeft, Globe, Leaf, Truck, Factory, Recycle, Building2, UserCog, Car, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const quickAccessItems = [
    { icon: Factory, label: t('landing.wasteGenerator'), desc: t('landing.wasteGeneratorDesc'), mode: 'register', type: 'generator', color: 'from-amber-500 to-orange-600' },
    { icon: Recycle, label: t('landing.recycler'), desc: t('landing.recyclerDesc'), mode: 'register', type: 'recycler', color: 'from-cyan-500 to-blue-600' },
    { icon: Truck, label: t('landing.transporter'), desc: t('landing.transporterDesc'), mode: 'register', type: 'transporter', color: 'from-primary to-emerald-600' },
    { icon: ShieldCheck, label: t('landing.safeDisposal'), desc: t('landing.safeDisposalDesc'), mode: 'register', type: 'disposal', color: 'from-purple-500 to-violet-600' },
    { icon: Car, label: t('landing.driver'), desc: t('landing.driverDesc'), mode: 'login', type: 'driver', color: 'from-rose-500 to-red-600' },
    { icon: UserCog, label: t('landing.employeeAccess'), desc: t('landing.employeeAccessDesc'), mode: 'employee', type: null, color: 'from-slate-500 to-slate-700' },
  ];

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-8 sm:pt-20 sm:pb-0">
      <div className="absolute inset-0">
        <img src={heroBg} alt={t('landing.recyclingFacilities')} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
      </div>

      <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-32 right-20 hidden lg:block">
        <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center shadow-eco-lg"><Leaf className="w-8 h-8 text-primary-foreground" /></div>
      </motion.div>
      <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-40 left-20 hidden lg:block">
        <div className="w-14 h-14 rounded-2xl bg-card shadow-eco-md flex items-center justify-center"><Truck className="w-7 h-7 text-primary" /></div>
      </motion.div>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-60 left-32 hidden lg:block">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><Globe className="w-6 h-6 text-accent" /></div>
      </motion.div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-3 sm:mb-6">
            <div className="flex flex-col items-center gap-1.5 sm:gap-3">
              <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-primary">{t('landing.systemName')}</h2>
              <h3 className="text-sm sm:text-xl md:text-2xl font-semibold text-foreground/80">{t('landing.systemNameAr')}</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-2 rounded-full bg-primary/10 text-primary font-medium text-[11px] sm:text-sm">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4" />{t('landing.tagline')}
              </span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-3 sm:mb-6 leading-snug px-2">
            {t('landing.heroTitle1')}{" "}
            <span className="text-gradient-eco">{t('landing.heroTitle2')}</span>
            <br />{t('landing.heroTitle3')}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-xs sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-5 sm:mb-10 px-4 leading-relaxed">
            {t('landing.heroDesc')}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 px-6">
            <Button variant="hero" size="lg" className="group text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6 w-full sm:w-auto" onClick={() => navigate('/auth?mode=register')}>
              {t('landing.registerCompany')}
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="lg" className="text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6 w-full sm:w-auto" onClick={() => navigate('/auth?mode=login')}>
              {t('nav.login')}
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-6 sm:mt-12">
            <p className="text-[10px] sm:text-sm text-muted-foreground mb-2.5 sm:mb-4">{t('landing.quickAccess')}</p>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-4 px-4">
              {quickAccessItems.map((item, i) => (
                <motion.button key={item.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.05 }} whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.type ? `/auth?mode=${item.mode}&type=${item.type}` : `/auth?mode=${item.mode}`)}
                  className="flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer"
                >
                  <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow`}>
                    <item.icon className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[9px] sm:text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors leading-tight max-w-[70px] sm:max-w-none">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{item.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-3 sm:mt-6 text-[10px] sm:text-sm text-muted-foreground">
            {t('landing.joinUs')}
          </motion.p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
