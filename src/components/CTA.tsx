import { ArrowLeft, Sparkles, Shield, Clock, BarChart3, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const benefits = [
    { icon: Shield, text: t('cta.benefit1') },
    { icon: Clock, text: t('cta.benefit2') },
    { icon: BarChart3, text: t('cta.benefit3') },
    { icon: Headphones, text: t('cta.benefit4') },
  ];

  return (
    <section id="contact" className="py-12 sm:py-24 relative overflow-hidden">
      <div className="container px-4">
        <div className="relative rounded-3xl overflow-hidden animate-fade-in">
          <div className="absolute inset-0 gradient-eco" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="relative py-10 px-4 sm:py-16 sm:px-8 md:py-20 md:px-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />{t('cta.badge')}
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">{t('cta.title1')}<br />{t('cta.title2')}</h2>
              <p className="text-white/80 text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 px-4">{t('cta.desc')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <benefit.icon className="w-5 h-5 text-white" />
                    <span className="text-white/90 text-xs font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl group" onClick={() => navigate('/auth?mode=register')}>
                  {t('landing.registerCompany')}
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
                <Button size="xl" variant="outline" className="border-2 border-white text-white hover:bg-white/10 bg-transparent" onClick={() => navigate('/auth?mode=login')}>
                  {t('nav.login')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
