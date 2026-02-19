import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'م. أحمد سعيد',
    role: 'مدير شركة تدوير',
    text: 'المنصة غيّرت طريقة شغلنا بالكامل — تتبع الشحنات وإصدار الشهادات صار في دقائق بدل أيام.',
    rating: 5,
    avatar: 'أ',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'د. منى عبدالله',
    role: 'مستشارة بيئية',
    text: 'دليل الاستشاريين ساعدني أوصل لعملاء جدد، والنظام سهل ومنظم جداً.',
    rating: 5,
    avatar: 'م',
    color: 'from-amber-500 to-orange-500',
  },
  {
    name: 'أ. خالد محمود',
    role: 'مسؤول نفايات طبية',
    text: 'التحقق الرقمي من الشهادات وفّر علينا وقت كبير وزاد ثقة عملائنا فينا.',
    rating: 5,
    avatar: 'خ',
    color: 'from-blue-500 to-cyan-500',
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-muted/30 via-background to-muted/20 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
            <Star className="h-4 w-4 fill-current" />
            ماذا يقول عملاؤنا؟
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            ثقة عملائنا فخرنا ⭐
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            آراء حقيقية من شركات ومؤسسات تستخدم المنصة يومياً
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-6 min-h-[60px]">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
