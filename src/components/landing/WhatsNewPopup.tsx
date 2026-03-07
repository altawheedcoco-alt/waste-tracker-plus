import { useState, useEffect } from 'react';
import { X, Sparkles, Users, Award, Megaphone, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const POPUP_KEY = 'irecycle_whats_new_v2';

const highlights = [
  { icon: Rocket, title: 'الإصدار 2.0', desc: 'هوية بصرية جديدة بالكامل مع تحسينات شاملة في الأداء والتجربة', color: 'from-primary to-[hsl(200,75%,45%)]' },
  { icon: Users, title: 'منصة عُمالنا', desc: 'نظام توظيف متكامل — قدّم على وظائف أو انشر فرص عمل', color: 'from-blue-500 to-cyan-500' },
  { icon: Award, title: 'دليل الاستشاريين', desc: 'اعثر على مستشارين بيئيين ومكاتب أيزو معتمدة', color: 'from-[hsl(42,92%,55%)] to-orange-500' },
  { icon: Megaphone, title: 'إعلانات مستهدفة', desc: 'وصّل خدماتك لجمهور القطاع البيئي', color: 'from-purple-500 to-violet-500' },
];

const WhatsNewPopup = () => {
  const [show, setShow] = useState(false);
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

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          {/* Popup */}
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[201] max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
              {/* Header — v2.0 gradient */}
              <div className="relative p-6 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(162,72%,42%) 0%, hsl(200,75%,45%) 100%)' }}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <button onClick={close} className="absolute top-3 left-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[hsl(42,92%,55%)] animate-pulse" />
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">الإصدار 2.0</span>
                  </div>
                  <h3 className="text-xl font-extrabold">iRecycle 2.0 وصل! 🎉</h3>
                  <p className="text-sm text-white/80 mt-1">اكتشف التطورات الجديدة اللي أضفناها عشانك</p>
                </div>
              </div>

              {/* Features */}
              <div className="p-5 space-y-3">
                {highlights.map((h, i) => (
                  <motion.div
                    key={h.title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${h.color} flex items-center justify-center shrink-0`}>
                      <h.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{h.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 flex gap-2">
                <Button className="flex-1" onClick={() => { close(); navigate('/auth?mode=register'); }}>
                  سجّل الآن
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
