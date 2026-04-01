/**
 * قسم الأسئلة الشائعة التفاعلي مع بحث
 */
import { memo, useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Search, HelpCircle, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface FAQ {
  qAr: string; qEn: string; aAr: string; aEn: string;
}

const faqs: FAQ[] = [
  { qAr: 'هل التسجيل في المنصة مجاني؟', qEn: 'Is registration free?', aAr: 'نعم، التسجيل مجاني بالكامل. يمكنك إنشاء حساب لجهتك والبدء في استخدام الميزات الأساسية فوراً دون أي رسوم.', aEn: 'Yes, registration is completely free. You can create your organization account and start using core features immediately.' },
  { qAr: 'ما أنواع الجهات التي يمكنها التسجيل؟', qEn: 'What types of organizations can register?', aAr: 'المنصة تدعم: المولّد (المصنع/المنشأة)، الناقل، المدوّر، جهة التخلص الآمن، المستشار البيئي، مكتب الاستشارات، والجهة الرقابية.', aEn: 'The platform supports: Generator (factory/facility), Transporter, Recycler, Safe Disposal, Environmental Consultant, Consulting Office, and Regulator.' },
  { qAr: 'كيف أتتبع شحناتي؟', qEn: 'How do I track my shipments?', aAr: 'يمكنك تتبع كل شحنة لحظياً على الخريطة عبر GPS. ستصلك إشعارات فورية عند كل تغيير في حالة الشحنة.', aEn: 'You can track every shipment in real-time on the map via GPS. You\'ll receive instant notifications on every status change.' },
  { qAr: 'هل المنصة متوافقة مع اللوائح المصرية؟', qEn: 'Is the platform compliant with Egyptian regulations?', aAr: 'نعم، المنصة مصممة وفقاً لقانون تنظيم إدارة المخلفات المصري واللوائح البيئية. تتضمن إصدار الشهادات والتقارير المطلوبة.', aEn: 'Yes, the platform is designed in compliance with Egyptian waste management law and environmental regulations.' },
  { qAr: 'هل يمكنني استخدام المنصة على الموبايل؟', qEn: 'Can I use the platform on mobile?', aAr: 'نعم، المنصة تعمل كتطبيق (PWA) يمكنك تثبيته على هاتفك. يعمل حتى بدون اتصال بالإنترنت مع إشعارات فورية.', aEn: 'Yes, the platform works as a PWA app you can install. It works offline with push notifications.' },
  { qAr: 'كيف يتم ضمان أمان البيانات؟', qEn: 'How is data security ensured?', aAr: 'نستخدم تشفير متقدم، صلاحيات وصول دقيقة (RLS)، مركز أمن سيبراني، ومراقبة لحظية للتهديدات لحماية بياناتك.', aEn: 'We use advanced encryption, granular RLS policies, a cyber security center, and real-time threat monitoring.' },
  { qAr: 'هل يوجد دعم فني؟', qEn: 'Is there technical support?', aAr: 'نعم، يمكنك التواصل عبر الدردشة داخل المنصة، واتساب، أو نموذج الاتصال. فريقنا متاح للمساعدة.', aEn: 'Yes, you can reach us via in-platform chat, WhatsApp, or the contact form. Our team is always available.' },
  { qAr: 'ما تكلفة الاشتراك؟', qEn: 'What are the subscription costs?', aAr: 'نقدم خطط متعددة تناسب حجم عملياتك. الخطة المجانية تشمل الميزات الأساسية، والخطط المدفوعة تتضمن ميزات متقدمة مثل الذكاء الاصطناعي والتقارير المتقدمة.', aEn: 'We offer multiple plans to fit your operations. The free plan includes core features, paid plans include AI and advanced reports.' },
];

const FAQSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return faqs;
    const q = search.toLowerCase();
    return faqs.filter(f =>
      f.qAr.toLowerCase().includes(q) || f.qEn.toLowerCase().includes(q) ||
      f.aAr.toLowerCase().includes(q) || f.aEn.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-background">
      <div className="container px-4">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
            <HelpCircle className="w-4 h-4" />
            {isAr ? 'أسئلة شائعة' : 'FAQ'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-6">
            {isAr ? 'الأسئلة الأكثر شيوعاً' : 'Frequently Asked Questions'}
          </h2>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'ابحث في الأسئلة...' : 'Search questions...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 text-sm"
            />
          </div>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-2">
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                className="rounded-xl border bg-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-foreground flex-1">
                    {isAr ? faq.qAr : faq.qEn}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t pt-3">
                        {isAr ? faq.aAr : faq.aEn}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {isAr ? 'لم يتم العثور على نتائج' : 'No results found'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
});

FAQSection.displayName = 'FAQSection';
export default FAQSection;
