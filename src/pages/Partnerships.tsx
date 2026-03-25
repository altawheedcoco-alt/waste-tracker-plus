import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { Factory, Truck, Building2, ArrowLeft, ArrowRight, CheckCircle2, Shield, BarChart3, Recycle, Users, Globe } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Footer = lazy(() => import("@/components/Footer"));

const Partnerships = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const partners = [
    {
      id: 'factories',
      icon: Factory,
      color: 'from-blue-600 to-indigo-700',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200 dark:border-blue-800',
      titleAr: 'للمصانع والمنتجين',
      titleEn: 'For Factories & Producers',
      descAr: 'نوفر حلولاً متكاملة لإدارة عوادم الإنتاج والحمأة الصناعية بما يتوافق مع قانون البيئة المصري رقم 202 لسنة 2020. من التوصيف الدقيق إلى النقل الآمن والتقارير البيئية المعتمدة.',
      descEn: 'We provide integrated solutions for managing production waste and industrial sludge in compliance with Egyptian Environmental Law 202/2020. From precise characterization to safe transport and certified environmental reports.',
      features: [
        { ar: 'توصيف دقيق للمخلفات الصناعية', en: 'Precise industrial waste characterization' },
        { ar: 'تقارير بيئية معتمدة من EEAA', en: 'EEAA-certified environmental reports' },
        { ar: 'إدارة سلسلة الحفظ الكاملة', en: 'Full chain of custody management' },
        { ar: 'لوحة تحكم مخصصة لكل مصنع', en: 'Dedicated dashboard for each factory' },
      ],
    },
    {
      id: 'collectors',
      icon: Truck,
      color: 'from-emerald-600 to-green-700',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      titleAr: 'لجامعي المخلفات والناقلين',
      titleEn: 'For Waste Collectors & Transporters',
      descAr: 'انضم إلى شبكتنا كشريك لوجستي معتمد للحصول على طلبات نقل وتجميع النفايات في منطقتك. نوفر لك أدوات ذكية لإدارة الأسطول وتتبع الشحنات وتحصيل المستحقات.',
      descEn: 'Join our network as a certified logistics partner to receive waste collection and transport requests in your area. We provide smart tools for fleet management, shipment tracking, and payment collection.',
      features: [
        { ar: 'بوابة طلبات جمع تشبه أوبر', en: 'Uber-like collection request portal' },
        { ar: 'تتبع مباشر للأسطول والسائقين', en: 'Real-time fleet & driver tracking' },
        { ar: 'نظام محاسبي ومالي متكامل', en: 'Integrated accounting & finance system' },
        { ar: 'تقييم أداء وتنبيهات استباقية', en: 'Performance scoring & proactive alerts' },
      ],
    },
    {
      id: 'government',
      icon: Building2,
      color: 'from-amber-600 to-orange-700',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200 dark:border-amber-800',
      titleAr: 'للجهات الحكومية والرقابية',
      titleEn: 'For Government & Regulatory Bodies',
      descAr: 'نقدم تقارير تحليلية وبيانات جغرافية لدعم مبادرات "مصر الخضراء" وتحسين كفاءة جمع النفايات. نساعد في رقمنة منظومة إدارة المخلفات وتحقيق أهداف التنمية المستدامة.',
      descEn: 'We provide analytical reports and geographic data to support "Green Egypt" initiatives and improve waste collection efficiency. We help digitize the waste management ecosystem and achieve sustainable development goals.',
      features: [
        { ar: 'تقارير جغرافية وتحليلية متقدمة', en: 'Advanced geographic & analytical reports' },
        { ar: 'بيانات حية عن حركة النفايات', en: 'Real-time waste movement data' },
        { ar: 'دعم مبادرات الاقتصاد الدائري', en: 'Circular economy initiative support' },
        { ar: 'تكامل مع منظومة EEAA', en: 'Integration with EEAA systems' },
      ],
    },
  ];

  const stats = [
    { valueAr: '+500', valueEn: '500+', labelAr: 'شريك معتمد', labelEn: 'Certified Partners', icon: Users },
    { valueAr: '+15', valueEn: '15+', labelAr: 'محافظة مغطاة', labelEn: 'Governorates Covered', icon: Globe },
    { valueAr: '+50K', valueEn: '50K+', labelAr: 'طن تم تدويرها', labelEn: 'Tons Recycled', icon: Recycle },
    { valueAr: '99.9%', valueEn: '99.9%', labelAr: 'معدل الامتثال', labelEn: 'Compliance Rate', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <PageNavBar className="mb-4" />
        </div>
        {/* Hero */}
        <section className="container mx-auto px-4 max-w-5xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Users className="w-4 h-4" />
            {isAr ? 'الشراكات والخدمات' : 'Partnerships & Services'}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
            {isAr ? 'انضم إلى منظومة آي ريسايكل' : 'Join the iRecycle Ecosystem'}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {isAr
              ? 'منصة واحدة تربط المصانع والمنتجين وجامعي المخلفات والجهات الحكومية في منظومة رقمية متكاملة للاقتصاد الدائري.'
              : 'One platform connecting factories, producers, waste collectors, and government bodies in an integrated digital circular economy ecosystem.'}
          </p>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 max-w-4xl mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-5 rounded-2xl bg-card border border-border/50">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{isAr ? stat.valueAr : stat.valueEn}</p>
                <p className="text-xs text-muted-foreground mt-1">{isAr ? stat.labelAr : stat.labelEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Cards */}
        <section className="container mx-auto px-4 max-w-5xl space-y-8 mb-16">
          {partners.map((p) => (
            <div key={p.id} className={`rounded-2xl border ${p.borderColor} overflow-hidden bg-card hover:shadow-lg transition-shadow`}>
              <div className={`bg-gradient-to-r ${p.color} px-6 py-5 flex items-center gap-4`}>
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <p.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{isAr ? p.titleAr : p.titleEn}</h2>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <p className="text-sm text-foreground/80 leading-relaxed">{isAr ? p.descAr : p.descEn}</p>
                <ul className="space-y-3">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {isAr ? f.ar : f.en}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-5">
                <Button
                  onClick={() => navigate('/auth?mode=register')}
                  className="gap-2"
                  variant="outline"
                >
                  {isAr ? 'انضم كشريك' : 'Become a Partner'}
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 max-w-3xl">
          <div className="text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              {isAr ? 'هل أنت جهة حكومية أو رقابية؟' : 'Are you a government or regulatory body?'}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-lg mx-auto">
              {isAr
                ? 'تواصل معنا للحصول على عرض تفصيلي وتجربة مخصصة للمنصة.'
                : 'Contact us for a detailed presentation and customized platform demo.'}
            </p>
            <Button onClick={() => navigate('/help')} size="lg" className="gap-2">
              {isAr ? 'تواصل معنا' : 'Contact Us'}
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </section>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Partnerships;
