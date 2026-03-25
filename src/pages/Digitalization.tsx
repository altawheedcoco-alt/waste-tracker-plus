import { memo } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Binary, Cpu, Globe2, ShieldCheck, BarChart3, FileCheck, Truck, Factory,
  Recycle, Scale, Zap, Cloud, Lock, Eye, TrendingUp, Workflow, Brain,
  Database, Network, Fingerprint, ArrowRight, Sparkles, CheckCircle2, XCircle
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" }
  })
};

const pillars = [
  {
    icon: FileCheck,
    title: "التوثيق الرقمي الذكي",
    titleEn: "Smart Digital Documentation",
    desc: "تحويل كامل لدورة المستندات من الورق إلى النظام الرقمي — عقود، فواتير، بيانات شحن، شهادات، وتصاريح — بتوقيعات إلكترونية وأختام رقمية معتمدة وسجل تدقيق لا يمكن التلاعب به.",
    descEn: "Complete paperless document lifecycle — contracts, invoices, manifests, certificates & permits — with legally binding e-signatures, digital stamps, and tamper-proof audit trails.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Truck,
    title: "سلسلة النقل الرقمية",
    titleEn: "Digital Transport Chain",
    desc: "تتبع حي لكل شحنة من لحظة الاستلام حتى التسليم النهائي عبر GPS والتوقيعات الرقمية وصور الأدلة، مع إشعارات فورية لكل الأطراف المعنية وربط آلي بالمحاسبة.",
    descEn: "Real-time shipment tracking from pickup to final delivery via GPS, digital signatures & evidence photos, with instant notifications and auto-linked accounting.",
    color: "from-emerald-500 to-green-400",
  },
  {
    icon: Brain,
    title: "الذكاء الاصطناعي التشغيلي",
    titleEn: "Operational AI Engine",
    desc: "محرك ذكاء اصطناعي مدمج يحلل البيانات التشغيلية ويقدم توصيات استباقية — تصنيف آلي للمخلفات، كشف الشذوذ، تحليل المشاعر، واقتراحات تحسين الأداء بشكل مستمر.",
    descEn: "Built-in AI engine that analyzes operational data for proactive insights — auto waste classification, anomaly detection, sentiment analysis, and continuous optimization.",
    color: "from-violet-500 to-purple-400",
  },
  {
    icon: BarChart3,
    title: "لوحات التحكم التحليلية",
    titleEn: "Analytical Command Centers",
    desc: "مراكز قيادة رقمية لكل جهة تشغيلية (مولّد، ناقل، مدوّر، جهة تخلص) مع مؤشرات أداء حية KPIs، رسوم بيانية تفاعلية، وتقارير قابلة للتصدير والمشاركة.",
    descEn: "Role-specific digital command centers (Generator, Transporter, Recycler, Disposal) with live KPIs, interactive charts, and exportable shareable reports.",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: Scale,
    title: "الامتثال الرقابي الآلي",
    titleEn: "Automated Regulatory Compliance",
    desc: "أتمتة كاملة لمتطلبات الجهات الرقابية (WMRA, EEAA, LTRA, IDA) — إنشاء تقارير إلزامية، تدقيق ISO تفاعلي، وإخطارات استباقية بمواعيد التجديد والانتهاء.",
    descEn: "Full automation of regulatory requirements (WMRA, EEAA, LTRA, IDA) — mandatory reporting, interactive ISO audits, and proactive renewal/expiry alerts.",
    color: "from-red-500 to-rose-400",
  },
  {
    icon: Network,
    title: "الربط والتكامل الشامل",
    titleEn: "Full Integration & Connectivity",
    desc: "نظام API مفتوح يربط جميع الأطراف — مولدين، ناقلين، مدورين، جهات تخلص، سائقين، مستشارين، ومراقبين — في منظومة رقمية واحدة متكاملة بالكامل.",
    descEn: "Open API ecosystem connecting all stakeholders — generators, transporters, recyclers, disposal facilities, drivers, consultants & regulators — in one unified digital platform.",
    color: "from-teal-500 to-emerald-400",
  },
];

const stats = [
  { value: "100%", label: "رقمنة المستندات", labelEn: "Document Digitalization", icon: FileCheck },
  { value: "0", label: "ورق مطبوع", labelEn: "Paper Printed", icon: Binary },
  { value: "24/7", label: "مراقبة حية", labelEn: "Live Monitoring", icon: Eye },
  { value: "∞", label: "قابلية التوسع", labelEn: "Scalability", icon: TrendingUp },
];

const techStack = [
  { icon: Cloud, label: "سحابة آمنة", labelEn: "Secure Cloud" },
  { icon: Lock, label: "تشفير شامل", labelEn: "End-to-End Encryption" },
  { icon: Fingerprint, label: "مصادقة متعددة", labelEn: "Multi-Factor Auth" },
  { icon: Database, label: "بيانات محمية", labelEn: "Protected Data" },
  { icon: Workflow, label: "أتمتة العمليات", labelEn: "Process Automation" },
  { icon: Zap, label: "أداء فائق", labelEn: "High Performance" },
];

