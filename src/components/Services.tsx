import { motion } from "framer-motion";
import { MapPin, FileBarChart, Clock, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();

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
  ];

  return (
    <section id="services" className="py-12 sm:py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">{t('services.badge')}</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('services.title')} <span className="text-gradient-eco">{t('services.titleHighlight')}</span> {t('services.titleSuffix')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('services.desc')}</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {services.map((service, index) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }}>
              <motion.div whileHover={{ y: -8 }} className="group relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-card shadow-eco-sm hover:shadow-eco-lg transition-all duration-300 border border-border/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-eco-md">
                    <service.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
