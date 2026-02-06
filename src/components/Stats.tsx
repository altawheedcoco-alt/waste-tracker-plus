import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Building2, Truck, Recycle, Target } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: 500,
    suffix: "+",
    label: "شركة مسجلة",
    color: "text-primary",
  },
  {
    icon: Truck,
    value: 15000,
    suffix: "+",
    label: "شحنة معالجة",
    color: "text-accent",
  },
  {
    icon: Recycle,
    value: 95,
    suffix: "%",
    label: "معدل إعادة التدوير",
    color: "text-eco-teal",
  },
  {
    icon: Target,
    value: 99,
    suffix: "%",
    label: "دقة التتبع",
    color: "text-primary",
  },
];

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
  return (
    <section id="stats" className="py-24 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            الإحصائيات
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            أرقام تتحدث عن <span className="text-gradient-eco">نجاحنا</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نفخر بالثقة التي منحنا إياها عملاؤنا والنتائج التي حققناها معاً
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ 
  icon: Icon, 
  value, 
  suffix, 
  label, 
  color 
}: { 
  icon: typeof Building2; 
  value: number; 
  suffix: string; 
  label: string; 
  color: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="text-center p-8 rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-md transition-all duration-300 border border-border/50"
  >
    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4`}>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
    <div className={`text-4xl md:text-5xl font-extrabold mb-2 ${color}`}>
      <AnimatedCounter value={value} suffix={suffix} />
    </div>
    <p className="text-muted-foreground font-medium">{label}</p>
  </motion.div>
);

export default Stats;
