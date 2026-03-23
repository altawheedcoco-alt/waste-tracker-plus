import { useState, useEffect } from 'react';
import { X, Sparkles, Rocket, Truck, Brain, Shield, ShoppingCart, BarChart3, Leaf, Zap, Users, Award, Globe, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const POPUP_KEY = 'irecycle_whats_new_v5_1';

const versions = [
  {
    version: 'v5.1',
    title: 'الإصدار 5.1 — النضج المتكامل',
    subtitle: 'أكبر تحديث في تاريخ المنصة',
    badge: 'جديد',
    features: [
      { icon: Truck, title: 'منظومة السائقين الثلاثية', desc: 'تابع · مستقل (Uber) · مؤجر — كل نوع بصلاحيات وواجهة مخصصة', color: 'from-blue-500 to-indigo-600' },
      { icon: ShoppingCart, title: 'سوق الشحنات والمزايدة', desc: 'مزايدة عكسية · محفظة رقمية · نظام ضمان (Escrow)', color: 'from-emerald-500 to-green-600' },
      { icon: Brain, title: 'ذكاء اصطناعي متقدم', desc: 'تحليل مستندات · توصيات ذكية · استوديو مستندات AI', color: 'from-purple-500 to-violet-600' },
      { icon: Shield, title: 'رقابة حكومية رباعية', desc: 'WMRA · EEAA · LTRA · IDA — لوحات مراقبة سيادية', color: 'from-red-500 to-rose-600' },
      { icon: HardHat, title: 'المقاول البلدي', desc: 'عقود حكومية · SLA · غرامات · إثبات أداء ميداني', color: 'from-lime-600 to-green-700' },
      { icon: Globe, title: 'تتبع GPS لحظي متصل', desc: 'خرائط مجانية · سرعة · ارتفاع · تنبيهات · تصدير المسار', color: 'from-cyan-500 to-blue-600' },
    ],
  },
  {
    version: 'v4.0',
    title: 'الإصدار 4.0 — البنية التحتية',
    subtitle: 'الأساس الذي بُني عليه كل شيء',
    badge: 'سابق',
    features: [
      { icon: BarChart3, title: 'لوحة تحكم موحدة', desc: 'مركز قيادة وسيطرة لكل جهة مع KPIs لحظية', color: 'from-primary to-emerald-600' },
      { icon: Users, title: 'هيكل إداري كامل', desc: '10+ أدوار تنظيمية من CEO حتى محلل البيانات', color: 'from-indigo-500 to-purple-600' },
      { icon: Award, title: 'نظام التقييم والسمعة', desc: 'تقييم ثنائي الاتجاه مع 4 مستويات (جديد → نخبة)', color: 'from-amber-500 to-orange-600' },
      { icon: Leaf, title: 'الامتثال البيئي', desc: 'توافق كامل مع القانون 202/2020 ولائحته التنفيذية', color: 'from-green-500 to-teal-600' },
    ],
  },
];

const WhatsNewPopup = () => {
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(POPUP_KEY);
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem(POPUP_KEY, 'true');
  };

  const currentVersion = versions[activeTab];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed inset-x-3 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[201] max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" dir="rtl">
              {/* Header */}
              <div className="relative p-5 text-white overflow-hidden shrink-0" style={{
                background: 'linear-gradient(135deg, hsl(160 68% 32%) 0%, hsl(180 55% 26%) 50%, hsl(205 68% 32%) 100%)',
              }}>
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }} />
                <button onClick={close} className="absolute top-3 left-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                      {currentVersion.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-extrabold">{currentVersion.title} 🚀</h3>
                  <p className="text-sm text-white/70 mt-0.5">{currentVersion.subtitle}</p>
                </div>
              </div>

              {/* Version Tabs */}
              <div className="flex gap-1 px-4 pt-3 shrink-0">
                {versions.map((v, i) => (
                  <button
                    key={v.version}
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      activeTab === i
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Rocket className="w-3 h-3 inline-block ml-1" />
                    {v.version}
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="p-4 space-y-2 overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-2"
                  >
                    {currentVersion.features.map((f, i) => (
                      <motion.div
                        key={f.title}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <f.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-foreground">{f.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CTA */}
              <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0 border-t border-border/30">
                <Button className="flex-1 gap-1.5" onClick={() => { close(); navigate('/auth?mode=register'); }}>
                  <Zap className="w-4 h-4" />
                  ابدأ الآن
                </Button>
                <Button variant="outline" className="flex-1" onClick={close}>
                  لاحقاً
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsNewPopup;
