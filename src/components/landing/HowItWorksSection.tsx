/**
 * قسم "كيف يعمل؟" — خطوات مرئية تفاعلية
 */
import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UserPlus, PackagePlus, MapPin, Award, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const steps = [
  { icon: UserPlus, labelAr: 'سجّل جهتك', labelEn: 'Register', descAr: 'أنشئ حساب مجاني لجهتك في أقل من 3 دقائق', descEn: 'Create a free account for your organization in under 3 minutes', color: 'from-primary to-emerald-600' },
  { icon: PackagePlus, labelAr: 'أنشئ شحنة', labelEn: 'Create Shipment', descAr: 'حدد نوع المخلفات والكمية والوجهة بخطوات بسيطة', descEn: 'Specify waste type, quantity and destination in simple steps', color: 'from-cyan-500 to-blue-600' },
  { icon: MapPin, labelAr: 'تتبع لحظياً', labelEn: 'Track Live', descAr: 'تابع الشحنة على الخريطة من الاستلام حتى التسليم', descEn: 'Follow your shipment on the map from pickup to delivery', color: 'from-amber-500 to-orange-600' },
  { icon: Award, labelAr: 'استلم الشهادة', labelEn: 'Get Certificate', descAr: 'احصل على شهادة إتمام رقمية معتمدة تلقائياً', descEn: 'Receive an automated digital completion certificate', color: 'from-purple-500 to-violet-600' },
];

const HowItWorksSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
            {isAr ? 'كيف يعمل؟' : 'How It Works?'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
            {isAr ? '4 خطوات بسيطة لإدارة مخلفاتك بالكامل' : '4 simple steps to fully manage your waste'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                {/* Step number */}
                <div className="absolute -top-2 -right-2 sm:top-0 sm:right-auto w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10 shadow-md">
                  {i + 1}
                </div>

                {/* Icon circle */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg relative z-0`}>
                  <Icon className="w-9 h-9 sm:w-11 sm:h-11 text-white" strokeWidth={1.8} />
                </div>

                {/* Arrow between steps (mobile) */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden my-2">
                    <ArrowDown className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}

                <h3 className="font-bold text-foreground text-base sm:text-lg mb-1.5">
                  {isAr ? step.labelAr : step.labelEn}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[220px]">
                  {isAr ? step.descAr : step.descEn}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = 'HowItWorksSection';
export default HowItWorksSection;
