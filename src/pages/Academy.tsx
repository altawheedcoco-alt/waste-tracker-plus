import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { GraduationCap, Trash2, Cpu, HardHat, HeartPulse, Factory, ArrowLeft, ArrowRight, AlertTriangle, Recycle, BookOpen } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";

const Footer = lazy(() => import("@/components/Footer"));

const categories = [
  {
    id: 'municipal',
    icon: Trash2,
    color: 'from-emerald-500 to-green-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    titleAr: 'المخلفات البلدية',
    titleEn: 'Municipal Waste',
    subtitleAr: 'نفايات منزلية وتجارية',
    subtitleEn: 'Household & Commercial Waste',
    descAr: 'تشمل النفايات المنزلية والتجارية مثل الورق، البلاستيك، والزجاج، وتُعرف في السوق المصري بـ "الدشت" و"الخردة". تُجمع هذه المخلفات عبر نظام الجمع البلدي أو من خلال جامعي القمامة المرخصين.',
    descEn: 'Includes household and commercial waste such as paper, plastic, and glass. Known locally as "Dasht" and "Khorda". Collected through municipal collection systems or licensed waste collectors.',
    itemsAr: ['ورق وكرتون (بالات، دشت)', 'بلاستيك (PET، HDPE، أكياس)', 'زجاج (قزاز أبيض وملون)', 'معادن (كانز ألومنيوم، صفيح)', 'مخلفات طعام عضوية'],
    itemsEn: ['Paper & Cardboard (bales, dasht)', 'Plastics (PET, HDPE, bags)', 'Glass (clear & colored)', 'Metals (aluminum cans, tin)', 'Organic food waste'],
    lawAr: 'قانون إدارة المخلفات رقم 202 لسنة 2020 - الباب الثاني',
    lawEn: 'Waste Management Law 202/2020 - Chapter 2',
    dangerLevel: 'low',
  },
  {
    id: 'industrial',
    icon: Factory,
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    titleAr: 'المخلفات الصناعية',
    titleEn: 'Industrial Waste',
    subtitleAr: 'عوادم إنتاج وحمأة صناعية',
    subtitleEn: 'Production waste & industrial sludge',
    descAr: 'تشمل عوادم الإنتاج والحمأة الصناعية الناتجة عن المصانع والمنشآت الصناعية. يُلزم القانون المصري 202/2020 جميع المنشآت الصناعية بالتسجيل لدى جهاز تنظيم إدارة المخلفات (WMRA) والحصول على ترخيص تداول المخلفات الصناعية.',
    descEn: 'Includes production waste and industrial sludge from factories. Egyptian Law 202/2020 requires all industrial facilities to register with WMRA and obtain industrial waste handling permits.',
    itemsAr: ['حمأة صناعية ومحاليل كيماوية', 'زيوت معدنية مستعملة', 'براميل ومخلفات تعبئة', 'خبث أفران ورماد متطاير', 'قصاصات معادن وبقايا إنتاج'],
    itemsEn: ['Industrial sludge & chemical solutions', 'Used mineral oils', 'Drums & packaging waste', 'Furnace slag & fly ash', 'Metal scrap & production residues'],
    lawAr: 'قانون 202/2020 - الباب الثالث (المخلفات الصناعية والزراعية)',
    lawEn: 'Law 202/2020 - Chapter 3 (Industrial & Agricultural Waste)',
    dangerLevel: 'high',
  },
  {
    id: 'electronic',
    icon: Cpu,
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    titleAr: 'المخلفات الإلكترونية',
    titleEn: 'Electronic Waste (E-Waste)',
    subtitleAr: 'أجهزة تالفة ولوحات إلكترونية',
    subtitleEn: 'Damaged devices & circuit boards',
    descAr: 'تشمل الأجهزة التالفة واللوحات الإلكترونية، وتُصنف كنفايات خطرة لاحتوائها على معادن ثقيلة مثل الرصاص والزئبق والكادميوم. يتطلب التعامل معها تراخيص خاصة من جهاز شؤون البيئة (EEAA).',
    descEn: 'Includes damaged devices and circuit boards. Classified as hazardous waste due to heavy metals like lead, mercury, and cadmium. Handling requires special permits from EEAA.',
    itemsAr: ['هواتف محمولة وأجهزة لوحية', 'حاسبات شخصية ولابتوبات', 'لوحات إلكترونية (بوردات)', 'بطاريات ليثيوم وحمضية', 'كابلات وأسلاك نحاسية'],
    itemsEn: ['Mobile phones & tablets', 'PCs & laptops', 'Circuit boards (PCBs)', 'Lithium & acid batteries', 'Copper cables & wires'],
    lawAr: 'قانون 202/2020 - الباب الخامس (المخلفات الخطرة)',
    lawEn: 'Law 202/2020 - Chapter 5 (Hazardous Waste)',
    dangerLevel: 'high',
  },
  {
    id: 'construction',
    icon: HardHat,
    color: 'from-slate-500 to-gray-700',
    bgLight: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800',
    titleAr: 'مخلفات الهدم والبناء',
    titleEn: 'Construction & Demolition Waste',
    subtitleAr: 'الرَتْش ومواد البناء',
    subtitleEn: 'Rubble & building materials',
    descAr: 'تُعرف محلياً بـ "الرَتْش"، وتشمل كسر الرخام، الخرسانة، وحديد التسليح الناتج عن أعمال الترميم والهدم. يتم فرزها وإعادة تدويرها في كسارات متخصصة لإنتاج مواد بناء معاد تدويرها.',
    descEn: 'Known locally as "Ratsh", includes marble fragments, concrete, and rebar from renovation and demolition.',
    itemsAr: ['خرسانة مكسرة (كسر خرسانة)', 'حديد تسليح (حديد سكراب)', 'كسر رخام وسيراميك', 'خشب شدات وفورم', 'أنقاض طوب أحمر وأسمنتي'],
    itemsEn: ['Crushed concrete', 'Rebar (scrap iron)', 'Marble & ceramic fragments', 'Formwork timber', 'Red & cement brick rubble'],
    lawAr: 'قانون 202/2020 - الباب الرابع (مخلفات الهدم والبناء)',
    lawEn: 'Law 202/2020 - Chapter 4 (C&D Waste)',
    dangerLevel: 'medium',
  },
  {
    id: 'medical',
    icon: HeartPulse,
    color: 'from-red-500 to-rose-700',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    titleAr: 'المخلفات الطبية',
    titleEn: 'Medical Waste',
    subtitleAr: 'نفايات رعاية صحية خطرة',
    subtitleEn: 'Hazardous healthcare waste',
    descAr: 'هي نفايات الرعاية الصحية الخطرة (الأكياس الحمراء) التي تتطلب معالجة خاصة بالحرق أو التعقيم بالبخار (الأوتوكلاف). تشمل الأدوات الحادة، المواد الملوثة بالدم، والأدوية منتهية الصلاحية.',
    descEn: 'Hazardous healthcare waste (red bags) requiring special treatment by incineration or steam sterilization (autoclave).',
    itemsAr: ['أدوات حادة (إبر، مشارط)', 'مواد ملوثة بالدم والسوائل', 'أدوية ومستحضرات منتهية الصلاحية', 'نفايات مختبرات وثقافات بكتيرية', 'مخلفات غرف العمليات'],
    itemsEn: ['Sharps (needles, scalpels)', 'Blood-contaminated materials', 'Expired medications', 'Lab waste & bacterial cultures', 'Operating room waste'],
    lawAr: 'قانون 202/2020 - الباب الخامس + قرارات وزارة الصحة',
    lawEn: 'Law 202/2020 - Chapter 5 + Ministry of Health regulations',
    dangerLevel: 'critical',
  },
];

