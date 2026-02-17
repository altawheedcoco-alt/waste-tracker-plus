import { memo } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Sparkles } from 'lucide-react';

const newsItems = [
  'التوحيد للخدمات البيئية وتدوير المخلفات — الطريق الجديد إلى النجاح والازدهار والتقدم',
  'أحد الشركات العاملة في السوق المصرى والمتخصصة في عمليات نقل وتدوير المخلفات وملحقاتها',
  'نقل وفرز وتداول وإعادة تدوير الزجاج والأخشاب والورق والمعادن والبلاستيك والمنسوجات',
  'مزاولة الأنشطة تحت غطاء قانوني كامل من الهيئة العامة للتنمية الصناعية ووزارة البيئة المصرية',
  'رفع القيمة الاقتصادية لصناعة التدوير داخل جمهورية مصر العربية',
  'تطوير مستمر مبنى على تخطيط متكامل لخلق منتجات صديقة للبيئة بتكاليف أقل',
  'تحويل النفايات بعيداً عن المحارق والمدافن والمكبات — النظام الدائري',
  'خلق فرص صناعية تعتمد على ناتج تدوير المخلفات كمستلزمات إنتاج للصناعات المختلفة',
  'رؤية واسعة لجميع الجوانب البيئية تضمن تحقيق فوائد بيئية شاملة',
  'لا تعد المواد نفايات ما لم يتم التخلص منها — معالجة المخلفات بتحويلها إلى منتجات جديدة',
  'الحد من استهلاك المواد الخام الجديدة والطاقة اللازمة لمعالجة النفايات',
  'خدمات الجمع والنقل بسيارات مجهزة ومرخصة ومطابقة للتشريعات البيئية',
  'سيارات مدرجة ضمن ترخيص مزاولة النشاط من جهاز تنظيم إدارة المخلفات',
  'نقاط تخزين مؤقتة وآمنة للمخلفات المتولدة من الجهات المختلفة',
  'فرز وتصنيف وكبس المخلفات بعمالة مدربة ومؤهلة للتعامل مع الأنواع المختلفة',
  'الرقمنة — نعمل على الفوز بعشرين سنة مستقبلية من خلال التحول الرقمي',
  'تطوير نماذج أعمال جديدة وخلق تجارب فريدة للعملاء والموردين',
  'الاستخدام الذكي للبيانات والتكنولوجيا في إدارة المخلفات',
  'الوصول إلى صفر مخلفات — دعم مباشر لتقليل كميات المخلفات الموجهة إلى المدافن',
  'نظام I RECYCLE SYSTEM — حل برمجي متكامل لإدارة النفايات من التوليد إلى التخلص',
  'تتبع دقيق لمختلف أنواع المخلفات وحصر الكميات المتولدة من مواقع التولد المختلفة',
  'إصدار شهادات تفيد بأنه تم التخلص من المخلفات بالطرق السليمة والمتوافقة مع التشريعات',
  'التخلص الآمن والنهائي من المخلفات الخطرة في الأماكن المعتمدة من وزارة البيئة',
  'شراء الأنواع المختلفة من المخلفات غير الخطرة وتوريدها لمصانع إعادة التدوير',
  'تعظيم الفائدة الاقتصادية للمخلفات وتطوير صناعة التدوير في مصر',
  'إنتاج أعلاف غير تقليدية من هوالك الصناعات الغذائية المختلفة',
  'تحويل مسار عشرات الأنواع من هوالك الصناعات الغذائية إلى أعلاف بديلة',
  'جمع بيانات النفايات وإنشاء ملفات تعريف نفايات موحدة',
  'إنشاء تقارير تنظيمية وتحليل اتجاهات حجم النفايات والتكاليف على مستوى الشركة',
  'توجيه وتحليل أحجام النفايات والتكاليف من خلال الرسوم البيانية المتقدمة',
  'تتبع النفايات الخطرة وغير الخطرة من نقطة التوليد إلى التخلص — الامتثال التنظيمي',
  'التوحيد للخدمات البيئية — أكثر عالمية أكثر دقة أكثر أماناً في تتبع المخلفات',
  'تتبع النفايات بشكل مبسط لضمان الامتثال للمتطلبات الحكومية والبيئية والدولية',
  'صناعة الأخشاب المضغوطة والحبيبية — إعادة تدوير مخلفات الأخشاب لمنتجات صديقة للبيئة',
  'التوحيد شركة مصنعة للبالتات الخشبية والأثاث الخشبي المتنوع والمنتجات الخشبية',
  'تراخيص من الهيئة العامة للتنمية الصناعية والموافقات البيئية وعضوية اتحاد الصناعات المصرية',
  'إعادة تدوير الأخشاب — تحويل الأخشاب المستخدمة والمهملة إلى مواد قابلة للاستخدام الجديد',
  'الحفاظ على البيئة واستدامة الموارد الطبيعية من خلال إعادة التدوير',
  'تصنيع الأثاث والألواح الخشبية والبالتات والديكور الداخلي من الأخشاب المعاد تدويرها',
  'توفير الطاقة والموارد الطبيعية وتقليل الحاجة لاستخدام الخشب الأولي',
  'التعامل مع مخلفات الأخشاب والبلاستيك والكرتون والورق والمخلفات الغذائية بأنواعها',
];

const NewsTicker = memo(() => {
  const repeatedItems = [...newsItems, ...newsItems];

  return (
    <div className="fixed top-16 sm:top-20 left-0 right-0 w-full overflow-hidden z-40" dir="rtl">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative flex items-center">
        {/* Label with accent */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 shrink-0 z-10 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
          <Newspaper className="w-4 h-4 text-amber-950" />
          <span className="text-xs font-black whitespace-nowrap text-amber-950 tracking-wide">آخر الأخبار</span>
        </div>

        {/* Decorative arrow */}
        <div className="w-0 h-0 border-t-[18px] border-b-[18px] border-r-[12px] border-t-transparent border-b-transparent border-r-amber-500 shrink-0 z-10" />

        {/* Scrolling content - direction RIGHT, faster speed */}
        <div className="overflow-hidden flex-1 py-2.5">
          <motion.div
            className="whitespace-nowrap flex items-center gap-1 text-sm font-medium text-white/95"
            animate={{ x: ['-50%', '0%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 120,
                ease: 'linear',
              },
            }}
          >
            {repeatedItems.map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span className="mx-3 text-amber-400 text-xs">✦</span>
                <span className="drop-shadow-sm">{item}</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* Link button */}
        <a
          href="https://irecycle-eg.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 z-10 border-r border-white/10 group"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:text-amber-400 transition-colors" />
          <span className="text-xs font-semibold hidden sm:inline text-white/80 group-hover:text-white transition-colors">زيارة الموقع</span>
        </a>
      </div>

      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-l from-amber-400 via-emerald-400 to-amber-400 opacity-60" />
    </div>
  );
});

NewsTicker.displayName = 'NewsTicker';

export default NewsTicker;
