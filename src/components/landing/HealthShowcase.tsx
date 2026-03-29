import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Fingerprint, Brain, Zap, Activity, ArrowLeft,
  ScanFace, Mic, Bot, Eye, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HealthShowcase = memo(() => {
  const navigate = useNavigate();

  const features = [
    { icon: Fingerprint, label: 'البصمة الضوئية', desc: 'PPG بالإصبع', color: 'bg-primary/10 text-primary' },
    { icon: ScanFace, label: 'مسح الوجه', desc: 'rPPG بدون لمس', color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Mic, label: 'تحليل الصوت', desc: 'Voice Biomarkers', color: 'bg-violet-500/10 text-violet-600' },
    { icon: Bot, label: 'مدرب صحي AI', desc: 'نصائح مخصصة', color: 'bg-teal-500/10 text-teal-600' },
    { icon: Eye, label: 'حارس العين', desc: 'وضعية + رمش', color: 'bg-blue-500/10 text-blue-600' },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-primary/5">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            9 أدوات AI متقدمة
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            iRecycle <span className="text-primary">Health</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            منظومة صحية ذكية متكاملة — حلل حالتك الصحية والنفسية باستخدام كاميرا وميكروفون هاتفك فقط
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto mb-8">
          {features.map(item => (
            <div key={item.label} className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
              <p className="text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate('/health')}
            size="lg"
            className="gap-2 px-8"
          >
            جرّب الآن مجاناً
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
});

HealthShowcase.displayName = 'HealthShowcase';
export default HealthShowcase;
