import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Building2, Truck, Recycle, Target, TrendingUp, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
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
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString('en-US')}{suffix}</span>;
};

const Stats = () => {
  const { t } = useLanguage();
  const { data: liveStats } = useQuery({
    queryKey: ['landing-live-stats'],
    queryFn: async () => {
      const [orgsResult, shipmentsResult, driversResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true }),
      ]);
      return { organizations: orgsResult.count || 0, shipments: shipmentsResult.count || 0, drivers: driversResult.count || 0 };
    },
    staleTime: 1000 * 60 * 30,
  });

  const stats = [
    { icon: Building2, value: liveStats?.organizations || 500, suffix: "+", label: t('stats.registeredCompanies'), description: t('stats.registeredCompaniesDesc') },
    { icon: Truck, value: liveStats?.shipments || 15000, suffix: "+", label: t('stats.processedShipments'), description: t('stats.processedShipmentsDesc') },
    { icon: Recycle, value: 95, suffix: "%", label: t('stats.recyclingRate'), description: t('stats.recyclingRateDesc') },
    { icon: ShieldCheck, value: 100, suffix: "%", label: t('stats.legalCompliance'), description: t('stats.legalComplianceDesc') },
    { icon: Target, value: 99, suffix: "%", label: t('stats.trackingAccuracy'), description: t('stats.trackingAccuracyDesc') },
    { icon: TrendingUp, value: liveStats?.drivers || 200, suffix: "+", label: t('stats.activeDrivers'), description: t('stats.activeDriversDesc') },
  ];

  const badges = [t('stats.envLaw'), t('stats.wasteLaw'), t('stats.dataProtection')];

  return (
    <section id="stats" className="py-12 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
      <div className="container px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-8 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <TrendingUp className="w-4 h-4" />{t('stats.badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{t('stats.title')} <span className="text-gradient-eco">{t('stats.titleHighlight')}</span></h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">{t('stats.desc')}</p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
              <motion.div whileHover={{ scale: 1.03, y: -4 }} className="text-center p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-md transition-all duration-300 border border-border/50 group">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 flex items-center justify-center mx-auto mb-2 sm:mb-4 transition-colors">
                  <stat.icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="text-xl sm:text-4xl md:text-5xl font-extrabold mb-1 sm:mb-2 text-primary"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></div>
                <p className="font-semibold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-base">{stat.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{stat.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-8 sm:mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-card border border-border/50">
            {badges.map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />{badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
