/**
 * قسم مقارنة "قبل وبعد" استخدام المنصة
 */
import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const comparisons = [
  { beforeAr: 'تتبع يدوي بالورق والاتصالات', afterAr: 'تتبع لحظي على الخريطة بـ GPS', beforeEn: 'Manual tracking via paper & calls', afterEn: 'Real-time GPS map tracking' },
  { beforeAr: 'إصدار الشهادات يستغرق أيام', afterAr: 'شهادات رقمية فورية تلقائية', beforeEn: 'Certificate issuance takes days', afterEn: 'Instant automated digital certificates' },
  { beforeAr: 'لا رقابة على الامتثال البيئي', afterAr: 'امتثال 100% مع تقارير آلية', beforeEn: 'No environmental compliance monitoring', afterEn: '100% compliance with automated reports' },
  { beforeAr: 'فواتير يدوية وأخطاء محاسبية', afterAr: 'فوترة تلقائية ودفتر أستاذ رقمي', beforeEn: 'Manual invoicing & accounting errors', afterEn: 'Auto-billing & digital accounting ledger' },
  { beforeAr: 'صعوبة إيجاد ناقل أو مدوّر', afterAr: 'سوق مخلفات ذكي وبورصة أسعار', beforeEn: 'Hard to find transporter or recycler', afterEn: 'Smart waste marketplace & price exchange' },
  { beforeAr: 'تقارير بيئية بعد أسابيع', afterAr: 'تحليلات كربون وبيئة لحظية', beforeEn: 'Environmental reports after weeks', afterEn: 'Real-time carbon & environmental analytics' },
];

const BeforeAfterSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-muted/20">
      <div className="container px-4">
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
            {isAr ? 'قبل وبعد iRecycle' : 'Before & After iRecycle'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isAr ? 'الفرق الذي تصنعه المنصة في عملياتك اليومية' : 'The difference the platform makes in your daily operations'}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {comparisons.map((item, i) => (
            <motion.div
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center rounded-xl border bg-card p-3 sm:p-4 shadow-sm"
              initial={{ opacity: 0, x: isAr ? 30 : -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {/* Before */}
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-muted-foreground line-through decoration-destructive/30">
                  {isAr ? item.beforeAr : item.beforeEn}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-primary shrink-0" />

              {/* After */}
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-foreground font-medium">
                  {isAr ? item.afterAr : item.afterEn}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

BeforeAfterSection.displayName = 'BeforeAfterSection';
export default BeforeAfterSection;
