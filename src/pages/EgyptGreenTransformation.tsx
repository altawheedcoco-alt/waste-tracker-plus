import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Globe, Leaf, Scale, MapPin, Building2, Calendar, Award, 
  ArrowLeft, ArrowRight, Cpu, BarChart3, Recycle, TreePine,
  Landmark, Users, FileText, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ───────────── Timeline Data ───────────── */
const timelineEvents = [
  { year: 1972, titleAr: 'مؤتمر ستوكهولم', titleEn: 'Stockholm Conference', descAr: 'أول مؤتمر أممي للبيئة — مصر من أوائل الدول المشاركة', descEn: 'First UN environmental conference — Egypt among earliest participants', icon: Globe },
  { year: 1992, titleAr: 'قمة ريو', titleEn: 'Rio Earth Summit', descAr: 'مصر توقع اتفاقية الأمم المتحدة الإطارية لتغير المناخ (UNFCCC)', descEn: 'Egypt signs the UNFCCC framework convention', icon: FileText },
  { year: 1994, titleAr: 'قانون البيئة 4/1994', titleEn: 'Environmental Law 4/1994', descAr: 'أول تشريع بيئي شامل في مصر وإنشاء جهاز شؤون البيئة (EEAA)', descEn: 'First comprehensive environmental law & establishment of EEAA', icon: Scale },
  { year: 2009, titleAr: 'كوبنهاغن COP15', titleEn: 'Copenhagen COP15', descAr: 'مصر تقدم التزامات أولية بخفض الانبعاثات وتطوير الطاقة المتجددة', descEn: 'Egypt submits initial emission reduction & renewable energy commitments', icon: Leaf },
  { year: 2015, titleAr: 'اتفاق باريس COP21', titleEn: 'Paris Agreement COP21', descAr: 'مصر تنضم لاتفاق باريس وتلتزم بالمساهمات المحددة وطنياً (NDC)', descEn: 'Egypt joins Paris Agreement with Nationally Determined Contributions', icon: Award },
  { year: 2016, titleAr: 'رؤية مصر 2030', titleEn: 'Egypt Vision 2030', descAr: 'إطلاق الاستراتيجية الوطنية للتنمية المستدامة مع 3 أبعاد و12 محور', descEn: 'Launch of National Sustainable Development Strategy with 3 dimensions & 12 pillars', icon: Sparkles },
  { year: 2020, titleAr: 'قانون المخلفات 202/2020', titleEn: 'Waste Law 202/2020', descAr: 'أول قانون متكامل لإدارة المخلفات يشمل التصنيف والترخيص والعقوبات', descEn: 'First integrated waste management law covering classification, licensing & penalties', icon: Recycle },
  { year: 2022, titleAr: 'COP27 شرم الشيخ', titleEn: 'COP27 Sharm El-Sheikh', descAr: 'مصر تستضيف مؤتمر المناخ — إطلاق صندوق الخسائر والأضرار', descEn: 'Egypt hosts COP27 — Launch of Loss & Damage Fund', icon: Landmark },
  { year: 2023, titleAr: 'الاستراتيجية الوطنية لتغير المناخ', titleEn: 'National Climate Strategy 2050', descAr: 'مصر تُطلق استراتيجية 2050 للحياد الكربوني والتكيف مع تغير المناخ', descEn: 'Egypt launches 2050 strategy for carbon neutrality & climate adaptation', icon: TreePine },
  { year: 2024, titleAr: 'التحول الرقمي البيئي', titleEn: 'Digital Environmental Transformation', descAr: 'إطلاق منصات رقمية مثل iRecycle لرقمنة إدارة المخلفات والاقتصاد الدائري', descEn: 'Launch of digital platforms like iRecycle for waste management digitization', icon: Cpu },
];

