import { memo } from "react";
import { 
  FileSearch, Brain, Languages, Workflow, Shield, BarChart3, 
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Zap, Users,
  FileText, Truck, Building2, Scale, Leaf, Factory,
  Upload, ScanSearch, UserCheck, Database, Play, ArrowLeft,
  MessageSquare, Settings2, PieChart, CloudCog
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

/* ─────────────────────────────────────────────
   Section 1: المشكلة في معالجة المستندات يدوياً
   ───────────────────────────────────────────── */
const ProblemSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Right - Title */}
        <motion.div 
          className="text-right order-1"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="inline-block border-r-4 border-[hsl(var(--eco-emerald))] pr-4 mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">
              المشكلة في معالجة
            </h2>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--eco-emerald))]">
              المستندات يدوياً
            </h2>
          </div>
          <p className="text-lg text-[hsl(var(--landing-muted-foreground))] leading-relaxed mt-4">
            تستنزف المؤسسات مواردها بشكل كبير بسبب المهام المتكررة في معالجة المستندات.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {[
              { text: "البحث داخل كميات كبيرة من المستندات للوصول إلى المعلومات الهامة", icon: FileSearch },
              { text: "إدخال البيانات يدوياً من الفواتير والعقود والنماذج", icon: FileText },
              { text: "إدارة البيانات غير المنظمة وشبه المنظمة", icon: Database },
              { text: "عمليات فحص امتثال تستغرق وقتاً طويلاً وتكثر فيها الأخطاء", icon: Shield },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="bg-muted rounded-xl p-4 text-right border border-border"
                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
              >
                <item.icon className="w-5 h-5 text-[hsl(var(--eco-emerald))] mb-2 mr-auto" />
                <p className="text-sm font-medium text-[hsl(var(--landing-foreground))]">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Left - Consequences */}
        <motion.div 
          className="text-right order-2"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="flex items-center gap-3 mb-6 justify-end">
            <p className="text-lg text-[hsl(var(--landing-foreground))]">
              <Clock className="inline w-5 h-5 ml-2 text-[hsl(var(--eco-emerald))]" />
              يقضي الموظفون <span className="font-bold text-[hsl(var(--eco-emerald))] text-xl">11 ساعة أسبوعياً</span> في أعمال مرتبطة بالمستندات، مما يؤدي إلى:
            </p>
          </div>
          <div className="space-y-4">
            {[
              { title: "ارتفاع التكاليف التشغيلية", icon: TrendingUp, color: "bg-destructive/8 border-destructive/20 dark:bg-destructive/15 dark:border-destructive/30" },
              { title: "تأخيرات في المعاملات وإجراءات انضمام العملاء الجدد", icon: Clock, color: "bg-amber-500/8 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30" },
              { title: "زيادة مخاطر الاحتيال ومخالفات الامتثال", icon: AlertTriangle, color: "bg-orange-500/8 border-orange-500/20 dark:bg-orange-500/15 dark:border-orange-500/30" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                className={`${item.color} rounded-xl p-5 text-right border flex items-center gap-4 justify-end`}
                custom={i + 2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
              >
                <div>
                  <h4 className="font-bold text-[hsl(var(--landing-foreground))]">{item.title}</h4>
                </div>
                <div className="w-10 h-10 rounded-lg bg-card/80 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[hsl(var(--landing-foreground))]" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
));
ProblemSection.displayName = "ProblemSection";

/* ─────────────────────────────────────────────
   Section 2: الحل - منظومة ذكاء المستندات
   ───────────────────────────────────────────── */
const SolutionSection = memo(() => (
  <div className="py-16 sm:py-24 <div className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }} />
    
    <div className="container px-4 relative z-10">
      {/* Header */}
      <motion.div 
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="inline-flex items-center gap-2 bg-[hsl(var(--eco-emerald))]/10 px-4 py-2 rounded-full mb-6">
          <Brain className="w-5 h-5 text-[hsl(var(--eco-emerald))]" />
          <span className="text-sm font-semibold text-[hsl(var(--eco-emerald))]">مدعوم بالذكاء الاصطناعي</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))] mb-4">
          كيفية حل المشكلات باستخدام <span className="text-[hsl(var(--eco-emerald))]">iRecycle</span>
        </h2>
        <p className="text-lg text-[hsl(var(--landing-muted-foreground))] max-w-3xl mx-auto leading-relaxed">
          تمكين الشركات من تعزيز الكفاءة من خلال تسريع العمليات، وتقليل التكاليف، وضمان امتثال أقوى — 
          وذلك عبر <span className="font-bold text-[hsl(var(--eco-emerald))]">تقنية فهم المستندات المدعومة بالذكاء الاصطناعي</span>
        </p>
      </motion.div>

      {/* Key Points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, title: "مشاركة العنصر البشري", desc: "لضمان أعلى درجات الدقة من خلال المراجعة البشرية في الحالات الحساسة" },
          { icon: Languages, title: "الأولوية للعربية", desc: "تقنية متقدمة للتعرف الضوئي على الحروف والكتابة اليدوية، مصممة خصيصاً للوثائق العربية" },
          { icon: Workflow, title: "أتمتة شاملة", desc: "من تحميل المستند إلى الحصول على بيانات موثوقة قابلة للاستخدام" },
          { icon: CloudCog, title: "تكامل مرن", desc: "يتصل بسلاسة مع أنظمة ERP وإدارة علاقات العملاء والأنظمة القديمة" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl p-6 text-right border border-[hsl(var(--landing-border))] shadow-sm hover:shadow-md transition-shadow"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--eco-emerald))]/10 flex items-center justify-center mb-4 mr-auto">
              <item.icon className="w-6 h-6 text-[hsl(var(--eco-emerald))]" />
            </div>
            <h3 className="font-bold text-[hsl(var(--landing-foreground))] mb-2">{item.title}</h3>
            <p className="text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
SolutionSection.displayName = "SolutionSection";

/* ─────────────────────────────────────────────
   Section 3: ماذا تقدم المنصة؟
   ───────────────────────────────────────────── */
const OfferingsSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Title */}
        <motion.div 
          className="text-right lg:col-span-1"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">ماذا تقدم</h2>
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--eco-emerald))]">منصة iRecycle؟</h2>
        </motion.div>

        {/* Features List */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { 
              title: "استخراج ذكي للبيانات",
              desc: "يتجاوز حدود تقنية OCR التقليدية، إذ يفهم السياق ويحدد الحقول والبنود والقيم عبر مختلف أنواع المستندات (الفواتير، العقود، الهويات، تذاكر الوزن).",
              color: "border-r-[hsl(var(--eco-emerald))]"
            },
            { 
              title: "تركيز على العربية ودعم متعدد اللغات",
              desc: "حل متطور للتعرّف الضوئي على الحروف والكتابة اليدوية باللغة العربية، مع إمكانيات شاملة لدعم اللغات العالمية.",
              color: "border-r-[hsl(200,80%,50%)]"
            },
            { 
              title: "تنفيذ سلس ومتكامل",
              desc: "يولّد بيانات دقيقة ومنظمة بصيغ متعددة (XML، JSON، Excel، PDF)، مع إمكانية التكامل المباشر مع أنظمة ERP وCRM.",
              color: "border-r-[hsl(var(--eco-teal))]"
            },
            { 
              title: "دقة وامتثال مدمجان",
              desc: "يُراجع المعلومات ويطابقها مع القواعد التنظيمية والسياسات التشغيلية، مدعوماً بمراجعة بشرية لضمان النتائج الدقيقة والموثوقة.",
              color: "border-r-amber-400"
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`bg-muted rounded-xl p-6 text-right border-r-4 ${item.color} hover:bg-muted/80 transition-colors`}
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
            >
              <h3 className="font-bold text-lg text-[hsl(var(--landing-foreground))] mb-2">{item.title}</h3>
              <p className="text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
));
OfferingsSection.displayName = "OfferingsSection";

