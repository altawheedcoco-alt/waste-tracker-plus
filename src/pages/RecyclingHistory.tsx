import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Scroll, Pyramid, Cpu, Leaf, Recycle, Globe, Sparkles } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImg from "@/assets/egypt-history-hero.webp";

const timelineData = [
  {
    era: "3500 ق.م",
    hieroglyphic: "𓂀 𓏏𓅓 𓇋𓏏",
    title: "عصر ما قبل الأسرات — بداية الوعي",
    titleEn: "Pre-Dynastic Era — The Awakening",
    description: "قبل توحيد مصر، كان سكان وادي النيل يعيدون استخدام الأواني الفخارية المكسورة كأدوات قطع وكشط. كانوا يطحنون الفخار القديم ويخلطونه مع الطين لصنع أوانٍ جديدة أكثر متانة. كما استخدموا عظام الحيوانات في صناعة الإبر والأدوات الدقيقة بدلاً من التخلص منها — وهو أقدم شكل موثّق لإعادة التدوير في تاريخ البشرية.",
    descEn: "Before Egypt's unification, Nile Valley inhabitants reused broken pottery as cutting and scraping tools. They ground old pottery and mixed it with clay for stronger new vessels. Animal bones were crafted into needles and fine tools — the earliest documented form of recycling in human history.",
    icon: Pyramid,
    color: "from-stone-500 to-amber-700",
    bgAccent: "bg-stone-500/10",
  },
  {
    era: "3000 ق.م",
    hieroglyphic: "𓂀 𓏏𓅓𓂋 𓆑𓇋𓏏",
    title: "الدولة القديمة — بُناة الأهرام المُدوِّرون",
    titleEn: "Old Kingdom — The Recycling Pyramid Builders",
    description: "لم يكن بناء الأهرامات يعتمد فقط على الحجارة الجديدة. أثبتت الحفريات أن المصريين أعادوا استخدام أحجار من مبانٍ قديمة وأنقاض مستوطنات سابقة. ورش صهر النحاس في منف كانت تجمع الأدوات البالية وتصهرها لإنتاج أزاميل ومناشير جديدة. حتى رقائق الذهب كانت تُجمع بعناية وتُعاد صهرها. ورق البردي المستعمل كان يُعاد تدويره كوقود في الأفران أو كمادة عازلة في البناء.",
    descEn: "Pyramid construction wasn't just about new stones. Excavations prove Egyptians reused stones from old buildings. Copper smelting workshops in Memphis collected worn tools for remelting into new chisels. Even gold flakes were carefully collected and re-smelted. Used papyrus was recycled as kiln fuel or building insulation.",
    icon: Pyramid,
    color: "from-amber-500 to-yellow-600",
    bgAccent: "bg-amber-500/10",
  },
  {
    era: "1500 ق.م",
    hieroglyphic: "𓊪𓏏𓂋 𓅱𓂧𓏏 𓇋𓏏",
    title: "الدولة الحديثة — نظام فرز متقدم",
    titleEn: "New Kingdom — Advanced Sorting System",
    description: "في عهد الأسرة الثامنة عشرة بطيبة (الأقصر)، نشأ أول نظام حكومي منظم لإدارة المخلفات. عمّال مقابر دير المدينة كانوا يفرزون مخلفاتهم: المعادن تُعاد للورش، والخشب يُحوَّل إلى فحم، والمنسوجات البالية تُستخدم كحشو للوسائد. اكتُشفت مناطق مخصصة لتجميع المخلفات بالقرب من المعابد الكبرى مثل الكرنك. كما استُخدم الزجاج المكسور في صناعة خرز ملون جديد — وهي تقنية سبقت أوروبا بـ 3000 عام.",
    descEn: "Under the 18th Dynasty in Thebes, the first organized government waste system emerged. Deir el-Medina workers sorted waste: metals returned to workshops, wood became charcoal, worn textiles stuffed pillows. Waste collection zones were found near Karnak. Broken glass was remelted into new colored beads — a technique 3000 years ahead of Europe.",
    icon: Scroll,
    color: "from-orange-500 to-red-600",
    bgAccent: "bg-orange-500/10",
  },
  {
    era: "300 ق.م",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧 𓏤𓇋",
    title: "العصر البطلمي — التقاء الحضارات",
    titleEn: "Ptolemaic Era — Civilizations Converge",
    description: "مع وصول البطالمة، اندمجت تقنيات إعادة التدوير المصرية مع المعرفة اليونانية. الإسكندرية أصبحت مركزاً عالمياً لإعادة تدوير ورق البردي — حيث كانت المخطوطات القديمة تُغسل وتُعاد الكتابة عليها (ما يُعرف بالـ Palimpsest). كما طوّروا أفراناً أكثر كفاءة لصهر الزجاج المُعاد تدويره، وأنشأوا أول أسواق منظمة لبيع المواد المُستعملة.",
    descEn: "With the Ptolemies, Egyptian recycling merged with Greek knowledge. Alexandria became a global center for papyrus recycling — old manuscripts were washed and rewritten (palimpsests). They developed more efficient furnaces for recycled glass and established the first organized markets for used materials.",
    icon: Globe,
    color: "from-blue-500 to-indigo-600",
    bgAccent: "bg-blue-500/10",
  },
  {
    era: "القرن 10",
    hieroglyphic: "𓏏𓂋 𓅱𓂧𓏏 𓏤𓂋𓆑",
    title: "القاهرة الفاطمية — المدينة النظيفة",
    titleEn: "Fatimid Cairo — The Clean City",
    description: "كانت القاهرة في العصر الفاطمي من أنظف مدن العالم. وُظِّف عمال متخصصون لكنس الشوارع وجمع المخلفات يومياً. الأقمشة البالية كانت تُحوَّل إلى ورق — وهي صناعة ازدهرت في مصر قبل أوروبا بقرون. نشأت أحياء كاملة متخصصة في إعادة تدوير المعادن والزجاج والجلود، وكان لكل حرفة سوق خاص بها في شوارع القاهرة القديمة.",
    descEn: "Fatimid Cairo was one of the world's cleanest cities. Specialized workers swept streets and collected waste daily. Worn fabrics were converted to paper — an industry that flourished in Egypt centuries before Europe. Entire neighborhoods specialized in recycling metals, glass, and leather.",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    bgAccent: "bg-violet-500/10",
  },
  {
    era: "القرن 12",
    hieroglyphic: "𓏏𓂋 𓅱𓂧𓏏 𓏤𓇋𓂋",
    title: "العصر الأيوبي — صلاح الدين والنظافة العسكرية",
    titleEn: "Ayyubid Era — Saladin's Military Hygiene",
    description: "اهتم صلاح الدين الأيوبي بنظافة القاهرة كجزء من تحصين المدينة. أُنشئت ورش لإعادة تدوير المعادن من الأسلحة المكسورة لصناعة دروع وسيوف جديدة. الجلود البالية من سروج الخيل كانت تُعاد دبغها واستخدامها. وازدهرت صناعة الصابون من زيوت الطبخ المستعملة — وهي إحدى أقدم أشكال إعادة التدوير الكيميائي.",
    descEn: "Saladin prioritized Cairo's cleanliness as part of city fortification. Workshops recycled broken weapons into new armor and swords. Worn horse saddle leather was re-tanned. Soap-making from used cooking oils flourished — one of the earliest forms of chemical recycling.",
    icon: Scroll,
    color: "from-red-600 to-amber-600",
    bgAccent: "bg-red-500/10",
  },
  {
    era: "القرن 15",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧 𓏤𓂋𓇋",
    title: "العصر المملوكي — أسواق المستعمل والحِرَف",
    titleEn: "Mamluk Era — Second-Hand Markets & Crafts",
    description: "ازدهرت في القاهرة المملوكية أسواق متخصصة لبيع وشراء المواد المستعملة، أشهرها سوق الروبابيكيا الذي لا يزال قائماً حتى اليوم. حرفيون متخصصون في ترقيع الأواني النحاسية وإصلاح الأثاث أسسوا نقابات حرفية منظمة. المنسوجات القديمة كانت تُفكك وتُعاد غزلها، والورق المستعمل كان يُعاد تصنيعه في ورش بولاق.",
    descEn: "Mamluk Cairo thrived with specialized second-hand markets, most famously the Robabekia market still operating today. Craftsmen repairing copper vessels and furniture formed organized guilds. Old textiles were unraveled and re-spun, and used paper was recycled in Bulaq workshops.",
    icon: Globe,
    color: "from-yellow-600 to-orange-600",
    bgAccent: "bg-yellow-500/10",
  },
  {
    era: "القرن 19",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧𓏏 𓏤𓂋",
    title: "عصر محمد علي — ولادة الزبالين",
    titleEn: "Muhammad Ali Era — Birth of the Zabbaleen",
    description: "مع التصنيع بدأت إدارة النفايات المنظمة في القاهرة والإسكندرية. ورش إعادة تدوير القطن والمنسوجات تأسست لخدمة الصناعة الناشئة. نظام 'الزبالين' — الذي أصبح لاحقاً نموذجاً عالمياً — بدأ كنظام مجتمعي يحقق نسبة إعادة تدوير 80٪ (أعلى من معظم الدول الغربية حتى اليوم). كل عائلة تخصصت في نوع معين: البلاستيك، الورق، المعادن، أو المخلفات العضوية لتغذية الخنازير.",
    descEn: "With industrialization came organized waste management in Cairo and Alexandria. Cotton recycling workshops served the emerging industry. The 'Zabbaleen' system achieved 80% recycling rates (higher than most Western nations today). Each family specialized in a type: plastic, paper, metals, or organic waste for pig farming.",
    icon: Globe,
    color: "from-emerald-500 to-teal-600",
    bgAccent: "bg-emerald-500/10",
  },
  {
    era: "1940s",
    hieroglyphic: "𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏",
    title: "منتصف القرن العشرين — هجرة الزبالين إلى القاهرة",
    titleEn: "Mid-20th Century — Zabbaleen Migration to Cairo",
    description: "في الأربعينيات والخمسينيات هاجر أقباط الصعيد (الزبالين) إلى القاهرة واستقروا في مناطق مثل منشية ناصر والمقطم. طوروا نظاماً فريداً عالمياً: جمع من الباب للباب، فرز يدوي دقيق، وإعادة تدوير تصل إلى 85٪ من المخلفات. أنشأوا مصانع صغيرة لفرم البلاستيك وكبس الورق، وأصبحت منشية ناصر أكبر مركز لإعادة التدوير في الشرق الأوسط.",
    descEn: "In the 1940s-50s, Upper Egypt's Copts (Zabbaleen) migrated to Cairo, settling in Manshiyat Naser and Mokattam. They developed a globally unique system: door-to-door collection, meticulous manual sorting, recycling up to 85% of waste. Small factories for plastic shredding and paper pressing made Manshiyat Naser the Middle East's largest recycling hub.",
    icon: Recycle,
    color: "from-zinc-500 to-slate-600",
    bgAccent: "bg-zinc-500/10",
  },
  {
    era: "1952",
    hieroglyphic: "𓏏𓂋 𓅱𓂧𓏏 𓆓",
    title: "ثورة يوليو — تنظيم القطاع العام",
    titleEn: "July Revolution — Public Sector Organization",
    description: "بعد ثورة 1952 أممت الحكومة كثيراً من المصانع وأنشأت هيئات حكومية للنظافة. بدأت أول محاولات رسمية لتنظيم جمع القمامة عبر المحليات. ظهرت مقالب القمامة الرسمية الأولى خارج المدن، لكن الزبالين استمروا كعمود فقري فعلي لجمع وفرز المخلفات في الأحياء الشعبية والراقية على حد سواء.",
    descEn: "After the 1952 revolution, the government nationalized factories and created public cleanliness authorities. First official garbage dumps appeared outside cities, but the Zabbaleen remained the actual backbone of waste collection and sorting across all neighborhoods.",
    icon: Scroll,
    color: "from-stone-600 to-zinc-500",
    bgAccent: "bg-stone-500/10",
  },
  {
    era: "1970s",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧𓏏",
    title: "الانفتاح الاقتصادي — طفرة البلاستيك",
    titleEn: "Economic Opening — The Plastic Boom",
    description: "مع سياسة الانفتاح الاقتصادي في عهد السادات، تدفقت السلع الاستهلاكية المغلفة بالبلاستيك إلى مصر لأول مرة بكميات ضخمة. تحول الزبالون بسرعة من التعامل مع مخلفات عضوية في الغالب إلى فرز البلاستيك والألومنيوم والكرتون. نشأت ورش جديدة في منشية ناصر لفرم زجاجات البلاستيك وإعادة تصنيعها في خراطيم ري ومواسير.",
    descEn: "With Sadat's economic opening, consumer goods wrapped in plastic flooded Egypt. The Zabbaleen quickly adapted from mostly organic waste to sorting plastic, aluminum, and cardboard. New workshops in Manshiyat Naser shredded plastic bottles to remake them into irrigation pipes.",
    icon: Recycle,
    color: "from-sky-500 to-blue-600",
    bgAccent: "bg-sky-500/10",
  },
  {
    era: "1981",
    hieroglyphic: "𓏏𓂋 𓅱𓂧 𓆓𓏏",
    title: "مشروع الزبالين مع البنك الدولي",
    titleEn: "Zabbaleen Project with the World Bank",
    description: "بتمويل من البنك الدولي وبالتعاون مع جمعية جامعي القمامة بالمقطم، أُطلق أول مشروع رسمي لتطوير منظومة الزبالين. شمل المشروع توفير عربات نقل حديثة بدلاً من عربات الحمير، وتحسين ظروف الفرز، وإنشاء مراكز تجميع منظمة. اعتبره البنك الدولي نموذجاً ناجحاً للاقتصاد الدائري غير الرسمي.",
    descEn: "Funded by the World Bank in cooperation with the Mokattam garbage collectors' association, the first official project to develop the Zabbaleen system launched. It provided modern transport vehicles instead of donkey carts, improved sorting conditions, and established organized collection centers.",
    icon: Globe,
    color: "from-blue-600 to-indigo-500",
    bgAccent: "bg-blue-500/10",
  },
  {
    era: "1990s",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧 𓏤𓂋",
    title: "الصحوة البيئية — أول قوانين بيئة",
    titleEn: "Environmental Awakening — First Environmental Laws",
    description: "صدر قانون البيئة رقم 4 لسنة 1994 — أول تشريع بيئي شامل في مصر — وأُنشئ جهاز شؤون البيئة (EEAA). بدأت أول حملات التوعية بخطورة حرق القمامة في العراء. ظهرت أولى شركات إعادة التدوير الرسمية المصرية، وبدأ تصدير البلاستيك والورق المفروز من مصر إلى الصين وتركيا.",
    descEn: "Environmental Law 4/1994 — Egypt's first comprehensive environmental legislation — was issued and EEAA established. First awareness campaigns about open burning hazards began. Egypt's first formal recycling companies appeared, and sorted plastic and paper exports to China and Turkey started.",
    icon: Leaf,
    color: "from-teal-500 to-green-600",
    bgAccent: "bg-teal-500/10",
  },
  {
    era: "2003",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧 𓆓𓏏𓏤",
    title: "الخصخصة — صدام النظامين",
    titleEn: "Privatization — Clash of Systems",
    description: "منحت الحكومة عقود جمع القمامة لشركات أجنبية (إيطالية وإسبانية) لتحديث المنظومة. أدى ذلك لتهميش الزبالين وانخفاض نسب إعادة التدوير من 85٪ إلى أقل من 20٪ لأن الشركات الأجنبية اعتمدت الدفن بدلاً من الفرز. تفاقمت أزمة القمامة في القاهرة، مما أثبت أن النظام التقليدي كان أكثر كفاءة بيئياً من البدائل الحديثة.",
    descEn: "The government awarded waste collection contracts to foreign companies (Italian and Spanish). This marginalized the Zabbaleen and recycling rates dropped from 85% to under 20%, as foreign companies used landfilling instead of sorting. Cairo's garbage crisis proved the traditional system was more environmentally efficient.",
    icon: Globe,
    color: "from-rose-500 to-red-600",
    bgAccent: "bg-rose-500/10",
  },
  {
    era: "2009",
    hieroglyphic: "𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏",
    title: "أزمة إنفلونزا الخنازير — ضربة للزبالين",
    titleEn: "Swine Flu Crisis — Blow to the Zabbaleen",
    description: "قررت الحكومة ذبح جميع الخنازير (300,000 رأس) بسبب أزمة إنفلونزا الخنازير رغم أنها لا تنتقل من الخنازير. كان الزبالون يعتمدون على الخنازير في التخلص من المخلفات العضوية (60٪ من القمامة). أدى القرار لتراكم المخلفات العضوية في الشوارع وتفاقم الأزمة البيئية، لكنه دفع نحو البحث عن حلول بديلة ومنظمة.",
    descEn: "The government culled all 300,000 pigs due to swine flu fears (despite no pig-to-human transmission). The Zabbaleen relied on pigs to process organic waste (60% of garbage). This led to organic waste accumulating in streets, but pushed towards organized alternative solutions.",
    icon: Leaf,
    color: "from-amber-600 to-yellow-500",
    bgAccent: "bg-amber-500/10",
  },
  {
    era: "2020",
    hieroglyphic: "𓂀 𓏏𓅓 𓆓𓏏𓏤 𓇋𓏏𓂋",
    title: "القانون 202 — التحول الأخضر",
    titleEn: "Law 202 — Green Transformation",
    description: "صدور قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 أسّس لمنظومة وطنية متكاملة تحت إشراف جهاز WMRA. تضمّن القانون إلزامية الفصل من المصدر، وتراخيص رقمية لشركات النظافة، وعقوبات على المخالفين. بدأت مصر في إنشاء مصانع تحويل النفايات إلى طاقة، ومحطات معالجة حديثة في العاصمة الإدارية والمدن الجديدة.",
    descEn: "Waste Management Law 202/2020 established a national system under WMRA. It mandated source separation, digital licenses for waste companies, and penalties for violators. Egypt began building waste-to-energy plants and modern treatment stations in the New Administrative Capital.",
    icon: Leaf,
    color: "from-green-500 to-emerald-600",
    bgAccent: "bg-green-500/10",
  },
  {
    era: "2025",
    hieroglyphic: "𓂀 𓊪𓏏𓂋 𓅱𓂧 𓆓𓏏𓏤",
    title: "iRecycle — الامتداد الرقمي",
    titleEn: "iRecycle — The Digital Extension",
    description: "منصة iRecycle تجسّد امتداداً حضارياً لأجدادنا الذين مارسوا التدوير قبل 5000 عام. نستكمل مسيرتهم بأدوات العصر الرقمي: ذكاء اصطناعي لتصنيف المخلفات تلقائياً، تتبع لحظي للشحنات عبر GPS، شهادات بيئية رقمية موثّقة بالبلوك تشين، وسوق إلكتروني يربط المنتجين بالمُعالِجين مباشرة. كل ذلك في منظومة واحدة متكاملة تليق بتاريخ مصر العريق في الاستدامة.",
    descEn: "iRecycle is the civilizational extension of ancestors who practiced recycling 5000 years ago. We continue with AI waste classification, GPS shipment tracking, blockchain-verified environmental certificates, and a marketplace connecting producers with processors — a unified ecosystem worthy of Egypt's sustainability heritage.",
    icon: Cpu,
    color: "from-primary to-emerald-500",
    bgAccent: "bg-primary/10",
  },
];