/* ───────────── Legislative Framework ───────────── */
const laws = [
  { numAr: 'قانون 202/2020', numEn: 'Law 202/2020', titleAr: 'قانون تنظيم إدارة المخلفات', titleEn: 'Waste Management Regulation Law', points: ['تصنيف المخلفات (بلدية، صناعية، خطرة، زراعية، بناء)', 'ترخيص أنشطة الجمع والنقل والمعالجة والتخلص', 'إنشاء منظومة السجل الوطني للمخلفات', 'عقوبات مالية وجنائية على المخالفين'] },
  { numAr: 'قانون 4/1994', numEn: 'Law 4/1994', titleAr: 'قانون حماية البيئة', titleEn: 'Environmental Protection Law', points: ['تقييم الأثر البيئي (EIA) للمشروعات', 'معايير جودة الهواء والمياه والتربة', 'حماية المحميات الطبيعية', 'الرقابة على الانبعاثات الصناعية'] },
  { numAr: 'اللائحة التنفيذية 2020', numEn: 'Executive Regulations 2020', titleAr: 'اللائحة التنفيذية لقانون المخلفات', titleEn: 'Executive Regulations for Waste Law', points: ['اشتراطات النقل والتخزين المؤقت', 'إجراءات الحصول على التراخيص', 'معايير المدافن الصحية', 'آليات الرقابة والتفتيش'] },
];

/* ───────────── COP Events Map Data ───────────── */
const copLocations = [
  { name: 'COP27 — شرم الشيخ', year: 2022, lat: 27.9158, lng: 34.3300, highlight: true },
  { name: 'COP28 — دبي', year: 2023, lat: 25.2048, lng: 55.2708 },
  { name: 'COP29 — باكو', year: 2024, lat: 40.4093, lng: 49.8671 },
];

/* ───────────── iRecycle Role ───────────── */
const platformRole = [
  { iconComp: Recycle, titleAr: 'رقمنة إدارة المخلفات', titleEn: 'Waste Management Digitization', descAr: 'ربط المولدين والناقلين والمصانع في منظومة رقمية واحدة', descEn: 'Connecting generators, transporters & factories in one digital ecosystem' },
  { iconComp: BarChart3, titleAr: 'قياس الأثر البيئي', titleEn: 'Environmental Impact Measurement', descAr: 'حساب البصمة الكربونية وأرصدة الكربون لكل شحنة', descEn: 'Carbon footprint calculation & carbon credits for every shipment' },
  { iconComp: Scale, titleAr: 'الامتثال التشريعي', titleEn: 'Legislative Compliance', descAr: 'ضمان التوافق مع قانون 202/2020 ولوائحه التنفيذية', descEn: 'Ensuring compliance with Law 202/2020 and executive regulations' },
  { iconComp: Users, titleAr: 'التوعية المجتمعية', titleEn: 'Community Awareness', descAr: 'أكاديمية تعليمية ومحتوى توعوي عن إعادة التدوير', descEn: 'Educational academy & awareness content about recycling' },
  { iconComp: Cpu, titleAr: 'ذكاء اصطناعي بيئي', titleEn: 'Environmental AI', descAr: 'تصنيف تلقائي للمخلفات وتنبؤ بالكميات وتحسين المسارات', descEn: 'Automatic waste classification, quantity prediction & route optimization' },
  { iconComp: Globe, titleAr: 'شفافية وحوكمة', titleEn: 'Transparency & Governance', descAr: 'تقارير ESG رقمية وشهادات بصمة كربونية مشفرة بـ QR', descEn: 'Digital ESG reports & QR-encrypted carbon footprint certificates' },
];

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.5 } };

