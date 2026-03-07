import { Users, ShieldCheck, Megaphone, Award, ArrowLeft, Sparkles, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Rocket,
    title: 'الإصدار 2.0',
    desc: 'هوية بصرية جديدة بالكامل مع تحسينات شاملة في الأداء والتجربة وأدوات ذكية متطورة.',
    color: 'from-primary to-[hsl(200,75%,45%)]',
    link: '/',
    badge: 'v2.0 🚀',
  },
  {
    icon: Users,
    title: 'منصة عُمالنا للتوظيف',
    desc: 'نظام توظيف متكامل — عرض وطلب في مكان واحد. سجّل كباحث عن عمل أو انشر وظيفة لاستقطاب الكفاءات.',
    color: 'from-blue-500 to-cyan-500',
    link: '/dashboard/omaluna',
    badge: 'جديد 🔥',
  },
  {
    icon: Award,
    title: 'دليل الاستشاريين والمكاتب',
    desc: 'دليل معتمد للمستشارين البيئيين ومكاتب الاستشارات وجهات منح شهادات الأيزو — كل الخبراء في مكان واحد.',
    color: 'from-[hsl(42,92%,55%)] to-orange-500',
    link: '/auth?mode=register&type=consultant',
    badge: 'جديد',
  },
  {
    icon: Megaphone,
    title: 'نظام الإعلانات المدفوعة',
    desc: 'وصّل خدماتك ومنتجاتك لآلاف العاملين في قطاع المخلفات والتدوير عبر إعلانات مستهدفة.',
    color: 'from-purple-500 to-violet-500',
    link: '/dashboard/ads',
    badge: 'جديد',
  },
  {
    icon: ShieldCheck,
    title: 'التحقق من المستندات',
    desc: 'تحقق فوري من صحة شهادات التخلص الآمن ونماذج تتبع المخلفات عبر رمز التتبع أو QR.',
    color: 'from-emerald-500 to-green-500',
    link: '/verify',
    badge: 'محدّث',
  },
];

const WhatsNewSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-[hsl(200,75%,45%)]/15 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
            <Sparkles className="h-4 w-4 animate-pulse" />
            ما الجديد في المنصة؟
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            مميزات جديدة تنتظرك 🚀
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            نطوّر باستمرار لنقدم لك أدوات أذكى وخدمات أشمل — اكتشف آخر الإضافات
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="relative group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => navigate(f.link)}
            >
              <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
              <span className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${f.color} text-white shadow-md`}>
                {f.badge}
              </span>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg mb-4`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  اكتشف المزيد
                  <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNewSection;
