import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Truck, Eye, MapPin, Shield, Zap, 
  BarChart3, Bell, Globe, Palette, Radio, ChevronLeft, ChevronRight
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  type: 'feature' | 'improvement' | 'fix';
  icon: typeof Sparkles;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v5.1',
    date: '2026-03',
    titleAr: 'رادار القرب الذكي',
    titleEn: 'Smart Proximity Radar',
    descAr: 'خريطة تفاعلية تعرض السائقين المتاحين ومناطق الطلب المرتفع بنطاق 50 كم',
    descEn: 'Interactive map showing available drivers and high-demand zones within 50km',
    type: 'feature',
    icon: MapPin,
  },
  {
    version: 'v5.1',
    date: '2026-03',
    titleAr: 'نظام راحة العين المتقدم',
    titleEn: 'Advanced Eye Comfort System',
    descAr: 'فلتر الضوء الأزرق، جدولة تلقائية، 3 أوضاع مخصصة',
    descEn: 'Blue light filter, auto-scheduling, 3 custom modes',
    type: 'feature',
    icon: Eye,
  },
  {
    version: 'v5.1',
    date: '2026-03',
    titleAr: 'منظومة السائق المستقل',
    titleEn: 'Independent Driver Ecosystem',
    descAr: 'نظام متكامل يشبه أوبر لربط الناقلين بالسائقين المستقلين',
    descEn: 'Uber-like system connecting transporters with freelance drivers',
    type: 'feature',
    icon: Truck,
  },
  {
    version: 'v5.0',
    date: '2026-02',
    titleAr: 'الذكاء الاصطناعي السيادي',
    titleEn: 'Sovereign AI Engine',
    descAr: 'تحليل ذكي للشحنات والمستندات مع كشف الشذوذ تلقائياً',
    descEn: 'Smart shipment and document analysis with anomaly detection',
    type: 'feature',
    icon: Sparkles,
  },
  {
    version: 'v5.0',
    date: '2026-02',
    titleAr: 'البورصة والمزادات',
    titleEn: 'Waste Exchange & Auctions',
    descAr: 'سوق إلكتروني لتداول المخلفات بنظام المزايدة الذكية',
    descEn: 'Digital marketplace for waste trading with smart bidding',
    type: 'feature',
    icon: BarChart3,
  },
  {
    version: 'v4.5',
    date: '2026-01',
    titleAr: 'المزامنة اللحظية الشاملة',
    titleEn: 'Platform-Wide Realtime Sync',
    descAr: 'تحديث فوري لكافة البيانات عبر 600+ جدول',
    descEn: 'Instant updates across 600+ tables',
    type: 'improvement',
    icon: Radio,
  },
  {
    version: 'v4.0',
    date: '2025-12',
    titleAr: 'إشعارات واتساب الذكية',
    titleEn: 'Smart WhatsApp Notifications',
    descAr: 'إشعارات فورية عبر واتساب لمتابعة الشحنات والمدفوعات',
    descEn: 'Instant WhatsApp alerts for shipments and payments',
    type: 'feature',
    icon: Bell,
  },
  {
    version: 'v3.5',
    date: '2025-11',
    titleAr: 'دعم متعدد اللغات',
    titleEn: 'Multi-language Support',
    descAr: 'دعم كامل للعربية والإنجليزية مع تبديل فوري',
    descEn: 'Full Arabic & English support with instant switching',
    type: 'improvement',
    icon: Globe,
  },
];

const TYPE_STYLES = {
  feature: 'bg-primary/10 text-primary border-primary/20',
  improvement: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  fix: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const TYPE_LABELS = {
  feature: { ar: 'ميزة جديدة', en: 'New Feature' },
  improvement: { ar: 'تحسين', en: 'Improvement' },
  fix: { ar: 'إصلاح', en: 'Fix' },
};

const PlatformChangelog = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/20 to-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-3 gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary">
            <Sparkles className="h-3 w-3" />
            {isAr ? 'سجل التحديثات' : 'Changelog'}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {isAr ? 'آخر تحديثات المنصة' : 'Latest Platform Updates'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isAr ? 'تابع أحدث الميزات والتحسينات التي نضيفها باستمرار' : 'Follow the latest features and improvements we continuously add'}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-2xl mx-auto">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 start-5 sm:start-6 w-px bg-border" />

          <div className="space-y-6">
            {CHANGELOG.map((entry, i) => {
              const Icon = entry.icon;
              return (
                <div key={i} className="relative flex gap-4 sm:gap-5 group">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center shadow-sm group-hover:border-primary/60 transition-colors">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 pb-2">
                    <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                          {entry.version}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${TYPE_STYLES[entry.type]}`}>
                          {isAr ? TYPE_LABELS[entry.type].ar : TYPE_LABELS[entry.type].en}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ms-auto">{entry.date}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        {isAr ? entry.titleAr : entry.titleEn}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isAr ? entry.descAr : entry.descEn}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

PlatformChangelog.displayName = 'PlatformChangelog';
export default PlatformChangelog;
