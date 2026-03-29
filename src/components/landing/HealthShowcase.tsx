import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Fingerprint, Brain, Zap, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HealthShowcase = memo(() => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-primary/5">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-4">
            <Fingerprint className="h-3.5 w-3.5" />
            تقنية البصمة الضوئية PPG
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            iRecycle <span className="text-primary">Health</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            حلل حالتك الصحية في 30 ثانية فقط باستخدام كاميرا هاتفك — بدون أجهزة طبية
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
          {[
            { icon: Heart, label: 'معدل النبض', value: 'BPM', color: 'bg-destructive/10 text-destructive' },
            { icon: Brain, label: 'مستوى التوتر', value: 'Stress', color: 'bg-secondary/50 text-secondary-foreground' },
            { icon: Zap, label: 'مستوى الطاقة', value: 'Energy', color: 'bg-primary/10 text-primary' },
            { icon: Activity, label: 'الإنتاجية', value: 'Focus', color: 'bg-accent/30 text-accent-foreground' },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border/60 rounded-xl p-4 text-center shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate('/dashboard/health')}
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
