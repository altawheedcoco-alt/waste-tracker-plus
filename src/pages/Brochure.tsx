import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowRight } from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';
import {
  sections, platformStats, whyChooseUs, industries,
  documentAIFeatures, impactNumbers,
  type BrochureSection, type BrochureFeature,
} from '@/components/brochure/brochureData';
import {
  CheckCircle2, Leaf, Cog, Globe, Zap, Lock, Phone, Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ───── A4 Page wrapper ───── */
const Page = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`brochure-page bg-white relative ${className}`}>
    {children}
  </div>
);

/* ───── Section divider page ───── */
const DividerPage = ({ title, titleEn, subtitle, icon: Icon, color, count }: {
  title: string; titleEn: string; subtitle: string; icon: any; color: string; count: number;
}) => (
  <Page>
    <div className={`h-full flex flex-col items-center justify-center text-center p-16 bg-gradient-to-br ${color}`}>
      <div className="p-6 bg-white/20 rounded-3xl mb-8 backdrop-blur-sm">
        <Icon className="w-20 h-20 text-white" />
      </div>
      <h2 className="text-4xl font-black text-white mb-3">{title}</h2>
      <h3 className="text-2xl font-bold text-white/80 mb-4">{titleEn}</h3>
      <p className="text-white/60 text-lg">{subtitle}</p>
      <div className="mt-8 px-6 py-3 bg-white/20 rounded-full text-white font-bold backdrop-blur-sm">
        {count} وظيفة متكاملة | {count} Integrated Functions
      </div>
    </div>
  </Page>
);

