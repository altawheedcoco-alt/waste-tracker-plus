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
    <section className="py-10 sm:py-16 bg-background">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemCapabilities.map((capability) => (
            <div
              key={capability.title}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted/50 transition-colors border-b border-border/30 animate-fade-in"
            >
              <div className="flex-shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /></div>
              <div className="text-right flex-1">
                <h3 className="font-bold text-foreground leading-relaxed text-sm sm:text-base">
                  {capability.title}
                  {capability.description && <span className="font-normal text-muted-foreground text-xs sm:text-base">: "{capability.description}"</span>}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesList;
