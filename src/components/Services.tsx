import { MapPin, FileBarChart, Clock, CheckCircle2, Truck, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const Services = () => {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const services = [
    {
      icon: MapPin, title: t('services.gpsTracking'), description: t('services.gpsTrackingDesc'),
      features: [t('services.gpsFeature1'), t('services.gpsFeature2'), t('services.gpsFeature3')],
    },
    {
      icon: FileBarChart, title: t('services.envReports'), description: t('services.envReportsDesc'),
      features: [t('services.envFeature1'), t('services.envFeature2'), t('services.envFeature3')],
    },
    {
      icon: Clock, title: t('services.scheduling'), description: t('services.schedulingDesc'),
      features: [t('services.schedFeature1'), t('services.schedFeature2'), t('services.schedFeature3')],
    },
    {
      icon: Truck,
      title: language === 'ar' ? 'إدارة أسطول السائقين' : 'Driver Fleet Management',
      description: language === 'ar' ? 'إدارة ثلاثة أنواع من السائقين (تابع/مؤجر/مستقل) مع تتبع الأداء والتقييم' : 'Manage three driver types with performance tracking & rating',
      features: [
        language === 'ar' ? 'سائق تابع + مؤجر + مستقل' : 'Company + Hired + Independent',
        language === 'ar' ? 'تتبع GPS لحظي للمركبات' : 'Real-time vehicle GPS tracking',
        language === 'ar' ? 'محفظة مالية لكل سائق' : 'Digital wallet per driver',
      ],
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'التوزيع الذكي' : 'Smart Dispatch',
      description: language === 'ar' ? 'خوارزمية ذكية توزع الشحنات تلقائياً لأقرب سائق متاح ضمن نطاق الخدمة' : 'Smart algorithm auto-dispatches shipments to nearest available driver',
      features: [
        language === 'ar' ? 'توزيع تلقائي حسب القرب' : 'Auto-dispatch by proximity',
        language === 'ar' ? 'ترتيب بالتقييم والقبول' : 'Ranked by rating & acceptance',
        language === 'ar' ? 'إشعارات فورية للسائق' : 'Instant driver notifications',
      ],
    },
  ];

  return (
    <section id="services" className="py-12 sm:py-24 bg-muted/30 relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2" />

      <div className="container px-4 relative">
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm mb-3 sm:mb-4">{t('services.badge')}</span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">{t('services.title')} <span className="text-gradient-eco">{t('services.titleHighlight')}</span> {t('services.titleSuffix')}</h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">{t('services.desc')}</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-8">
          {services.map((service, i) => (
            <motion.div 
              key={service.title} 
              className="group relative p-4 sm:p-8 rounded-xl sm:rounded-3xl bg-card border border-border/50 overflow-hidden card-shine"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <motion.div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl gradient-eco flex items-center justify-center mb-4 sm:mb-6 shadow-eco-md"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <service.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </motion.div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-xs sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, fi) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-center gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.15 + fi * 0.08 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
