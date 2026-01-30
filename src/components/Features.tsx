import { motion } from "framer-motion";
import { 
  Truck, 
  Recycle, 
  BarChart3, 
  Users, 
  Shield, 
  MapPin,
  Package,
  FileText
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "إدارة الشحنات",
    description: "تتبع ومراقبة شحنات النفايات من المصدر إلى وجهتها النهائية",
    color: "from-primary to-accent",
  },
  {
    icon: Truck,
    title: "تتبع النقل",
    description: "مراقبة مركبات النقل والسائقين في الوقت الفعلي",
    color: "from-accent to-eco-teal",
  },
  {
    icon: Recycle,
    title: "إعادة التدوير",
    description: "إدارة عمليات إعادة التدوير وتقييم الأثر البيئي",
    color: "from-eco-teal to-primary",
  },
  {
    icon: BarChart3,
    title: "التقارير",
    description: "إنتاج تقارير شاملة وإحصائيات مفصلة",
    color: "from-primary to-eco-green-light",
  },
  {
    icon: Users,
    title: "إدارة المستخدمين",
    description: "إدارة الشركات والمستخدمين والأذونات",
    color: "from-eco-green-light to-accent",
  },
  {
    icon: Shield,
    title: "الأمان",
    description: "حماية البيانات والامتثال للمعايير البيئية",
    color: "from-accent to-primary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            المميزات
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            كل ما تحتاجه في <span className="text-gradient-eco">منصة واحدة</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نقدم لك حلولاً متكاملة لإدارة النفايات بكفاءة عالية مع مراعاة أعلى معايير الاستدامة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: typeof Package; 
  title: string; 
  description: string; 
  color: string;
}) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="group relative p-8 rounded-2xl bg-card shadow-eco-sm hover:shadow-eco-lg transition-all duration-300 border border-border/50"
  >
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-7 h-7 text-primary-foreground" />
    </div>
    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="text-muted-foreground leading-relaxed">
      {description}
    </p>
    
    {/* Hover Glow Effect */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
  </motion.div>
);

export default Features;
