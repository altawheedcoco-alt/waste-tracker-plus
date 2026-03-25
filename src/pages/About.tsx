import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { Eye, Target, Flag, Heart, Leaf, Brain, Users, MapPin, Scale, ShieldCheck, BarChart3, Globe, Building2, Recycle, ArrowLeft, ArrowRight } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Footer = lazy(() => import("@/components/Footer"));

const About = () => {
  const { language } = useLanguage();
  usePageTitle(language === 'ar' ? 'من نحن' : 'About Us');
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const goals = [
    {
      icon: Scale,
      titleAr: 'الامتثال التشريعي',
      titleEn: 'Legislative Compliance',
      descAr: 'نشر الوعي بقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 لضمان التزام كافة الأطراف بالمعايير البيئية الرسمية.',
      descEn: 'Spreading awareness of Waste Management Law 202/2020 to ensure all parties comply with official environmental standards.',
    },
    {
      icon: MapPin,
      titleAr: 'الربط الجغرافي الذكي',
      titleEn: 'Smart Geographic Integration',
      descAr: 'توفير خرائط تفاعلية دقيقة لمواقع تجميع وتدوير المخلفات في كافة المحافظات المصرية.',
      descEn: 'Providing precise interactive maps of waste collection and recycling sites across all Egyptian governorates.',
    },
    {
      icon: Users,
      titleAr: 'دعم القطاع غير الرسمي',
      titleEn: 'Informal Sector Integration',
      descAr: 'دمج العاملين في قطاع المخلفات وتطوير مهاراتهم ضمن منظومة رقمية منظمة ومحمية.',
      descEn: 'Integrating waste sector workers and developing their skills within an organized, protected digital ecosystem.',
    },
    {
      icon: BarChart3,
      titleAr: 'الشفافية والبيانات',
      titleEn: 'Transparency & Data',
      descAr: 'بناء قاعدة بيانات وطنية تخدم متخذي القرار وتساهم في تقليل الانبعاثات الكربونية.',
      descEn: 'Building a national database serving decision-makers and contributing to carbon emission reduction.',
    },
  ];

  const values = [
    {
      icon: Leaf,
      color: 'from-primary to-primary/80',
      titleAr: 'المسؤولية البيئية',
      titleEn: 'Environmental Responsibility',
      descAr: 'نؤمن أن حماية بيئة مصر هي مسؤولية وطنية مشتركة بين كل مواطن ومؤسسة وجهة حكومية.',
      descEn: 'We believe that protecting Egypt\'s environment is a shared national responsibility among every citizen, institution, and government body.',
    },
    {
      icon: Brain,
      color: 'from-secondary-foreground to-foreground',
      titleAr: 'الابتكار الرقمي',
      titleEn: 'Digital Innovation',
      descAr: 'استخدام أحدث تقنيات الخرائط والذكاء الاصطناعي لخدمة المواطن والبيئة وتحقيق التحول الرقمي.',
      descEn: 'Leveraging the latest mapping and AI technologies to serve citizens, the environment, and drive digital transformation.',
    },
    {
      icon: Globe,
      color: 'from-primary/70 to-primary',
      titleAr: 'الخدمة العامة',
      titleEn: 'Public Service',
      descAr: 'المنصة متاحة لخدمة كافة القطاعات في الدولة دون انحياز لجهة خاصة — منصة الشعب لخدمة الشعب.',
      descEn: 'The platform serves all sectors of the state without bias toward any private entity — a public platform for public service.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <PageNavBar className="mb-4" />
        </div>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
          <div className="container mx-auto px-4 max-w-5xl relative py-12 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
              <Building2 className="w-4 h-4" />
              {isAr ? 'مبادرة وطنية لجمهورية مصر العربية' : 'A National Initiative for the Arab Republic of Egypt'}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 text-foreground leading-tight">
              {isAr ? 'عن منصة' : 'About'}{' '}
              <span className="text-primary">iRecycle</span>
            </h1>

            <p className="text-muted-foreground max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
              {isAr
                ? 'منصة وطنية خدمية رقمية تعمل على ربط كافة أطراف منظومة إدارة المخلفات في مصر، دعماً لوزارة البيئة المصرية وجهاز تنظيم إدارة المخلفات (WMRA) في إطار رؤية مصر 2030 للتنمية المستدامة.'
                : 'A national digital service platform connecting all stakeholders in Egypt\'s waste management ecosystem, supporting the Egyptian Ministry of Environment and WMRA within Egypt Vision 2030 for sustainable development.'}
            </p>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="container mx-auto px-4 max-w-5xl -mt-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vision */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-7 sm:p-9 relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {isAr ? 'الرؤية' : 'Vision'}
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {isAr
                    ? 'أن نكون الركيزة الرقمية الأولى لدعم منظومة إدارة المخلفات في جمهورية مصر العربية، والمحرك الأساسي للتحول نحو الاقتصاد الأخضر والمستدام بما يتماشى مع رؤية مصر 2030.'
                    : 'To be the primary digital pillar supporting the waste management ecosystem in the Arab Republic of Egypt, and the main driver toward a green and sustainable economy in line with Egypt Vision 2030.'}
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="rounded-2xl border border-border/50 bg-card p-7 sm:p-9 relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 end-0 w-32 h-32 bg-accent/30 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {isAr ? 'المهمة' : 'Mission'}
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {isAr
                    ? 'توفير منصة وطنية خدمية موحدة تربط المواطنين، والمنشآت الصناعية، والجهات الرقابية، ومقدمي الخدمات اللوجستية، لضمان إدارة ذكية وشفافة للمخلفات بكافة أنواعها، وتسهيل الوصول إلى مراكز التدوير المعتمدة لتقليل الأثر البيئي وتعظيم الاستفادة من الموارد.'
                    : 'To provide a unified national service platform connecting citizens, industrial facilities, regulatory bodies, and logistics providers, ensuring smart and transparent management of all waste types, and facilitating access to certified recycling centers to reduce environmental impact and maximize resource utilization.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Goals */}
        <section className="container mx-auto px-4 max-w-5xl mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-foreground text-sm font-semibold mb-4">
              <Flag className="w-4 h-4 text-primary" />
              {isAr ? 'الأهداف الاستراتيجية' : 'Strategic Goals'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isAr ? 'نحو مصر أكثر استدامة' : 'Toward a More Sustainable Egypt'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {goals.map((goal, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <goal.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1.5">{isAr ? goal.titleAr : goal.titleEn}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? goal.descAr : goal.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section className="container mx-auto px-4 max-w-5xl mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-foreground text-sm font-semibold mb-4">
              <Heart className="w-4 h-4 text-primary" />
              {isAr ? 'القيم الجوهرية' : 'Core Values'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isAr ? 'المبادئ التي نبني عليها' : 'The Principles We Build On'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((val, i) => (
              <div
                key={i}
                className="text-center p-7 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-shadow group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${val.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <val.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{isAr ? val.titleAr : val.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? val.descAr : val.descEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Institutional Partners */}
        <section className="container mx-auto px-4 max-w-4xl mb-16">
          <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 text-background p-8 sm:p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              {isAr ? 'في خدمة المنظومة البيئية المصرية' : 'Serving Egypt\'s Environmental Ecosystem'}
            </h3>
            <p className="text-background/70 max-w-2xl mx-auto text-sm leading-relaxed mb-6">
              {isAr
                ? 'تعمل منصة آي ريسايكل بالتنسيق مع وزارة البيئة المصرية وجهاز تنظيم إدارة المخلفات (WMRA) وجهاز شؤون البيئة (EEAA) لتحقيق الامتثال الكامل للتشريعات البيئية ودعم مبادرات التحول الأخضر.'
                : 'iRecycle operates in coordination with the Egyptian Ministry of Environment, WMRA, and EEAA to achieve full compliance with environmental legislation and support green transformation initiatives.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { ar: 'وزارة البيئة', en: 'Ministry of Environment' },
                { ar: 'جهاز WMRA', en: 'WMRA' },
                { ar: 'جهاز EEAA', en: 'EEAA' },
                { ar: 'رؤية مصر 2030', en: 'Egypt Vision 2030' },
              ].map((tag, i) => (
                <span key={i} className="px-4 py-2 rounded-full bg-background/10 text-background/90 text-xs font-semibold border border-background/10">
                  {isAr ? tag.ar : tag.en}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/partnerships')}
                variant="secondary"
                size="lg"
                className="gap-2"
              >
                <Recycle className="w-4 h-4" />
                {isAr ? 'انضم كشريك' : 'Become a Partner'}
              </Button>
              <Button
                onClick={() => navigate('/legislation')}
                variant="outline"
                size="lg"
                className="gap-2 border-background/30 text-background hover:bg-background/10"
              >
                <Scale className="w-4 h-4" />
                {isAr ? 'التشريعات والتراخيص' : 'Legislation & Licenses'}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default About;