const RecyclingHistory = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Ancient Egyptian recycling hieroglyphs"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-amber-400 font-bold text-lg sm:text-2xl tracking-[0.4em] mb-4" style={{ fontFamily: 'serif', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
            𓂀 𓏏𓅓𓂋𓆑 𓇋𓏏𓂋 𓊪𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏𓏤
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {isAr ? 'تاريخ التدوير في مصر' : 'History of Recycling in Egypt'}
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-2xl mx-auto" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            {isAr
              ? 'من أجدادنا الفراعنة إلى العصر الرقمي — رحلة 5000 عام من إعادة الاستخدام والتدوير'
              : 'From our Pharaonic ancestors to the digital age — a 5000-year journey of reuse and recycling'}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Introduction */}
      <section className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <PageNavBar className="mb-6" />
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            {isAr ? 'نحن امتداد لأجدادنا' : 'We are the extension of our ancestors'}
          </div>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            {isAr
              ? 'لم يكن المصريون القدماء مجرد بُناة أهرامات ومعابد — بل كانوا أول من وضع أسس إعادة التدوير والاستدامة البيئية في التاريخ البشري. اليوم، نحن نستكمل ما بدأوه بأدوات القرن الحادي والعشرين.'
              : 'Ancient Egyptians were not just builders of pyramids and temples — they were the first to establish the foundations of recycling and environmental sustainability in human history. Today, we continue what they started with 21st-century tools.'}
          </p>
        </div>

        {/* Hieroglyphic Quote */}
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-700/30 rounded-3xl p-8 sm:p-12 text-center mb-16">
          <div className="absolute top-4 right-6 text-4xl opacity-20">𓂀</div>
          <div className="absolute bottom-4 left-6 text-4xl opacity-20">𓏏</div>
          <p className="text-amber-600 dark:text-amber-400 text-2xl sm:text-3xl font-bold tracking-[0.3em] mb-4" style={{ fontFamily: 'serif' }}>
            𓂀 𓇋𓏏𓂋 𓊪𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏𓏤 𓅓𓂋𓆑
          </p>
          <p className="text-foreground font-bold text-lg">
            {isAr ? '"الأرض أمانة — أعِد ما أخذت منها"' : '"The Earth is a trust — return what you take from it"'}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {isAr ? '— من نصوص الحكمة المصرية القديمة' : '— From ancient Egyptian wisdom texts'}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-12">
          {isAr ? 'رحلة عبر الزمن' : 'Journey Through Time'}
          <span className="block text-amber-500 text-lg sm:text-xl mt-1 tracking-[0.3em]" style={{ fontFamily: 'serif' }}>𓂀 𓏏𓅓 𓆓𓏏𓏤</span>
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-0 bottom-0 start-6 sm:start-1/2 w-0.5 bg-gradient-to-b from-amber-400 via-emerald-400 to-primary" />

          <div className="flex flex-col gap-12">
            {timelineData.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={item.era} className={`relative flex items-start gap-4 sm:gap-8 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute start-6 sm:start-1/2 -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg ring-4 ring-background`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`ms-20 sm:ms-0 sm:w-[calc(50%-40px)] ${isLeft ? '' : ''}`}>
                    <div className={`${item.bgAccent} border border-border/50 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-shadow`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${item.color}`}>
                          {item.era}
                        </span>
                        <span className="text-amber-500/70 text-sm tracking-[0.2em]" style={{ fontFamily: 'serif' }}>
                          {item.hieroglyphic}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                        {isAr ? item.title : item.titleEn}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {isAr ? item.description : item.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden sm:block sm:w-[calc(50%-40px)]" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-amber-500/5 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Recycle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-black mb-4">
            {isAr ? 'كن جزءاً من الامتداد الحضاري' : 'Be Part of the Civilizational Extension'}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            {isAr
              ? 'أجدادنا بدأوا المسيرة منذ 5000 عام. اليوم، دورك أنت لاستكمال الرحلة نحو مستقبل أخضر مستدام.'
              : 'Our ancestors started the journey 5000 years ago. Today, it\'s your turn to continue toward a sustainable green future.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="eco" size="lg" onClick={() => navigate('/auth?mode=register')} className="gap-2 font-bold">
              {isAr ? 'انضم الآن' : 'Join Now'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/')} className="gap-2 font-bold">
              {isAr ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </div>
          <p className="mt-6 text-amber-500 text-lg tracking-[0.3em] font-bold" style={{ fontFamily: 'serif', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
            𓂀 𓏏𓅓𓂋𓆑 𓇋𓏏𓂋 𓊪𓏏𓂋 𓅱𓂧𓏏 𓆓𓏏𓏤
          </p>
        </div>
      </section>
    </div>
  );
});

RecyclingHistory.displayName = 'RecyclingHistory';

export default RecyclingHistory;
