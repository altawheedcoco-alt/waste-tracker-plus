import { useLanguage } from "@/contexts/LanguageContext";
import { Leaf, Recycle, BarChart3, MapPin, Scale, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const pillars = [
  {
    icon: Recycle,
    titleAr: 'تقليل النفايات وإعادة التدوير',
    titleEn: 'Waste Reduction & Recycling',
    descAr: 'تحويل 80% من المخلفات البلدية بعيداً عن المدافن بحلول 2030.',
    descEn: 'Divert 80% of municipal waste from landfills by 2030.',
  },
  {
    icon: BarChart3,
    titleAr: 'الاقتصاد الدائري',
    titleEn: 'Circular Economy',
    descAr: 'تعظيم القيمة الاقتصادية للمخلفات عبر إعادة التصنيع والاستخدام.',
    descEn: 'Maximize economic value of waste through remanufacturing and reuse.',
  },
  {
    icon: MapPin,
    titleAr: 'التغطية الجغرافية الشاملة',
    titleEn: 'Nationwide Coverage',
    descAr: 'ربط كافة المحافظات بشبكة رقمية موحدة لنقاط التجميع والتدوير.',
    descEn: 'Connect all governorates with a unified digital network of collection points.',
  },
  {
    icon: Scale,
    titleAr: 'الامتثال التشريعي',
    titleEn: 'Legislative Compliance',
    descAr: 'تطبيق قانون إدارة المخلفات 202/2020 ولائحته التنفيذية.',
    descEn: 'Enforce Waste Management Law 202/2020 and its executive regulations.',
  },
];

const NationalInitiativeSection = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-5 border border-primary/20">
            <Globe className="w-4 h-4" />
            {isAr ? 'جمهورية مصر العربية' : 'Arab Republic of Egypt'}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-4 leading-tight">
            {isAr ? 'المبادرة الوطنية للتحول الأخضر' : 'National Green Transformation Initiative'}
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-foreground/80 text-sm font-semibold mb-4">
            <Leaf className="w-4 h-4 text-primary" />
            {isAr ? 'رؤية مصر 2030 — التنمية المستدامة' : 'Egypt Vision 2030 — Sustainable Development'}
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'تعمل منصة iRecycle كركيزة رقمية وطنية لدعم تحول مصر نحو الاقتصاد الأخضر من خلال رقمنة منظومة إدارة المخلفات وربط كافة الأطراف — من المواطن إلى الجهات الرقابية — في منصة موحدة شفافة.'
              : 'iRecycle serves as a national digital pillar supporting Egypt\'s transition to a green economy by digitizing the waste management ecosystem and connecting all stakeholders — from citizens to regulatory bodies — in a unified, transparent platform.'}
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2 text-sm">{isAr ? pillar.titleAr : pillar.titleEn}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? pillar.descAr : pillar.descEn}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate('/egypt-green')} size="lg" className="gap-2">
            <Globe className="w-4 h-4" />
            {isAr ? 'مصر والتحول البيئي' : 'Egypt & Green Transformation'}
          </Button>
          <Button onClick={() => navigate('/laws')} variant="outline" size="lg" className="gap-2">
            <Scale className="w-4 h-4" />
            {isAr ? 'التشريعات وتصنيف المخلفات' : 'Legislation & Waste Classification'}
          </Button>
          <Button onClick={() => navigate('/map')} variant="outline" size="lg" className="gap-2">
            <MapPin className="w-4 h-4" />
            {isAr ? 'خريطة التدوير الوطنية' : 'National Recycling Map'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NationalInitiativeSection;
