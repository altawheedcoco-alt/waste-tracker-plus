import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Header from "@/components/Header";
import { lazy, Suspense, useState } from "react";
import { Rocket, Users, Trophy, Eye, Calendar, Code, Sparkles, ArrowLeft, ArrowRight, CheckCircle2, Clock, Star, Heart, Zap, Shield, Target, Lightbulb, Quote, Headphones, Scale, Megaphone, Bot, Building2 } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Footer = lazy(() => import("@/components/Footer"));

const versions = [
  {
    version: '1.0',
    period: '2022 – 2023',
    title: 'الإصدار الأول — البداية',
    subtitle: 'وضع حجر الأساس',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    status: 'completed' as const,
    highlights: [
      'إطلاق أول نسخة تجريبية من المنصة',
      'نظام تسجيل أساسي للمولدين والناقلين والمُدوِّرين',
      'لوحة تحكم مبسطة لإدارة الشحنات',
      'نظام تتبع أساسي للمخلفات',
      'إصدار أول شهادة تخلص آمن رقمية',
      'دعم اللغة العربية بالكامل',
    ],
  },
  {
    version: '2.0',
    period: '2023 – 2024',
    title: 'الإصدار الثاني — التطور',
    subtitle: 'توسع شامل في المميزات',
    icon: Zap,
    color: 'from-purple-500 to-violet-500',
    status: 'completed' as const,
    highlights: [
      'هوية بصرية محدثة وتجربة مستخدم أفضل',
      'نظام توظيف "عُمالنا" للقطاع البيئي',
      'دليل الاستشاريين ومكاتب الأيزو المعتمدة',
      'نظام الإعلانات المدفوعة والمستهدفة',
      'خرائط تفاعلية لمراكز التجميع والتدوير',
      'نظام الفواتير والمحاسبة الرقمية',
      'تكامل مع واتساب للإشعارات الذكية',
    ],
  },
  {
    version: '3.0',
    period: '2024 – 2025',
    title: 'الإصدار الثالث — النضج',
    subtitle: 'بنية تحتية متكاملة',
    icon: Rocket,
    color: 'from-primary to-[hsl(200,75%,45%)]',
    status: 'completed' as const,
    highlights: [
      'هوية بصرية Fusion 3.0 جديدة بالكامل',
      'ذكاء اصطناعي متكامل لتحليل المخلفات والمستندات',
      'نظام الاقتصاد الدائري ومؤشر MCI',
      'مركز اتصال ذكي مدمج مع CRM',
      'سوق B2B لتبادل المخلفات والسلع',
      'نظام مدير النظام المتقدم (Sovereign Admin)',
      'تقارير ESG والبصمة الكربونية',
      'أكاديمية التدريب والشهادات المهنية',
      'واجهة API مفتوحة للتكامل الخارجي',
    ],
  },
  {
    version: '4.0',
    period: '2025',
    title: 'الإصدار الرابع — البنية التحتية',
    subtitle: 'مركز القيادة الموحد',
    icon: Shield,
    color: 'from-amber-500 to-orange-500',
    status: 'completed' as const,
    highlights: [
      'مركز القيادة والتحكم الموحد لجميع العمليات',
      'أكثر من 10 أدوار إدارية متخصصة',
      'نظام الامتثال لقانون 202/2020 المصري',
      'لوحات رقابة سيادية للجهات الحكومية الأربع',
      'نظام التوقيع الرقمي وسلاسل الاعتماد',
      'إدارة الحسابات والفترات المحاسبية المتقدمة',
      'نظام إشعارات متعدد القنوات (بريد، واتساب، SMS)',
      'تكامل IoT وأجهزة الاستشعار الذكية',
      'نظام النسخ الاحتياطي والتعافي من الكوارث',
    ],
  },
  {
    version: '5.1',
    period: '2025 – الآن',
    title: 'الإصدار الخامس — النضج المتكامل',
    subtitle: 'الإصدار الحالي',
    icon: Sparkles,
    color: 'from-emerald-500 to-primary',
    status: 'current' as const,
    highlights: [
      'منظومة السائقين الثلاثية (تابع، مؤجر، مستقل)',
      'سوق الشحنات والمزايدة العكسية مع نظام ضمان Escrow',
      'المحفظة المالية الرقمية ونظام التسويات',
      'نظام السمعة والتقييم ثنائي الاتجاه',
      'محرك التوزيع الذكي Smart Dispatch',
      'منظومة المقاول البلدي المتكاملة مع SLA حكومي',
      'تتبع GPS حي مع خريطة المسار والسرعة',
      'هوية بصرية v5.1 Shimmer UI',
      'نظام إثبات الأداء الميداني بالصور والموقع',
      'نظام السلامة المهنية وتتبع الحوادث',
      'التقارير الدورية التلقائية للجهات الحكومية',
    ],
  },
];

