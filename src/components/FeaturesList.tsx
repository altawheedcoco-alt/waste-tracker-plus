import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesList = () => {
  const { t } = useLanguage();

  const systemCapabilities = [
    { title: t('featuresList.f1'), description: t('featuresList.f1d') },
    { title: t('featuresList.f2'), description: t('featuresList.f2d') },
    { title: t('featuresList.f3'), description: t('featuresList.f3d') },
    { title: t('featuresList.f4'), description: t('featuresList.f4d') },
    { title: t('featuresList.f5'), description: t('featuresList.f5d') },
    { title: t('featuresList.f6'), description: t('featuresList.f6d') },
    { title: t('featuresList.f7'), description: t('featuresList.f7d') },
    { title: t('featuresList.f8'), description: t('featuresList.f8d') },
    { title: t('featuresList.f9'), description: t('featuresList.f9d') },
    { title: t('featuresList.f10'), description: '' },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemCapabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border-b border-border/30"
            >
              <div className="flex-shrink-0 mt-1"><CheckCircle2 className="w-6 h-6 text-primary" /></div>
              <div className="text-right flex-1">
                <h3 className="font-bold text-foreground leading-relaxed">
                  {capability.title}
                  {capability.description && <span className="font-normal text-muted-foreground">: "{capability.description}"</span>}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesList;