/* ─────────────────────────────────────────────
   Section 4: أتمتة ذكية + كيف تعمل المنصة
   ───────────────────────────────────────────── */
const AutomationSection = memo(() => (
  <div className="py-16 sm:py-24 bg-[hsl(var(--landing-muted))]">
    <div className="container px-4">
      {/* Smart Automation */}
      <motion.div 
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))] mb-4">
          أتمتة ذكية تتجاوز حدود <span className="text-[hsl(var(--eco-emerald))]">استخراج البيانات</span>
        </h2>
        <p className="text-lg text-[hsl(var(--landing-muted-foreground))] max-w-3xl mx-auto">
          المنصة لا تكتفي بقراءة البيانات — بل <span className="font-bold">تطبق القواعد والشروط لتنفيذ الإجراءات تلقائياً</span>، مما يضمن سير العمل بسرعة أعلى وامتثالاً أكبر.
        </p>
      </motion.div>

      {/* Automation Examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { 
            condition: "في حال تجاوز إجمالي الفاتورة 10,000 جنيه",
            action: "تحويلها إلى المدير للموافقة",
          },
          { 
            condition: "في حال كانت وثيقة الهوية أو الترخيص منتهية الصلاحية",
            action: "الرفض التلقائي مع إشعار فريق الامتثال",
          },
          { 
            condition: "في حال تم تصنيف شحنة على أنها عالية المخاطر",
            action: "تصعيد الحالة لإجراء فحص بيئي",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl overflow-hidden shadow-sm border border-[hsl(var(--landing-border))]"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="p-5 bg-muted text-right">
              <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">الحالة:</p>
              <p className="font-semibold text-[hsl(var(--landing-foreground))]">"{item.condition}"</p>
            </div>
            <div className="p-5 text-right">
              <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">الإجراء:</p>
              <p className="font-semibold text-[hsl(var(--eco-emerald))]">"{item.action}"</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Why it matters */}
      <div className="bg-[hsl(var(--eco-emerald))] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-white text-center">
          {[
            "يقضي على القرارات اليدوية المتكررة",
            "يتكيف بسهولة مع سير العمل في أي قطاع",
            "يقلل من الأخطاء ومخاطر عدم الامتثال",
            "يُسرّع عمليات الموافقة والمعاملات",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));
