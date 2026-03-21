import { Shield, Award, Building2, Landmark, Leaf, Globe2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const partners = [
  {
    icon: Landmark,
    name: 'وزارة البيئة المصرية',
    nameEn: 'Ministry of Environment',
    role: 'الجهة الرقابية والتنظيمية',
    roleEn: 'Regulatory & oversight body',
  },
  {
    icon: Shield,
    name: 'جهاز تنظيم إدارة المخلفات',
    nameEn: 'WMRA',
    role: 'التخطيط والمتابعة',
    roleEn: 'Planning & monitoring',
  },
  {
    icon: Building2,
    name: 'وزارة التنمية المحلية',
    nameEn: 'Ministry of Local Development',
    role: 'التنسيق مع المحافظات',
    roleEn: 'Governorate coordination',
  },
  {
    icon: Globe2,
    name: 'برنامج الأمم المتحدة الإنمائي',
    nameEn: 'UNDP Egypt',
    role: 'الدعم الفني والمالي',
    roleEn: 'Technical & financial support',
  },
  {
    icon: Leaf,
    name: 'صندوق حماية البيئة',
    nameEn: 'Environmental Protection Fund',
    role: 'التمويل الأخضر',
    roleEn: 'Green financing',
  },
  {
    icon: Award,
    name: 'الهيئة العامة للاعتماد',
    nameEn: 'EGAC',
    role: 'الاعتماد والجودة',
    roleEn: 'Accreditation & quality',
  },
];

const TrustedPartnersSection = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--primary)) 0, hsl(var(--primary)) 1px, transparent 0, transparent 50%)`,
        backgroundSize: '24px 24px',
      }} />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-5 border border-primary/20">
            <Shield className="w-4 h-4" />
            {isAr ? 'شركاء النجاح' : 'Success Partners'}
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight">
            {isAr ? (
              <>جهات رسمية تثق في <span className="text-gradient-eco">iRecycle</span></>
            ) : (
              <>Official entities trust <span className="text-gradient-eco">iRecycle</span></>
            )}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'نفخر بشراكتنا مع أهم المؤسسات الحكومية والدولية لبناء منظومة إدارة مخلفات رقمية شفافة وفعالة'
              : 'We are proud to partner with key governmental and international institutions to build a transparent and efficient digital waste management ecosystem'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-12">
          {partners.map((partner, i) => (
            <div
              key={partner.name}
              className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                <partner.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-xs sm:text-sm mb-1 leading-tight">
                {isAr ? partner.name : partner.nameEn}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {isAr ? partner.role : partner.roleEn}
              </p>
            </div>
          ))}
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="absolute inset-0 gradient-eco opacity-90" />
          <div className="relative px-6 py-8 sm:px-12 sm:py-12 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-white">
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black mb-1">27+</div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">
                  {isAr ? 'محافظة مغطاة' : 'Governorates covered'}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black mb-1">100%</div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">
                  {isAr ? 'امتثال تشريعي' : 'Regulatory compliance'}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black mb-1">24/7</div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">
                  {isAr ? 'دعم فني متواصل' : 'Continuous support'}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black mb-1">ISO</div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">
                  {isAr ? 'معايير عالمية' : 'International standards'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedPartnersSection;
