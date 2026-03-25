import { memo, useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Binary, BarChart3, FileCheck, Truck, Factory,
  Recycle, Scale, Zap, Cloud, Lock, Eye, TrendingUp, Workflow, Brain,
  Database, Network, Fingerprint, ArrowRight, Sparkles, CheckCircle2, XCircle,
  Users, FileText, Building2, ShieldCheck, Landmark, Award, Target, Clock,
  Layers, Globe2, MessageSquare, Smartphone, Wifi, Server
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  })
};

// Animated counter hook
const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  
  return { count, ref };
};

const LiveStat = ({ value, label, icon: Icon, suffix = "" }: { value: number; label: string; icon: React.ElementType; suffix?: string }) => {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="relative group">
      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-all duration-500" />
      <div className="relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-500">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-xs font-bold text-muted-foreground text-center">{label}</div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      </div>
    </div>
  );
};

const pillars = [
  {
    icon: FileCheck, title: "التوثيق الرقمي الذكي", titleEn: "Smart Digital Documentation",
    desc: "تحويل كامل لدورة المستندات — عقود، فواتير، بيانات شحن، شهادات، وتصاريح — بتوقيعات إلكترونية وأختام رقمية وسجل تدقيق لا يمكن التلاعب به.",
    descEn: "Complete paperless document lifecycle — contracts, invoices, manifests, certificates & permits — with e-signatures, digital stamps, and tamper-proof audit trails.",
    color: "from-blue-500 to-cyan-400",
    details: [
      { t: "استوديو المستندات الذكي", tEn: "AI Document Studio", d: "إنشاء عقود وفواتير وشهادات بالذكاء الاصطناعي — تكتب الوصف والمنصة تُنتج المستند جاهزاً للتوقيع.", dEn: "Generate contracts, invoices & certificates with AI — describe what you need and get a signing-ready document." },
      { t: "التوقيع الإلكتروني والأختام", tEn: "E-Signatures & Digital Stamps", d: "كل مستند يُوقَّع إلكترونياً بتوقيع مُعتمد وختم المؤسسة الرقمي، مع ختم زمني وسجل تدقيق كامل.", dEn: "Every document signed with verified e-signatures and organizational stamps, with timestamps and full audit trail." },
      { t: "التوقيع التلقائي", tEn: "Auto-Signing Rules", d: "كل فاتورة معتمدة تُوقَّع وتُختم تلقائياً عند تغيير حالتها — دون تدخل يدوي.", dEn: "Auto-sign & stamp approved invoices on status change — zero manual intervention." },
      { t: "التحقق العلني", tEn: "Public Verification", d: "كل مستند يحمل QR Code وكود تحقق — أي طرف خارجي يتحقق من الصحة فوراً.", dEn: "Every document carries QR & verification code — any party can instantly verify authenticity." },
    ],
  },
  {
    icon: Truck, title: "سلسلة النقل الرقمية", titleEn: "Digital Transport Chain",
    desc: "تتبع حي لكل شحنة عبر GPS والتوقيعات الرقمية وصور الأدلة، مع إشعارات فورية وربط آلي بالمحاسبة.",
    descEn: "Real-time shipment tracking via GPS, digital signatures & evidence photos, with instant notifications and auto-linked accounting.",
    color: "from-emerald-500 to-green-400",
    details: [
      { t: "الشحنة الرقمية الكاملة", tEn: "Full Digital Shipment", d: "كل شحنة لها ملف رقمي: نوع المخلف، الوزن، المصدر، الوجهة، السائق، صور الاستلام والتسليم، والتوقيعات.", dEn: "Full digital file per shipment: waste type, weight, source, destination, driver, photos & signatures." },
      { t: "٣ فئات سائقين", tEn: "3 Driver Categories", d: "سائق تابع (موظف)، مستقل (نموذج Uber بمزايدة)، ومؤجر (رابط مهمة لمرة واحدة) — لكل فئة أدوات مختلفة.", dEn: "Employed (permanent), Freelance (Uber bidding model), Hired (one-time mission link) — each with unique tools." },
      { t: "التوزيع الآلي الذكي", tEn: "Smart Dispatch", d: "يختار السائق الأنسب تلقائياً بناءً على الموقع والتقييم والحمولة والسعر.", dEn: "Auto-selects best driver by location, rating, capacity & price." },
      { t: "الخريطة الحية", tEn: "Live Map", d: "خريطة تعرض مواقع جميع السائقين والشحنات النشطة لحظياً مع إشعارات واتساب وبوش.", dEn: "Live map showing all drivers & active shipments with WhatsApp & push alerts." },
    ],
  },
  {
    icon: Brain, title: "الذكاء الاصطناعي التشغيلي", titleEn: "Operational AI Engine",
    desc: "محرك AI يحلل البيانات ويقدم توصيات استباقية — تصنيف آلي، كشف الشذوذ، وتحسين أداء مستمر.",
    descEn: "AI engine analyzing data for proactive insights — auto classification, anomaly detection, continuous optimization.",
    color: "from-violet-500 to-purple-400",
    details: [
      { t: "وكيل AI للمبيعات", tEn: "AI Sales Agent", d: "يستقبل محادثات واتساب وتليجرام — يجيب الأسئلة، يُنشئ طلبات، ويحوّل للفريق عند الحاجة ٢٤/٧.", dEn: "Handles WhatsApp & Telegram conversations 24/7 — answers questions, creates orders, escalates when needed." },
      { t: "تصنيف المخلفات بالصورة", tEn: "Image Classification", d: "التقط صورة والذكاء الاصطناعي يصنف المخلف ويقترح المسار الأمثل للتدوير.", dEn: "Snap a photo and AI classifies the waste and suggests optimal recycling route." },
      { t: "كشف الشذوذ", tEn: "Anomaly Detection", d: "يكتشف الأنماط غير الطبيعية: وزن مشبوه، تأخير غير مبرر، فجوات في السجلات.", dEn: "Detects anomalies: suspicious weights, unexplained delays, record gaps." },
      { t: "مساعد العمليات", tEn: "Operations Assistant", d: "مساعد AI يجيب: 'كم شحنة أرسلت؟'، 'ما أكثر نوع مخلف؟'، 'أداء السائق أحمد؟'", dEn: "AI assistant answers: 'How many shipments?', 'Most common waste?', 'Driver Ahmed's performance?'" },
    ],
  },
  {
    icon: BarChart3, title: "لوحات التحكم التحليلية", titleEn: "Analytical Command Centers",
    desc: "مراكز قيادة رقمية لكل دور (مولّد، ناقل، مدوّر، جهة تخلص) مع KPIs حية وتقارير قابلة للتصدير.",
    descEn: "Role-specific command centers (Generator, Transporter, Recycler, Disposal) with live KPIs and exportable reports.",
    color: "from-amber-500 to-orange-400",
    details: [
      { t: "لوحة المولّد", tEn: "Generator Dashboard", d: "تدير طلبات النقل، تتابع الشحنات، تراقب الأوزان والتكاليف، وتتواصل مع الناقلين.", dEn: "Manage transport requests, track shipments, monitor weights & costs, communicate with transporters." },
      { t: "لوحة الناقل", tEn: "Transporter Dashboard", d: "تدير السائقين والمركبات، توزّع المهام، تراقب المسارات، وتدير المحاسبة مع كل جهة.", dEn: "Manage drivers & vehicles, dispatch tasks, monitor routes, handle accounting per entity." },
      { t: "لوحة المدوّر", tEn: "Recycler Dashboard", d: "تدير سعة المنشأة، المواد الواردة والمُعالَجة، جودة المواد، وتقارير الأثر البيئي.", dEn: "Manage facility capacity, incoming & processed materials, quality, environmental impact." },
      { t: "لوحة المدير السيادي", tEn: "Sovereign Admin", d: "رؤية ٣٦٠° على المنظومة: كل الجهات والشحنات والمستخدمين والموافقات.", dEn: "Full 360° ecosystem view: all entities, shipments, users, approvals & settings." },
    ],
  },
  {
    icon: Scale, title: "الامتثال الرقابي الآلي", titleEn: "Automated Regulatory Compliance",
    desc: "أتمتة لمتطلبات WMRA, EEAA, LTRA, IDA — تقارير إلزامية، تدقيق ISO، وإخطارات استباقية.",
    descEn: "Full automation for WMRA, EEAA, LTRA, IDA — mandatory reports, ISO audits, proactive alerts.",
    color: "from-red-500 to-rose-400",
    details: [
      { t: "بوابات رقابية", tEn: "Regulatory Portals", d: "بوابة لكل جهة رقابية مع تقارير جاهزة تتوافق مع المتطلبات القانونية — تقديم بضغطة زر.", dEn: "Portal per authority with pre-formatted legal-compliant reports — submit with one click." },
      { t: "تدقيق ISO تفاعلي", tEn: "Interactive ISO Audit", d: "قوائم فحص رقمية مع ربط مباشر بالأدلة ودعوة المدقق عبر رابط آمن مؤقت.", dEn: "Digital checklists with evidence linking and auditor invite via secure temporary link." },
      { t: "إنذارات التراخيص", tEn: "License Alerts", d: "إنذارات ٣٠/٦٠/٩٠ يوماً قبل انتهاء أي ترخيص عبر بوش وإيميل وواتساب.", dEn: "30/60/90-day alerts before license expiry via push, email & WhatsApp." },
      { t: "سجل التدقيق", tEn: "Audit Trail", d: "كل إجراء مسجّل: من أنشأ ومن عدّل ومتى — سجل غير قابل للتعديل يُستخدم كدليل قانوني.", dEn: "Every action logged: who, what, when — immutable record usable as legal evidence." },
    ],
  },
  {
    icon: Network, title: "الربط والتكامل الشامل", titleEn: "Full Integration & Connectivity",
    desc: "نظام API يربط جميع الأطراف — مولدين، ناقلين، مدورين، سائقين، مستشارين — في منظومة واحدة.",
    descEn: "Open API connecting all stakeholders — generators, transporters, recyclers, drivers, consultants — in one ecosystem.",
    color: "from-teal-500 to-emerald-400",
    details: [
      { t: "مركز تواصل موحد", tEn: "Unified Comms Hub", d: "شات مشفر — رسائل، صور، ملفات، استطلاعات، قنوات بث — كل المحادثات مرتبطة بالعمليات.", dEn: "Encrypted chat — messages, photos, files, polls, broadcast — all linked to operations." },
      { t: "سوق B2B رقمي", tEn: "B2B Marketplace", d: "سوق تبادل مخلفات — عرض وطلب، تفاوض، تأكيد متبادل، وتقييم مع حماية الخصوصية.", dEn: "Waste exchange — supply & demand, negotiation, mutual confirmation, ratings with privacy." },
      { t: "إشعارات ٤ قنوات", tEn: "4-Channel Notifications", d: "كل حدث: إشعار داخلي + بوش (حتى لو مغلق) + واتساب + إيميل.", dEn: "Every event: in-app + push (even closed) + WhatsApp + email." },
      { t: "مفاتيح API", tEn: "API Keys", d: "صلاحيات محددة (قراءة، كتابة، إدارة) مع تحديد معدل الطلبات للربط الخارجي.", dEn: "Granular scopes (read, write, admin) with rate limiting for external integration." },
    ],
  },
];

