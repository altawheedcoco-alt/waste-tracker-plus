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
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
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

      {/* Deep Dive: How the platform serves each pillar */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {isAr ? 'كيف تخدم المنصة كل تفصيلة؟' : 'How Does the Platform Serve Every Detail?'}
            </h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base leading-relaxed">
              {isAr
                ? 'لكل ركيزة من ركائز الرقمنة، بنت المنصة أدوات وأنظمة متخصصة تعمل بشكل متكامل. إليك كيف يتحقق ذلك عملياً:'
                : 'For each digitalization pillar, the platform has built specialized tools and systems that work together. Here\'s how it works in practice:'
              }
            </p>
          </motion.div>

          {/* 1. Digital Documentation Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '١. التوثيق الرقمي — بالتفصيل' : '1. Digital Documentation — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'استوديو المستندات الذكي (AI Studio)' : 'AI Document Studio', d: isAr ? 'إنشاء عقود وفواتير وشهادات بالذكاء الاصطناعي — تكتب الوصف والمنصة تُنتج المستند جاهزاً للتوقيع بصيغة احترافية.' : 'Generate contracts, invoices & certificates with AI — describe what you need and the platform produces a signing-ready professional document.' },
                { t: isAr ? 'التوقيع الإلكتروني والأختام' : 'E-Signatures & Digital Stamps', d: isAr ? 'كل مستند يُوقَّع إلكترونياً بتوقيع مُعتمد وختم المؤسسة الرقمي، مع ختم زمني غير قابل للتعديل وسجل تدقيق كامل لمن وقّع ومتى.' : 'Every document is signed with verified e-signatures and organizational digital stamps, with immutable timestamps and full audit trail of who signed and when.' },
                { t: isAr ? 'التوقيع التلقائي' : 'Auto-Signing Rules', d: isAr ? 'يمكن ضبط قواعد توقيع تلقائية — مثلاً: كل فاتورة معتمدة تُوقَّع وتُختم تلقائياً عند تغيير حالتها لـ "معتمدة" دون تدخل يدوي.' : 'Set auto-signing rules — e.g., every approved invoice is automatically signed & stamped when status changes to "approved" without manual intervention.' },
                { t: isAr ? 'التحقق العلني من المستندات' : 'Public Document Verification', d: isAr ? 'أي مستند صادر من المنصة يحمل QR Code وكود تحقق — أي طرف خارجي يمكنه التحقق من صحة المستند فوراً عبر صفحة التحقق العلنية.' : 'Every platform-issued document carries a QR code and verification code — any external party can instantly verify authenticity via the public verification page.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2. Transport Chain Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '٢. سلسلة النقل الرقمية — بالتفصيل' : '2. Digital Transport Chain — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'الشحنة الرقمية الكاملة' : 'Full Digital Shipment', d: isAr ? 'كل شحنة لها ملف رقمي كامل: نوع المخلف، الوزن، المصدر، الوجهة، السائق المُعيَّن، صور الاستلام والتسليم، وتوقيعات جميع الأطراف — كلها في مكان واحد.' : 'Every shipment has a full digital file: waste type, weight, source, destination, assigned driver, pickup/delivery photos, and all-party signatures — all in one place.' },
                { t: isAr ? 'ثلاث فئات سائقين' : 'Three Driver Categories', d: isAr ? 'المنصة تدعم السائق التابع (موظف دائم)، السائق المستقل (نموذج Uber)، والسائق المؤجر (رابط مهمة لمرة واحدة) — كل فئة لها صلاحيات وأدوات مختلفة.' : 'The platform supports Employed Drivers (permanent), Freelance Drivers (Uber model), and Hired Drivers (one-time mission link) — each with different permissions and tools.' },
                { t: isAr ? 'التوزيع الآلي الذكي (Smart Dispatch)' : 'Smart Dispatch Engine', d: isAr ? 'محرك توزيع يختار السائق الأنسب تلقائياً بناءً على الموقع الجغرافي، التقييم، الحمولة المتاحة، وسعر العرض — مع إمكانية المزايدة من السائقين المستقلين.' : 'Dispatch engine auto-selects the best driver based on location, rating, available capacity, and bid price — with bidding capability for freelance drivers.' },
                { t: isAr ? 'الخريطة الحية والتتبع' : 'Live Map & Tracking', d: isAr ? 'خريطة حية تعرض مواقع جميع السائقين والشحنات النشطة لحظياً، مع إشعارات واتساب وبوش عند كل تحديث حالة (استلام، في الطريق، تم التسليم).' : 'Live map showing all driver locations and active shipments in real-time, with WhatsApp & push notifications at every status update (picked up, in transit, delivered).' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3. AI Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '٣. الذكاء الاصطناعي — بالتفصيل' : '3. AI Engine — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'وكيل AI للمبيعات (Sales Agent)' : 'AI Sales Agent', d: isAr ? 'وكيل ذكي يستقبل المحادثات عبر واتساب وتليجرام والموقع — يجيب الأسئلة، يُنشئ طلبات جديدة، ويحوّل للفريق البشري عند الحاجة — يعمل ٢٤/٧ بدون توقف.' : 'Smart agent handling conversations via WhatsApp, Telegram & website — answers questions, creates orders, and escalates to human staff when needed — works 24/7.' },
                { t: isAr ? 'تصنيف المخلفات بالصورة' : 'Image-Based Waste Classification', d: isAr ? 'التقط صورة للمخلف والذكاء الاصطناعي يصنفه تلقائياً (بلاستيك، معدن، ورق، عضوي...) ويقترح المسار الأمثل للمعالجة أو التدوير.' : 'Take a photo of waste and AI auto-classifies it (plastic, metal, paper, organic...) and suggests the optimal processing or recycling route.' },
                { t: isAr ? 'كشف الشذوذ والتنبيهات' : 'Anomaly Detection & Alerts', d: isAr ? 'المحرك يراقب كل العمليات ويكتشف الأنماط غير الطبيعية: شحنة بوزن مشبوه، تأخير غير مبرر، فجوة في السجلات — وينبّه المسؤول فوراً.' : 'The engine monitors all operations and detects anomalies: suspicious shipment weight, unexplained delays, record gaps — and alerts management immediately.' },
                { t: isAr ? 'مساعد العمليات الذكي' : 'Smart Operations Assistant', d: isAr ? 'مساعد AI متاح داخل لوحة التحكم يجيب أسئلة المستخدم عن بياناته: "كم شحنة أرسلت هذا الشهر؟"، "ما أكثر نوع مخلف؟"، "ما أداء السائق أحمد؟"' : 'AI assistant inside the dashboard answers user questions about their data: "How many shipments this month?", "What\'s the most common waste type?", "What\'s driver Ahmed\'s performance?"' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 4. Command Centers Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '٤. لوحات التحكم — بالتفصيل' : '4. Command Centers — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'لوحة المولّد (Generator)' : 'Generator Dashboard', d: isAr ? 'تدير طلبات نقل المخلفات، تتابع الشحنات، تراقب الأوزان والتكاليف، تطبع البيانات والفواتير، وتتواصل مع الناقلين — كلها من شاشة واحدة.' : 'Manage waste transport requests, track shipments, monitor weights & costs, print manifests & invoices, and communicate with transporters — all from one screen.' },
                { t: isAr ? 'لوحة الناقل (Transporter)' : 'Transporter Dashboard', d: isAr ? 'تدير السائقين والمركبات، تستقبل الطلبات، توزّع المهام، تراقب المسارات الحية، تدير المحاسبة مع كل جهة، وتصدر التقارير الرقابية.' : 'Manage drivers & vehicles, receive requests, dispatch tasks, monitor live routes, handle accounting per entity, and generate regulatory reports.' },
                { t: isAr ? 'لوحة المدوّر (Recycler)' : 'Recycler Dashboard', d: isAr ? 'تدير سعة المنشأة، تتبع المواد الواردة والمُعالَجة، مؤشرات إعادة التدوير، جودة المواد، وتقارير الأثر البيئي — مع ربط مباشر بسوق B2B.' : 'Manage facility capacity, track incoming & processed materials, recycling rates, material quality, environmental impact reports — with direct B2B marketplace link.' },
                { t: isAr ? 'لوحة المدير السيادي (Sovereign Admin)' : 'Sovereign Admin Panel', d: isAr ? 'رؤية شاملة ٣٦٠° على المنظومة بالكامل: كل الجهات، كل الشحنات، كل المستخدمين، الموافقات، الإعدادات، والتقارير — مع صلاحيات حاكمة كاملة.' : 'Full 360° view of the entire ecosystem: all entities, shipments, users, approvals, settings & reports — with complete sovereign authority.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 5. Regulatory Compliance Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '٥. الامتثال الرقابي — بالتفصيل' : '5. Regulatory Compliance — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'بوابات الجهات الرقابية' : 'Regulatory Authority Portals', d: isAr ? 'بوابة مخصصة لكل جهة رقابية (WMRA, EEAA, LTRA, IDA) مع تقارير مُعدّة مسبقاً تتوافق مع المتطلبات القانونية لكل هيئة — جاهزة للتقديم بضغطة زر.' : 'Dedicated portal for each authority (WMRA, EEAA, LTRA, IDA) with pre-formatted reports matching each agency\'s legal requirements — ready to submit with one click.' },
                { t: isAr ? 'التدقيق التفاعلي ISO' : 'Interactive ISO Auditing', d: isAr ? 'نظام تدقيق ISO 14001 تفاعلي مع قوائم فحص رقمية، ربط مباشر بالأدلة من قاعدة البيانات، وإمكانية دعوة المدقق الخارجي عبر رابط آمن مؤقت.' : 'Interactive ISO 14001 audit system with digital checklists, direct evidence linking from the database, and ability to invite external auditors via secure temporary link.' },
                { t: isAr ? 'إنذارات التراخيص والتجديد' : 'License & Renewal Alerts', d: isAr ? 'المنصة تتبع كل ترخيص وتصريح لكل جهة — وترسل إنذارات استباقية قبل انتهاء الصلاحية بـ 30/60/90 يوماً عبر البوش والإيميل والواتساب.' : 'The platform tracks every license & permit for every entity — sending proactive alerts 30/60/90 days before expiry via push, email & WhatsApp.' },
                { t: isAr ? 'سجل التدقيق الشامل (Audit Trail)' : 'Comprehensive Audit Trail', d: isAr ? 'كل إجراء على المنصة مسجّل: من أنشأ، من عدّل، من حذف، متى وأين — سجل لا يمكن مسحه أو تعديله، يُستخدم كدليل قانوني عند الحاجة.' : 'Every action is logged: who created, modified, deleted, when & where — an immutable, uneditable record usable as legal evidence when needed.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 6. Integration Deep Dive */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={6}
            className="mb-10 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg">
                <Network className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black">{isAr ? '٦. الربط والتكامل — بالتفصيل' : '6. Integration & Connectivity — In Detail'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: isAr ? 'مركز التواصل الموحد' : 'Unified Communication Hub', d: isAr ? 'شات مشفر داخل المنصة بين كل الأطراف — رسائل نصية، صور، ملفات، استطلاعات رأي، وقنوات بث جماعية — كل المحادثات محفوظة ومرتبطة بالعمليات.' : 'Encrypted in-platform chat between all parties — text, photos, files, polls, broadcast channels — all conversations saved and linked to operations.' },
                { t: isAr ? 'سوق B2B الرقمي' : 'B2B Digital Marketplace', d: isAr ? 'سوق تبادل مخلفات بين الجهات — عرض وطلب، تفاوض، رسائل، تأكيد متبادل، تقييم — مع حماية خصوصية العروض بناءً على دور كل مستخدم.' : 'Waste exchange marketplace — supply & demand, negotiation, messaging, mutual confirmation, ratings — with offer privacy protection based on user role.' },
                { t: isAr ? 'إشعارات متعددة القنوات' : 'Multi-Channel Notifications', d: isAr ? 'كل حدث مهم يُرسل عبر ٤ قنوات: إشعار داخلي، بوش نوتيفيكيشن (حتى لو التطبيق مغلق)، واتساب، وإيميل — لضمان عدم فوات أي تحديث.' : 'Every important event sent via 4 channels: in-app notification, push notification (even when app is closed), WhatsApp & email — ensuring nothing is missed.' },
                { t: isAr ? 'مفاتيح API للتكامل' : 'API Keys for Integration', d: isAr ? 'نظام مفاتيح API مع صلاحيات محددة (قراءة فقط، كتابة، إدارة) وتحديد معدل الطلبات — يسمح لأي نظام خارجي بالربط الآمن مع بيانات المنصة.' : 'API key system with granular scopes (read-only, write, admin) and rate limiting — allowing any external system to securely connect with platform data.' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20">
                  <h4 className="text-sm font-bold mb-1.5 text-foreground">{item.t}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Additional Platform Capabilities */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={7}
            className="p-6 sm:p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
            <div className="flex items-center gap-3 mb-5">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-black">{isAr ? 'وأكثر من ذلك...' : 'And Much More...'}</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                isAr ? 'نظام محاسبة رقمي متكامل (ERP)' : 'Full Digital Accounting (ERP)',
                isAr ? 'مزادات المخلفات الإلكترونية' : 'Electronic Waste Auctions',
                isAr ? 'نظام التوظيف والتعيين الذكي' : 'Smart Recruitment System',
                isAr ? 'إعلانات المنصة والتسويق' : 'Platform Ads & Marketing',
                isAr ? 'أكاديمية تدريب إعادة التدوير' : 'Recycling Training Academy',
                isAr ? 'نظام المكافآت والتقييم' : 'Rewards & Rating System',
                isAr ? 'بطاقة الهوية الرقمية للمؤسسة' : 'Digital Identity Card',
                isAr ? 'مركز الطباعة الذكي' : 'Smart Print Center',
                isAr ? 'كول سنتر ذكي بتحليل المكالمات' : 'Smart Call Center with Analytics',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card border border-border/30">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-bold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

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
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
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
