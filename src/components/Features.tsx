import { Trash2, Truck, Recycle, BarChart3, Users, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const Features = () => {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const features = [
    { icon: Trash2, title: t('features.shipmentMgmt'), description: t('features.shipmentMgmtDesc'), color: "from-primary to-accent" },
    { icon: Truck, title: t('features.transportTracking'), description: t('features.transportTrackingDesc'), color: "from-accent to-eco-teal" },
    { icon: Recycle, title: t('features.recycling'), description: t('features.recyclingDesc'), color: "from-eco-teal to-primary" },
    { icon: BarChart3, title: t('features.reports'), description: t('features.reportsDesc'), color: "from-primary to-eco-green-light" },
    { icon: Users, title: t('features.userMgmt'), description: t('features.userMgmtDesc'), color: "from-eco-green-light to-accent" },
    { icon: ShieldCheck, title: t('features.securityFeature'), description: t('features.securityDesc'), color: "from-accent to-primary" },
  ];

  return (
    <section id="features" className="py-12 sm:py-24 bg-muted/30 relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2" />

      <div className="container px-4 relative">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm mb-3 sm:mb-4">{t('features.badge')}</span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">{t('features.title')} <span className="text-gradient-eco">{t('features.titleHighlight')}</span></h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">{t('features.desc')}</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {features.map((feature, i) => (
            <motion.div 
              key={feature.title} 
              className="group relative p-3 sm:p-8 rounded-xl sm:rounded-2xl bg-card shadow-eco-sm border border-border/50 card-shine overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-500" />
              <motion.div 
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 sm:mb-5 shadow-md relative z-10`}
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <feature.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </motion.div>
              <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors relative z-10">{feature.title}</h3>
              <p className="text-xs sm:text-base text-muted-foreground leading-relaxed relative z-10">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
