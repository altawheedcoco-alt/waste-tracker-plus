import { memo } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="fixed top-16 sm:top-20 left-0 right-0 w-full overflow-hidden z-40 h-[42px]" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900" />
      
      <div className="relative flex items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 shrink-0 z-10 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
          <Newspaper className="w-4 h-4 text-amber-950" />
          <span className="text-xs font-black whitespace-nowrap text-amber-950 tracking-wide">آخر الأخبار</span>
        </div>

        <div className="w-0 h-0 border-t-[18px] border-b-[18px] border-r-[12px] border-t-transparent border-b-transparent border-r-amber-500 shrink-0 z-10" />

        <div className="overflow-hidden flex-1 py-2.5">
          <div className="whitespace-nowrap flex items-center gap-1 text-sm font-medium text-white/95 animate-ticker">
            {repeatedItems.map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span className="mx-3 text-amber-400 text-xs">✦</span>
                <span className="drop-shadow-sm">{item}</span>
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/news"
          className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 z-10 border-r border-white/10 group"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:text-amber-400 transition-colors" />
          <span className="text-xs font-semibold hidden sm:inline text-white/80 group-hover:text-white transition-colors">كل الأخبار</span>
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-l from-amber-400 via-emerald-400 to-amber-400 opacity-60" />
    </div>
  );
});

NewsTicker.displayName = 'NewsTicker';

export default NewsTicker;
