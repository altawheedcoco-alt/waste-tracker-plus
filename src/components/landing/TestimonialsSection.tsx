import { Star, Quote, ArrowLeft, ArrowRight, MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TestimonialForm from './TestimonialForm';

// Static testimonials as fallback
const staticTestimonials = [
  {
    name: 'م. أحمد سعيد',
    role: 'مدير شركة تدوير — القاهرة',
    text: 'المنصة غيّرت طريقة شغلنا بالكامل — تتبع الشحنات وإصدار الشهادات صار في دقائق بدل أيام. وفّرنا أكثر من 40% من الوقت الإداري.',
    rating: 5,
    avatar: 'أ',
    color: 'from-emerald-500 to-teal-500',
    metric: 'وفّر 40% من الوقت',
  },
  {
    name: 'د. منى عبدالله',
    role: 'مستشارة بيئية — الإسكندرية',
    text: 'دليل الاستشاريين ساعدني أوصل لعملاء جدد، والنظام سهل ومنظم جداً. حصلت على 12 عميل جديد خلال 3 أشهر فقط.',
    rating: 5,
    avatar: 'م',
    color: 'from-amber-500 to-orange-500',
    metric: '12 عميل جديد',
  },
  {
    name: 'أ. خالد محمود',
    role: 'مسؤول نفايات طبية — أسيوط',
    text: 'التحقق الرقمي من الشهادات وفّر علينا وقت كبير وزاد ثقة عملائنا فينا. الامتثال التشريعي أصبح تلقائي بالكامل.',
    rating: 5,
    avatar: 'خ',
    color: 'from-blue-500 to-cyan-500',
    metric: 'امتثال 100%',
  },
  {
    name: 'م. سارة حسن',
    role: 'مديرة عمليات مصنع — المنوفية',
    text: 'كنا نعاني من تأخير التقارير البيئية — الآن كل شيء آلي ودقيق. أنصح كل مصنع يسجل في المنصة فوراً.',
    rating: 5,
    avatar: 'س',
    color: 'from-purple-500 to-violet-500',
    metric: 'تقارير آلية 100%',
  },
];

const gradientColors = [
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch approved testimonials from DB
  const { data: dbTestimonials } = useQuery({
    queryKey: ['approved-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Convert DB testimonials to display format
  const dynamicTestimonials = (dbTestimonials || []).map((t, i) => ({
    name: t.author_name,
    role: 'عميل منصة iRecycle',
    text: t.comment,
    rating: 5,
    avatar: t.author_name?.charAt(0) || '?',
    color: gradientColors[i % gradientColors.length],
    metric: 'تجربة حقيقية',
  }));

  // Combine: approved DB testimonials first, then static
  const testimonials = [...dynamicTestimonials, ...staticTestimonials];

  return (
    <section className="py-16 sm:py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12 sm:mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-bold mb-5 border border-primary/20">
            <Star className="h-4 w-4 fill-current" />
            ماذا يقول عملاؤنا؟
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
            قصص نجاح <span className="text-gradient-eco">حقيقية</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            شركات ومؤسسات مصرية حققت نتائج ملموسة باستخدام منصة iRecycle
          </p>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.slice(0, 8).map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="relative bg-card border border-border/50 rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group animate-fade-up flex flex-col"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              
              <div className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-3">
                ✓ {t.metric}
              </div>

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-sm text-foreground/80 leading-relaxed mb-6 flex-1">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden">
          <div className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
            <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10" />
            
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-3">
              ✓ {testimonials[activeIndex]?.metric}
            </div>

            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: testimonials[activeIndex]?.rating || 5 }).map((_, s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              "{testimonials[activeIndex]?.text}"
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonials[activeIndex]?.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {testimonials[activeIndex]?.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{testimonials[activeIndex]?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{testimonials[activeIndex]?.role}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setActiveIndex(i => (i - 1 + testimonials.length) % testimonials.length)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveIndex(i => (i + 1) % testimonials.length)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {testimonials.slice(0, 8).map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>
        </div>

        {/* Testimonial Form */}
        <div className="mt-16 max-w-lg mx-auto">
          <TestimonialForm />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
