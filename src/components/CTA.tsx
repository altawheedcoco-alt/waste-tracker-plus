import { ArrowLeft, Sparkles, Shield, Clock, BarChart3, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const benefits = [
    { icon: Shield, text: t('cta.benefit1') },
    { icon: Clock, text: t('cta.benefit2') },
    { icon: BarChart3, text: t('cta.benefit3') },
    { icon: Headphones, text: t('cta.benefit4') },
  ];

  return (
    <section id="contact" className="py-12 sm:py-24 relative overflow-hidden" ref={ref}>
      <div className="container px-4">
        <motion.div 
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Solid dark green background for guaranteed contrast */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(160, 68%, 30%) 0%, hsl(160, 75%, 22%) 50%, hsl(170, 60%, 25%) 100%)' }} />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

          <div className="relative py-10 px-4 sm:py-16 sm:px-8 md:py-20 md:px-16">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 font-medium text-sm mb-6 backdrop-blur-sm"
                style={{ color: 'white' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4" />{t('cta.badge')}
              </motion.div>
              <motion.h2 
                className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2"
                style={{ color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {t('cta.title1')}<br />{t('cta.title2')}
              </motion.h2>
              <motion.p 
                className="text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 px-4"
                style={{ color: 'rgba(255,255,255,0.9)' }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {t('cta.desc')}
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={i} 
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 group"
                    initial={{ opacity: 0, y: 15 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.25)' }}
                  >
                    <benefit.icon className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'white' }} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Button size="xl" className="bg-white hover:bg-white/90 shadow-lg hover:shadow-xl group relative overflow-hidden" style={{ color: 'hsl(160, 68%, 30%)' }} onClick={() => navigate('/auth?mode=register')}>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {t('landing.registerCompany')}
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
                <Button size="xl" variant="outline" className="border-2 bg-transparent" style={{ borderColor: 'white', color: 'white' }} onClick={() => navigate('/auth?mode=login')}>
                  {t('nav.login')}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