const roadmap = [
  { year: "2021", phase: "الفكرة والبحث", phaseEn: "Idea & Research", items: ["دراسة السوق المصري لإدارة المخلفات", "تحليل الفجوات الرقمية في القطاع", "تصميم النموذج الأولي للمنصة"], itemsEn: ["Egyptian waste management market study", "Digital gap analysis in the sector", "Initial platform prototype design"] },
  { year: "2022", phase: "التأسيس", phaseEn: "Foundation", items: ["بناء البنية التحتية السحابية الأولى", "تطوير نظام إدارة الشحنات الأساسي", "إطلاق أول لوحة تحكم للمولّد والناقل"], itemsEn: ["First cloud infrastructure build", "Core shipment management system", "First Generator & Transporter dashboards"] },
  { year: "2023", phase: "النمو", phaseEn: "Growth", items: ["إضافة نظام العقود والفواتير الرقمية", "إطلاق نظام التوثيق والتوقيع الإلكتروني", "تطوير لوحات المدوّر وجهة التخلص", "بناء نظام التتبع الحي للشحنات"], itemsEn: ["Digital contracts & invoicing system", "E-signature & documentation launch", "Recycler & Disposal dashboards", "Live shipment tracking system"] },
  { year: "2024", phase: "التوسع", phaseEn: "Expansion", items: ["إطلاق نظام السائقين ثلاثي الفئات (تابع، مستقل، مؤجر)", "محرك التوزيع الذكي Smart Dispatch", "نظام الامتثال الرقابي الآلي WMRA/EEAA", "سوق B2B ونظام الشراكات الخارجية"], itemsEn: ["3-tier driver system (Employed, Freelance, Hired)", "Smart Dispatch Engine", "Automated WMRA/EEAA compliance", "B2B Marketplace & external partnerships"] },
  { year: "2025 Q1-Q2", phase: "الذكاء الاصطناعي", phaseEn: "AI Revolution", items: ["وكيل مبيعات AI متعدد القنوات (واتساب، تيليجرام)", "تصنيف المخلفات بالصور عبر الذكاء الاصطناعي", "كشف الحالات الشاذة والعمليات المشبوهة", "استوديو المستندات الذكي AI Document Studio"], itemsEn: ["Multi-channel AI Sales Agent (WhatsApp, Telegram)", "AI image-based waste classification", "Anomaly & fraud detection", "AI Document Studio"] },
  { year: "2025 Q3-Q4", phase: "النضج والتكامل", phaseEn: "Maturity & Integration", items: ["أكاديمية التدريب الرقمية والشهادات", "نظام المزادات الرقمية", "نظام التوظيف ووكالات التوظيف", "التحليلات التنبؤية وتقارير الأداء المتقدمة"], itemsEn: ["Digital Training Academy & certifications", "Digital auction system", "Recruitment & staffing agencies", "Predictive analytics & advanced reports"] },
  { year: "2026+", phase: "الريادة الإقليمية", phaseEn: "Regional Leadership", items: ["التوسع في المنطقة العربية وأفريقيا", "تكامل IoT مع أجهزة الوزن والفرز الآلي", "الذكاء الاصطناعي التوليدي للتقارير والقرارات", "منصة مفتوحة الـ API للتكامل مع الحكومات"], itemsEn: ["MENA & Africa expansion", "IoT integration with weighing & auto-sorting", "Generative AI for reports & decisions", "Open API platform for government integration"] },
];

