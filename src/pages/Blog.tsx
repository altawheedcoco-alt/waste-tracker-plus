import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import { BookOpen, Calendar, ArrowLeft, ArrowRight } from "lucide-react";

const Footer = lazy(() => import("@/components/Footer"));

// Static blog content (will be replaced with dynamic content from DB later)
const articles = [
  {
    id: '1',
    titleAr: 'دليل تصنيف النفايات البلدية في مصر',
    titleEn: 'Guide to Municipal Waste Classification in Egypt',
    excerptAr: 'تعرف على التصنيفات الرسمية للنفايات البلدية طبقًا لقانون إدارة المخلفات رقم 202 لسنة 2020 وكيفية التعامل مع كل نوع.',
    excerptEn: 'Learn about official municipal waste classifications under Waste Management Law 202/2020 and how to handle each type.',
    category: 'municipal',
    categoryAr: 'نفايات بلدية',
    categoryEn: 'Municipal Waste',
    date: '2025-02-20',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: '2',
    titleAr: 'المخلفات الطبية: مخاطرها وطرق التخلص الآمن',
    titleEn: 'Medical Waste: Risks and Safe Disposal Methods',
    excerptAr: 'المخلفات الطبية من أخطر أنواع النفايات. نستعرض في هذا المقال الإرشادات المصرية والدولية للتعامل الآمن معها.',
    excerptEn: 'Medical waste is among the most hazardous. This article covers Egyptian and international guidelines for safe handling.',
    category: 'medical',
    categoryAr: 'نفايات طبية',
    categoryEn: 'Medical Waste',
    date: '2025-02-15',
    color: 'bg-red-500/10 text-red-600',
  },
  {
    id: '3',
    titleAr: 'النفايات الإلكترونية: ثروة مهدرة في مصر',
    titleEn: 'E-Waste: A Wasted Treasure in Egypt',
    excerptAr: 'مصر تنتج أكثر من 50 ألف طن نفايات إلكترونية سنويًا. كيف يمكن تحويلها من عبء بيئي إلى فرصة اقتصادية؟',
    excerptEn: 'Egypt produces over 50,000 tons of e-waste annually. How can we turn this environmental burden into an economic opportunity?',
    category: 'electronic',
    categoryAr: 'نفايات إلكترونية',
    categoryEn: 'E-Waste',
    date: '2025-02-10',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    id: '4',
    titleAr: 'اقتصاد التدوير الدائري: مستقبل الصناعة المصرية',
    titleEn: 'Circular Economy: The Future of Egyptian Industry',
    excerptAr: 'كيف يمكن لمبادئ الاقتصاد الدائري أن تحول قطاع إدارة النفايات في مصر وتخلق آلاف فرص العمل الجديدة.',
    excerptEn: 'How circular economy principles can transform Egypt\'s waste management sector and create thousands of new jobs.',
    category: 'industry',
    categoryAr: 'صناعة التدوير',
    categoryEn: 'Recycling Industry',
    date: '2025-02-05',
    color: 'bg-blue-500/10 text-blue-600',
  },
];

const Blog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">{isAr ? 'مدونة iRecycle' : 'iRecycle Blog'}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{isAr ? 'مقالات ونصائح حول إدارة النفايات وإعادة التدوير في مصر' : 'Articles and tips on waste management and recycling in Egypt'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <article key={article.id} className="group border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-card">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${article.color}`}>
                    {isAr ? article.categoryAr : article.categoryEn}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                  {isAr ? article.titleAr : article.titleEn}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {isAr ? article.excerptAr : article.excerptEn}
                </p>
                <button className="text-sm font-medium text-primary flex items-center gap-1 hover:gap-2 transition-all">
                  {isAr ? 'اقرأ المزيد' : 'Read More'}
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Blog;
