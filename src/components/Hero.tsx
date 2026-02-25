import { memo } from "react";
import { ArrowLeft, Globe, Leaf, Truck, Factory, Recycle, Building2, UserCog, Car, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg-optimized.webp";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = memo(() => {
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
        <img 
          src={heroBg} 
          alt={t('landing.recyclingFacilities')} 
          className="w-full h-full object-cover sm:animate-hero-zoom"
          loading="eager" 
          // @ts-ignore - fetchpriority is a valid HTML attribute
          {...{ fetchpriority: "high" } as any} 
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/95" />
      </div>

      {/* Static decorative icons - desktop only */}
      <div className="absolute top-32 right-20 hidden lg:block animate-float-slow">
        <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center shadow-eco-lg"><Leaf className="w-8 h-8 text-primary-foreground" /></div>
      </div>
      <div className="absolute bottom-40 left-20 hidden lg:block animate-float-delayed">
        <div className="w-14 h-14 rounded-2xl bg-card shadow-eco-md flex items-center justify-center"><Truck className="w-7 h-7 text-primary" /></div>
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline badge */}
          <div className="mb-4 sm:mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white font-medium text-[11px] sm:text-sm border border-white/20 shadow-lg">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />{t('landing.tagline')}
            </span>
          </div>

          {/* Main heading */}
          <h1 
            className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-3 sm:mb-6 leading-snug px-2 text-white drop-shadow-lg animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t('landing.heroTitle1')}{" "}
            <span className="text-gradient-eco">{t('landing.heroTitle2')}</span>
            <br /><span className="text-white">{t('landing.heroTitle3')}</span>
          </h1>

          <p 
            className="text-sm sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6 sm:mb-10 px-4 leading-relaxed drop-shadow-md animate-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            {t('landing.heroDesc')}
          </p>

          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 px-6 animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            <Button variant="hero" size="lg" className="group text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6 w-full sm:w-auto shadow-xl spring-press" onClick={() => navigate('/auth?mode=register')}>
              {t('landing.registerCompany')}
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="lg" className="text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6 w-full sm:w-auto border-white/40 text-white hover:bg-white/10 spring-press" onClick={() => navigate('/auth?mode=login')}>
              {t('nav.login')}
            </Button>
          </div>

          {/* Quick access grid */}
          <div className="mt-6 sm:mt-12 animate-fade-up" style={{ animationDelay: '0.65s' }}>
            <p className="text-[10px] sm:text-sm text-white/60 mb-2.5 sm:mb-4">{t('landing.quickAccess')}</p>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-4 px-4">
              {quickAccessItems.map((item, i) => (
                <button 
                  key={item.label}
                  onClick={() => navigate(item.type ? `/auth?mode=${item.mode}&type=${item.type}` : `/auth?mode=${item.mode}`)}
                  className="flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer hover:scale-110 hover:-translate-y-1 active:scale-95 transition-transform duration-200"
                >
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow ring-2 ring-white/20`}>
                    <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors leading-tight max-w-[80px] sm:max-w-none drop-shadow-md">{item.label}</span>
                  <span className="text-[10px] text-white/60 hidden sm:block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p 
            className="mt-3 sm:mt-6 text-[10px] sm:text-sm text-white/50 animate-fade-up"
            style={{ animationDelay: '0.9s' }}
          >
            {t('landing.joinUs')}
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
