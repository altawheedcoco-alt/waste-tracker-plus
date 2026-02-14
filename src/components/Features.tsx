import { motion } from "framer-motion";
import { Package, Truck, Recycle, BarChart3, Users, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Package, title: t('features.shipmentMgmt'), description: t('features.shipmentMgmtDesc'), color: "from-primary to-accent" },
    { icon: Truck, title: t('features.transportTracking'), description: t('features.transportTrackingDesc'), color: "from-accent to-eco-teal" },
    { icon: Recycle, title: t('features.recycling'), description: t('features.recyclingDesc'), color: "from-eco-teal to-primary" },
    { icon: BarChart3, title: t('features.reports'), description: t('features.reportsDesc'), color: "from-primary to-eco-green-light" },
    { icon: Users, title: t('features.userMgmt'), description: t('features.userMgmtDesc'), color: "from-eco-green-light to-accent" },
    { icon: Shield, title: t('features.securityFeature'), description: t('features.securityDesc'), color: "from-accent to-primary" },
  ];

  return (
    <section id="features" className="py-12 sm:py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">{t('features.badge')}</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features.title')} <span className="text-gradient-eco">{t('features.titleHighlight')}</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('features.desc')}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <motion.div whileHover={{ y: -5, scale: 1.02 }} className="group relative p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-lg transition-all duration-300 border border-border/50">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