const achievements = [
  { icon: Users, value: '+500', label: 'جهة مسجلة', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Trophy, value: '+10K', label: 'شحنة مُتتبعة', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Shield, value: '+5K', label: 'شهادة تخلص آمن', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Star, value: '5', label: 'إصدارات رئيسية', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Target, value: '27', label: 'محافظة مُغطاة', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Heart, value: '+50', label: 'شريك وداعم', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const team = [
  {
    role: 'المؤسس والمطور الرئيسي',
    desc: 'صاحب الرؤية والمسؤول عن التصميم والتطوير التقني الكامل للمنصة منذ عام 2021.',
    icon: Lightbulb,
    color: 'from-primary to-[hsl(200,75%,45%)]',
  },
  {
    role: 'فريق الدعم الفني',
    desc: 'فريق متخصص في دعم المستخدمين وحل المشكلات التقنية وضمان استمرارية الخدمة.',
    icon: Shield,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    role: 'المستشارون البيئيون',
    desc: 'خبراء في إدارة المخلفات والتشريعات البيئية يساهمون في تطوير سياسات المنصة.',
    icon: Star,
    color: 'from-emerald-500 to-green-500',
  },
];

const Journey = () => {
  const { language } = useLanguage();
  usePageTitle('رحلة المنصة والإصدارات');
  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <PageNavBar className="mb-4" />
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
          <div className="container mx-auto px-4 max-w-5xl relative py-12 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
                رحلة iRecycle منذ 2021
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-foreground leading-tight">
                من رؤية إلى <span className="text-primary">منصة وطنية</span>
              </h1>

              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                رحلة بدأت عام 2021 برؤية لتحويل إدارة المخلفات في مصر رقمياً، وتتطور باستمرار لتقديم أفضل الحلول
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4 max-w-5xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1 bg-muted/50 rounded-xl">
              {[
                { value: 'timeline', label: 'الإصدارات', icon: Calendar },
                { value: 'achievements', label: 'الإنجازات', icon: Trophy },
                { value: 'team', label: 'القائمون', icon: Users },
                { value: 'vision', label: 'الرؤية', icon: Eye },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-0">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute right-6 sm:right-8 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

                {versions.map((v, i) => (
                  <motion.div
                    key={v.version}
                    className="relative mb-8 last:mb-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {/* Timeline dot */}
                      <div className="hidden sm:flex flex-col items-center pt-1">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
                          v.color,
                          v.status === 'current' && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                        )}>
                          <v.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Content card */}
                      <div className={cn(
                        "flex-1 rounded-2xl border p-6 transition-all",
                        v.status === 'current'
                          ? 'border-primary/30 bg-primary/5 shadow-lg'
                          : 'border-border/50 bg-card hover:shadow-md'
                      )}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r",
                                v.color
                              )}>
                                v{v.version}
                              </span>
                              {v.status === 'current' && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                  الإصدار الحالي
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{v.title}</h3>
                            <p className="text-sm text-muted-foreground">{v.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                            {v.period}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {v.highlights.map((h, hi) => (
                            <div key={hi} className="flex items-start gap-2 text-sm text-foreground/80">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Future */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex gap-4 sm:gap-6">
                    <div className="hidden sm:flex flex-col items-center pt-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          قريباً
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">جاري التطوير المستمر 🚧</h3>
                      <p className="text-sm text-muted-foreground">
                        نعمل باستمرار على تطوير مميزات جديدة وتحسين الأداء — ترقبوا المزيد من التحديثات القادمة!
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {achievements.map((a, i) => (
                  <motion.div
                    key={a.label}
                    className="text-center p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-shadow"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4", a.bg)}>
                      <a.icon className={cn("w-7 h-7", a.color)} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">{a.value}</div>
                    <div className="text-sm text-muted-foreground">{a.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-2">ونستمر في النمو!</h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  هذه الأرقام تعكس جزءاً من إنجازاتنا المتراكمة منذ الانطلاق — ونعمل يومياً لتقديم المزيد
                </p>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team">
              <div className="space-y-5">
                {team.map((t, i) => (
                  <motion.div
                    key={t.role}
                    className="flex gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0", t.color)}>
                      <t.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{t.role}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 text-background p-8 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">شكراً لكل من ساهم في هذه الرحلة</h3>
                <p className="text-background/70 text-sm max-w-md mx-auto">
                  نقدر كل مستخدم وشريك ساهم في تطوير المنصة بملاحظاته واقتراحاته
                </p>
              </div>
            </TabsContent>

            {/* Vision Tab */}
            <TabsContent value="vision">
              <div className="space-y-6">
                {/* Origin story */}
                <motion.div
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">كيف بدأت الفكرة؟</h3>
                      <p className="text-xs text-muted-foreground">2021 — بداية الرؤية</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    في عام 2021، بدأت رؤية إنشاء منصة رقمية وطنية لإدارة المخلفات في مصر. كان الهدف واضحاً: 
                    تحويل منظومة إدارة المخلفات من نظام ورقي تقليدي إلى نظام رقمي ذكي يربط كل الأطراف — 
                    من المولد إلى الناقل إلى المُدوِّر — في منظومة واحدة شفافة ومتكاملة.
                  </p>
                </motion.div>

                {/* Timeline markers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { year: '2021', title: 'ولادة الرؤية', desc: 'بدأت الفكرة كحلم لتحويل إدارة المخلفات رقمياً في مصر، مع دراسة السوق والتشريعات البيئية.', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
                    { year: '2022', title: 'بداية التطوير', desc: 'انطلاق العمل الفعلي على بناء المنصة — تصميم قاعدة البيانات وتطوير أول نموذج عمل.', icon: Code, color: 'from-blue-500 to-cyan-500' },
                    { year: '2023', title: 'الإطلاق التجريبي', desc: 'إطلاق النسخة الأولى واختبارها مع مجموعة محدودة من الجهات، مع بدء تطوير الإصدار الثاني.', icon: Rocket, color: 'from-purple-500 to-violet-500' },
                    { year: '2024', title: 'البنية التحتية v3–v4', desc: 'هوية Fusion 3.0، ذكاء اصطناعي، مركز قيادة موحد، امتثال قانون 202/2020، لوحات رقابة سيادية.', icon: Shield, color: 'from-amber-500 to-orange-500' },
                    { year: '2025', title: 'النضج المتكامل v5.1', desc: 'السائقون الثلاثة، سوق الشحنات، المقاول البلدي، المحفظة الرقمية، محرك التوزيع الذكي، و Shimmer UI.', icon: Sparkles, color: 'from-emerald-500 to-primary' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.year}
                      className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center", m.color)}>
                          <m.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-primary">{m.year}</span>
                          <h4 className="font-bold text-foreground">{m.title}</h4>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Future vision */}
                <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 text-background p-8 text-center">
                  <Eye className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">رؤيتنا للمستقبل</h3>
                  <p className="text-background/70 text-sm max-w-2xl mx-auto leading-relaxed">
                    نسعى لأن تكون iRecycle الركيزة الرقمية الأولى لمنظومة إدارة المخلفات في مصر والمنطقة العربية،
                    مع التوسع في استخدام الذكاء الاصطناعي وإنترنت الأشياء لتحقيق اقتصاد دائري حقيقي
                    يخدم البيئة والمجتمع والاقتصاد الوطني.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Journey;
