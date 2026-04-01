/**
 * حاسبة التوفير الفورية — المستخدم يدخل حجم مخلفاته ويرى التوفير المتوقع
 */
import { memo, useState, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calculator, TrendingUp, Clock, Leaf, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';

const SavingsCalculator = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const [monthlyTons, setMonthlyTons] = useState(50);

  const savings = useMemo(() => {
    const costPerTonTraditional = 850; // EGP
    const costPerTonPlatform = 520; // EGP
    const savingPerTon = costPerTonTraditional - costPerTonPlatform;
    const monthlySaving = monthlyTons * savingPerTon;
    const yearlySaving = monthlySaving * 12;
    const timeSavedHours = Math.round(monthlyTons * 0.3); // 0.3 hours per ton saved
    const co2Reduced = Math.round(monthlyTons * 0.45); // tons CO2

    return { monthlySaving, yearlySaving, timeSavedHours, co2Reduced, savingPercent: Math.round((savingPerTon / costPerTonTraditional) * 100) };
  }, [monthlyTons]);

  const results = [
    { icon: DollarSign, labelAr: 'التوفير الشهري', labelEn: 'Monthly Savings', value: `${savings.monthlySaving.toLocaleString()} EGP`, color: 'text-primary' },
    { icon: TrendingUp, labelAr: 'التوفير السنوي', labelEn: 'Yearly Savings', value: `${savings.yearlySaving.toLocaleString()} EGP`, color: 'text-emerald-500' },
    { icon: Clock, labelAr: 'ساعات عمل موفرة/شهر', labelEn: 'Hours Saved/Month', value: `${savings.timeSavedHours}`, color: 'text-amber-500' },
    { icon: Leaf, labelAr: 'تقليل CO₂ شهرياً', labelEn: 'CO₂ Reduced/Month', value: `${savings.co2Reduced} ${isAr ? 'طن' : 'tons'}`, color: 'text-cyan-500' },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-background">
      <div className="container px-4">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Calculator className="w-4 h-4" />
            {isAr ? 'احسب توفيرك' : 'Calculate Your Savings'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
            {isAr ? 'كم ستوفّر مع iRecycle؟' : 'How Much Will You Save?'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            {isAr ? 'حرّك المؤشر لتحديد حجم مخلفاتك الشهري وشاهد التوفير' : 'Move the slider to set your monthly waste volume and see savings'}
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Slider Card */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {isAr ? 'حجم المخلفات الشهري' : 'Monthly Waste Volume'}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {monthlyTons} <span className="text-sm font-normal text-muted-foreground">{isAr ? 'طن' : 'tons'}</span>
              </span>
            </div>
            <Slider
              value={[monthlyTons]}
              onValueChange={([v]) => setMonthlyTons(v)}
              min={5}
              max={500}
              step={5}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 {isAr ? 'طن' : 'tons'}</span>
              <span>500 {isAr ? 'طن' : 'tons'}</span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {results.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={i}
                  className="rounded-xl border bg-card p-4 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${r.color}`} />
                  <p className="text-lg sm:text-xl font-bold text-foreground">{r.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {isAr ? r.labelAr : r.labelEn}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Saving badge */}
          <div className="text-center mt-6">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              {isAr ? `توفير ${savings.savingPercent}% مقارنة بالطرق التقليدية` : `${savings.savingPercent}% savings vs traditional methods`}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

SavingsCalculator.displayName = 'SavingsCalculator';
export default SavingsCalculator;
