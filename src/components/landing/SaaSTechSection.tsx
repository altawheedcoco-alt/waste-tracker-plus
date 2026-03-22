import { memo } from "react";
import { motion } from "framer-motion";
import {
  Code2, Cloud, Cpu, Lock, Fingerprint, Satellite, Binary,
  MonitorSmartphone, Layers, GitBranch, Server, Wifi, Zap, Route
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const techPillars = [
  {
    icon: Cloud,
    titleAr: "حوسبة سحابية",
    titleEn: "Cloud Computing",
    descAr: "بنية تحتية سحابية مرنة تتوسع تلقائياً مع حجم عملياتك — من ١٠ شحنات إلى ١٠,٠٠٠ شحنة يومياً",
    descEn: "Elastic cloud infrastructure that auto-scales with your operations",
    tags: ["SaaS", "Auto-Scale", "99.9% Uptime"],
  },
  {
    icon: Cpu,
    titleAr: "ذكاء اصطناعي توليدي",
    titleEn: "Generative AI",
    descAr: "نماذج ذكاء اصطناعي متقدمة تحلل مستنداتك وتتنبأ بالمشكلات وتصنّف مخلفاتك بالصور فوراً",
    descEn: "Advanced AI models that analyze documents, predict issues & classify waste by image",
    tags: ["Gemini Pro", "Vision AI", "NLP"],
  },
  {
    icon: Lock,
    titleAr: "تشفير عسكري",
    titleEn: "Military-Grade Encryption",
    descAr: "تشفير AES-256 لكل البيانات وبصمة SHA-256 لكل مستند — لا أحد يستطيع التلاعب بسجلاتك",
    descEn: "AES-256 encryption for all data & SHA-256 fingerprint for every document",
    tags: ["SHA-256", "E2E Encryption", "Zero-Trust"],
  },
  {
    icon: Fingerprint,
    titleAr: "تحقق بيومتري",
    titleEn: "Biometric Verification",
    descAr: "مطابقة الوجه مع الهوية الوطنية بدقة فائقة واستخراج البيانات آلياً عبر OCR الذكي",
    descEn: "Face match with national ID & automated data extraction via smart OCR",
    tags: ["Face Match", "AI-OCR", "KYC"],
  },
  {
    icon: Satellite,
    titleAr: "تتبع جغرافي لحظي",
    titleEn: "Real-time Geospatial",
    descAr: "تتبع GPS مباشر لمركبات النقل مع سياج جغرافي ذكي وتنبيهات انحراف فورية",
    descEn: "Live GPS tracking with smart geofencing & instant deviation alerts",
    tags: ["GPS Live", "Geofencing", "IoT Ready"],
  },
  {
    icon: GitBranch,
    titleAr: "سلسلة كتل مبسطة",
    titleEn: "Blockchain-lite",
    descAr: "سجل مراجعة غير قابل للتعديل (Immutable Audit Trail) يوثق كل عملية بتسلسل تشفيري",
    descEn: "Immutable audit trail documenting every operation with cryptographic chaining",
    tags: ["Chain Hash", "Immutable", "Audit Trail"],
  },
];

const floatingTechWords = [
  "API Gateway", "Microservices", "CI/CD", "WebSocket", "Edge Functions",
  "Row-Level Security", "OAuth 2.0", "Webhooks", "PWA", "REST API",
  "Real-time DB", "CDN", "Docker", "TypeScript", "React",
];

const SaaSTechSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Animated tech background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Floating binary/code decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        {floatingTechWords.map((word, i) => (
          <motion.span
            key={word}
            className="absolute text-foreground font-mono text-[10px] sm:text-xs font-bold"
            style={{
              top: `${8 + (i * 6.2) % 85}%`,
              left: `${5 + (i * 13.7) % 90}%`,
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12"
        >
          {/* Code badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border-2 border-primary/20 mb-6 shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Code2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold text-primary tracking-wider">
              {isAr ? "حلول برمجية متقدمة" : "Advanced Software Solutions"}
            </span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </motion.div>

          <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 sm:mb-5 leading-tight">
            {isAr ? (
              <>
                ليست مجرد منصة...
                <br />
                <span className="text-primary">منظومة تقنية متكاملة</span>
              </>
            ) : (
              <>
                Not Just a Platform...
                <br />
                <span className="text-primary">A Complete Tech Ecosystem</span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            {isAr
              ? "نقدم حلولاً برمجية تقنية (SaaS) لإدارة المخلفات بأساليب ذكية ومتطورة — مبنية على أحدث تقنيات الحوسبة السحابية والذكاء الاصطناعي والتشفير المتقدم"
              : "We deliver SaaS solutions for waste management powered by cutting-edge cloud computing, AI, and advanced encryption technologies"}
          </p>

          {/* Tech stack badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { icon: MonitorSmartphone, label: "PWA" },
              { icon: Server, label: "Edge Functions" },
              { icon: Layers, label: "Microservices" },
              { icon: Wifi, label: "Real-time" },
              { icon: Binary, label: "AI/ML" },
            ].map((tech) => (
              <span
                key={tech.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/60 text-[10px] sm:text-xs font-mono font-bold text-muted-foreground"
              >
                <tech.icon className="w-3 h-3" />
                {tech.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Tech Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 max-w-6xl mx-auto">
          {techPillars.map((pillar, index) => (
            <motion.div
              key={pillar.titleAr}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
            >
              {/* Glowing top border on hover */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/60 to-transparent transition-all duration-500" />

              {/* Icon with pulse ring */}
              <div className="relative w-9 h-9 sm:w-14 sm:h-14 mb-2 sm:mb-5">
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl ring-2 ring-primary/0 group-hover:ring-primary/20 group-hover:animate-pulse transition-all" />
                <div className="relative w-full h-full rounded-lg sm:rounded-xl flex items-center justify-center">
                  <pillar.icon className="w-4 h-4 sm:w-7 sm:h-7 text-primary" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xs sm:text-lg font-black text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors leading-tight">
                {isAr ? pillar.titleAr : pillar.titleEn}
              </h3>
              <p className="text-[9px] sm:text-sm text-muted-foreground leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                {isAr ? pillar.descAr : pillar.descEn}
              </p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-1">
                {pillar.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-primary/5 border border-primary/10 text-[8px] sm:text-[10px] font-mono font-bold text-primary/80 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-12"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-8 py-5 rounded-2xl bg-card border-2 border-primary/15 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-start">
                <p className="text-sm sm:text-base font-black text-foreground">
                  {isAr
                    ? "جهة وسيطة تقنية — لا تتحمل مسؤولية العمليات التشغيلية"
                    : "Technical Intermediary — No operational liability"}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {isAr
                    ? "منصة iRecycle تقدم حلولاً برمجية SaaS فقط • المسؤولية على المستخدم"
                    : "iRecycle provides SaaS solutions only • Liability rests with the user"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

SaaSTechSection.displayName = "SaaSTechSection";

export default SaaSTechSection;
