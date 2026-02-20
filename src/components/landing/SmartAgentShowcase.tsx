import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, ShoppingCart, Zap, Globe, Phone, ArrowLeft, CheckCircle2, Sparkles, Brain, TrendingUp, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const channels = [
  { icon: '🌐', label: 'موقعك الإلكتروني', desc: 'ويدجت شات ذكي' },
  { icon: '📱', label: 'واتساب بزنس', desc: 'رد تلقائي 24/7' },
  { icon: '📘', label: 'فيسبوك وماسنجر', desc: 'تعليقات ورسائل' },
  { icon: '✈️', label: 'تليجرام', desc: 'بوت مخصص' },
];

const features = [
  { icon: Brain, title: 'يتعلم من بياناتك', desc: 'أسعارك، خدماتك، سياساتك - كل حاجة بتعلمهاله بيستخدمها في الرد' },
  { icon: ShoppingCart, title: 'يأخذ الأوردرات', desc: 'يجمع بيانات العميل ويسجل الطلب تلقائياً ويبلغك فوراً' },
  { icon: MessageSquare, title: 'ردود مخصصة', desc: 'مش ردود محفوظة - كل رد مبني على سياق المحادثة وبيانات شركتك' },
  { icon: Clock, title: '24/7 بدون توقف', desc: 'يشتغل حتى وأنت نايم - خارج ساعات العمل يرد رسالة مخصصة' },
  { icon: TrendingUp, title: 'تحليلات وتقارير', desc: 'تابع عدد المحادثات والأوردرات ورضا العملاء من مكان واحد' },
  { icon: Zap, title: 'تصعيد ذكي', desc: 'لو العميل زعلان أو طلب مدير - يحوله لموظف بشري فوراً' },
];

const steps = [
  { num: '1', title: 'فعّل الوكيل', desc: 'من لوحة التحكم بضغطة واحدة' },
  { num: '2', title: 'درّبه', desc: 'أضف أسعارك وخدماتك وأسئلة العملاء المتكررة' },
  { num: '3', title: 'وصّل القنوات', desc: 'اربطه بواتساب أو فيسبوك أو موقعك' },
  { num: '4', title: 'استلم الأوردرات', desc: 'الوكيل يشتغل وأنت تستلم الطلبات!' },
];

const SmartAgentShowcase = memo(() => {
  const navigate = useNavigate();

  return (
    <section dir="rtl" className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">جديد - الوكيل الذكي</span>
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-4">
            سيبك من الشات بوت التقليدي 🤖
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-xl text-muted-foreground mb-2">
            وكيل ذكي <span className="text-primary font-bold">بيتعلم</span> وبيدور ورا كل سؤال
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground">
            كل سؤال ليه إجابة، وكل كومنت هيجيله رد مخصوص - محدش أبداً هيحس إنه بيتكلم مع جهاز!
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Channels */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16"
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center mb-8">
            🔗 أي منصة عندك… أنا جاهز!
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {channels.map((ch, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/50 transition-all"
              >
                <span className="text-4xl block mb-2">{ch.icon}</span>
                <p className="font-semibold text-sm">{ch.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{ch.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16"
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center mb-8">
            ⚡ ابدأ في 4 خطوات
          </motion.h3>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <h4 className="font-bold mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-0 w-full">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground/30 mx-auto" style={{ marginRight: '-50%' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">🔥 عايز تجرب بنفسك؟</h3>
            <p className="text-muted-foreground mb-6">
              فعّل الوكيل الذكي من لوحة التحكم وشوف الفرق
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                <Bot className="w-5 h-5" />
                ابدأ الآن مجاناً
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard/smart-agent')} className="gap-2">
                <Zap className="w-5 h-5" />
                لوحة تحكم الوكيل
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />بدون كود</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />تفعيل فوري</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />صيانة مستمرة</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

SmartAgentShowcase.displayName = 'SmartAgentShowcase';
export default SmartAgentShowcase;
