import { useRef, useEffect, useState } from "react";
import { Building2, Truck, Recycle, Target, TrendingUp, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { withTimeout, logNetworkError } from "@/lib/networkGuard";
import { motion, useInView } from "framer-motion";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";


const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else { setCount(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return <span ref={ref}>{count.toLocaleString('en-US')}{suffix}</span>;
};

const Stats = () => {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useRealtimeSync([
    { table: 'organizations', queryKeys: ['landing-live-stats'] },
    { table: 'shipments', queryKeys: ['landing-live-stats'] },
    { table: 'drivers', queryKeys: ['landing-live-stats'] },
  ]);

  const { data: liveStats } = useQuery({
    queryKey: ['landing-live-stats'],
    queryFn: async () => {
      try {
        const [orgsResult, shipmentsResult, driversResult] = await withTimeout(
          'landing-live-stats',
          () => Promise.all([
            supabase.from('organizations').select('id', { count: 'exact', head: true }),
            supabase.from('shipments').select('id', { count: 'exact', head: true }),
            supabase.from('drivers').select('id', { count: 'exact', head: true }),
          ])
        );

        return {
          organizations: orgsResult.count ?? 0,
          shipments: shipmentsResult.count ?? 0,
          drivers: driversResult.count ?? 0,
        };
      } catch (error) {
        logNetworkError('landing-live-stats', error);
        return { organizations: 0, shipments: 0, drivers: 0 };
      }
    },
    staleTime: 1000 * 60 * 30,
  });

  const stats = [
    { icon: Building2, value: liveStats?.organizations ?? 0, suffix: "+", label: t('stats.registeredCompanies'), description: t('stats.registeredCompaniesDesc'), gradient: 'from-emerald-500 to-teal-500' },
    { icon: Truck, value: liveStats?.shipments ?? 0, suffix: "+", label: t('stats.processedShipments'), description: t('stats.processedShipmentsDesc'), gradient: 'from-blue-500 to-cyan-500' },
    { icon: Recycle, value: 95, suffix: "%", label: t('stats.recyclingRate'), description: t('stats.recyclingRateDesc'), gradient: 'from-primary to-emerald-600' },
    { icon: ShieldCheck, value: 100, suffix: "%", label: t('stats.legalCompliance'), description: t('stats.legalComplianceDesc'), gradient: 'from-amber-500 to-orange-500' },
    { icon: Target, value: 99, suffix: "%", label: t('stats.trackingAccuracy'), description: t('stats.trackingAccuracyDesc'), gradient: 'from-purple-500 to-violet-500' },
    { icon: TrendingUp, value: liveStats?.drivers ?? 0, suffix: "+", label: t('stats.activeDrivers'), description: t('stats.activeDriversDesc'), gradient: 'from-rose-500 to-pink-500' },
  ];

  const badges = [t('stats.envLaw'), t('stats.wasteLaw'), t('stats.dataProtection')];

  return (
    <section id="stats" className="py-16 sm:py-28 relative overflow-hidden" ref={sectionRef}>
      
      <div className="container px-4 relative">
        <motion.div 
          className="text-center mb-10 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-sm mb-5 border border-primary/20">
            <TrendingUp className="w-4 h-4" />{t('stats.badge')}
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4">
            {t('stats.title')} <span className="text-gradient-eco">{t('stats.titleHighlight')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">{t('stats.desc')}</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="text-center p-5 sm:p-10 rounded-2xl sm:rounded-3xl bg-card border border-border/50 group card-shine cursor-default"
            >
              <motion.div 
                className={`w-12 h-12 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-lg`}
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <stat.icon className="w-6 h-6 sm:w-9 sm:h-9 text-white" />
              </motion.div>
              <div className="text-2xl sm:text-5xl md:text-6xl font-black mb-1.5 sm:mb-3 text-foreground">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="font-bold text-foreground mb-0.5 sm:mb-1 text-xs sm:text-base">{stat.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-10 sm:mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl bg-card border border-border/50 shadow-sm">
            {badges.map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-[10px] sm:text-sm font-semibold text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />{badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