const techStack = [
  { icon: Cloud, label: "سحابة آمنة", labelEn: "Secure Cloud" },
  { icon: Lock, label: "تشفير شامل", labelEn: "End-to-End Encryption" },
  { icon: Fingerprint, label: "مصادقة متعددة", labelEn: "Multi-Factor Auth" },
  { icon: Database, label: "بيانات محمية", labelEn: "Protected Data" },
  { icon: Workflow, label: "أتمتة العمليات", labelEn: "Process Automation" },
  { icon: Zap, label: "أداء فائق", labelEn: "High Performance" },
  { icon: Server, label: "Edge Functions", labelEn: "Edge Functions" },
  { icon: Wifi, label: "إشعارات فورية", labelEn: "Real-time Alerts" },
  { icon: Smartphone, label: "تطبيق PWA", labelEn: "PWA App" },
];

const Digitalization = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [liveStats, setLiveStats] = useState({ shipments: 0, organizations: 0, users: 0, invoices: 0, documents: 0, posts: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [s, o, p, i, d, pt] = await Promise.all([
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('ai_documents').select('id', { count: 'exact', head: true }),
        supabase.from('platform_posts').select('id', { count: 'exact', head: true }),
      ]);
      setLiveStats({
        shipments: s.count ?? 0,
        organizations: o.count ?? 0,
        users: p.count ?? 0,
        invoices: i.count ?? 0,
        documents: d.count ?? 0,
        posts: pt.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />

      {/* === HERO === */}
      <section className="relative pt-36 sm:pt-44 pb-24 overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        {/* Glowing orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6 shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
              <Binary className="w-4 h-4 animate-pulse" />
              {isAr ? 'التحول الرقمي في إدارة المخلفات' : 'Digital Transformation in Waste Management'}
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            {isAr ? (
              <>الرقمنة ليست <span className="text-primary">خياراً</span>... بل <span className="bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">مستقبل حتمي</span></>
            ) : (
              <>Digitalization isn't a <span className="text-primary">choice</span>... it's an <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">inevitable future</span></>
            )}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-12">
            {isAr
              ? 'منصة iRecycle تقود ثورة رقمية في قطاع إدارة المخلفات بمصر والمنطقة — من الورق والقلم إلى منظومة رقمية ذكية تربط جميع الأطراف وتؤتمت كل العمليات وتحمي كل البيانات.'
              : 'iRecycle is leading a digital revolution in Egypt & MENA waste management — from pen & paper to a smart digital ecosystem connecting all stakeholders, automating every process, and securing all data.'
            }
          </motion.p>
        </div>
      </section>

      {/* === LIVE STATS FROM DATABASE === */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03),transparent_70%)]" />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {isAr ? 'بيانات حية من قاعدة البيانات' : 'Live Data from Database'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">{isAr ? 'أرقام المنصة الحية' : 'Live Platform Numbers'}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{isAr ? 'هذه الأرقام تُجلب مباشرة من قاعدة البيانات — وليست ثابتة' : 'These numbers are fetched directly from the database — not static'}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <LiveStat value={liveStats.shipments} label={isAr ? 'شحنة رقمية' : 'Digital Shipments'} icon={Truck} suffix="+" />
            <LiveStat value={liveStats.organizations} label={isAr ? 'جهة مسجلة' : 'Registered Entities'} icon={Building2} suffix="+" />
            <LiveStat value={liveStats.users} label={isAr ? 'مستخدم نشط' : 'Active Users'} icon={Users} suffix="+" />
            <LiveStat value={liveStats.invoices} label={isAr ? 'فاتورة رقمية' : 'Digital Invoices'} icon={FileText} suffix="+" />
            <LiveStat value={liveStats.documents} label={isAr ? 'مستند AI' : 'AI Documents'} icon={FileCheck} suffix="+" />
            <LiveStat value={liveStats.posts} label={isAr ? 'منشور محتوى' : 'Content Posts'} icon={Landmark} suffix="+" />
          </div>
        </div>
      </section>

      {/* === WHAT IS DIGITALIZATION === */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">{isAr ? 'ماذا تعني الرقمنة في iRecycle؟' : 'What Does Digitalization Mean at iRecycle?'}</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isAr
                ? 'ليست مجرد تحويل الورق إلى PDF — بل إعادة هندسة كاملة لسلسلة القيمة: من توليد المخلف، مروراً بالنقل والفرز والتدوير، وصولاً للتقرير النهائي والمحاسبة. كل خطوة رقمية، ذكية، وموثقة.'
                : 'Not just paper to PDF — it\'s a full value chain re-engineering: from waste generation, through transport, sorting & recycling, to final reporting & accounting. Every step digital, intelligent, and documented.'
              }
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((pillar, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="group relative p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/[0.02] group-hover:to-primary/[0.05] transition-all duration-500" />
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <pillar.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{isAr ? pillar.title : pillar.titleEn}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? pillar.desc : pillar.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === DEEP DIVE: HOW PLATFORM SERVES EACH PILLAR === */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">{isAr ? 'كيف تخدم المنصة كل تفصيلة؟' : 'How Does the Platform Serve Every Detail?'}</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground">{isAr ? 'لكل ركيزة، بنت المنصة أدوات متخصصة تعمل بتكامل. إليك كيف يتحقق ذلك عملياً:' : 'For each pillar, the platform built specialized integrated tools. Here\'s how it works:'}</p>
          </motion.div>

          {pillars.map((pillar, pi) => (
            <motion.div key={pi} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={pi + 1}
              className="mb-8 p-6 sm:p-8 rounded-2xl border border-border/40 bg-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center shadow-lg`}>
                  <pillar.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black">{isAr ? `${pi + 1}. ${pillar.title}` : `${pi + 1}. ${pillar.titleEn}`}</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {pillar.details.map((item, i) => (
                  <div key={i} className="group/card p-4 rounded-xl bg-muted/30 dark:bg-muted/15 border border-border/20 hover:border-primary/20 hover:bg-muted/50 transition-all duration-200">
                    <h4 className="text-sm font-bold mb-1.5 text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {isAr ? item.t : item.tEn}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? item.d : item.dEn}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Extra capabilities */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={7}
            className="p-6 sm:p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
            <div className="flex items-center gap-3 mb-5">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-black">{isAr ? 'وأكثر من ذلك...' : 'And Much More...'}</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                isAr ? 'نظام محاسبة رقمي (ERP)' : 'Digital Accounting (ERP)',
                isAr ? 'مزادات المخلفات الإلكترونية' : 'Electronic Waste Auctions',
                isAr ? 'نظام التوظيف الذكي' : 'Smart Recruitment',
                isAr ? 'إعلانات وتسويق المنصة' : 'Platform Ads & Marketing',
                isAr ? 'أكاديمية تدريب التدوير' : 'Recycling Academy',
                isAr ? 'نظام المكافآت والتقييم' : 'Rewards & Ratings',
                isAr ? 'بطاقة الهوية الرقمية' : 'Digital Identity Card',
                isAr ? 'مركز الطباعة الذكي' : 'Smart Print Center',
                isAr ? 'كول سنتر ذكي' : 'Smart Call Center',
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

      {/* === BEFORE vs AFTER === */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-black text-center mb-12">
            {isAr ? 'قبل وبعد الرقمنة' : 'Before & After Digitalization'}
          </motion.h2>
          <div className="space-y-3">
            {[
              { before: isAr ? 'مستندات ورقية تضيع وتتلف' : 'Paper docs lost & damaged', after: isAr ? 'توثيق رقمي دائم بتوقيعات إلكترونية' : 'Permanent digital records with e-signatures' },
              { before: isAr ? 'تتبع يدوي بالهاتف والواتساب' : 'Manual tracking via phone & WhatsApp', after: isAr ? 'تتبع GPS حي مع إشعارات فورية' : 'Live GPS tracking with instant alerts' },
              { before: isAr ? 'محاسبة يدوية وأخطاء حسابية' : 'Manual accounting & errors', after: isAr ? 'محاسبة آلية مرتبطة بكل شحنة' : 'Auto accounting linked to every shipment' },
              { before: isAr ? 'تقارير رقابية تأخذ أسابيع' : 'Regulatory reports take weeks', after: isAr ? 'تقارير فورية بضغطة زر' : 'Instant reports with one click' },
              { before: isAr ? 'لا رقابة على السائقين' : 'No driver oversight', after: isAr ? 'مراقبة حية وتقييم أداء ذكي' : 'Live monitoring & smart scoring' },
              { before: isAr ? 'تواصل مشتت بين الأطراف' : 'Scattered communication', after: isAr ? 'منصة تواصل موحدة مشفرة' : 'Unified encrypted communication hub' },
              { before: isAr ? 'بيانات مبعثرة في ملفات Excel' : 'Data scattered in Excel files', after: isAr ? 'قاعدة بيانات مركزية بتحليلات AI' : 'Central database with AI analytics' },
              { before: isAr ? 'لا يوجد تاريخ للعمليات' : 'No operations history', after: isAr ? 'سجل كامل وأرشيف رقمي غير محدود' : 'Complete history & unlimited digital archive' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                <div className="flex-1 flex items-center gap-3 px-5 py-3 rounded-xl sm:rounded-e-none bg-destructive/5 dark:bg-destructive/10 border border-destructive/20">
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm font-semibold text-destructive">{item.before}</span>
                </div>
                <div className="hidden sm:flex items-center justify-center w-10 bg-muted/50 border-y border-border/30">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 flex items-center gap-3 px-5 py-3 rounded-xl sm:rounded-s-none bg-primary/5 dark:bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-primary">{item.after}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === DIGITALIZATION ROADMAP === */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">{isAr ? 'خارطة طريق الرقمنة' : 'Digitalization Roadmap'}</h2>
            <p className="text-muted-foreground">{isAr ? 'رحلة التحول الرقمي من التأسيس إلى الريادة الإقليمية' : 'The digital transformation journey from foundation to regional leadership'}</p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 start-6 sm:start-1/2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/10" />

            {roadmap.map((phase, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className={`relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 mb-10 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                
                {/* Timeline dot */}
                <div className="absolute start-6 sm:start-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-[0_0_12px_hsl(var(--primary)/0.4)] z-10" />

                {/* Content */}
                <div className={`ms-14 sm:ms-0 sm:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'sm:text-end' : ''}`}>
                  <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2 justify-start">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black">{phase.year}</span>
                      <span className="text-sm font-bold text-foreground">{isAr ? phase.phase : phase.phaseEn}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {(isAr ? phase.items : phase.itemsEn).map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === TECH FOUNDATION === */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-black mb-4">
            {isAr ? 'البنية التقنية المتينة' : 'Robust Technical Foundation'}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            {isAr ? 'مبنية على أحدث التقنيات السحابية مع أعلى معايير الأمان والحماية' : 'Built on cutting-edge cloud tech with highest security standards'}
          </motion.p>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
            {techStack.map((tech, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 2}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <tech.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-bold">{isAr ? tech.label : tech.labelEn}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === VISION CTA === */}
      <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 relative" />
            <h2 className="text-2xl sm:text-3xl font-black mb-4 relative">
              {isAr ? 'رؤيتنا: صفر ورق — 100% رقمي' : 'Our Vision: Zero Paper — 100% Digital'}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto relative mb-6">
              {isAr
                ? 'نؤمن أن مستقبل إدارة المخلفات في مصر والمنطقة العربية يبدأ بالرقمنة الكاملة. منصة iRecycle ليست مجرد برنامج — بل مشروع وطني لتحويل قطاع بأكمله من العشوائية إلى النظام، ومن الورق إلى البيانات، ومن التخمين إلى الذكاء الاصطناعي.'
                : 'We believe the future of waste management in Egypt & the Arab world starts with full digitalization. iRecycle isn\'t just software — it\'s a national project to transform an entire sector from chaos to order, from paper to data, from guesswork to AI.'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-3 relative">
              {[
                { icon: Target, l: isAr ? 'صفر ورق' : 'Zero Paper' },
                { icon: Eye, l: isAr ? 'شفافية كاملة' : 'Full Transparency' },
                { icon: Award, l: isAr ? 'جودة عالمية' : 'World-class Quality' },
                { icon: Globe2, l: isAr ? 'توسع إقليمي' : 'Regional Expansion' },
              ].map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card/80 border border-border/40 text-xs font-bold text-foreground/80">
                  <v.icon className="w-3.5 h-3.5 text-primary" />{v.l}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

Digitalization.displayName = 'Digitalization';
export default Digitalization;