AutomationSection.displayName = "AutomationSection";

/* ─────────────────────────────────────────────
   Section 5: كيف تعمل المنصة - Pipeline
   ───────────────────────────────────────────── */
const PipelineSection = memo(() => {
  const steps = [
    { icon: Upload, title: "التحميل", desc: "استرداد المستندات (صور، ملفات ممسوحة ضوئياً، وغيرها)" },
    { icon: ScanSearch, title: "الاستخراج", desc: "يقوم الذكاء الاصطناعي باستخراج البيانات المنظمة وغير المنظمة" },
    { icon: Shield, title: "التحقق الآلي", desc: "يتحقق الذكاء الاصطناعي من صحة المعلومات المستخرجة" },
    { icon: UserCheck, title: "التحقق البشري", desc: "يتم توجيه البيانات منخفضة الثقة إلى المراجعين البشريين" },
    { icon: Database, title: "الاستلام", desc: "يقوم النظام بتخزين البيانات الموثوقة ومشاركتها" },
    { icon: Play, title: "الإجراء", desc: "تشغيل سير العمل تلقائياً (الدفع، التقارير، الامتثال)" },
  ];

  return (
    <div className="py-16 sm:py-24">
      <div className="container px-4">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold text-center text-[hsl(var(--eco-emerald))] mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          كيف تعمل المنصة؟
        </motion.h2>

        {/* Desktop Pipeline */}
        <div className="hidden md:block relative">
          {/* Connection Line */}
          <div className="absolute top-12 left-[8%] right-[8%] h-1 bg-[hsl(var(--eco-emerald))]/20 rounded-full">
            <div className="absolute inset-0 bg-gradient-to-l from-[hsl(var(--eco-emerald))] to-[hsl(var(--eco-emerald))]/30 rounded-full" />
          </div>
          
          <div className="grid grid-cols-6 gap-4 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="text-center"
                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-[hsl(var(--eco-emerald))] flex items-center justify-center text-white shadow-lg mb-4">
                  <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[hsl(var(--landing-foreground))] mb-1">{step.title}</h4>
                <p className="text-xs sm:text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Pipeline */}
        <div className="md:hidden space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 bg-card rounded-xl p-4 border border-[hsl(var(--landing-border))]"
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--eco-emerald))] flex items-center justify-center text-white flex-shrink-0">
                <step.icon className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <h4 className="font-bold text-[hsl(var(--landing-foreground))]">{step.title}</h4>
                <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">{step.desc}</p>
              </div>
              <span className="text-xs font-bold text-[hsl(var(--eco-emerald))] bg-[hsl(var(--eco-emerald))]/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});
