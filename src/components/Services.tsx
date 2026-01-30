import { motion } from "framer-motion";
import { MapPin, FileBarChart, Clock, CheckCircle2 } from "lucide-react";

const services = [
  {
    icon: MapPin,
    title: "تتبع GPS مباشر للسائقين",
    description: "رقابة كاملة على مخلفاتك عبر تتبع ذكي يضمن لك التخلص النهائي الصحيح",
    features: ["تتبع في الوقت الفعلي", "تنبيهات فورية", "سجل كامل للرحلات"],
  },
  {
    icon: FileBarChart,
    title: "تقارير بيئية شاملة",
    description: "تحليلات بيئية دقيقة تدعم اتخاذ القرار وتوفير الوقت",
    features: ["تقارير مخصصة", "رسوم بيانية تفاعلية", "تصدير متعدد الصيغ"],
  },
  {
    icon: Clock,
    title: "إدارة الوقت والجدولة",
    description: "جدولة ذكية لعمليات الجمع والنقل والمعالجة",
    features: ["جدولة تلقائية", "تذكيرات ذكية", "تحسين المسارات"],
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            خدماتنا
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            خدمات <span className="text-gradient-eco">متميزة</span> لإدارة أفضل
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نوفر لك أدوات متقدمة تساعدك على إدارة عملياتك بكفاءة عالية
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  description, 
  features 
}: { 
  icon: typeof MapPin; 
  title: string; 
  description: string; 
  features: string[];
}) => (
  <motion.div
    whileHover={{ y: -8 }}
    className="group relative p-8 rounded-3xl bg-card shadow-eco-sm hover:shadow-eco-lg transition-all duration-300 border border-border/50 overflow-hidden"
  >
    {/* Gradient Background */}
    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
    
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl gradient-eco flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-eco-md">
        <Icon className="w-8 h-8 text-primary-foreground" />
      </div>
      
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {description}
      </p>
      
      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default Services;
