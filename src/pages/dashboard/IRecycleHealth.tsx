import React, { useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Activity, Brain, Zap, Fingerprint, Camera, RefreshCw,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2,
  Waves, Shield, Clock
} from 'lucide-react';
import { usePPGMeasurement, PPGResults } from '@/hooks/usePPGMeasurement';
import { cn } from '@/lib/utils';

// ─── Signal Quality Indicator ───
const SignalIndicator = ({ quality }: { quality: 'none' | 'poor' | 'fair' | 'good' }) => {
  const config = {
    none: { label: 'لا إشارة', color: 'bg-muted', bars: 0 },
    poor: { label: 'ضعيفة', color: 'bg-destructive', bars: 1 },
    fair: { label: 'متوسطة', color: 'bg-secondary', bars: 2 },
    good: { label: 'ممتازة', color: 'bg-primary', bars: 3 },
  }[quality];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-full transition-all',
              i <= config.bars ? config.color : 'bg-muted',
            )}
            style={{ height: `${i * 5 + 3}px` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{config.label}</span>
    </div>
  );
};

// ─── Metric Card ───
const MetricCard = ({ icon: Icon, label, value, unit, color, description }: {
  icon: React.ElementType; label: string; value: number; unit: string;
  color: string; description: string;
}) => {
  const level = value > 70 ? 'مرتفع' : value > 40 ? 'متوسط' : 'منخفض';
  const levelColor = value > 70 ? 'text-destructive' : value > 40 ? 'text-secondary-foreground' : 'text-primary';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className={cn('text-[10px]', levelColor)}>{level}</Badge>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}<span className="text-sm font-normal text-muted-foreground mr-1">{unit}</span></p>
        <p className="text-xs font-semibold text-foreground mt-1">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        <Progress value={value} className="h-1.5 mt-2" />
      </CardContent>
    </Card>
  );
};