PipelineSection.displayName = "PipelineSection";

/* ─────────────────────────────────────────────
   Section 6: الأثر والنتائج القابلة للقياس
   ───────────────────────────────────────────── */
const ImpactSection = memo(() => (
  <div className="py-16 sm:py-24 bg-gradient-to-b from-[hsl(200,30%,96%)] to-white">
    <div className="container px-4">
      <motion.div 
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">الأثر على الصناعات</h2>
        <p className="text-xl text-[hsl(var(--eco-emerald))] font-semibold mt-2">كفاءة ونتائج يمكن قياسها</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { icon: Shield, value: "↓", label: "انخفاض في مخاطر الاحتيال ومخالفات الامتثال" },
          { icon: Clock, value: "11h", label: "يوفر نحو 11 ساعة أسبوعياً لكل موظف" },
          { icon: Zap, value: "70%", label: "تسريع معالجة المستندات بنسبة تصل إلى 70%" },
          { icon: BarChart3, value: "∞", label: "قابل للتوسع لمعالجة آلاف المستندات يومياً" },
          { icon: Brain, value: "AI+", label: "دقة أعلى من خلال الجمع بين الأتمتة والتحقق البشري" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="text-center bg-card rounded-2xl p-6 border border-[hsl(var(--landing-border))] shadow-sm"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-14 h-14 mx-auto rounded-xl bg-[hsl(var(--eco-emerald))]/10 flex items-center justify-center mb-4">
              <item.icon className="w-7 h-7 text-[hsl(var(--eco-emerald))]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--eco-emerald))] mb-2">{item.value}</div>
            <p className="text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
ImpactSection.displayName = "ImpactSection";

/* ─────────────────────────────────────────────
   Section 7: القطاعات المخدومة
   ───────────────────────────────────────────── */
const IndustriesSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      <motion.h2 
        className="text-3xl sm:text-4xl font-bold text-center text-[hsl(var(--eco-emerald))] mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        القطاعات التي نخدمها
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Leaf, title: "إدارة النفايات والتدوير", desc: "أتمتة تذاكر الوزن، فواتير الشحنات، تقارير الامتثال البيئي، وشهادات التدوير" },
          { icon: Truck, title: "الخدمات اللوجستية وسلسلة الإمداد", desc: "أتمتة مستندات الشحن، وفواتير الموردين، والتحقق من كتالوجات المنتجات" },
          { icon: Building2, title: "الخدمات المالية", desc: "أتمتة مراجعة الفواتير، وتحليل مستندات القروض، وتقارير الامتثال" },
          { icon: Scale, title: "القانون والامتثال", desc: "مراجعة العقود والتحقق من الامتثال التنظيمي بدعم من الذكاء الاصطناعي" },
          { icon: Factory, title: "التصنيع والإنتاج", desc: "إدارة أوامر التشغيل وشهادات الجودة ومستندات سلسلة الحيازة" },
          { icon: Settings2, title: "التقنية والأتمتة", desc: "التكامل مع أنظمة ERP وCRM وأجهزة الموازين الصناعية عبر API مفتوح" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl p-6 text-right border border-[hsl(var(--landing-border))] shadow-sm hover:shadow-md hover:border-[hsl(var(--eco-emerald))]/30 transition-all group"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 mr-auto group-hover:bg-[hsl(var(--eco-emerald))]/10 transition-colors">
              <item.icon className="w-6 h-6 text-[hsl(200,80%,50%)] group-hover:text-[hsl(var(--eco-emerald))] transition-colors" />
            </div>
            <h3 className="font-bold text-lg text-[hsl(var(--landing-foreground))] mb-2">{item.title}</h3>
            <p className="text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
IndustriesSection.displayName = "IndustriesSection";

/* ─────────────────────────────────────────────
   Section 8: المميزات الرئيسية
   ───────────────────────────────────────────── */
const FeaturesSection = memo(() => (
  <div className="py-16 sm:py-24 bg-gradient-to-l from-[hsl(200,30%,96%)] to-white">
    <div className="container px-4">
      <motion.div 
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">المميزات الرئيسية للمنصة</h2>
      </motion.div>

      {/* Category 1 */}
      <motion.div 
        className="mb-12"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h3 className="text-xl font-bold text-[hsl(var(--eco-emerald))] text-right mb-6">
          1. القوة الأساسية للأتمتة والذكاء الاصطناعي
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "معالجة الفواتير والمدفوعات", points: ["استخراج تفاصيل الضرائب، وشروط الدفع، وعناصر الفاتورة", "التسوية التلقائية مع أنظمة ERP/المالية"] },
            { title: "التعرف على العربية والكتابة اليدوية", points: ["مخصص للوثائق العربية (بما في ذلك اللهجات) ومتعدد اللغات", "يعالج المحتوى المطبوع والممسوح ضوئياً والمكتوب يدوياً"] },
            { title: "التكامل مع الأنظمة", points: ["واجهات برمجة تطبيقات للاتصال السلس مع أنظمة ERP وCRM", "يضمن أن تتوافق المنصة مع أعمالك دون تعديل العمليات"] },
          ].map((item, i) => (
            <motion.div 
              key={i} 
              className="bg-card rounded-2xl p-6 text-right border border-[hsl(var(--landing-border))] shadow-sm"
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
            >
              <h4 className="font-bold text-[hsl(var(--landing-foreground))] mb-3">{item.title}</h4>
              <ul className="space-y-2">
                {item.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2 justify-end text-sm text-[hsl(var(--landing-muted-foreground))]">
                    <span>{p}</span>
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--eco-emerald))] flex-shrink-0 mt-0.5" />
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Category 2 */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h3 className="text-xl font-bold text-[hsl(var(--eco-emerald))] text-right mb-6">
          2. الثقة والمرونة والدقة
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "التحقق بمشاركة العنصر البشري", desc: "توجيه البيانات ذات الثقة المنخفضة للمراجعة البشرية لتحقيق دقة شبه كاملة" },
            { title: "التخصيص", desc: "نماذج مخصصة لكل قطاع مثل المالية، الرعاية الصحية، التجزئة، وقابلة للتكيف بسهولة" },
            { title: "محرك قواعد الأعمال", desc: "تحديد قواعد تحقق مخصصة مثل فحص الامتثال وتدفقات الموافقة" },
            { title: "التحليلات والرؤى", desc: "إنشاء لوحات بيانات وتقارير من البيانات المعالجة لدعم اتخاذ القرار" },
            { title: "ميزات الدردشة بالذكاء الاصطناعي", desc: "التفاعل مع المستندات باستخدام اللغة الطبيعية وطرح الأسئلة والحصول على إجابات دقيقة" },
          ].map((item, i) => (
            <motion.div 
              key={i} 
              className="bg-card rounded-2xl p-6 text-right border border-[hsl(var(--landing-border))] shadow-sm"
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
            >
              <h4 className="font-bold text-[hsl(var(--landing-foreground))] mb-2">{item.title}</h4>
              <p className="text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
));
FeaturesSection.displayName = "FeaturesSection";

/* ─────────────────────────────────────────────
   Section 9: لماذا تستخدم المنصة
   ───────────────────────────────────────────── */
const WhyUsSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      <motion.div 
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">
          لماذا تستخدم <span className="text-[hsl(var(--eco-emerald))]">iRecycle</span>؟
        </h2>
        <p className="text-lg text-[hsl(var(--landing-muted-foreground))] mt-4 max-w-2xl mx-auto">
          لأن المستندات ليست مجرد كلمات على صفحة — بل هي <span className="font-bold">عقود، وفواتير، ومطالبات، وقرارات تتعلق بالامتثال.</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {[
          { 
            problem: "الأدوات التقليدية تتوقف عند النص فقط.",
            solution: "iRecycle تفهم السياق، والعلاقات بين البيانات." 
          },
          { 
            problem: "الأدوات الأخرى تقدم بيانات خام.",
            solution: "iRecycle توفر معلومات منظمة وقابلة للتنفيذ جاهزة لدمجها في سير العمل." 
          },
          { 
            problem: "المراجعة اليدوية تبطئ العمل.",
            solution: "iRecycle تطبق قواعد الأعمال مع مشاركة العنصر البشري لضمان الدقة والامتثال." 
          },
          { 
            problem: "المنصات الأخرى تواجه صعوبة مع اللغة العربية.",
            solution: "iRecycle تضع العربية في المقام الأول، متعددة اللغات، ومصممة خصيصاً لقطاعات المالية والرعاية الصحية والتأمين." 
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl p-6 text-right border border-[hsl(var(--landing-border))] shadow-sm"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-bold text-[hsl(var(--landing-foreground))] mb-2">{item.problem}</p>
            <p className="text-[hsl(var(--eco-emerald))] font-medium leading-relaxed">{item.solution}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div 
        className="mt-12 bg-[hsl(var(--eco-emerald))] rounded-2xl p-6 sm:p-8 text-center text-white"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <CheckCircle2 className="w-8 h-8 mx-auto mb-3" />
        <p className="text-lg font-bold">
          مع iRecycle، يتحول كل مستند إلى قرار موثوق يمكنك الاعتماد عليه.
        </p>
      </motion.div>
    </div>
  </div>
));
WhyUsSection.displayName = "WhyUsSection";

/* ─────────────────────────────────────────────
   Section 10: نماذج الاستخدام الرئيسية
   ───────────────────────────────────────────── */
const UseCasesSection = memo(() => (
  <div className="py-16 sm:py-24 bg-[hsl(var(--landing-muted))]">
    <div className="container px-4">
      <motion.div
        className="text-center mb-16"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--eco-emerald))] mb-2">نماذج لاستخدامات المنصة</h2>
        <p className="text-lg text-[hsl(var(--landing-muted-foreground))]">استخدامات المنصة الرئيسية</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "معالجة الفواتير",
            desc: "أتمتة استخراج تفاصيل الفاتورة، وشروط الدفع، والتسوية مع أنظمة ERP.",
            icon: FileText,
            tags: ["تاريخ الفاتورة", "البنود", "الإجمالي"],
            status: "success" as const,
          },
          {
            title: "الخدمات اللوجستية وسلسلة الإمداد",
            desc: "التحقق من مستندات الشحن، وفواتير الموردين، وكتالوجات المنتجات.",
            icon: Truck,
            tags: ["عنوان الاستلام", "عنوان التسليم", "حالة الدفع"],
            status: "success" as const,
          },
          {
            title: "التأمين وكشف الاحتيال",
            desc: "تسريع معالجة الطلبات، كشف الاحتيال، ودعم إصدار الوثائق التأمينية.",
            icon: Shield,
            tags: ["رقم الهوية", "رقم التأمين"],
            status: "error" as const,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl overflow-hidden border border-[hsl(var(--landing-border))] shadow-sm"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="bg-muted p-6 text-right">
              <div className="flex items-center gap-3 justify-end mb-3">
                <h3 className="font-bold text-lg text-[hsl(var(--landing-foreground))]">{item.title}</h3>
                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[hsl(var(--eco-emerald))]" />
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--landing-muted-foreground))] leading-relaxed">{item.desc}</p>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2 justify-end">
                {item.tags.map((tag, j) => (
                  <span
                    key={j}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      item.status === "error" && j === item.tags.length - 1
                        ? "bg-destructive/10 text-destructive border border-destructive/30"
                        : "bg-[hsl(var(--eco-emerald))]/10 text-[hsl(var(--eco-emerald))] border border-[hsl(var(--eco-emerald))]/20"
                    }`}
                  >
                    {item.status === "error" && j === item.tags.length - 1 ? "⚠ " : "✓ "}
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
UseCasesSection.displayName = "UseCasesSection";

/* ─────────────────────────────────────────────
   Section 11: الامتثال وإدارة المخاطر
   ───────────────────────────────────────────── */
const ComplianceSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Right - Title */}
        <motion.div
          className="text-right order-1"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">الامتثال</h2>
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--eco-emerald))] mb-8">وإدارة المخاطر</h2>

          <div className="space-y-4">
            {[
              {
                title: "التحقق من الهوية القانونية للعملاء (KYC)",
                desc: "استخراج والتحقق من هويات العملاء لتسريع إجراءات الانضمام.",
                color: "bg-muted",
              },
              {
                title: "الامتثال التنظيمي والتدقيق",
                desc: "مراجعة المستندات المالية والتشغيلية للتأكد من مطابقتها للمعايير المعتمدة في الصناعة.",
                color: "bg-muted/80",
              },
              {
                title: "كشف الاحتيال",
                desc: "رصد الشذوذ في العقود والمعاملات ومطالبات التأمين وتذاكر الوزن.",
                color: "bg-muted",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`${item.color} rounded-xl p-5 text-right border border-[hsl(200,30%,90%)]`}
                custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
              >
                <h4 className="font-bold text-[hsl(var(--landing-foreground))] mb-1">{item.title}</h4>
                <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Left - Visual */}
        <motion.div
          className="order-2 flex flex-col items-center gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="bg-card rounded-2xl p-6 border border-[hsl(var(--landing-border))] shadow-sm text-center">
              <FileSearch className="w-8 h-8 text-[hsl(var(--eco-emerald))] mx-auto mb-2" />
              <p className="text-sm font-medium text-[hsl(var(--landing-foreground))]">التحقق من التوقيعات</p>
            </div>
            <div className="text-3xl text-[hsl(var(--landing-muted-foreground))]">←</div>
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--eco-emerald))]/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[hsl(var(--eco-emerald))]" />
            </div>
          </div>
          <p className="text-lg font-bold text-[hsl(var(--eco-emerald))]">موثوق ✓</p>
          <div className="bg-muted rounded-xl p-4 text-center max-w-xs">
            <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">
              نظام تحقق آلي متعدد المراحل يضمن صحة التوقيعات والأختام والبيانات القانونية مع بصمة رقمية SHA-256
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
));
ComplianceSection.displayName = "ComplianceSection";

/* ─────────────────────────────────────────────
   Section 12: رحلة التكامل
   ───────────────────────────────────────────── */
const IntegrationJourneySection = memo(() => {
  const steps = [
    { num: 1, title: "البحث وتقييم الاحتياجات", desc: "فهم سير عمل العميل ومتطلبات الامتثال الخاصة به", highlighted: true },
    { num: 2, title: "الإعداد والتكامل", desc: "ربط المنصة بأنظمة ERP وCRM وأنظمة المستندات", highlighted: false },
    { num: 3, title: "تدريب وتكوين الذكاء الاصطناعي", desc: "تخصيص النماذج بحسب القطاع وأنواع المستندات", highlighted: true },
    { num: 4, title: "التحقق بمشاركة العنصر البشري", desc: "التأكد من الجودة عبر التجارب والاختبارات والتحقق", highlighted: false },
    { num: 5, title: "النشر وتشغيل النظام", desc: "إطلاق المنصة بأقل قدر ممكن من المشكلات", highlighted: true },
    { num: 6, title: "الدعم المستمر والتحسين", desc: "مراقبة مستمرة، تحديثات، وتوسيع نطاق الاستخدام", highlighted: true },
  ];

  return (
    <div className="py-16 sm:py-24 bg-[hsl(var(--landing-muted))]">
      <div className="container px-4">
        <motion.div
          className="text-right mb-16"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--landing-foreground))]">رحلة التكامل</h2>
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--eco-emerald))]">مع iRecycle</h2>
        </motion.div>

        <div className="space-y-4 max-w-3xl mr-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-4 rounded-xl p-5 ${
                step.highlighted
                  ? "bg-[hsl(var(--eco-emerald))] text-white"
                  : "bg-card border border-[hsl(var(--landing-border))]"
              }`}
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
            >
              <span className={`text-4xl font-bold flex-shrink-0 w-12 text-center ${
                step.highlighted ? "text-white/30" : "text-[hsl(var(--landing-border))]"
              }`}>
                {step.num}
              </span>
              <div className="text-right flex-1">
                <h4 className={`font-bold ${step.highlighted ? "" : "text-[hsl(var(--landing-foreground))]"}`}>
                  {step.title}
                </h4>
                <p className={`text-sm ${step.highlighted ? "text-white/80" : "text-[hsl(var(--landing-muted-foreground))]"}`}>
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});
IntegrationJourneySection.displayName = "IntegrationJourneySection";

