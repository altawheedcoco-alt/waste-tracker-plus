import { useState, useEffect } from 'react';
import { X, Sparkles, Users, Award, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const POPUP_KEY = 'irecycle_whats_new_v1';

const highlights = [
  { icon: Users, title: 'منصة عُمالنا', desc: 'نظام توظيف متكامل — قدّم على وظائف أو انشر فرص عمل', color: 'from-blue-500 to-cyan-500' },
  { icon: Award, title: 'دليل الاستشاريين', desc: 'اعثر على مستشارين بيئيين ومكاتب أيزو معتمدة', color: 'from-amber-500 to-orange-500' },
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

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-fade-in"
        onClick={close}
      />
      {/* Popup */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[201] max-w-md w-full animate-fade-up"
        style={{ animationDuration: '0.3s' }}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="relative bg-gradient-to-l from-primary to-emerald-600 p-6 text-white">
            <button onClick={close} className="absolute top-3 left-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-bold">ما الجديد؟</span>
            </div>
            <h3 className="text-xl font-extrabold">مميزات جديدة في iRecycle! 🎉</h3>
            <p className="text-sm text-white/80 mt-1">اكتشف الأدوات الجديدة اللي أضفناها عشانك</p>
          </div>

          {/* Features */}
          <div className="p-5 space-y-3">
            {highlights.map((h, i) => (
              <div
                key={h.title}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors animate-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${h.color} flex items-center justify-center shrink-0`}>
                  <h.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.desc}</p>
                </div>
              </div>
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
      </div>
    </>
  );
};

export default WhatsNewPopup;