const dangerBadge = (level: string, isAr: boolean) => {
  const config: Record<string, { label: string; labelEn: string; cls: string }> = {
    low: { label: 'خطورة منخفضة', labelEn: 'Low Risk', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    medium: { label: 'خطورة متوسطة', labelEn: 'Medium Risk', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    high: { label: 'خطورة عالية', labelEn: 'High Risk', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    critical: { label: 'خطورة حرجة', labelEn: 'Critical Risk', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const c = config[level] || config.low;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${c.cls}`}>
      <AlertTriangle className="w-3 h-3" />
      {isAr ? c.label : c.labelEn}
    </span>
  );
};

const Academy = () => {
  const { language } = useLanguage();
  usePageTitle(language === 'ar' ? 'الأكاديمية البيئية' : 'Environmental Academy');
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <PageNavBar className="mb-6" />
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <GraduationCap className="w-4 h-4" />
            {isAr ? 'أكاديمية التدوير — مبادرة وطنية للتوعية البيئية' : 'iRecycle Academy — National Environmental Awareness Initiative'}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
            {isAr ? 'تعرّف على أنواع المخلفات في مصر' : 'Learn About Waste Types in Egypt'}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {isAr
              ? 'دليل وطني شامل لتصنيف المخلفات طبقاً للقانون المصري رقم 202 لسنة 2020 ومعايير جهاز شؤون البيئة (EEAA) — في خدمة كل مواطن مصري.'
              : 'A comprehensive national guide to waste classification per Egyptian Law 202/2020 and EEAA standards — serving every Egyptian citizen.'}
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((cat) => (
            <section
              key={cat.id}
              className={`rounded-2xl border ${cat.borderColor} ${cat.bgLight} overflow-hidden transition-shadow hover:shadow-lg`}
            >
              <div className={`bg-gradient-to-r ${cat.color} px-6 py-4 flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{isAr ? cat.titleAr : cat.titleEn}</h2>
                  <p className="text-white/80 text-sm">{isAr ? cat.subtitleAr : cat.subtitleEn}</p>
                </div>
                {dangerBadge(cat.dangerLevel, isAr)}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4">{isAr ? cat.descAr : cat.descEn}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg px-3 py-2 border border-border/30">
                    <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="font-medium">{isAr ? cat.lawAr : cat.lawEn}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-primary" />
                    {isAr ? 'أمثلة شائعة' : 'Common Examples'}
                  </h3>
                  <ul className="space-y-2">
                    {(isAr ? cat.itemsAr : cat.itemsEn).map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/70">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${cat.color} flex-shrink-0 mt-1.5`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <h3 className="text-xl font-bold text-foreground mb-3">
            {isAr ? 'هل لديك مخلفات تحتاج للتخلص منها؟' : 'Have waste that needs disposal?'}
          </h3>
          <p className="text-muted-foreground mb-5 text-sm">
            {isAr
              ? 'سجّل على منصة iRecycle وتواصل مع أقرب مُدوِّر مرخص في منطقتك.'
              : 'Register on iRecycle and connect with the nearest licensed recycler in your area.'}
          </p>
          <a
            href="/auth?mode=register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {isAr ? 'سجّل الآن مجاناً' : 'Register Now for Free'}
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </a>
        </div>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Academy;
