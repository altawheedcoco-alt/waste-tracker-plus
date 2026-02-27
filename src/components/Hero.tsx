import { memo } from "react";
import { ArrowLeft, Globe, Leaf, Truck, Factory, Recycle, Building2, UserCog, Car, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg-light.webp";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = memo(() => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

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
      {/* Background image with stronger overlay for better text readability */}
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
        {/* Enhanced multi-layer overlay for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(140,20%,98%)]/95 via-transparent to-transparent" />
      </div>

      {/* Static decorative icons - desktop only */}
      <div className="absolute top-32 right-20 hidden lg:block animate-float-slow">
        <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center shadow-eco-lg"><Leaf className="w-8 h-8 text-white" /></div>
      </div>
      <div className="absolute bottom-40 left-20 hidden lg:block animate-float-delayed">
        <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-eco-md flex items-center justify-center"><Truck className="w-7 h-7 text-[hsl(160,84%,39%)]" /></div>
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline badge */}
          <div className="mb-4 sm:mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-lg text-white font-semibold text-[11px] sm:text-sm border border-white/25 shadow-xl">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t('landing.tagline')}
            </span>
          </div>

          {/* Main heading - bolder, more readable */}
          <h1 
            className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3 sm:mb-6 leading-snug px-2 animate-fade-up"
            style={{ 
              animationDelay: '0.2s',
              textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 4px 40px rgba(0,0,0,0.3)',
              color: 'white',
            }}
          >
            {t('landing.heroTitle1')}{" "}
            <span className="text-gradient-eco" style={{ WebkitTextFillColor: 'transparent', textShadow: 'none' }}>{t('landing.heroTitle2')}</span>
            <br /><span className="text-white">{t('landing.heroTitle3')}</span>
          </h1>

          <p className="text-[10px] sm:text-sm text-white/80 mt-1 font-semibold animate-fade-up tracking-wide px-4" style={{ animationDelay: '0.25s', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
            {language === 'ar' ? '🇪🇬 منصة خدمية وطنية لجمهورية مصر العربية — في إطار مبادرات التحول الأخضر' : '🇪🇬 A National Service Platform for Egypt — Supporting Green Transformation'}
          </p>

          <p 
            className="text-xs sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-10 px-4 leading-relaxed font-medium animate-fade-up"
            style={{ animationDelay: '0.35s', textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
          >
            {t('landing.heroDesc')}
          </p>

          {/* CTA Buttons - more prominent */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6 animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            <Button variant="hero" size="lg" className="group text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-6 w-full sm:w-auto shadow-2xl spring-press font-bold" onClick={() => navigate('/auth?mode=register')}>
              {t('landing.registerCompany')}
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="lg" className="text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-6 w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white/15 hover:border-white/70 spring-press font-bold backdrop-blur-sm" onClick={() => navigate('/auth?mode=login')}>
              {t('nav.login')}
            </Button>
          </div>

          {/* Quick access grid */}
          <div className="mt-8 sm:mt-14 animate-fade-up" style={{ animationDelay: '0.65s' }}>
            <p className="text-[10px] sm:text-sm text-white/70 mb-3 sm:mb-5 font-semibold tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>{t('landing.quickAccess')}</p>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-x-5 gap-y-4 sm:gap-5 px-4">
              {quickAccessItems.map((item) => (
                <button 
                  key={item.label}
                  onClick={() => navigate(item.type ? `/auth?mode=${item.mode}&type=${item.type}` : `/auth?mode=${item.mode}`)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer hover:scale-110 hover:-translate-y-1.5 active:scale-95 transition-all duration-200"
                >
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all ring-2 ring-white/25 group-hover:ring-white/50`}>
                    <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold text-white group-hover:text-white transition-colors leading-tight max-w-[80px] sm:max-w-none" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{item.label}</span>
                  <span className="text-[10px] text-white/60 hidden sm:block font-medium">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p 
            className="mt-4 sm:mt-8 text-[10px] sm:text-sm text-white/60 font-medium animate-fade-up"
            style={{ animationDelay: '0.9s', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
          >
            {t('landing.joinUs')}
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(140,20%,98%)] to-transparent" />
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
