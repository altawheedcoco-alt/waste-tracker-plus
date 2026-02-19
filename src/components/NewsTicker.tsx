import { memo } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Sparkles } from 'lucide-react';

const newsItems = [
  '🔥 جديد — منصة عُمالنا للتوظيف المتكامل: اعرض وظائف واستقطب كفاءات من مكان واحد!',
  '🆕 دليل الاستشاريين البيئيين وجهات منح الأيزو — اعثر على الخبير المناسب الآن!',
  '📢 نظام الإعلانات المدفوعة — وصّل خدماتك لآلاف العاملين في قطاع المخلفات!',
  '✅ التحقق الرقمي من المستندات — تحقق من شهادات التخلص الآمن بلحظة!',
  '👷 سجّل كباحث عن عمل وقدّم على الوظائف المتاحة مباشرة — تسجيل مجاني وبسيط!',
  '🏢 سجّل شركتك كمستشار بيئي أو مكتب استشارات واحصل على ظهور مميز في الدليل!',
  'التوحيد للخدمات البيئية وتدوير المخلفات — الطريق الجديد إلى النجاح والازدهار والتقدم',
  'نظام iRecycle — حل برمجي متكامل لإدارة وتتبع النفايات من التوليد إلى التخلص',
  'رقمنة كاملة لعمليات النقل والفرز والتدوير — أكثر دقة وأماناً',
  'إصدار نماذج تتبع المخلفات وشهادات التخلص الآمن المتوافقة مع التشريعات البيئية',
  'تتبع النفايات بشكل مبسط لضمان الامتثال للمتطلبات الحكومية والبيئية والدولية',
];

const NewsTicker = memo(() => {
  const repeatedItems = [...newsItems, ...newsItems];

  return (
    <div className="fixed top-16 sm:top-20 left-0 right-0 w-full overflow-hidden z-40" dir="rtl">
      {/* Gradient background with glass effect */}
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

        {/* Scrolling content - direction reversed to RIGHT */}
        <div className="overflow-hidden flex-1 py-2.5">
          <motion.div
            className="whitespace-nowrap flex items-center gap-1 text-sm font-medium text-white/95"
            animate={{ x: ['0%', '50%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
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