/* ───── Feature section page (bilingual) ───── */
const SectionPage = ({ section, lang }: { section: BrochureSection; lang: 'ar' | 'en' }) => {
  const Icon = section.icon;
  const isAr = lang === 'ar';
  return (
    <Page>
      <div className={`bg-gradient-to-l ${section.color} p-6 text-white`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black">{isAr ? section.title : section.titleEn}</h2>
            <p className="text-white/70 text-sm">{isAr ? section.titleEn : section.subtitle}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${section.category === 'environment' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
            {section.features.length} {isAr ? 'وظيفة' : 'Functions'}
          </div>
        </div>
      </div>
      <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-2 gap-3">
          {section.features.map((f, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-1 ${section.category === 'environment' ? 'text-emerald-600' : 'text-blue-600'}`} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{isAr ? f.name : f.nameEn}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{isAr ? f.desc : f.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Page footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-2 bg-gray-50 border-t flex items-center justify-between text-[10px] text-gray-400">
        <span>iRecycle — {isAr ? 'نظام التشغيل الصناعي لإدارة المخلفات' : 'Industrial Operating System for Waste Management'}</span>
        <span>{isAr ? section.titleEn : section.title}</span>
      </div>
    </Page>
  );
};

export default function FullBrochure() {
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handlePrint = () => {
    if (printRef.current) {
      import('@/services/documentService').then(({ PrintService }) => {
        PrintService.printHTML(printRef.current!.innerHTML, { title: 'بروشور المنصة' });
      });
    }
  };

  const envSections = sections.filter(s => s.category === 'environment');
  const opsSections = sections.filter(s => s.category === 'operations');
  const totalFeatures = sections.reduce((sum, s) => sum + s.features.length, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between p-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            العودة للموقع
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">
              ~{sections.length * 2 + 12} صفحة A4 | {totalFeatures}+ وظيفة
            </span>
            <Button onClick={handlePrint} size="sm" className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة / تحميل PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="brochure-container max-w-[210mm] mx-auto my-4 print:my-0">

        {/* ═══ PAGE 1: COVER ═══ */}
        <Page>
          <div className="h-full flex flex-col bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-8">
                <PlatformLogo size="xl" showText inverted showSubtitle />
              </div>
              <div className="w-24 h-1 bg-white/30 rounded-full mb-8" />
              <h1 className="text-4xl font-black mb-4 leading-tight">
                نظام التشغيل الصناعي<br />لإدارة المخلفات والاستدامة البيئية
              </h1>
              <h2 className="text-xl font-bold text-white/80 mb-6">
                Industrial Operating System for<br />Waste Management & Environmental Sustainability
              </h2>
              <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed mb-8">
                الحل الرقمي الشامل لإدارة سلسلة القيمة الكاملة للمخلفات مع رقابة بيئية متقدمة
                وامتثال كامل لمعايير ISO 14001 / ISO 45001 / GRI Standards / Basel Convention
              </p>
              <div className="grid grid-cols-4 gap-4 max-w-md">
                {platformStats.slice(0, 4).map((s) => (
                  <div key={s.label} className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white/10 text-center text-xs text-white/50">
              © {new Date().getFullYear()} iRecycle — Confidential Marketing Brochure
            </div>
          </div>
        </Page>

        {/* ═══ PAGE 2: COVER EN ═══ */}
        <Page>
          <div className="h-full flex flex-col bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-8">
                <PlatformLogo size="xl" showText inverted showSubtitle />
              </div>
              <div className="w-24 h-1 bg-white/30 rounded-full mb-8" />
              <h1 className="text-4xl font-black mb-4 leading-tight">
                The First Industrial OS<br />for Waste Management in MENA
              </h1>
              <h2 className="text-xl font-bold text-white/80 mb-6">
                Complete Digital Platform for Waste Lifecycle Management,<br />
                Environmental Compliance & Sustainability Reporting
              </h2>
              <div className="grid grid-cols-4 gap-4 max-w-lg mt-4">
                {platformStats.map((s) => (
                  <div key={s.labelEn} className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] text-white/70">{s.labelEn}</p>
                    <p className="text-[8px] text-white/40">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white/10 text-center text-xs text-white/50">
              © {new Date().getFullYear()} iRecycle — All Rights Reserved
            </div>
          </div>
        </Page>

        {/* ═══ PAGE 3: TABLE OF CONTENTS AR ═══ */}
        <Page>
          <div className="p-8" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 mb-2">فهرس المحتويات</h2>
            <p className="text-gray-500 mb-6">Table of Contents</p>
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            
            <div className="space-y-1">
              <div className="font-bold text-primary text-lg mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                القسم الأول: البيئة والاستدامة ({envSections.length} منظومات)
              </div>
              {envSections.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dashed border-gray-200">
                  <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                  <span className="text-sm font-semibold flex-1">{s.title}</span>
                  <span className="text-xs text-gray-400">{s.features.length} وظيفة</span>
                </div>
              ))}

              <div className="font-bold text-blue-600 text-lg mb-3 mt-6 flex items-center gap-2">
                <Cog className="w-5 h-5" />
                القسم الثاني: العمليات والإدارة ({opsSections.length} منظومات)
              </div>
              {opsSections.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dashed border-gray-200">
                  <span className="text-xs text-gray-400 w-6">{envSections.length + i + 1}</span>
                  <span className="text-sm font-semibold flex-1">{s.title}</span>
                  <span className="text-xs text-gray-400">{s.features.length} وظيفة</span>
                </div>
              ))}

              <div className="font-bold text-purple-600 text-lg mb-3 mt-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                أقسام إضافية
              </div>
              {['ذكاء المستندات | Document AI', 'القطاعات المستهدفة | Industries', 'الأثر والنتائج | Impact', 'لماذا iRecycle؟ | Why Us'].map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dashed border-gray-200">
                  <span className="text-xs text-gray-400 w-6">—</span>
                  <span className="text-sm font-semibold flex-1">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ═══ PAGE 4: EXECUTIVE SUMMARY AR ═══ */}
        <Page>
          <div className="p-8" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 mb-2">الملخص التنفيذي</h2>
            <p className="text-gray-500 mb-6">Executive Summary</p>
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg font-semibold text-gray-900">
                iRecycle هو أول نظام تشغيل صناعي متكامل لقطاع إدارة المخلفات وإعادة التدوير في مصر والشرق الأوسط.
              </p>
              <p>
                تأسست المنصة على رؤية واضحة: تحويل قطاع إدارة المخلفات من العمليات الورقية التقليدية إلى منظومة رقمية ذكية 
                تربط جميع أطراف سلسلة القيمة — المولدين، الناقلين، المدورين، الوسطاء، مرافق التخلص — في منصة واحدة متكاملة.
              </p>
              <p>
                تجمع المنصة بين <strong>إدارة العمليات التشغيلية</strong> (الشحنات، الأسطول، المخازن، المالية) 
                و<strong>الاستدامة البيئية</strong> (البصمة الكربونية IPCC، الاقتصاد الدائري MCI، تقارير ESG، أرصدة الكربون) 
                و<strong>الذكاء الاصطناعي المتقدم</strong> (10+ نماذج AI لتصنيف المخلفات، تحسين المسارات، كشف الاحتيال، تحليل المستندات).
              </p>
              <p>
                تلتزم المنصة بأعلى معايير الامتثال الدولي والمحلي: ISO 14001 للإدارة البيئية، ISO 45001 للسلامة المهنية، 
                GRI Standards لتقارير الاستدامة، اتفاقية بازل للمخلفات الخطرة، GDPR لحماية البيانات، 
                بالإضافة للقوانين المصرية (202/2020 و 4/1994).
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {impactNumbers.slice(0, 6).map((n) => (
                  <div key={n.label} className="text-center p-4 rounded-xl border-2 border-primary/10 bg-primary/5">
                    <p className="text-3xl font-black text-primary">{n.value}</p>
                    <p className="text-sm font-bold text-gray-900">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Page>

        {/* ═══ PAGE 5: EXECUTIVE SUMMARY EN ═══ */}
        <Page>
          <div className="p-8" dir="ltr">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Executive Summary</h2>
            <p className="text-gray-500 mb-6">الملخص التنفيذي</p>
            <div className="w-16 h-1 bg-emerald-600 rounded-full mb-8" />
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg font-semibold text-gray-900">
                iRecycle is the first integrated Industrial Operating System for the waste management and recycling sector in Egypt and the Middle East.
              </p>
              <p>
                The platform was built on a clear vision: transforming the waste management sector from traditional paper-based operations 
                into a smart digital ecosystem connecting all value chain stakeholders — generators, transporters, recyclers, brokers, 
                and disposal facilities — on a single integrated platform.
              </p>
              <p>
                The platform combines <strong>operational management</strong> (shipments, fleet, inventory, finance) 
                with <strong>environmental sustainability</strong> (IPCC carbon footprint, MCI circular economy, ESG reports, carbon credits) 
                and <strong>advanced AI</strong> (10+ AI models for waste classification, route optimization, fraud detection, document analysis).
              </p>
              <p>
                We comply with the highest international and local standards: ISO 14001 (EMS), ISO 45001 (OHS), 
                GRI Standards, Basel Convention, GDPR, and Egyptian environmental laws (202/2020 & 4/1994).
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {impactNumbers.map((n) => (
                  <div key={n.labelEn} className="text-center p-4 rounded-xl border-2 border-emerald-600/10 bg-emerald-50">
                    <p className="text-3xl font-black text-emerald-600">{n.value}</p>
                    <p className="text-sm font-bold text-gray-900">{n.labelEn}</p>
                    <p className="text-xs text-gray-500">{n.descEn}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Page>

        {/* ═══ ENVIRONMENT SECTION DIVIDER ═══ */}
        <DividerPage
          title="البيئة والاستدامة والسلامة"
          titleEn="Environment, Sustainability & Safety"
          subtitle={`${envSections.length} منظومات • ${envSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة`}
          icon={Leaf}
          color="from-emerald-600 to-teal-600"
          count={envSections.reduce((s, sec) => s + sec.features.length, 0)}
        />

        {/* ═══ ENVIRONMENT SECTIONS (AR + EN for each) ═══ */}
        {envSections.map((section, i) => (
          <div key={i}>
            <SectionPage section={section} lang="ar" />
            <SectionPage section={section} lang="en" />
          </div>
        ))}

        {/* ═══ OPERATIONS SECTION DIVIDER ═══ */}
        <DividerPage
          title="العمليات والإدارة والتكنولوجيا"
          titleEn="Operations, Management & Technology"
          subtitle={`${opsSections.length} منظومات • ${opsSections.reduce((s, sec) => s + sec.features.length, 0)} وظيفة`}
          icon={Cog}
          color="from-blue-600 to-indigo-600"
          count={opsSections.reduce((s, sec) => s + sec.features.length, 0)}
        />

        {/* ═══ OPERATIONS SECTIONS (AR + EN for each) ═══ */}
        {opsSections.map((section, i) => (
          <div key={i}>
            <SectionPage section={section} lang="ar" />
            <SectionPage section={section} lang="en" />
          </div>
        ))}

        {/* ═══ DOCUMENT AI DIVIDER ═══ */}
        <DividerPage
          title="ذكاء المستندات"
          titleEn="Document AI Intelligence"
          subtitle="تحويل المستندات الورقية إلى بيانات ذكية"
          icon={Sparkles}
          color="from-purple-600 to-pink-600"
          count={documentAIFeatures.length}
        />

        {/* ═══ DOCUMENT AI AR ═══ */}
        <Page>
          <div className="p-8" dir="rtl">
            <div className="bg-gradient-to-l from-purple-600 to-pink-600 rounded-xl p-6 text-white mb-6">
              <h2 className="text-2xl font-black mb-2">🧠 منظومة ذكاء المستندات</h2>
              <p className="text-white/70">تحويل أي مستند ورقي إلى بيانات مهيكلة قابلة للبحث والتحليل بالذكاء الاصطناعي</p>
            </div>
            <div className="space-y-3">
              {documentAIFeatures.map((f, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 font-bold text-purple-700 text-sm">{i + 1}</div>
                  <div>
                    <p className="font-bold text-gray-900">{f.name}</p>
                    <p className="text-sm text-gray-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ═══ DOCUMENT AI EN ═══ */}
        <Page>
          <div className="p-8" dir="ltr">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white mb-6">
              <h2 className="text-2xl font-black mb-2">🧠 Document AI Intelligence</h2>
              <p className="text-white/70">Transform any paper document into structured, searchable, analyzable data using AI</p>
            </div>
            <div className="space-y-3">
              {documentAIFeatures.map((f, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 font-bold text-purple-700 text-sm">{i + 1}</div>
                  <div>
                    <p className="font-bold text-gray-900">{f.nameEn}</p>
                    <p className="text-sm text-gray-600">{f.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ═══ INDUSTRIES AR ═══ */}
        <Page>
          <div className="p-8" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 mb-2">القطاعات المستهدفة</h2>
            <p className="text-gray-500 mb-8">Industries We Serve</p>
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {industries.map((ind, i) => {
                const Icon = ind.icon;
                return (
                  <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl border-2 border-gray-100 hover:border-primary/20 transition-colors">
                    <div className="p-4 bg-primary/10 rounded-2xl mb-3">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{ind.name}</p>
                    <p className="text-xs text-gray-500">{ind.nameEn}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Page>

        {/* ═══ WHY US AR ═══ */}
        <Page>
          <div className="p-8" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 mb-2">لماذا iRecycle؟</h2>
            <p className="text-gray-500 mb-8">Why Choose iRecycle?</p>
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            <div className="space-y-4">
              {whyChooseUs.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4 p-5 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">{item.descEn}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Page>

        {/* ═══ WHY US EN ═══ */}
        <Page>
          <div className="p-8" dir="ltr">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Why Choose iRecycle?</h2>
            <p className="text-gray-500 mb-8">Our Competitive Advantage</p>
            <div className="w-16 h-1 bg-emerald-600 rounded-full mb-8" />
            <div className="space-y-4">
              {whyChooseUs.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4 p-5 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                    <div className="p-3 bg-emerald-600/10 rounded-xl shrink-0">
                      <Icon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">{item.titleEn}</p>
                      <p className="text-sm text-gray-600">{item.descEn}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Page>

        {/* ═══ SUMMARY STATS ═══ */}
        <Page>
          <div className="p-8 flex flex-col justify-center h-full" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">المنصة بالأرقام</h2>
            <p className="text-gray-500 mb-8 text-center">Platform at a Glance</p>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {platformStats.map((s) => (
                <div key={s.label} className="text-center p-5 rounded-xl border-2 border-primary/10 bg-primary/5">
                  <p className="text-4xl font-black text-primary">{s.value}</p>
                  <p className="text-sm font-bold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.labelEn}</p>
                  <p className="text-[10px] text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                <p className="text-4xl font-black text-emerald-600">{envSections.length}</p>
                <p className="text-sm font-bold">منظومة بيئية</p>
                <p className="text-xs text-gray-500">Environmental Systems</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-blue-50 border-2 border-blue-200">
                <p className="text-4xl font-black text-blue-600">{opsSections.length}</p>
                <p className="text-sm font-bold">منظومة تشغيلية</p>
                <p className="text-xs text-gray-500">Operational Systems</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-purple-50 border-2 border-purple-200">
                <p className="text-4xl font-black text-purple-600">{totalFeatures}</p>
                <p className="text-sm font-bold">إجمالي الوظائف</p>
                <p className="text-xs text-gray-500">Total Functions</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                <p className="text-4xl font-black text-amber-600">{sections.length}</p>
                <p className="text-sm font-bold">قسم رئيسي</p>
                <p className="text-xs text-gray-500">Main Sections</p>
              </div>
            </div>
          </div>
        </Page>

        {/* ═══ BACK COVER AR ═══ */}
        <Page>
          <div className="h-full flex flex-col bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <PlatformLogo size="xl" showText inverted showSubtitle />
              <div className="w-24 h-1 bg-white/30 rounded-full my-8" />
              <p className="text-2xl font-bold mb-4">
                نظام التشغيل الصناعي الأول من نوعه<br />لقطاع إدارة المخلفات وإعادة التدوير
              </p>
              <p className="text-white/70 mb-8 max-w-md">
                The First Industrial Operating System for Waste Management & Recycling in Egypt and the Middle East
              </p>
              <div className="flex items-center gap-8 text-sm text-white/60">
                <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> منصة سحابية آمنة</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> تحديثات مستمرة</span>
                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> تشفير شامل</span>
              </div>
              <div className="mt-8 px-8 py-3 bg-white text-primary rounded-full font-bold text-lg">
                www.irecycle-egy.lovable.app
              </div>
            </div>
            <div className="p-4 bg-white/10 text-center text-xs text-white/50">
              © {new Date().getFullYear()} iRecycle — جميع الحقوق محفوظة | All Rights Reserved
            </div>
          </div>
        </Page>

      </div>

      {/* Print Styles */}
      <style>{`
        .brochure-page {
          width: 210mm;
          min-height: 297mm;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          .no-print { display: none !important; }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .brochure-container {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
          
          .brochure-page {
            width: 100% !important;
            min-height: auto;
            height: auto;
            box-shadow: none !important;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          
          .brochure-page .h-full {
            min-height: 100vh;
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
        
        @media screen {
          .brochure-page {
            border-radius: 4px;
          }
        }
      `}</style>
    </div>
  );
}
