import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, ShoppingCart, Zap, Globe, Phone, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Brain, TrendingUp, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const channelsData = {
  ar: [
    { icon: '🌐', label: 'موقعك الإلكتروني', desc: 'ويدجت شات ذكي' },
    { icon: '📱', label: 'واتساب بزنس', desc: 'رد تلقائي 24/7' },
    { icon: '📘', label: 'فيسبوك وماسنجر', desc: 'تعليقات ورسائل' },
    { icon: '✈️', label: 'تليجرام', desc: 'بوت مخصص' },
  ],
  en: [
    { icon: '🌐', label: 'Your Website', desc: 'Smart chat widget' },
    { icon: '📱', label: 'WhatsApp Business', desc: 'Auto-reply 24/7' },
    { icon: '📘', label: 'Facebook & Messenger', desc: 'Comments & messages' },
    { icon: '✈️', label: 'Telegram', desc: 'Custom bot' },
  ],
};

const featuresData = {
  ar: [
    { icon: Brain, title: 'يتعلم من بياناتك', desc: 'أسعارك، خدماتك، سياساتك - كل حاجة بتعلمهاله بيستخدمها في الرد' },
    { icon: ShoppingCart, title: 'يأخذ الأوردرات', desc: 'يجمع بيانات العميل ويسجل الطلب تلقائياً ويبلغك فوراً' },
    { icon: MessageSquare, title: 'ردود مخصصة', desc: 'مش ردود محفوظة - كل رد مبني على سياق المحادثة وبيانات شركتك' },
    { icon: Clock, title: '24/7 بدون توقف', desc: 'يشتغل حتى وأنت نايم - خارج ساعات العمل يرد رسالة مخصصة' },
    { icon: TrendingUp, title: 'تحليلات وتقارير', desc: 'تابع عدد المحادثات والأوردرات ورضا العملاء من مكان واحد' },
    { icon: Zap, title: 'تصعيد ذكي', desc: 'لو العميل زعلان أو طلب مدير - يحوله لموظف بشري فوراً' },
  ],
  en: [
    { icon: Brain, title: 'Learns from your data', desc: 'Your prices, services, policies — everything you teach it gets used in replies' },
    { icon: ShoppingCart, title: 'Takes orders', desc: 'Collects customer info, registers orders automatically, and notifies you instantly' },
    { icon: MessageSquare, title: 'Custom replies', desc: 'Not canned responses — every reply is built on conversation context and your data' },
    { icon: Clock, title: '24/7 non-stop', desc: 'Works while you sleep — sends custom messages outside working hours' },
    { icon: TrendingUp, title: 'Analytics & reports', desc: 'Track conversations, orders, and customer satisfaction from one place' },
    { icon: Zap, title: 'Smart escalation', desc: 'If customer is upset or asks for a manager — routes to a human agent instantly' },
  ],
};

const stepsData = {
  ar: [
    { num: '1', title: 'فعّل الوكيل', desc: 'من لوحة التحكم بضغطة واحدة' },
    { num: '2', title: 'درّبه', desc: 'أضف أسعارك وخدماتك وأسئلة العملاء المتكررة' },
    { num: '3', title: 'وصّل القنوات', desc: 'اربطه بواتساب أو فيسبوك أو موقعك' },
    { num: '4', title: 'استلم الأوردرات', desc: 'الوكيل يشتغل وأنت تستلم الطلبات!' },
  ],
  en: [
    { num: '1', title: 'Activate the agent', desc: 'One click from your dashboard' },
    { num: '2', title: 'Train it', desc: 'Add your prices, services, and FAQs' },
    { num: '3', title: 'Connect channels', desc: 'Link it to WhatsApp, Facebook, or your site' },
    { num: '4', title: 'Receive orders', desc: 'The agent works and you receive orders!' },
  ],
};

const SmartAgentShowcase = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const channels = channelsData[language];
  const features = featuresData[language];
  const steps = stepsData[language];

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-4xl mx-auto mb-16">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{isAr ? 'جديد - الوكيل الذكي' : 'New — Smart Agent'}</span>
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-4">
            {isAr ? 'سيبك من الشات بوت التقليدي 🤖' : 'Forget traditional chatbots 🤖'}
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-xl text-muted-foreground mb-2">
            {isAr ? (
              <>وكيل ذكي <span className="text-primary font-bold">بيتعلم</span> وبيدور ورا كل سؤال</>
            ) : (
              <>A smart agent that <span className="text-primary font-bold">learns</span> and researches every question</>
            )}
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground">
            {isAr
              ? 'كل سؤال ليه إجابة، وكل كومنت هيجيله رد مخصوص - محدش أبداً هيحس إنه بيتكلم مع جهاز!'
              : 'Every question gets an answer, every comment gets a custom reply — no one will ever feel they\'re talking to a machine!'}
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center mb-8">
            {isAr ? '🔗 أي منصة عندك… أنا جاهز!' : '🔗 Any platform you have… I\'m ready!'}
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {channels.map((ch, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/50 transition-all">
                <span className="text-4xl block mb-2">{ch.icon}</span>
                <p className="font-semibold text-sm">{ch.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{ch.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.h3 variants={fadeUp} custom={0} className="text-2xl font-bold text-center mb-8">
            {isAr ? '⚡ ابدأ في 4 خطوات' : '⚡ Start in 4 steps'}
          </motion.h3>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="relative text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <h4 className="font-bold mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-0 w-full">
                    {isAr
                      ? <ArrowLeft className="w-5 h-5 text-muted-foreground/30 mx-auto" style={{ marginRight: '-50%' }} />
                      : <ArrowRight className="w-5 h-5 text-muted-foreground/30 mx-auto" style={{ marginLeft: '-50%' }} />
                    }
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">{isAr ? '🔥 عايز تجرب بنفسك؟' : '🔥 Want to try it yourself?'}</h3>
            <p className="text-muted-foreground mb-6">
              {isAr ? 'فعّل الوكيل الذكي من لوحة التحكم وشوف الفرق' : 'Activate the smart agent from your dashboard and see the difference'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                <Bot className="w-5 h-5" />
                {isAr ? 'ابدأ الآن مجاناً' : 'Start free now'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard/smart-agent')} className="gap-2">
                <Zap className="w-5 h-5" />
                {isAr ? 'لوحة تحكم الوكيل' : 'Agent dashboard'}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />{isAr ? 'بدون كود' : 'No code'}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />{isAr ? 'تفعيل فوري' : 'Instant setup'}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />{isAr ? 'صيانة مستمرة' : 'Ongoing support'}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

SmartAgentShowcase.displayName = 'SmartAgentShowcase';
export default SmartAgentShowcase;
