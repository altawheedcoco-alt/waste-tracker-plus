import { memo, useEffect, useState } from "react";
import { ArrowLeft, Globe, Leaf, Truck, Factory, Recycle, Building2, UserCog, Car, ShieldCheck, Sparkles, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg-egypt-tech.webp";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";


const Hero = memo(() => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  // Animated counters
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount1(Math.round(ease * 500));
      setCount2(Math.round(ease * 12));
      setCount3(Math.round(ease * 98));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const quickAccessItems = [
    { icon: Factory, label: t('landing.wasteGenerator'), desc: t('landing.wasteGeneratorDesc'), mode: 'register', type: 'generator', color: 'from-amber-500 to-orange-600' },
    { icon: Recycle, label: t('landing.recycler'), desc: t('landing.recyclerDesc'), mode: 'register', type: 'recycler', color: 'from-cyan-500 to-blue-600' },
    { icon: Truck, label: t('landing.transporter'), desc: t('landing.transporterDesc'), mode: 'register', type: 'transporter', color: 'from-primary to-emerald-600' },
    { icon: ShieldCheck, label: t('landing.safeDisposal'), desc: t('landing.safeDisposalDesc'), mode: 'register', type: 'disposal', color: 'from-purple-500 to-violet-600' },
    { icon: Car, label: t('landing.driver'), desc: t('landing.driverDesc'), mode: 'login', type: 'driver', color: 'from-rose-500 to-red-600' },
    { icon: UserCog, label: t('landing.employeeAccess'), desc: t('landing.employeeAccessDesc'), mode: 'employee', type: null, color: 'from-slate-500 to-slate-700' },
  ];

  const statsItems = [
    { value: `${count1}+`, label: t('heroExtra.registeredEntities'), icon: Building2 },
    { value: `${count2}+`, label: t('heroExtra.operationalModules'), icon: TrendingUp },
    { value: `${count3}%`, label: t('heroExtra.complianceRate'), icon: Shield },
  ];

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-28 pb-8 sm:pt-32 sm:pb-0">
      {/* Background image with cinematic overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt={t('landing.recyclingFacilities')} 
          className="w-full h-full object-cover sm:animate-hero-zoom"
          loading="eager" 
          {...{ fetchpriority: "high" } as any} 
          decoding="async"
        />
        {/* v2.0 — Premium cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/55 to-foreground/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* v2.0 Badge — with shimmer */}
          <motion.div 
            className="mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white font-semibold text-[11px] sm:text-sm border border-white/20 shadow-xl relative overflow-hidden">
              
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="text-amber-400 font-bold">v2.0</span>
              <span className="w-px h-4 bg-white/30" />
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t('landing.tagline')}
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1 
            className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3 sm:mb-6 leading-snug px-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
              textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 4px 40px rgba(0,0,0,0.3)',
              color: 'white',
            }}
          >
            {t('landing.heroTitle1')}{" "}
            <span className="text-gradient-eco" style={{ WebkitTextFillColor: 'transparent', textShadow: 'none' }}>
              {t('landing.heroTitle2')}
            </span>
            <br /><span className="text-white">{t('landing.heroTitle3')}</span>
          </motion.h1>

          <motion.p 
            className="text-[10px] sm:text-sm text-white/70 mt-1 font-semibold tracking-wide px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
          >
            {t('heroExtra.nationalPlatform')}
          </motion.p>

          <motion.p 
            className="text-xs sm:text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-6 sm:mb-8 px-4 leading-relaxed font-medium"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
          >
            {t('landing.heroDesc')}
          </motion.p>

          {/* v2.0 — Live Stats Bar with glow */}
          <motion.div 
            className="flex items-center justify-center gap-4 sm:gap-8 mb-6 sm:mb-8 px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            {statsItems.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="flex flex-col items-center gap-1 px-3 sm:px-5 py-2 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 relative overflow-hidden group"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-lg sm:text-2xl font-black text-white tabular-nums">{stat.value}</span>
                <span className="text-[9px] sm:text-xs text-white/60 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons — with glow effect */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Button variant="hero" size="lg" className="group text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-6 w-full sm:w-auto shadow-2xl spring-press font-bold relative overflow-hidden" onClick={() => navigate('/auth?mode=register')}>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {t('landing.registerCompany')}
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="lg" className="text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-6 w-full sm:w-auto border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 spring-press font-bold backdrop-blur-sm" onClick={() => navigate('/auth?mode=login')}>
              {t('nav.login')}
            </Button>
          </motion.div>

          {/* Quick access grid */}
          <motion.div 
            className="mt-8 sm:mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <p className="text-[10px] sm:text-sm text-white/60 mb-3 sm:mb-5 font-semibold tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>{t('landing.quickAccess')}</p>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-x-5 gap-y-4 sm:gap-5 px-4">
              {quickAccessItems.map((item, i) => (
                <motion.button 
                  key={item.label}
                  onClick={() => navigate(item.type ? `/auth?mode=${item.mode}&type=${item.type}` : `/auth?mode=${item.mode}`)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.75 + i * 0.05 }}
                  whileHover={{ scale: 1.12, y: -6 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all ring-2 ring-white/20 group-hover:ring-white/40 relative overflow-hidden`}>
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white relative z-10" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold text-white group-hover:text-white transition-colors leading-tight max-w-[80px] sm:max-w-none" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{item.label}</span>
                  <span className="text-[10px] text-white/50 hidden sm:block font-medium">{item.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="mt-4 sm:mt-8 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <p 
              className="text-[11px] sm:text-sm font-bold tracking-wide text-gradient-eco"
              style={{ WebkitTextFillColor: 'transparent' }}
            >
              {t('landing.joinUs')}
            </p>
            <p className="text-sm sm:text-lg text-amber-400 font-bold tracking-[0.35em]" style={{ fontFamily: 'serif', textShadow: '0 0 12px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.4)' }}>
              𓂀 𓏏𓅓𓂋𓆑 𓇋𓏏𓂋 𓊪𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏𓏤
            </p>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
