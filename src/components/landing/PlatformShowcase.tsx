import { memo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, FileCheck, Brain, Shield, Wallet, ClipboardCheck, 
  Headphones, Database, Truck, Users, Zap, Globe, Car, ShoppingCart, Star
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const showcaseItems = [
  {
    icon: BarChart3,
    titleAr: "لوحات تحكم ذكية",
    titleEn: "Smart Dashboards",
    descAr: "٥٨ ودجت تخصصي مع تحليلات لحظية وتقارير يومية قابلة للطباعة — رؤية شاملة لكل عملياتك في نظرة واحدة",
    descEn: "58 specialized widgets with real-time analytics and printable daily reports",
    statAr: "٧ تبويبات تحليلية",
    statEn: "7 analytics tabs",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    titleAr: "ذكاء اصطناعي متكامل",
    titleEn: "Integrated AI Engine",
    descAr: "وكيل ذكي يجيب عملائك ويحلل مستنداتك ويتنبأ بالمشكلات قبل حدوثها — مستقبل إدارة المخلفات",
    descEn: "Smart agent that answers customers, analyzes documents & predicts issues",
    statAr: "تحليل فوري",
    statEn: "Instant analysis",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Shield,
    titleAr: "نظام رقابي شامل",
    titleEn: "Regulatory Oversight",
    descAr: "رصد الامتثال والتفتيش الميداني وإصدار المخالفات والعقوبات — كل جهة رقابية لها لوحتها المتكاملة",
    descEn: "Compliance monitoring, field inspections & violation management",
    statAr: "١١ وحدة رقابية",
    statEn: "11 regulatory modules",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: ClipboardCheck,
    titleAr: "سلسلة الحفظ الرقمية",
    titleEn: "Digital Chain of Custody",
    descAr: "تتبع كل كيلوجرام من المصدر حتى التدوير — شفافية كاملة وتوثيق لا يقبل التلاعب",
    descEn: "Track every kilogram from source to recycling — full transparency",
    statAr: "تتبع لحظي",
    statEn: "Real-time tracking",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Wallet,
    titleAr: "نظام مالي متكامل",
    titleEn: "Financial System",
    descAr: "فوترة آلية ودفتر أستاذ ذكي وإدارة الإيداعات والمطالبات — محاسبة بدون أخطاء",
    descEn: "Auto-invoicing, smart ledger & deposit management — error-free accounting",
    statAr: "دقة ١٠٠٪",
    statEn: "100% accuracy",
    gradient: "from-teal-500 to-cyan-600",
  },
  {
    icon: FileCheck,
    titleAr: "إدارة مستندات متقدمة",
    titleEn: "Advanced Document Hub",
    descAr: "رفع جماعي ذكي وتصنيف تلقائي حسب نوع الجهة — أرشيف رقمي متكامل لكل مستنداتك",
    descEn: "Smart bulk upload, auto-categorization & complete digital archive",
    statAr: "أرشيف رقمي",
    statEn: "Digital archive",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: Headphones,
    titleAr: "مركز اتصالات ذكي",
    titleEn: "Smart Call Center",
    descAr: "تسجيل المكالمات وتحليل الأداء وقياس رضا العملاء — خدمة عملاء بمعايير عالمية",
    descEn: "Call recording, performance analytics & customer satisfaction tracking",
    statAr: "تقييم فوري",
    statEn: "Instant rating",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: Users,
    titleAr: "منصة عُمالنا للتوظيف",
    titleEn: "Omaluna Recruitment",
    descAr: "نظام توظيف متكامل يربط العمالة بالمصانع ومراكز التدوير — إدارة موارد بشرية رقمية",
    descEn: "Integrated recruitment connecting workers with factories & recycling centers",
    statAr: "توظيف رقمي",
    statEn: "Digital hiring",
    gradient: "from-sky-500 to-blue-500",
  },
];

const PlatformShowcase = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? 'اكتشف ما بالداخل' : 'Discover What\'s Inside'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? 'منظومة رقمية' : 'A Digital Ecosystem'}
            <span className="text-primary"> {isAr ? 'لا مثيل لها' : 'Like No Other'}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? 'أكثر من مجرد منصة — نظام بيئي رقمي متكامل يربط كل أطراف سلسلة إدارة المخلفات في مصر' 
              : 'More than a platform — a complete digital ecosystem connecting all waste management stakeholders in Egypt'}
          </p>
        </motion.div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.titleAr}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group relative bg-card border border-border/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2.5 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-sm sm:text-lg font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors leading-tight">
                {isAr ? item.titleAr : item.titleEn}
              </h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                {isAr ? item.descAr : item.descEn}
              </p>

              {/* Stat badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                  {isAr ? item.statAr : item.statEn}
                </span>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.06), transparent 70%)' }} 
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/40 border border-border/50">
            <Globe className="w-5 h-5 text-primary" />
            <p className="text-sm sm:text-base font-bold text-foreground">
              {isAr ? 'وأكثر من ذلك بكثير...' : 'And much more...'}
              <span className="text-muted-foreground font-medium mr-2">
                {isAr ? ' سجّل الآن واكتشف بنفسك' : ' Sign up and discover yourself'}
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

PlatformShowcase.displayName = 'PlatformShowcase';

export default PlatformShowcase;