// ─── Results View ───
const ResultsView = ({ results }: { results: PPGResults }) => {
  const hrStatus = useMemo(() => {
    if (results.heartRate < 60) return { label: 'بطيء', icon: TrendingDown, color: 'text-primary' };
    if (results.heartRate > 100) return { label: 'سريع', icon: TrendingUp, color: 'text-destructive' };
    return { label: 'طبيعي', icon: CheckCircle2, color: 'text-primary' };
  }, [results.heartRate]);

  return (
    <div className="space-y-4">
      {/* Heart Rate Hero */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5 text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
          <p className="text-4xl font-bold text-foreground">{results.heartRate}</p>
          <p className="text-sm text-muted-foreground">نبضة/دقيقة</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <hrStatus.icon className={cn('h-4 w-4', hrStatus.color)} />
            <span className={cn('text-xs font-medium', hrStatus.color)}>{hrStatus.label}</span>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span>HRV: <strong className="text-foreground">{results.hrv}ms</strong></span>
            <span>الثقة: <strong className="text-foreground">{results.confidence}%</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Metrics Grid */}
      <div className="grid grid-cols-1 gap-3">
        <MetricCard
          icon={Brain}
          label="مستوى التوتر"
          value={results.stress}
          unit="%"
          color="bg-destructive/10 text-destructive"
          description="يُحسب من تباين ضربات القلب (HRV) — كلما قل التباين زاد التوتر"
        />
        <MetricCard
          icon={Zap}
          label="مستوى الطاقة"
          value={results.energy}
          unit="%"
          color="bg-primary/10 text-primary"
          description="يعتمد على توازن الجهاز العصبي اللاإرادي ومعدل النبض"
        />
        <MetricCard
          icon={Activity}
          label="القدرة على الإنتاجية"
          value={results.productivity}
          unit="%"
          color="bg-accent/30 text-accent-foreground"
          description="يجمع بين انخفاض التوتر وكفاية الطاقة للتركيز والعمل"
        />
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            توصيات صحية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {results.stress > 60 && (
            <div className="flex gap-2 p-2 bg-destructive/5 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">مستوى التوتر مرتفع. خذ استراحة قصيرة ومارس تمارين التنفس العميق.</p>
            </div>
          )}
          {results.energy < 40 && (
            <div className="flex gap-2 p-2 bg-secondary/30 rounded-lg">
              <Zap className="h-4 w-4 text-secondary-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">طاقتك منخفضة. تناول وجبة خفيفة واحرص على الترطيب الكافي.</p>
            </div>
          )}
          {results.heartRate > 100 && (
            <div className="flex gap-2 p-2 bg-destructive/5 rounded-lg">
              <Heart className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">معدل النبض مرتفع. استرح قليلاً وتجنب الكافيين.</p>
            </div>
          )}
          {results.stress <= 40 && results.energy >= 60 && (
            <div className="flex gap-2 p-2 bg-primary/5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">حالتك الصحية ممتازة! أنت في أفضل حالاتك للعمل والإنتاجية.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Main Page ───
const IRecycleHealth = () => {
  const {
    state, progress, results, error, signalQuality,
    videoRef, canvasRef,
    startMeasurement, reset,
  } = usePPGMeasurement();

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-lg mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Fingerprint className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">iRecycle Health</h1>
            <p className="text-xs text-muted-foreground">تحليل صحي ذكي بتقنية البصمة الضوئية PPG</p>
          </div>
        </div>

        {/* Hidden video + canvas */}
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />

        {/* IDLE State */}
        {state === 'idle' && !results && (
          <div className="space-y-4">
            {/* How it works */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Waves className="h-4 w-4 text-primary" />
                  كيف تعمل التقنية؟
                </h2>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'ضع إصبعك', desc: 'غطِّ الكاميرا الخلفية والفلاش بإصبعك بالكامل' },
                    { step: '2', title: 'انتظر 30 ثانية', desc: 'التطبيق يحلل تغيرات لون الجلد الدقيقة من تدفق الدم' },
                    { step: '3', title: 'اطلع على النتائج', desc: 'ستحصل على تحليل شامل: التوتر، الطاقة، والإنتاجية' },
                  ].map(item => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Heart, label: 'معدل النبض', desc: 'BPM دقيق' },
                { icon: Brain, label: 'مستوى التوتر', desc: 'من HRV' },
                { icon: Zap, label: 'مستوى الطاقة', desc: 'جاهزيتك للعمل' },
                { icon: Activity, label: 'الإنتاجية', desc: 'قدرة التركيز' },
              ].map(f => (
                <Card key={f.label} className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <f.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                    <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={startMeasurement} className="w-full gap-2" size="lg">
              <Camera className="h-5 w-5" />
              ابدأ القياس
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ هذا التحليل للأغراض التثقيفية فقط ولا يُغني عن الاستشارة الطبية المتخصصة
            </p>
          </div>
        )}

        {/* PREPARING */}
        {state === 'preparing' && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">جارٍ تشغيل الكاميرا...</p>
              <p className="text-xs text-muted-foreground">ضع إصبعك على الكاميرا الخلفية والفلاش</p>
            </CardContent>
          </Card>
        )}

        {/* MEASURING */}
        {state === 'measuring' && (
          <Card className="border-primary/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-medium">جارٍ القياس...</span>
                </div>
                <SignalIndicator quality={signalQuality} />
              </div>

              <div className="relative">
                <Progress value={progress} className="h-3" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {progress}%
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  متبقي {Math.ceil((100 - progress) * 0.3)} ثانية
                </span>
              </div>

              {/* Heartbeat animation */}
              <div className="flex justify-center">
                <Heart className="h-16 w-16 text-destructive animate-pulse" />
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                لا ترفع إصبعك — ابقِ ثابتاً حتى اكتمال القياس
              </p>

              <Button variant="outline" onClick={reset} className="w-full text-xs">
                إلغاء
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ANALYZING */}
        {state === 'analyzing' && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Activity className="h-10 w-10 animate-pulse text-primary mx-auto" />
              <p className="text-sm font-medium">جارٍ تحليل البيانات...</p>
              <p className="text-xs text-muted-foreground">يتم حساب مؤشرات الصحة من إشارة PPG</p>
            </CardContent>
          </Card>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <Card className="border-destructive/30">
            <CardContent className="p-5 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                حاول مجدداً
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RESULTS */}
        {state === 'done' && results && (
          <>
            <ResultsView results={results} />
            <Button onClick={reset} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              قياس جديد
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IRecycleHealth;
