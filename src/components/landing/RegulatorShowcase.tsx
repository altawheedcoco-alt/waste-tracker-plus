import { memo } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, FileWarning, ClipboardCheck, Building2, Scale, Landmark, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const regulators = [
  {
    icon: Shield,
    codeAr: "WMRA",
    nameAr: "جهاز تنظيم إدارة المخلفات",
    nameEn: "Waste Management Regulatory Agency",
    descAr: "إصدار التراخيص ومراقبة الامتثال والتفتيش الميداني وإصدار المخالفات",
    descEn: "Licensing, compliance monitoring, field inspections & violation management",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Landmark,
    codeAr: "EEAA",
    nameAr: "جهاز شؤون البيئة",
    nameEn: "Egyptian Environmental Affairs Agency",
    descAr: "تقييم الأثر البيئي والرصد والمراقبة البيئية والتقارير الدورية",
    descEn: "Environmental impact assessment, monitoring & periodic reporting",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    icon: Scale,
    codeAr: "LTRA",
    nameAr: "هيئة تنظيم النقل البري",
    nameEn: "Land Transport Regulatory Authority",
    descAr: "تراخيص مركبات النقل وتتبع الأسطول والامتثال لمعايير السلامة",
    descEn: "Transport vehicle licensing, fleet tracking & safety compliance",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Building2,
    codeAr: "IDA",
    nameAr: "هيئة التنمية الصناعية",
    nameEn: "Industrial Development Authority",
    descAr: "تراخيص المنشآت الصناعية ومراقبة عمليات إعادة التدوير والتصنيع",
    descEn: "Industrial facility licensing & recycling operations oversight",
    gradient: "from-violet-500 to-purple-600",
  },
];

const RegulatorShowcase = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? "الجهات الرقابية والتنظيمية" : "Regulatory Bodies"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? "حوكمة رقمية" : "Digital Governance"}
            <span className="text-primary"> {isAr ? "لكل الجهات" : "for All Authorities"}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "لوحات تحكم مخصصة لكل جهة رقابية — تفتيش ميداني، إصدار مخالفات، تقارير امتثال، ورقابة شاملة"
              : "Custom dashboards for each regulator — inspections, violations, compliance reports & oversight"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8">
          {regulators.map((reg, i) => (
            <motion.div
              key={reg.codeAr}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card border border-border/50 rounded-2xl p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${reg.gradient} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <reg.icon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{reg.codeAr}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-tight">
                    {isAr ? reg.nameAr : reg.nameEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {isAr ? reg.descAr : reg.descEn}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: FileWarning, ar: "إصدار مخالفات رقمية", en: "Digital Violations" },
            { icon: ClipboardCheck, ar: "تفتيش ميداني إلكتروني", en: "E-Field Inspections" },
            { icon: BadgeCheck, ar: "شهادات امتثال", en: "Compliance Certificates" },
          ].map((b) => (
            <div key={b.ar} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50">
              <b.icon className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">{isAr ? b.ar : b.en}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

RegulatorShowcase.displayName = "RegulatorShowcase";
export default RegulatorShowcase;
