import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { Scale, FileText, Shield, Building2, Leaf, AlertTriangle, CheckCircle2, ExternalLink, BookOpen } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";

const Footer = lazy(() => import("@/components/Footer"));

const Legislation = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const laws = [
    {
      id: 'law202',
      icon: FileText,
      color: 'from-emerald-600 to-green-700',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      titleAr: 'قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020',
      titleEn: 'Waste Management Regulation Law No. 202/2020',
      descAr: 'القانون الأساسي المنظم لإدارة المخلفات في جمهورية مصر العربية. يُلزم جميع المنشآت المُولّدة للمخلفات بالتسجيل والحصول على تراخيص التداول، ويُنشئ جهاز تنظيم إدارة المخلفات (WMRA) كجهة رقابية مستقلة.',
      descEn: 'The primary law regulating waste management in Egypt. Requires all waste-generating facilities to register and obtain handling permits. Establishes the Waste Management Regulatory Agency (WMRA) as an independent oversight body.',
      chapters: [
        { ar: 'الباب الأول: التعريفات والأحكام العامة', en: 'Chapter 1: Definitions & General Provisions' },
        { ar: 'الباب الثاني: المخلفات البلدية', en: 'Chapter 2: Municipal Waste' },
        { ar: 'الباب الثالث: المخلفات الصناعية والزراعية', en: 'Chapter 3: Industrial & Agricultural Waste' },
        { ar: 'الباب الرابع: مخلفات الهدم والبناء', en: 'Chapter 4: Construction & Demolition Waste' },
        { ar: 'الباب الخامس: المخلفات الخطرة والطبية', en: 'Chapter 5: Hazardous & Medical Waste' },
        { ar: 'الباب السادس: العقوبات والجزاءات', en: 'Chapter 6: Penalties & Sanctions' },
      ],
    },
    {
      id: 'law4',
      icon: Leaf,
      color: 'from-teal-600 to-cyan-700',
      borderColor: 'border-teal-200 dark:border-teal-800',
      titleAr: 'قانون البيئة رقم 4 لسنة 1994 وتعديلاته',
      titleEn: 'Environmental Law No. 4/1994 & Amendments',
      descAr: 'القانون الإطاري لحماية البيئة في مصر. يُنشئ جهاز شؤون البيئة (EEAA) ويحدد معايير الانبعاثات والتصريف وإجراءات تقييم الأثر البيئي (EIA) لجميع المشروعات.',
      descEn: 'The framework law for environmental protection in Egypt. Establishes the Egyptian Environmental Affairs Agency (EEAA) and sets emission/discharge standards and Environmental Impact Assessment (EIA) procedures.',
      chapters: [
        { ar: 'حماية البيئة البرية من التلوث', en: 'Land Environment Protection' },
        { ar: 'حماية البيئة المائية', en: 'Water Environment Protection' },
        { ar: 'حماية البيئة الهوائية', en: 'Air Environment Protection' },
        { ar: 'تقييم الأثر البيئي (EIA)', en: 'Environmental Impact Assessment (EIA)' },
      ],
    },
  ];

  const licenses = [
    {
      titleAr: 'ترخيص جمع ونقل المخلفات',
      titleEn: 'Waste Collection & Transport License',
      issuerAr: 'جهاز تنظيم إدارة المخلفات (WMRA)',
      issuerEn: 'Waste Management Regulatory Agency (WMRA)',
      reqsAr: ['سجل تجاري ساري', 'أسطول نقل مطابق للمواصفات', 'نظام تتبع GPS للمركبات', 'تأمين ضد المخاطر البيئية', 'شهادة تدريب للسائقين'],
      reqsEn: ['Valid commercial registry', 'Fleet meeting specifications', 'GPS tracking system', 'Environmental risk insurance', 'Driver training certificates'],
    },
    {
      titleAr: 'ترخيص تدوير ومعالجة المخلفات',
      titleEn: 'Waste Recycling & Treatment License',
      issuerAr: 'جهاز شؤون البيئة (EEAA) + WMRA',
      issuerEn: 'EEAA + WMRA',
      reqsAr: ['دراسة تقييم أثر بيئي معتمدة', 'خطة إدارة بيئية', 'نظام مراقبة انبعاثات', 'موقع مرخص بعيد عن المناطق السكنية', 'سجل إلكتروني للمخلفات الواردة'],
      reqsEn: ['Approved EIA study', 'Environmental management plan', 'Emission monitoring system', 'Licensed site away from residential areas', 'Electronic waste log for incoming waste'],
    },
    {
      titleAr: 'ترخيص تداول المخلفات الخطرة',
      titleEn: 'Hazardous Waste Handling License',
      issuerAr: 'جهاز شؤون البيئة (EEAA)',
      issuerEn: 'Egyptian Environmental Affairs Agency (EEAA)',
      reqsAr: ['تصنيف المخلفات حسب اتفاقية بازل', 'مركبات نقل مجهزة للمواد الخطرة', 'خطة طوارئ معتمدة', 'تأمين مسؤولية مدنية', 'مانيفست إلكتروني لكل شحنة'],
      reqsEn: ['Waste classification per Basel Convention', 'Hazmat-equipped transport vehicles', 'Approved emergency plan', 'Civil liability insurance', 'Electronic manifest per shipment'],
    },
  ];

  const bodies = [
    { nameAr: 'وزارة البيئة المصرية', nameEn: 'Egyptian Ministry of Environment', roleAr: 'الجهة العليا المسؤولة عن السياسات البيئية', roleEn: 'Supreme authority for environmental policy', icon: Building2 },
    { nameAr: 'جهاز شؤون البيئة (EEAA)', nameEn: 'Egyptian Environmental Affairs Agency', roleAr: 'تنفيذ قوانين البيئة وإصدار التراخيص البيئية', roleEn: 'Enforcement of environmental laws & licensing', icon: Shield },
    { nameAr: 'جهاز تنظيم إدارة المخلفات (WMRA)', nameEn: 'Waste Management Regulatory Agency', roleAr: 'الرقابة على منظومة إدارة المخلفات والتراخيص', roleEn: 'Oversight of waste management ecosystem', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <PageNavBar className="mb-6" />
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Scale className="w-4 h-4" />
            {isAr ? 'التراخيص والتشريعات' : 'Licenses & Legislation'}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
            {isAr ? 'الإطار القانوني لإدارة المخلفات في مصر' : 'Legal Framework for Waste Management in Egypt'}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {isAr
              ? 'دليل شامل بالتشريعات والتراخيص المطلوبة لمزاولة أنشطة جمع ونقل وتدوير المخلفات وفقاً لقوانين وزارة البيئة المصرية.'
              : 'A comprehensive guide to the legislation and licenses required for waste collection, transport, and recycling under Egyptian environmental laws.'}
          </p>
        </div>

        {/* Regulatory Bodies */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {isAr ? 'الجهات الرقابية والتنظيمية' : 'Regulatory & Oversight Bodies'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bodies.map((b, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow">
                <b.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-foreground text-sm mb-1">{isAr ? b.nameAr : b.nameEn}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? b.roleAr : b.roleEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Laws */}
        <section className="mb-12 space-y-6">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isAr ? 'القوانين الأساسية' : 'Key Legislation'}
          </h2>
          {laws.map((law) => (
            <div key={law.id} className={`rounded-2xl border ${law.borderColor} overflow-hidden hover:shadow-lg transition-shadow`}>
              <div className={`bg-gradient-to-r ${law.color} px-6 py-4 flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <law.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white flex-1">{isAr ? law.titleAr : law.titleEn}</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">{isAr ? law.descAr : law.descEn}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {law.chapters.map((ch, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/30 rounded-lg px-3 py-2">
                      <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {isAr ? ch.ar : ch.en}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Licenses */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {isAr ? 'التراخيص المطلوبة' : 'Required Licenses'}
          </h2>
          <div className="space-y-5">
            {licenses.map((lic, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-foreground">{isAr ? lic.titleAr : lic.titleEn}</h3>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
                    {isAr ? lic.issuerAr : lic.issuerEn}
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(isAr ? lic.reqsAr : lic.reqsEn).map((req, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-foreground text-sm mb-1">{isAr ? 'إخلاء مسؤولية' : 'Disclaimer'}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'هذا الدليل لأغراض التوعية العامة فقط ولا يُغني عن الاستشارة القانونية المتخصصة. للحصول على آخر التحديثات التشريعية، يُرجى الرجوع إلى الموقع الرسمي لوزارة البيئة المصرية وجهاز تنظيم إدارة المخلفات (WMRA).'
                  : 'This guide is for general awareness only and does not substitute specialized legal advice. For the latest legislative updates, please refer to the official websites of the Egyptian Ministry of Environment and WMRA.'}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Legislation;
