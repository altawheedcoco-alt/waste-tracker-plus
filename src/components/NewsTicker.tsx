import { memo } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink } from 'lucide-react';

const newsItems = [
  'التوحيد للخدمات البيئية وتدوير المخلفات — الطريق الجديد إلى النجاح والازدهار والتقدم',
  'خدمات الجمع والنقل بسيارات مجهزة ومرخصة ومطابقة للتشريعات البيئية',
  'التخزين المؤقت الآمن للمخلفات المتولدة من الجهات المختلفة',
  'فرز وتصنيف وكبس المخلفات بعمالة مدربة ومؤهلة',
  'نظام I RECYCLE SYSTEM — حل برمجي متكامل لإدارة وتتبع النفايات من التوليد إلى التخلص',
  'التخلص الآمن والنهائي من المخلفات الخطرة في الأماكن المعتمدة من وزارة البيئة',
  'شراء الأنواع المختلفة من المخلفات غير الخطرة وتوريدها لمصانع إعادة التدوير',
  'إنتاج أعلاف غير تقليدية من هوالك الصناعات الغذائية المختلفة',
  'الرقمنة — نعمل على الفوز بعشرين سنة مستقبلية من خلال التحول الرقمي',
  'صناعة الأخشاب المضغوطة والحبيبية — إعادة تدوير مخلفات الأخشاب لمنتجات صديقة للبيئة',
  'تتبع النفايات بشكل مبسط لضمان الامتثال للمتطلبات الحكومية والبيئية والدولية',
];

const NewsTicker = memo(() => {
  const repeatedItems = [...newsItems, ...newsItems];
  const totalText = repeatedItems.join('   ◆   ');

  return (
    <div className="w-full bg-primary/95 text-primary-foreground overflow-hidden relative" dir="rtl">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-primary shrink-0 z-10 border-l border-primary-foreground/20">
          <Newspaper className="w-4 h-4" />
          <span className="text-xs font-bold whitespace-nowrap">آخر الأخبار</span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1 py-2">
          <motion.div
            className="whitespace-nowrap flex items-center gap-1 text-sm"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 60,
                ease: 'linear',
              },
            }}
          >
            {repeatedItems.map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span className="mx-3 text-primary-foreground/60">◆</span>
                <span>{item}</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* Link */}
        <a
          href="https://irecycle-eg.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-2 shrink-0 hover:bg-primary-foreground/10 transition-colors z-10 border-r border-primary-foreground/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-xs font-medium hidden sm:inline">زيارة الموقع</span>
        </a>
      </div>
    </div>
  );
});

NewsTicker.displayName = 'NewsTicker';

export default NewsTicker;
