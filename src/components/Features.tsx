import { Trash2, Truck, Recycle, BarChart3, Users, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Trash2, title: t('features.shipmentMgmt'), description: t('features.shipmentMgmtDesc'), color: "from-primary to-accent" },
    { icon: Truck, title: t('features.transportTracking'), description: t('features.transportTrackingDesc'), color: "from-accent to-eco-teal" },
    { icon: Recycle, title: t('features.recycling'), description: t('features.recyclingDesc'), color: "from-eco-teal to-primary" },
    { icon: BarChart3, title: t('features.reports'), description: t('features.reportsDesc'), color: "from-primary to-eco-green-light" },
    { icon: Users, title: t('features.userMgmt'), description: t('features.userMgmtDesc'), color: "from-eco-green-light to-accent" },
    { icon: ShieldCheck, title: t('features.securityFeature'), description: t('features.securityDesc'), color: "from-accent to-primary" },
  ];

  return (
    <section id="features" className="py-12 sm:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-8 sm:mb-16 animate-fade-in">
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm mb-3 sm:mb-4">{t('features.badge')}</span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">{t('features.title')} <span className="text-gradient-eco">{t('features.titleHighlight')}</span></h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">{t('features.desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group relative p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-lg hover:-translate-y-1 transition-all duration-300 border border-border/50 animate-fade-in">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
