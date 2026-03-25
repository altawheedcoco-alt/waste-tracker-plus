import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { Scale, Trash2, Factory, Stethoscope, Monitor, Wheat, Building, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageNavBar from "@/components/ui/page-nav-bar";

const Footer = lazy(() => import("@/components/Footer"));

const wasteTypes = [
  {
    id: 'municipal',
    icon: Trash2,
    color: 'from-green-500 to-emerald-600',
    titleAr: 'المخلفات البلدية (الصلبة)',
    titleEn: 'Municipal Solid Waste',
    descAr: 'المخلفات الناتجة عن الأنشطة المنزلية والتجارية والإدارية اليومية في المناطق الحضرية والريفية.',
    descEn: 'Waste generated from daily domestic, commercial, and administrative activities in urban and rural areas.',
    marketNamesAr: ['زبالة منزلية', 'خردة', 'دشت', 'كراكيب', 'بقايا أكل', 'قمامة', 'نفايات عضوية (بواقي طعام)', 'كراتين', 'علب صفيح (كانز)', 'بلاستيك منزلي (أكياس، زجاجات PET)'],
    marketNamesEn: ['Household garbage', 'Dasht', 'Khorda', 'Food scraps', 'Organic waste', 'Cartons', 'Tin cans', 'PET bottles', 'Plastic bags'],
    lawRefAr: 'المادة 2 — تعريفات: "المخلفات البلدية"',
    lawRefEn: 'Article 2 — Definitions: "Municipal Waste"',
  },
  {
    id: 'industrial',
    icon: Factory,
    color: 'from-slate-500 to-gray-700',
    titleAr: 'المخلفات الصناعية',
    titleEn: 'Industrial Waste',
    descAr: 'المخلفات الناتجة عن العمليات الصناعية والتصنيعية، سواء كانت خطرة أو غير خطرة.',
    descEn: 'Waste generated from industrial and manufacturing processes, whether hazardous or non-hazardous.',
    marketNamesAr: ['حمأة صناعية (سلدج)', 'زيوت مستعملة (أويل)', 'رايش معادن', 'سكراب حديد', 'أطراف قص (تريم)', 'نشارة خشب صناعي', 'بالات بلاستيك مصنعة', 'فضلات نسيج (قماش تالف)', 'حمأة دهانات ومذيبات', 'خبث أفران'],
    marketNamesEn: ['Industrial sludge', 'Used oils', 'Metal shavings', 'Iron scrap', 'Trim waste', 'Industrial sawdust', 'Plastic bales', 'Textile waste', 'Paint sludge', 'Furnace slag'],
    lawRefAr: 'المادة 28 — إدارة المخلفات الصناعية',
    lawRefEn: 'Article 28 — Industrial Waste Management',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    color: 'from-red-500 to-rose-700',
    titleAr: 'المخلفات الطبية (الخطرة)',
    titleEn: 'Medical Waste (Hazardous)',
    descAr: 'المخلفات الناتجة عن المنشآت الصحية والمختبرات الطبية والصيدليات، وتشمل المواد المعدية والحادة والدوائية.',
    descEn: 'Waste from healthcare facilities, labs, and pharmacies, including infectious, sharps, and pharmaceutical materials.',
    marketNamesAr: ['أكياس حمراء (نفايات معدية)', 'أكياس صفراء (نفايات حادة)', 'حقن وسرنجات مستعملة', 'شاش وقطن ملوث', 'أدوية منتهية الصلاحية', 'عبوات كيماويات مخبرية', 'أنسجة بشرية وعينات', 'زجاجات محاليل وريدية', 'مخلفات أشعة ومواد مشعة'],
    marketNamesEn: ['Red bags (infectious)', 'Yellow bags (sharps)', 'Used syringes', 'Contaminated gauze', 'Expired medicine', 'Lab chemical containers', 'Human tissue', 'IV bottles', 'Radiological waste'],
    lawRefAr: 'المادة 31 — المخلفات الطبية الخطرة',
    lawRefEn: 'Article 31 — Hazardous Medical Waste',
  },
  {
    id: 'electronic',
    icon: Monitor,
    color: 'from-orange-500 to-amber-600',
    titleAr: 'المخلفات الإلكترونية (E-Waste)',
    titleEn: 'Electronic Waste (E-Waste)',
    descAr: 'الأجهزة الكهربائية والإلكترونية المستهلكة أو التالفة، وتحتوي على مواد سامة تتطلب معالجة خاصة.',
    descEn: 'Used or damaged electrical and electronic equipment containing toxic materials requiring special treatment.',
    marketNamesAr: ['كمبيوترات وشاشات قديمة', 'موبايلات تالفة', 'طابعات وكارتريدج', 'بطاريات ليثيوم', 'كابلات نحاس (سلوك)', 'لمبات موفرة (بها زئبق)', 'أجهزة منزلية تالفة (ثلاجات، غسالات)', 'بوردات إلكترونية (PCB)', 'هارد ديسكات'],
    marketNamesEn: ['Old PCs & monitors', 'Damaged phones', 'Printers & cartridges', 'Lithium batteries', 'Copper cables', 'CFL bulbs (mercury)', 'Damaged appliances', 'PCBs', 'Hard drives'],
    lawRefAr: 'المادة 33 — المخلفات الإلكترونية',
    lawRefEn: 'Article 33 — Electronic Waste',
  },
  {
    id: 'agricultural',
    icon: Wheat,
    color: 'from-yellow-500 to-lime-600',
    titleAr: 'المخلفات الزراعية',
    titleEn: 'Agricultural Waste',
    descAr: 'بقايا المحاصيل الزراعية والإنتاج الحيواني، وتشمل قش الأرز والحطب ومخلفات الحظائر.',
    descEn: 'Crop residues and livestock production waste including rice straw, wood, and barn waste.',
    marketNamesAr: ['قش أرز (حطب)', 'عروش خضار', 'تبن', 'حطب ذرة (مصاصة)', 'مخلفات حظائر (سبلة)', 'أخشاب تقليم أشجار', 'مخلفات صوب زراعية (بلاستيك صوب)', 'بقايا قصب السكر (باجاس)', 'سماد عضوي فاسد'],
    marketNamesEn: ['Rice straw', 'Vegetable stalks', 'Hay', 'Corn stalks', 'Barn waste', 'Tree trimmings', 'Greenhouse plastic', 'Bagasse', 'Spoiled compost'],
    lawRefAr: 'المادة 34 — المخلفات الزراعية',
    lawRefEn: 'Article 34 — Agricultural Waste',
  },
  {
    id: 'construction',
    icon: Building,
    color: 'from-stone-500 to-zinc-700',
    titleAr: 'مخلفات الهدم والبناء',
    titleEn: 'Construction & Demolition Waste',
    descAr: 'المخلفات الناتجة عن أعمال البناء والهدم والترميم، وتشمل الأنقاض والحديد والأخشاب.',
    descEn: 'Waste from construction, demolition, and renovation, including rubble, iron, and wood.',
    marketNamesAr: ['ردم (تراب وطوب مكسور)', 'رتش (أنقاض خرسانة)', 'حديد تسليح قديم (خردة حديد)', 'أخشاب شدات (فورم)', 'رخام وسيراميك مكسور', 'أسلاك كهربائية (نحاس)', 'مواسير PVC قديمة', 'ألواح جبس بورد تالفة', 'زجاج مكسور (كسر زجاج)'],
    marketNamesEn: ['Fill (broken bricks)', 'Ratsh (concrete rubble)', 'Old rebar (iron scrap)', 'Formwork wood', 'Broken marble/ceramic', 'Copper wiring', 'Old PVC pipes', 'Damaged drywall', 'Broken glass'],
    lawRefAr: 'المادة 35 — مخلفات الهدم والبناء',
    lawRefEn: 'Article 35 — Construction & Demolition Waste',
  },
];

const Laws = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <PageNavBar className="mb-4" />
        </div>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
          <div className="container mx-auto px-4 max-w-5xl relative py-12 sm:py-16 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-5 border border-primary/20">
              <Scale className="w-4 h-4" />
              {isAr ? 'القانون رقم 202 لسنة 2020' : 'Law No. 202 of 2020'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              {isAr ? 'تصنيف المخلفات طبقاً للتشريع المصري' : 'Waste Classification per Egyptian Legislation'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {isAr
                ? 'قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 يُصنّف المخلفات في مصر إلى ستة أنواع رئيسية. فيما يلي شرح مفصل لكل نوع مع الأسماء المتداولة في السوق المصري.'
                : 'Egypt\'s Waste Management Law 202/2020 classifies waste into six main categories. Below is a detailed explanation of each type with common Egyptian market names.'}
            </p>
          </div>
        </section>

        {/* Waste Types */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-6">
            {wasteTypes.map((type) => (
              <div key={type.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <type.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                        {isAr ? type.titleAr : type.titleEn}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {isAr ? type.descAr : type.descEn}
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent text-xs font-semibold text-foreground/70">
                        <Scale className="w-3 h-3" />
                        {isAr ? type.lawRefAr : type.lawRefEn}
                      </div>
                    </div>
                  </div>

                  {/* Market Names */}
                  <Accordion type="single" collapsible className="mt-5">
                    <AccordionItem value="names" className="border-border/30">
                      <AccordionTrigger className="text-sm font-semibold text-foreground/80 hover:no-underline py-3">
                        {isAr
                          ? `الأسماء الشائعة في السوق المصري (${type.marketNamesAr.length} مسمى)`
                          : `Common Egyptian Market Names (${type.marketNamesEn.length} terms)`}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(isAr ? type.marketNamesAr : type.marketNamesEn).map((name, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-full bg-accent text-xs font-medium text-foreground/80 border border-border/30"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Legal Disclaimer */}
        <section className="container mx-auto px-4 max-w-4xl mt-12">
          <div className="rounded-2xl bg-accent/50 border border-border/30 p-6 sm:p-8 text-center">
            <Scale className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-2">
              {isAr ? 'مرجعية قانونية' : 'Legal Reference'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'المحتوى مبني على قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية الصادرة عن وزارة البيئة المصرية وجهاز تنظيم إدارة المخلفات (WMRA). للاطلاع على النص الكامل يرجى مراجعة الجريدة الرسمية.'
                : 'Content is based on Waste Management Law 202/2020 and its executive regulations issued by the Egyptian Ministry of Environment and WMRA. For the full text, please refer to the Official Gazette.'}
            </p>
          </div>
        </section>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Laws;
