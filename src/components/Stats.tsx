import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Building2, Truck, Recycle, Target, TrendingUp, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString('en-US')}{suffix}
    </span>
  );
};

const Stats = () => {
  // Fetch live stats from database
  const { data: liveStats } = useQuery({
    queryKey: ['landing-live-stats'],
    queryFn: async () => {
      const [orgsResult, shipmentsResult, driversResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true }),
      ]);
      return {
        organizations: orgsResult.count || 0,
        shipments: shipmentsResult.count || 0,
        drivers: driversResult.count || 0,
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const stats = [
    {
      icon: Building2,
      value: liveStats?.organizations || 500,
      suffix: "+",
      label: "شركة مسجلة",
      description: "جهات مولدة وناقلة ومدورة",
    },
    {
      icon: Truck,
      value: liveStats?.shipments || 15000,
      suffix: "+",
      label: "شحنة معالجة",
      description: "تم تتبعها وتوثيقها بالكامل",
    },
    {
      icon: Recycle,
      value: 95,
      suffix: "%",
      label: "معدل إعادة التدوير",
      description: "من إجمالي المخلفات المستلمة",
    },
    {
      icon: ShieldCheck,
      value: 100,
      suffix: "%",
      label: "توافق قانوني",
      description: "مع قانون المخلفات 202/2020",
    },
    {
      icon: Target,
      value: 99,
      suffix: "%",
      label: "دقة التتبع",
      description: "GPS + توثيق مرئي لكل شحنة",
    },
    {
      icon: TrendingUp,
      value: liveStats?.drivers || 200,
      suffix: "+",
      label: "سائق نشط",
      description: "يتم تتبعهم في الوقت الحقيقي",
    },
  ];

  return (
    <section id="stats" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <TrendingUp className="w-4 h-4" />
            إحصائيات حية
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            أرقام تتحدث عن <span className="text-gradient-eco">نجاحنا</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نفخر بالثقة التي منحنا إياها عملاؤنا والنتائج التي حققناها معاً في حماية البيئة المصرية
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                className="text-center p-8 rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-md transition-all duration-300 border border-border/50 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold mb-2 text-primary">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="font-semibold text-foreground mb-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-6 py-4 rounded-2xl bg-card border border-border/50">
            {[
              'متوافق مع قانون البيئة 4/1994',
              'قانون إدارة المخلفات 202/2020',
              'حماية البيانات 151/2020',
            ].map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
