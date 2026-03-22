import { memo } from "react";
import { motion } from "framer-motion";
import { Building2, Briefcase, UserCheck, Truck, Zap, ArrowLeftRight, Star, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const driverTypes = [
  {
    icon: Building2,
    titleAr: "سائق تابع للجهة",
    titleEn: "Company Driver",
    descAr: "سائق مرتبط بجهة نقل محددة — ينفّذ مهام الجهة فقط ويتبع نظامها التشغيلي بالكامل",
    descEn: "Driver bound to a specific transport company — executes company missions only",
    features: [
      { ar: "مهام من الجهة مباشرة", en: "Direct company missions" },
      { ar: "تتبع GPS لحظي", en: "Real-time GPS tracking" },
      { ar: "أدوات ميدانية متكاملة", en: "Full field tools" },
    ],
    gradient: "from-blue-500 to-cyan-600",
    bgGlow: "bg-blue-500/10",
  },
  {
    icon: Briefcase,
    titleAr: "سائق حر مؤجر",
    titleEn: "Freelance Hired",
    descAr: "سائق مستقل يقبل مهام من جهات مختلفة بعقود اختيارية — مرونة كاملة مع ضمان الدخل",
    descEn: "Independent driver accepting missions from various companies — full flexibility",
    features: [
      { ar: "عروض مهام متعددة", en: "Multiple mission offers" },
      { ar: "عقود اختيارية مرنة", en: "Optional flexible contracts" },
      { ar: "تسعيرة شخصية", en: "Personal pricing" },
    ],
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
  },
  {
    icon: UserCheck,
    titleAr: "سائق مستقل",
    titleEn: "Independent Driver",
    descAr: "سائق حر يتلقى شحنات عبر التوزيع الذكي ويتصفح سوق الشحنات — ريادة أعمال حقيقية",
    descEn: "Free driver receiving shipments via Smart Dispatch & browsing the marketplace",
    features: [
      { ar: "التوزيع الذكي التلقائي", en: "Smart auto-dispatch" },
      { ar: "سوق الشحنات والمزايدة", en: "Shipment marketplace" },
      { ar: "نظام سمعة وتقييم", en: "Rating & reputation" },
    ],
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "bg-emerald-500/10",
  },
];

const DriverEcosystemShowcase = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/20" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? "منظومة السائقين v5.1" : "Driver Ecosystem v5.1"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? "ثلاثة أنواع من السائقين" : "Three Driver Types"}
            <span className="text-primary"> {isAr ? "— منظومة واحدة" : "— One Ecosystem"}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "أول منصة عربية تفصل بين السائقين حسب طبيعة العمل — كل نوع له واجهته وأدواته وصلاحياته الخاصة"
              : "The first Arabic platform to differentiate drivers by work nature — each type has its own UI, tools & permissions"}
          </p>
        </motion.div>

        {/* Driver Types Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-10">
          {driverTypes.map((type, i) => (
            <motion.div
              key={type.titleAr}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="group relative bg-card border border-border/50 rounded-2xl p-5 sm:p-7 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Background glow */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 ${type.bgGlow} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <type.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                  {isAr ? type.titleAr : type.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                  {isAr ? type.descAr : type.descEn}
                </p>
                <ul className="space-y-2">
                  {type.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80">
                      <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {isAr ? f.ar : f.en}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8"
        >
          {[
            { icon: ArrowLeftRight, labelAr: "توزيع ذكي تلقائي", labelEn: "Smart Auto-Dispatch" },
            { icon: Star, labelAr: "تقييم ثنائي الاتجاه", labelEn: "Dual Rating System" },
            { icon: MapPin, labelAr: "تتبع نطاق الخدمة", labelEn: "Service Area Tracking" },
          ].map((item) => (
            <div key={item.labelAr} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

DriverEcosystemShowcase.displayName = "DriverEcosystemShowcase";
export default DriverEcosystemShowcase;