const Digitalization = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />

      {/* Hero Section */}
      <section className="relative pt-36 sm:pt-44 pb-20 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
              <Binary className="w-4 h-4" />
              {isAr ? 'التحول الرقمي في إدارة المخلفات' : 'Digital Transformation in Waste Management'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6"
          >
            {isAr ? (
              <>الرقمنة ليست <span className="text-primary">خياراً</span>... بل <span className="bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">مستقبل حتمي</span></>
            ) : (
              <>Digitalization isn't a <span className="text-primary">choice</span>... it's an <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">inevitable future</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10"
          >
            {isAr
              ? 'منصة iRecycle تقود ثورة رقمية حقيقية في قطاع إدارة المخلفات بمصر والمنطقة — من الورق والقلم إلى منظومة رقمية ذكية متكاملة تربط جميع الأطراف وتؤتمت كل العمليات وتحمي كل البيانات.'
              : 'iRecycle is leading a real digital revolution in Egypt & MENA waste management — from pen & paper to a fully integrated smart digital ecosystem connecting all stakeholders, automating every process, and securing all data.'
            }
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border/40 shadow-sm">
                <stat.icon className="w-5 h-5 text-primary" />
                <div className="text-start">
                  <div className="text-xl font-black text-foreground">{stat.value}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground">{isAr ? stat.label : stat.labelEn}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What is Digitalization */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {isAr ? 'ماذا تعني الرقمنة في iRecycle؟' : 'What Does Digitalization Mean at iRecycle?'}
            </h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isAr
                ? 'ليست مجرد تحويل الورق إلى PDF — بل إعادة هندسة كاملة لسلسلة القيمة في إدارة المخلفات: من لحظة توليد المخلف، مروراً بالنقل والفرز والتدوير، وصولاً للتقرير النهائي والمحاسبة. كل خطوة رقمية، ذكية، وموثقة.'
                : 'Not just converting paper to PDF — it\'s a complete re-engineering of the waste management value chain: from waste generation, through transport, sorting & recycling, to final reporting & accounting. Every step is digital, intelligent, and documented.'
              }
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                className="group relative p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <pillar.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{isAr ? pillar.title : pillar.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? pillar.desc : pillar.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital vs Traditional */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-black text-center mb-12"
          >
            {isAr ? 'قبل وبعد الرقمنة' : 'Before & After Digitalization'}
          </motion.h2>

          <div className="space-y-4">
            {[
              { before: isAr ? 'مستندات ورقية تضيع وتتلف' : 'Paper docs lost & damaged', after: isAr ? 'توثيق رقمي دائم بتوقيعات إلكترونية' : 'Permanent digital records with e-signatures' },
              { before: isAr ? 'تتبع يدوي بالهاتف والواتساب' : 'Manual tracking via phone & WhatsApp', after: isAr ? 'تتبع GPS حي مع إشعارات فورية' : 'Live GPS tracking with instant alerts' },
              { before: isAr ? 'محاسبة يدوية وأخطاء حسابية' : 'Manual accounting & calculation errors', after: isAr ? 'محاسبة آلية مرتبطة بكل شحنة' : 'Auto accounting linked to every shipment' },
              { before: isAr ? 'تقارير رقابية تأخذ أسابيع' : 'Regulatory reports take weeks', after: isAr ? 'تقارير فورية بضغطة زر' : 'Instant reports with one click' },
              { before: isAr ? 'لا رقابة على السائقين' : 'No driver oversight', after: isAr ? 'مراقبة حية وتقييم أداء ذكي' : 'Live monitoring & smart performance scoring' },
              { before: isAr ? 'تواصل مشتت بين الأطراف' : 'Scattered stakeholder communication', after: isAr ? 'منصة تواصل موحدة مشفرة' : 'Unified encrypted communication hub' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0"
              >
                <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl sm:rounded-e-none bg-destructive/5 dark:bg-destructive/10 border border-destructive/20">
                  <X className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm font-semibold text-destructive">{item.before}</span>
                </div>
                <div className="hidden sm:flex items-center justify-center w-10 bg-muted/50 border-y border-border/30">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl sm:rounded-s-none bg-primary/5 dark:bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-primary">{item.after}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Foundation */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-black mb-4"
          >
            {isAr ? 'البنية التقنية المتينة' : 'Robust Technical Foundation'}
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {isAr
              ? 'مبنية على أحدث التقنيات السحابية مع أعلى معايير الأمان والحماية'
              : 'Built on cutting-edge cloud technologies with the highest security standards'
            }
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 2}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <tech.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-bold">{isAr ? tech.label : tech.labelEn}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black mb-4 relative">
              {isAr ? 'رؤيتنا: صفر ورق — 100% رقمي' : 'Our Vision: Zero Paper — 100% Digital'}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto relative">
              {isAr
                ? 'نؤمن أن مستقبل إدارة المخلفات في مصر والمنطقة العربية يبدأ بالرقمنة الكاملة. منصة iRecycle ليست مجرد برنامج — بل مشروع وطني لتحويل قطاع بأكمله من العشوائية إلى النظام، ومن الورق إلى البيانات، ومن التخمين إلى الذكاء الاصطناعي.'
                : 'We believe the future of waste management in Egypt & the Arab world starts with full digitalization. iRecycle isn\'t just software — it\'s a national project to transform an entire sector from chaos to order, from paper to data, from guesswork to AI.'
              }
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

Digitalization.displayName = 'Digitalization';
export default Digitalization;
