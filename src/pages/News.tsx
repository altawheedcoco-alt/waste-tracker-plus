import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Newspaper, ArrowLeft, Sparkles, Users, ShieldCheck, Megaphone, Award, 
  Recycle, Truck, BarChart3, FileCheck, Globe, BookOpen, Bell, Calendar
} from 'lucide-react';

const newsItems = [
  {
    id: 1,
    icon: Users,
    title: 'منصة عُمالنا للتوظيف المتكامل',
    description: 'نظام توظيف متكامل — عرض وطلب في مكان واحد. سجّل كباحث عن عمل أو انشر وظيفة لاستقطاب الكفاءات في قطاع المخلفات والتدوير.',
    color: 'from-blue-500 to-cyan-500',
    date: '2025-06-01',
    badge: 'جديد 🔥',
    link: '/dashboard/omaluna',
    category: 'توظيف',
  },
  {
    id: 2,
    icon: Award,
    title: 'دليل الاستشاريين البيئيين وجهات منح الأيزو',
    description: 'دليل معتمد للمستشارين البيئيين ومكاتب الاستشارات وجهات منح شهادات الأيزو — كل الخبراء في مكان واحد. اعثر على الخبير المناسب الآن!',
    color: 'from-amber-500 to-orange-500',
    date: '2025-05-20',
    badge: 'جديد',
    link: '/auth?mode=register&type=consultant',
    category: 'استشارات',
  },
  {
    id: 3,
    icon: Megaphone,
    title: 'نظام الإعلانات المدفوعة',
    description: 'وصّل خدماتك ومنتجاتك لآلاف العاملين في قطاع المخلفات والتدوير عبر إعلانات مستهدفة وفعالة.',
    color: 'from-purple-500 to-violet-500',
    date: '2025-05-15',
    badge: 'جديد',
    link: '/dashboard/ads',
    category: 'تسويق',
  },
  {
    id: 4,
    icon: ShieldCheck,
    title: 'التحقق الرقمي من المستندات',
    description: 'تحقق فوري من صحة شهادات التخلص الآمن ونماذج تتبع المخلفات عبر رمز التتبع أو QR — ضمان المصداقية والشفافية.',
    color: 'from-emerald-500 to-green-500',
    date: '2025-05-10',
    badge: 'محدّث',
    link: '/verify',
    category: 'تحقق',
  },
  {
    id: 5,
    icon: Recycle,
    title: 'نظام إدارة وتتبع النفايات',
    description: 'حل برمجي متكامل لإدارة وتتبع النفايات من التوليد إلى التخلص الآمن — رقمنة كاملة لعمليات النقل والفرز والتدوير.',
    color: 'from-green-500 to-teal-500',
    date: '2025-04-25',
    badge: 'أساسي',
    link: '/auth',
    category: 'إدارة نفايات',
  },
  {
    id: 6,
    icon: Truck,
    title: 'تتبع السائقين والمركبات GPS',
    description: 'تتبع فوري لحركة السائقين والمركبات مع إشعارات ذكية عند الوصول والمغادرة — مراقبة كاملة لأسطول النقل.',
    color: 'from-indigo-500 to-blue-500',
    date: '2025-04-20',
    badge: 'محدّث',
    link: '/dashboard/driver-tracking',
    category: 'نقل',
  },
  {
    id: 7,
    icon: BarChart3,
    title: 'تقارير وتحليلات متقدمة',
    description: 'تقارير شاملة وتحليلات بصرية للبيانات — اتخذ قرارات أذكى بناءً على بيانات دقيقة ومحدثة.',
    color: 'from-rose-500 to-pink-500',
    date: '2025-04-15',
    badge: 'محدّث',
    link: '/dashboard/reports',
    category: 'تقارير',
  },
  {
    id: 8,
    icon: FileCheck,
    title: 'إصدار الشهادات ونماذج التتبع',
    description: 'إصدار تلقائي لنماذج تتبع المخلفات وشهادات التخلص الآمن المتوافقة مع التشريعات البيئية المصرية والدولية.',
    color: 'from-teal-500 to-cyan-500',
    date: '2025-04-10',
    badge: 'أساسي',
    link: '/auth',
    category: 'شهادات',
  },
  {
    id: 9,
    icon: Globe,
    title: 'الامتثال للمتطلبات البيئية',
    description: 'ضمان الامتثال الكامل للمتطلبات الحكومية والبيئية والدولية مع أدوات رقمية متطورة.',
    color: 'from-sky-500 to-blue-500',
    date: '2025-04-05',
    badge: 'هام',
    link: '/auth',
    category: 'امتثال',
  },
  {
    id: 10,
    icon: BookOpen,
    title: 'أكاديمية التدريب والتأهيل',
    description: 'دورات تدريبية معتمدة في مجال إدارة المخلفات والسلامة البيئية — طوّر مهاراتك واحصل على شهادات معتمدة.',
    color: 'from-orange-500 to-red-500',
    date: '2025-03-28',
    badge: 'قريباً',
    link: '/dashboard/academy',
    category: 'تدريب',
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

const News = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="pt-32 sm:pt-36 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
              <Sparkles className="h-4 w-4" />
              آخر الأخبار والتحديثات
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              <Newspaper className="inline-block w-8 h-8 ml-2 text-primary" />
              أخبار المنصة
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              تابع أحدث المميزات والخدمات والتحديثات التي نضيفها باستمرار لتطوير تجربتك
            </p>
          </div>

          {/* News Grid */}
          <div className="space-y-5">
            {newsItems.map((item, i) => (
              <div
                key={item.id}
                className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(item.link)}
              >
                <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
                
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${item.color} text-white shadow-sm`}>
                        {item.badge}
                      </span>
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0 self-center group-hover:gap-2 transition-all">
                    التفاصيل
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Back button */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              العودة للرئيسية
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});

News.displayName = 'News';

export default News;