/* ─────────────────────────────────────────────
   Section 13: OCR vs فهم المستندات
   ───────────────────────────────────────────── */
const OcrVsAiSection = memo(() => (
  <div className="py-16 sm:py-24">
    <div className="container px-4">
      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-16 rounded-2xl overflow-hidden border border-[hsl(var(--landing-border))] shadow-sm">
        <motion.div
          className="bg-muted p-8 sm:p-12 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <h3 className="text-3xl font-bold text-[hsl(var(--landing-foreground))] mb-4">OCR</h3>
          <p className="text-[hsl(var(--landing-muted-foreground))] text-lg">يقرأ النص فقط</p>
        </motion.div>
        <motion.div
          className="bg-muted p-8 sm:p-12 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeIn}
        >
          <h3 className="text-3xl font-bold text-[hsl(var(--eco-emerald))] mb-4">فهم المستندات</h3>
          <p className="text-[hsl(var(--landing-foreground))] text-lg">
            تفهم <span className="font-bold">السياق، والهدف، والعلاقات، والإجراءات</span> المرتبطة بها
          </p>
        </motion.div>
      </div>

      {/* VS badge */}
      <div className="flex justify-center -mt-24 mb-8 relative z-10">
        <div className="w-16 h-16 rounded-full bg-card border-4 border-[hsl(var(--landing-border))] flex items-center justify-center shadow-lg">
          <span className="text-xl font-black text-[hsl(var(--landing-foreground))]">VS</span>
        </div>
      </div>

      {/* Core Features */}
      <motion.div
        className="text-right mb-8"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeIn}
      >
        <h3 className="text-2xl font-bold text-[hsl(var(--landing-foreground))]">الميزات الأساسية</h3>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "متعدد اللغات", desc: "العربية، الإنجليزية، الفرنسية، الألمانية، الإسبانية..." },
          { title: "الاعتماد على API", desc: "هيكلية قابلة للتوسع للتكامل مع أي نظام" },
          { title: "الصيغات المدعومة", desc: "PDF، Word، الصور الممسوحة ضوئياً، والمستندات المكتوبة يدوياً" },
          { title: "المخرجات", desc: "JSON، XML، Excel، PDF" },
          { title: "النشر الآمن", desc: "سحابي وعلى الخوادم المحلية (On-Premise)" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-xl p-5 text-right border border-[hsl(var(--landing-border))] shadow-sm"
            custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <h4 className="font-bold text-[hsl(var(--eco-emerald))] mb-1">{item.title}</h4>
            <p className="text-sm text-[hsl(var(--landing-muted-foreground))]">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
OcrVsAiSection.displayName = "OcrVsAiSection";

/* ─────────────────────────────────────────────
   Main Export
   ───────────────────────────────────────────── */
const DocumentAIShowcase = memo(() => (
  <section id="document-ai" dir="rtl" className="font-cairo">
    <ProblemSection />
    <SolutionSection />
    <OfferingsSection />
    <AutomationSection />
    <PipelineSection />
    <ImpactSection />
    <IndustriesSection />
    <FeaturesSection />
    <WhyUsSection />
    <UseCasesSection />
    <ComplianceSection />
    <IntegrationJourneySection />
    <OcrVsAiSection />
  </section>
));
DocumentAIShowcase.displayName = "DocumentAIShowcase";

export default DocumentAIShowcase;
