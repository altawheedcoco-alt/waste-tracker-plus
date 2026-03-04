import { memo } from "react";
import { 
  MessageSquare, Bell, Shield, Zap, Clock, BarChart3, 
  Users, Building2, Truck, CheckCircle2, Globe, Lock, 
  Send, FileText, CreditCard, Route, Smartphone, BellRing,
  MessageCircle, Bot, ArrowLeft, LogIn
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const WhatsAppShowcase = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const features = [
    {
      icon: Zap,
      title: isAr ? 'إشعارات فورية لحظية' : 'Instant Real-time Notifications',
      desc: isAr 
        ? 'استلم تنبيهات فورية على واتساب لحظة حدوث أي تحديث: تحركات الشحنات، تغيير الحالة، أو استلام الفواتير — دون تأخير.'
        : 'Get instant WhatsApp alerts the moment anything updates: shipment movements, status changes, or invoice receipts — zero delay.',
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: Bell,
      title: isAr ? 'إشعارات ذكية مخصصة' : 'Smart Customized Alerts',
      desc: isAr 
        ? 'اختر بدقة نوع الإشعارات التي تريد استلامها: شحنات، مالية، تقارير، طوارئ — كل مستخدم يتحكم في إعداداته.'
        : 'Choose exactly which notifications you receive: shipments, finances, reports, emergencies — every user controls their settings.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Bot,
      title: isAr ? 'ردود آلية ذكية بالذكاء الاصطناعي' : 'AI-Powered Auto Responses',
      desc: isAr 
        ? 'نظام ذكاء اصطناعي يرد على استفسارات العملاء تلقائياً عبر واتساب، يفهم السياق ويقدم إجابات دقيقة على مدار الساعة.'
        : 'AI system auto-responds to customer inquiries via WhatsApp, understands context and provides accurate answers 24/7.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Shield,
      title: isAr ? 'حماية وخصوصية كاملة' : 'Full Privacy & Protection',
      desc: isAr 
        ? 'أرقام الهواتف مشفرة ومحمية. لا يتم مشاركة بياناتك مع أي طرف ثالث. يمكنك إلغاء الاشتراك في أي وقت بسهولة.'
        : 'Phone numbers are encrypted and protected. Your data is never shared with third parties. Easily unsubscribe anytime.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: FileText,
      title: isAr ? 'تقارير وملخصات دورية' : 'Periodic Reports & Summaries',
      desc: isAr 
        ? 'استلم ملخصات يومية وأسبوعية وشهرية لعملياتك عبر واتساب: عدد الشحنات، الإيرادات، الأداء، والتنبيهات المهمة.'
        : 'Receive daily, weekly, and monthly operation summaries via WhatsApp: shipment count, revenue, performance, and key alerts.',
      color: 'from-cyan-500 to-teal-600',
    },
    {
      icon: Globe,
      title: isAr ? 'دعم متعدد اللغات' : 'Multilingual Support',
      desc: isAr 
        ? 'رسائل واتساب تصل باللغة العربية أو الإنجليزية حسب تفضيلات المستخدم، مع قوالب رسائل احترافية جاهزة.'
        : 'WhatsApp messages arrive in Arabic or English based on user preferences, with professional ready-made templates.',
      color: 'from-rose-500 to-pink-600',
    },
  ];

  const beneficiaries = [
    {
      icon: Building2,
      role: isAr ? 'الجهات والمؤسسات' : 'Organizations',
      benefits: isAr ? [
        'متابعة لحظية لجميع عمليات النقل والشحن',
        'تنبيهات فورية عند استلام الفواتير والمدفوعات',
        'تقارير أداء يومية وأسبوعية تلقائية',
        'إشعارات الطوارئ والحالات الحرجة',
        'ربط مع نظام المحاسبة والفواتير الإلكترونية',
      ] : [
        'Real-time monitoring of all transport & shipping operations',
        'Instant alerts on invoice & payment receipts',
        'Automatic daily & weekly performance reports',
        'Emergency & critical case notifications',
        'Integration with accounting & e-invoicing systems',
      ],
    },
    {
      icon: Truck,
      role: isAr ? 'السائقون' : 'Drivers',
      benefits: isAr ? [
        'إشعارات المهام الجديدة والشحنات المسندة',
        'تنبيهات تغيير المسارات والتحديثات الميدانية',
        'تأكيد التسليم والاستلام عبر واتساب',
        'إشعارات المستحقات المالية والرواتب',
        'تواصل مباشر مع إدارة الجهة الناقلة',
      ] : [
        'New task & assigned shipment notifications',
        'Route changes & field update alerts',
        'Delivery & receipt confirmation via WhatsApp',
        'Financial dues & salary notifications',
        'Direct communication with transport management',
      ],
    },
    {
      icon: Users,
      role: isAr ? 'العملاء والشركاء' : 'Clients & Partners',
      benefits: isAr ? [
        'تتبع شحناتهم لحظياً من البداية للنهاية',
        'إشعارات وصول المركبة وموعد الاستلام',
        'استلام الفواتير وإيصالات الدفع فوراً',
        'التواصل المباشر مع فريق الدعم',
        'تقييم الخدمة والتغذية الراجعة عبر واتساب',
      ] : [
        'Track shipments in real-time from start to finish',
        'Vehicle arrival & pickup time notifications',
        'Instant invoice & payment receipt delivery',
        'Direct communication with support team',
        'Service rating & feedback via WhatsApp',
      ],
    },
  ];

  const stats = [
    { value: isAr ? '+15' : '15+', label: isAr ? 'نموذج رسالة جاهز' : 'Ready Templates', icon: MessageSquare },
    { value: isAr ? '٢٤/٧' : '24/7', label: isAr ? 'إشعارات على مدار الساعة' : 'Round-the-clock Alerts', icon: Clock },
    { value: isAr ? '+٩٩٪' : '99%+', label: isAr ? 'نسبة وصول الرسائل' : 'Message Delivery Rate', icon: CheckCircle2 },
    { value: isAr ? '<٣ ث' : '<3s', label: isAr ? 'سرعة وصول الإشعار' : 'Notification Speed', icon: Zap },
  ];

  return (
    <section id="whatsapp-notifications" className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-200/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 mb-6">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700 dark:text-green-400">
              {isAr ? 'خدمة إشعارات واتساب المتكاملة' : 'Integrated WhatsApp Notification Service'}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-600 text-white border-0">
              {isAr ? 'مجاني' : 'Free'}
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight">
            {isAr ? (
              <>
                إشعارات <span className="text-green-600">واتساب</span> الذكية
                <br className="hidden sm:block" />
                <span className="text-primary">لكل عملياتك</span>
              </>
            ) : (
              <>
                Smart <span className="text-green-600">WhatsApp</span> Notifications
                <br className="hidden sm:block" />
                <span className="text-primary">For All Your Operations</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isAr 
              ? 'نظام إشعارات متكامل يربط بين جميع أطراف العملية — الجهات، السائقين، والعملاء — عبر رسائل واتساب فورية وذكية تضمن متابعة مستمرة وشفافية كاملة لكل عملية.'
              : 'A comprehensive notification system connecting all stakeholders — organizations, drivers, and clients — through instant, smart WhatsApp messages ensuring continuous monitoring and full transparency for every operation.'
            }
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 sm:mb-16 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/40 shadow-sm backdrop-blur-sm">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-green-600" />
              <div className="text-2xl sm:text-3xl font-black text-green-600">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-card/90 border border-border/40 hover:border-green-300 dark:hover:border-green-700 shadow-sm hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Beneficiaries Section */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-black text-center text-foreground mb-3">
            {isAr ? 'من يستفيد من هذه الخدمة؟' : 'Who Benefits From This Service?'}
          </h3>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto text-sm sm:text-base">
            {isAr 
              ? 'صُمم النظام ليخدم جميع الأطراف المشاركة في سلسلة إدارة المخلفات'
              : 'The system is designed to serve all stakeholders in the waste management chain'
            }
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {beneficiaries.map((b, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/90 dark:bg-card/90 border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">{b.role}</h4>
                </div>
                <ul className="space-y-3">
                  {b.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-2xl sm:text-3xl font-black text-center text-foreground mb-10">
            {isAr ? 'كيف يعمل النظام؟' : 'How Does It Work?'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '1', icon: Smartphone, title: isAr ? 'فعّل الخدمة' : 'Activate', desc: isAr ? 'فعّل إشعارات واتساب من إعدادات حسابك بنقرة واحدة' : 'Enable WhatsApp notifications from your account settings with one click' },
              { step: '2', icon: BellRing, title: isAr ? 'اختر إشعاراتك' : 'Choose Alerts', desc: isAr ? 'حدد أنواع الإشعارات التي تريد استلامها وأوقات الإرسال' : 'Select notification types you want to receive and delivery times' },
              { step: '3', icon: Send, title: isAr ? 'استلم فوراً' : 'Receive Instantly', desc: isAr ? 'استلم الإشعارات مباشرة على واتساب بشكل فوري وتلقائي' : 'Get notifications directly on WhatsApp instantly and automatically' },
            ].map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-1 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {s.step}
                </div>
                <h4 className="font-bold text-foreground mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <MessageCircle className="w-10 h-10 text-white/80 mx-auto mb-4" />
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              {isAr ? 'ابدأ الآن واستلم إشعاراتك عبر واتساب' : 'Start Now & Receive Your WhatsApp Notifications'}
            </h3>
            <p className="text-white/80 mb-6 max-w-lg mx-auto text-sm sm:text-base">
              {isAr 
                ? 'سجل حسابك وفعّل إشعارات واتساب مجاناً — لا حاجة لتطبيقات إضافية أو إعدادات معقدة'
                : 'Register your account and activate WhatsApp notifications for free — no extra apps or complex setup needed'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                size="lg"
                onClick={() => navigate('/auth?mode=register')}
                className="bg-white text-green-700 hover:bg-white/90 font-bold rounded-xl px-8 shadow-lg shadow-black/10 gap-2"
              >
                {isAr ? 'سجل الآن مجاناً' : 'Register Now Free'}
                <ArrowLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth?mode=login')}
                className="border-white/30 text-white hover:bg-white/10 font-bold rounded-xl px-8 gap-2"
              >
                <LogIn className="w-4 h-4" />
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

WhatsAppShowcase.displayName = 'WhatsAppShowcase';
export default WhatsAppShowcase;
