import { useEffect, useState, useRef } from 'react';
import { Eye, Users, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const VisitorCounter = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [totalVisits, setTotalVisits] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedUnique, setAnimatedUnique] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    const fetchCounter = async () => {
      const { data } = await (supabase as any)
        .from('visitor_counter')
        .select('total_visits, unique_visitors')
        .eq('id', 'global')
        .single();
      if (data) {
        setTotalVisits(data.total_visits || 0);
        setUniqueVisitors(data.unique_visitors || 0);
      }
    };
    fetchCounter();

    // Realtime subscription
    const channel = supabase
      .channel('visitor-counter-rt')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'visitor_counter',
        filter: 'id=eq.global',
      }, (payload: any) => {
        setTotalVisits(payload.new.total_visits || 0);
        setUniqueVisitors(payload.new.unique_visitors || 0);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Animate numbers when in view
  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 50;
    const stepTotal = totalVisits / steps;
    const stepUnique = uniqueVisitors / steps;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      if (current >= steps) {
        setAnimatedTotal(totalVisits);
        setAnimatedUnique(uniqueVisitors);
        clearInterval(timer);
      } else {
        setAnimatedTotal(Math.floor(stepTotal * current));
        setAnimatedUnique(Math.floor(stepUnique * current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, totalVisits, uniqueVisitors]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center gap-6 sm:gap-10 py-4"
    >
      {/* Total Visits */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <div className="text-xl sm:text-3xl font-black text-foreground tabular-nums">
            {animatedTotal.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            {isAr ? 'إجمالي الزيارات' : 'Total Visits'}
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-border" />

      {/* Unique Visitors */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <div className="text-xl sm:text-3xl font-black text-foreground tabular-nums">
            {animatedUnique.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            {isAr ? 'زائر فريد' : 'Unique Visitors'}
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-border hidden sm:block" />

      {/* Live indicator */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <span className="text-xs font-semibold text-emerald-600">
          {isAr ? 'مباشر' : 'LIVE'}
        </span>
      </div>
    </motion.div>
  );
};

export default VisitorCounter;