const EgyptGreenTransformation = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
              <Globe className="w-4 h-4" />
              {isAr ? 'جمهورية مصر العربية' : 'Arab Republic of Egypt'}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 leading-tight">
              {isAr ? 'مصر والتحول البيئي العالمي' : 'Egypt & Global Environmental Transformation'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
              {isAr
                ? 'رحلة مصر من مؤتمر ستوكهولم 1972 إلى استضافة COP27 وقيادة التحول الأخضر في المنطقة — وكيف تساهم المنصات الرقمية مثل iRecycle في تحقيق رؤية 2030.'
                : "Egypt's journey from Stockholm 1972 to hosting COP27 and leading the region's green transformation — and how digital platforms like iRecycle contribute to Vision 2030."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => navigate('/laws')} size="lg" className="gap-2">
                <Scale className="w-4 h-4" />
                {isAr ? 'التشريعات البيئية' : 'Environmental Legislation'}
              </Button>
              <Button onClick={() => navigate('/map')} variant="outline" size="lg" className="gap-2">
                <MapPin className="w-4 h-4" />
                {isAr ? 'خريطة التدوير' : 'Recycling Map'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.h2 {...fadeUp} className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-12">
            {isAr ? '📅 السجل التاريخي — من ستوكهولم إلى التحول الرقمي' : '📅 Historical Timeline — From Stockholm to Digital Transformation'}
          </motion.h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-primary/20 left-1/2 -translate-x-1/2 hidden sm:block" />

            {timelineEvents.map((event, i) => {
              const Icon = event.icon;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`relative flex items-start gap-4 mb-8 sm:mb-0 sm:py-6 ${
                    isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isLeft ? 'sm:text-end' : 'sm:text-start'}`}>
                    <div className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow">
                      <span className="text-xs font-bold text-primary">{event.year}</span>
                      <h3 className="font-bold text-foreground text-sm mt-1">
                        {isAr ? event.titleAr : event.titleEn}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {isAr ? event.descAr : event.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary items-center justify-center z-10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  {/* Empty space for alternating */}
                  <div className="hidden sm:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legislative Framework */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 {...fadeUp} className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-10">
            {isAr ? '⚖️ الإطار التشريعي البيئي' : '⚖️ Environmental Legislative Framework'}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {laws.map((law, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary">{isAr ? law.numAr : law.numEn}</span>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-3">{isAr ? law.titleAr : law.titleEn}</h3>
                <ul className="space-y-1.5">
                  {law.points.map((point, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map — COP Locations */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 {...fadeUp} className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-4">
            {isAr ? '🗺️ فعاليات المناخ الكبرى' : '🗺️ Major Climate Events'}
          </motion.h2>
          <p className="text-center text-muted-foreground text-sm mb-8 max-w-lg mx-auto">
            {isAr 
              ? 'مصر استضافت COP27 في شرم الشيخ 2022 — أول مؤتمر مناخ أممي في أفريقيا منذ سنوات.'
              : 'Egypt hosted COP27 in Sharm El-Sheikh 2022 — the first UN climate conference in Africa in years.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {copLocations.map((loc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-2xl border text-center transition-all ${
                  loc.highlight
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border/50 bg-card hover:shadow-md'
                }`}
              >
                <MapPin className={`w-8 h-8 mx-auto mb-3 ${loc.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="font-bold text-foreground text-sm">{loc.name}</h3>
                <span className="text-xs text-muted-foreground">{loc.year}</span>
                {loc.highlight && (
                  <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    🇪🇬 {isAr ? 'مصر المضيفة' : 'Hosted by Egypt'}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button onClick={() => navigate('/map')} variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              {isAr ? 'عرض خريطة التدوير الوطنية' : 'View National Recycling Map'}
            </Button>
          </div>
        </div>
      </section>

      {/* Digital Innovation — iRecycle Role */}
      <section className="py-16 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4 border border-primary/20">
              <Cpu className="w-4 h-4" />
              {isAr ? 'الابتكار الرقمي البيئي' : 'Digital Environmental Innovation'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
              {isAr ? 'دور iRecycle في التحول الأخضر' : "iRecycle's Role in Green Transformation"}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              {isAr
                ? 'منصة iRecycle تجسد التحول الرقمي البيئي في مصر عبر 6 محاور أساسية'
                : 'iRecycle embodies Egypt\'s digital environmental transformation through 6 core pillars'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformRole.map((role, i) => {
              const Icon = role.iconComp;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group p-5 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1.5">{isAr ? role.titleAr : role.titleEn}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? role.descAr : role.descEn}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-3">
              {isAr ? 'كن جزءاً من التحول الأخضر' : 'Be Part of the Green Transformation'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isAr
                ? 'انضم لآلاف المنشآت التي تستخدم iRecycle لإدارة مخلفاتها بكفاءة وشفافية'
                : 'Join thousands of facilities using iRecycle to manage waste efficiently & transparently'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
                <Building2 className="w-4 h-4" />
                {isAr ? 'سجل منشأتك مجاناً' : 'Register Your Facility Free'}
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" size="lg" className="gap-2">
                <BackIcon className="w-4 h-4" />
                {isAr ? 'العودة للرئيسية' : 'Back to Home'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EgyptGreenTransformation;
