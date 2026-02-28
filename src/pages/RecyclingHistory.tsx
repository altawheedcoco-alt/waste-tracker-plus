import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Scroll, Pyramid, Cpu, Leaf, Recycle, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImg from "@/assets/egypt-history-hero.webp";

const timelineData = [
  {
    era: "3000 ق.م",
    hieroglyphic: "𓂀 𓏏𓅓𓂋 𓆑𓇋𓏏",
    title: "الحضارة المصرية القديمة",
    titleEn: "Ancient Egyptian Civilization",
    description: "كان المصريون القدماء رواد إعادة الاستخدام في العالم. أعادوا تشكيل المعادن، وصهروا النحاس والبرونز لصناعة أدوات جديدة. استخدموا ورق البردي المُستعمل كوقود أو مواد بناء، وأعادوا استخدام الأحجار من المباني القديمة لبناء معابد جديدة.",
    descEn: "Ancient Egyptians were pioneers of reuse. They reshaped metals, melted copper and bronze for new tools, used papyrus as fuel or building material, and reused stones from old structures for new temples.",
    icon: Pyramid,
    color: "from-amber-500 to-yellow-600",
    bgAccent: "bg-amber-500/10",
  },
  {
    era: "1500 ق.م",
    hieroglyphic: "𓊪𓏏𓂋 𓅱𓂧𓏏 𓇋𓏏",
    title: "عصر الدولة الحديثة",
    titleEn: "The New Kingdom Era",
    description: "في عهد الأسرة الثامنة عشرة، طوّر المصريون نظاماً متقدماً لجمع وفرز المخلفات في طيبة (الأقصر). كانت ورش إعادة صهر المعادن تعمل بالقرب من المعابد الكبرى، وكانت الخشب المُستعمل يُحوَّل إلى فحم للاستخدام في الطهي والتدفئة.",
    descEn: "During the 18th Dynasty, Egyptians developed advanced waste collection systems in Thebes (Luxor). Metal recycling workshops operated near major temples, and used wood was converted to charcoal.",
    icon: Scroll,
    color: "from-orange-500 to-red-600",
    bgAccent: "bg-orange-500/10",
  },
  {
    era: "القرن 19",
    hieroglyphic: "𓏏𓂋𓆑 𓅱𓂧𓏏 𓏤𓂋",
    title: "مصر الحديثة — عصر محمد علي",
    titleEn: "Modern Egypt — Muhammad Ali Era",
    description: "مع بدايات التصنيع في مصر، ظهرت أولى محاولات إدارة النفايات المنظمة في القاهرة والإسكندرية. تأسست ورش لإعادة تدوير القطن والمنسوجات، وبدأ نظام 'الزبالين' الفريد الذي أصبح نموذجاً عالمياً في إعادة التدوير المجتمعي.",
    descEn: "With early industrialization, organized waste management began in Cairo and Alexandria. Cotton recycling workshops emerged, and the unique 'Zabbaleen' system became a global model for community recycling.",
    icon: Globe,
    color: "from-emerald-500 to-teal-600",
    bgAccent: "bg-emerald-500/10",
  },
  {
    era: "2020",
    hieroglyphic: "𓂀 𓏏𓅓 𓆓𓏏𓏤 𓇋𓏏𓂋",
    title: "القانون 202 — التحول الأخضر",
    titleEn: "Law 202 — Green Transformation",
    description: "صدور قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020، الذي أسس لمنظومة وطنية متكاملة تحت إشراف جهاز تنظيم إدارة المخلفات (WMRA). بداية التحول الرقمي في قطاع إدارة المخلفات المصري.",
    descEn: "Enactment of Waste Management Law 202/2020, establishing a national system under WMRA. The beginning of digital transformation in Egypt's waste management sector.",
    icon: Leaf,
    color: "from-green-500 to-emerald-600",
    bgAccent: "bg-green-500/10",
  },
  {
    era: "2025",
    hieroglyphic: "𓂀 𓊪𓏏𓂋 𓅱𓂧 𓆓𓏏𓏤",
    title: "iRecycle — الامتداد الرقمي",
    titleEn: "iRecycle — The Digital Extension",
    description: "منصة iRecycle تجسّد امتداد حضاري لأجدادنا المصريين القدماء الذين كانوا أول من مارس إعادة التدوير في التاريخ. نحن نستكمل مسيرتهم بأدوات العصر الرقمي: ذكاء اصطناعي، تتبع لحظي، وشهادات رقمية — لبناء مستقبل أخضر يليق بتاريخ مصر العريق.",
    descEn: "iRecycle embodies the civilizational extension of our ancient Egyptian ancestors who were the first to practice recycling. We continue their legacy with digital tools: AI, real-time tracking, and digital certificates — building a green future worthy of Egypt's heritage.",
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
