import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Activity, Brain, Zap, Camera, RefreshCw,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2,
  Waves, Shield, Clock, Droplets, Wind, Timer, Gauge,
  Stethoscope, Thermometer, HeartPulse, Sparkles, AlertTriangle, Info
} from 'lucide-react';
import { usePPGMeasurement, PPGResults } from '@/hooks/usePPGMeasurement';
import { cn } from '@/lib/utils';

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
          <div key={i} className={cn('w-1.5 rounded-full transition-all', i <= config.bars ? config.color : 'bg-muted')}
            style={{ height: `${i * 5 + 3}px` }} />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{config.label}</span>
    </div>
  );
};

// === Blood Pressure Card ===
const BPCard = ({ systolic, diastolic, category }: { systolic: number; diastolic: number; category: PPGResults['bpCategory'] }) => {
  const config = {
    low: { label: 'منخفض', color: 'text-blue-500', bg: 'bg-blue-500/10', advice: 'قد تشعر بدوار. اشرب سوائل واجلس ببطء.' },
    normal: { label: 'طبيعي ✓', color: 'text-primary', bg: 'bg-primary/10', advice: 'ضغطك في النطاق المثالي. حافظ على نمط حياتك الصحي.' },
    elevated: { label: 'مرتفع قليلاً', color: 'text-amber-500', bg: 'bg-amber-500/10', advice: 'قلل الملح وتمرن 30 دقيقة يومياً.' },
    high1: { label: 'مرتفع (درجة 1)', color: 'text-orange-500', bg: 'bg-orange-500/10', advice: 'راجع الطبيب. قد تحتاج تعديل نمط الحياة أو أدوية.' },
    high2: { label: 'مرتفع (درجة 2)', color: 'text-destructive', bg: 'bg-destructive/10', advice: 'ضغطك مرتفع. يُنصح بمراجعة الطبيب قريباً.' },
    crisis: { label: 'أزمة ضغط ⚠️', color: 'text-destructive', bg: 'bg-destructive/10', advice: 'اطلب المساعدة الطبية فوراً!' },
  }[category];

  return (
    <Card className={cn('border-0 shadow-sm', category === 'crisis' && 'border border-destructive/50')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">ضغط الدم التقديري</p>
            <Badge variant="outline" className={cn('text-[10px] mt-0.5', config.color)}>{config.label}</Badge>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-bold text-foreground">{systolic}</span>
          <span className="text-lg text-muted-foreground">/</span>
          <span className="text-3xl font-bold text-foreground">{diastolic}</span>
          <span className="text-xs text-muted-foreground mr-1">mmHg</span>
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground mb-2">
          <span>الانقباضي: <strong className="text-foreground">{systolic}</strong></span>
          <span>الانبساطي: <strong className="text-foreground">{diastolic}</strong></span>
        </div>
        {/* BP Scale visualization */}
        <div className="relative h-2 rounded-full overflow-hidden bg-muted mb-2">
          <div className="absolute inset-y-0 left-0 w-1/5 bg-blue-400/50" />
          <div className="absolute inset-y-0 left-[20%] w-1/5 bg-primary/50" />
          <div className="absolute inset-y-0 left-[40%] w-1/5 bg-amber-400/50" />
          <div className="absolute inset-y-0 left-[60%] w-1/5 bg-orange-400/50" />
          <div className="absolute inset-y-0 left-[80%] w-1/5 bg-destructive/50" />
          <div
            className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full"
            style={{ left: `${Math.min(95, Math.max(5, ((systolic - 80) / 120) * 100))}%` }}
          />
        </div>
        <p className={cn('text-[10px]', config.color)}>{config.advice}</p>
      </CardContent>
    </Card>
  );
};

// === SpO2 & Respiratory ===
const VitalsRow = ({ spo2, respiratoryRate }: { spo2: number; respiratoryRate: number }) => {
  const spo2Status = spo2 >= 95 ? { label: 'طبيعي', color: 'text-primary' } :
    spo2 >= 90 ? { label: 'منخفض قليلاً', color: 'text-amber-500' } :
      { label: 'منخفض', color: 'text-destructive' };

  const rrStatus = respiratoryRate >= 12 && respiratoryRate <= 20 ? { label: 'طبيعي', color: 'text-primary' } :
    { label: 'غير طبيعي', color: 'text-amber-500' };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center">
          <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{spo2}<span className="text-sm">%</span></p>
          <p className="text-[10px] font-semibold text-foreground">تشبع الأكسجين</p>
          <Badge variant="outline" className={cn('text-[9px] mt-1', spo2Status.color)}>{spo2Status.label}</Badge>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center">
          <Wind className="h-6 w-6 text-teal-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{respiratoryRate}</p>
          <p className="text-[10px] font-semibold text-foreground">معدل التنفس/د</p>
          <Badge variant="outline" className={cn('text-[9px] mt-1', rrStatus.color)}>{rrStatus.label}</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

// === Glucose Risk ===
const GlucoseRiskCard = ({ risk }: { risk: PPGResults['glucoseRisk'] }) => {
  const config = {
    low: { label: 'خطر منخفض', color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2, advice: 'مؤشراتك الأيضية تبدو جيدة. حافظ على نظام غذائي متوازن.' },
    moderate: { label: 'خطر متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle, advice: 'بعض المؤشرات تستحق المتابعة. قلل السكريات المكررة وزد النشاط البدني.' },
    elevated: { label: 'خطر مرتفع', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle, advice: 'مؤشراتك تدل على خطر أيضي. يُنصح بفحص السكر التراكمي (HbA1c).' },
  }[risk];

  const Icon = config.icon;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', config.bg)}>
            <Thermometer className={cn('h-4 w-4', config.color)} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">مؤشر الخطر الأيضي / السكر</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon className={cn('h-3 w-3', config.color)} />
              <span className={cn('text-[10px] font-medium', config.color)}>{config.label}</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{config.advice}</p>
      </CardContent>
    </Card>
  );
};

// === Vascular Age ===
const VascularAgeCard = ({ age, heartRate }: { age: number; heartRate: number }) => {
  const diff = age - 30; // assuming average user ~30
  const status = diff <= 0 ? { label: 'ممتاز — أصغر من العمر', color: 'text-primary' } :
    diff <= 5 ? { label: 'جيد — مناسب للعمر', color: 'text-primary' } :
      diff <= 15 ? { label: 'أكبر قليلاً — حسّن لياقتك', color: 'text-amber-500' } :
        { label: 'أكبر — راجع الطبيب', color: 'text-destructive' };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 text-center">
        <HeartPulse className="h-6 w-6 text-violet-500 mx-auto mb-1" />
        <p className="text-3xl font-bold text-foreground">{age} <span className="text-sm text-muted-foreground">سنة</span></p>
        <p className="text-[10px] font-semibold text-foreground mb-1">العمر الوعائي التقديري</p>
        <Badge variant="outline" className={cn('text-[9px]', status.color)}>{status.label}</Badge>
      </CardContent>
    </Card>
  );
};

// === HRV Advanced ===
const HRVDetailCard = ({ hrv, sdnn, pnn50, autonomicBalance }: { hrv: number; sdnn: number; pnn50: number; autonomicBalance: number }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-primary" />
        <p className="text-xs font-semibold text-foreground">تحليل تباين ضربات القلب (HRV)</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold text-foreground">{hrv}<span className="text-[10px] text-muted-foreground">ms</span></p>
          <p className="text-[9px] text-muted-foreground">RMSSD</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold text-foreground">{sdnn}<span className="text-[10px] text-muted-foreground">ms</span></p>
          <p className="text-[9px] text-muted-foreground">SDNN</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold text-foreground">{pnn50}<span className="text-[10px] text-muted-foreground">%</span></p>
          <p className="text-[9px] text-muted-foreground">pNN50</p>
        </div>
      </div>
      {/* Autonomic balance bar */}
      <p className="text-[10px] text-muted-foreground mb-1">التوازن العصبي اللاإرادي</p>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-destructive/30 via-primary/30 to-blue-500/30 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-2 bg-foreground rounded-full transition-all"
          style={{ left: `${Math.max(2, Math.min(95, autonomicBalance))}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
        <span>سمبثاوي (توتر)</span>
        <span>متوازن</span>
        <span>باراسمبثاوي (استرخاء)</span>
      </div>
    </CardContent>
  </Card>
);

// === Comprehensive Tips ===
const HealthTips = ({ results }: { results: PPGResults }) => {
  const tips: { icon: typeof Heart; text: string; type: 'success' | 'warning' | 'danger' | 'info' }[] = [];

  // BP tips
  if (results.bpCategory === 'normal') {
    tips.push({ icon: CheckCircle2, text: 'ضغط دمك طبيعي ومثالي. استمر في نمط حياتك الصحي.', type: 'success' });
  } else if (results.bpCategory === 'elevated' || results.bpCategory === 'high1') {
    tips.push({ icon: AlertTriangle, text: 'قلل تناول الملح إلى أقل من 5 غرام يومياً واحرص على المشي 30 دقيقة.', type: 'warning' });
  } else if (results.bpCategory === 'high2' || results.bpCategory === 'crisis') {
    tips.push({ icon: AlertCircle, text: 'ضغطك يحتاج متابعة طبية عاجلة. لا تتأخر في زيارة الطبيب.', type: 'danger' });
  }

  // SpO2 tips
  if (results.spo2 < 95) {
    tips.push({ icon: Droplets, text: 'تشبع الأكسجين منخفض. تنفس بعمق واخرج للهواء الطلق.', type: 'warning' });
  }

  // Stress tips
  if (results.stress > 60) {
    tips.push({ icon: Brain, text: 'مستوى التوتر مرتفع. جرب تمارين التنفس (4-7-8) أو التأمل لمدة 5 دقائق.', type: 'warning' });
  } else if (results.stress <= 30) {
    tips.push({ icon: CheckCircle2, text: 'مستوى التوتر منخفض جداً! أنت في حالة استرخاء ممتازة.', type: 'success' });
  }

  // Energy tips
  if (results.energy < 40) {
    tips.push({ icon: Zap, text: 'طاقتك منخفضة. تناول وجبة غنية بالبروتين واشرب ماء.', type: 'warning' });
  }

  // Glucose risk
  if (results.glucoseRisk === 'elevated') {
    tips.push({ icon: Thermometer, text: 'يُنصح بإجراء فحص سكر تراكمي (HbA1c) وفحص سكر صائم.', type: 'danger' });
  } else if (results.glucoseRisk === 'moderate') {
    tips.push({ icon: Info, text: 'قلل السكريات المكررة وزد من تناول الألياف والخضروات.', type: 'info' });
  }

  // Vascular age
  if (results.vascularAge > 45) {
    tips.push({ icon: HeartPulse, text: 'عمرك الوعائي مرتفع. مارس رياضة القلب (كارديو) 3 مرات أسبوعياً.', type: 'warning' });
  }

  // HRV general
  if (results.hrv < 20) {
    tips.push({ icon: Activity, text: 'تباين ضربات القلب منخفض. هذا قد يشير لإرهاق. خذ يوم راحة.', type: 'warning' });
  }

  // Respiratory
  if (results.respiratoryRate > 20) {
    tips.push({ icon: Wind, text: 'معدل التنفس مرتفع. حاول التنفس ببطء وعمق لتهدئة الجهاز العصبي.', type: 'info' });
  }

  // General positive
  if (results.stress <= 40 && results.energy >= 60 && results.bpCategory === 'normal' && results.spo2 >= 95) {
    tips.push({ icon: Sparkles, text: 'حالتك الصحية العامة ممتازة! أنت في أفضل حالاتك 🎉', type: 'success' });
  }

  const typeStyles = {
    success: 'bg-primary/5 border-primary/20',
    warning: 'bg-amber-500/5 border-amber-500/20',
    danger: 'bg-destructive/5 border-destructive/20',
    info: 'bg-blue-500/5 border-blue-500/20',
  };
  const iconColors = {
    success: 'text-primary',
    warning: 'text-amber-500',
    danger: 'text-destructive',
    info: 'text-blue-500',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          التقرير والتوصيات الصحية الشاملة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {tips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className={cn('flex gap-2 p-2.5 rounded-lg border', typeStyles[tip.type])}>
              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColors[tip.type])} />
              <p className="text-[11px] text-foreground/80 leading-relaxed">{tip.text}</p>
            </div>
          );
        })}
        {/* Disclaimer */}
        <div className="flex gap-2 p-2 bg-muted/50 rounded-lg mt-3">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            ⚠️ هذه التقديرات مبنية على تحليل الإشارة الضوئية (PPG) وليست بديلاً عن الفحوصات الطبية.
            للتشخيص الدقيق، راجع طبيبك واستخدم أجهزة قياس معتمدة.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// === Main Results View ===
const ResultsView = ({ results }: { results: PPGResults }) => {
  const hrStatus = useMemo(() => {
    if (results.heartRate < 60) return { label: 'بطيء', icon: TrendingDown, color: 'text-primary' };
    if (results.heartRate > 100) return { label: 'سريع', icon: TrendingUp, color: 'text-destructive' };
    return { label: 'طبيعي', icon: CheckCircle2, color: 'text-primary' };
  }, [results.heartRate]);

  return (
    <div className="space-y-3">
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

      {/* Blood Pressure */}
      <BPCard systolic={results.systolic} diastolic={results.diastolic} category={results.bpCategory} />

      {/* SpO2 & Respiratory Rate */}
      <VitalsRow spo2={results.spo2} respiratoryRate={results.respiratoryRate} />

      {/* Glucose Risk */}
      <GlucoseRiskCard risk={results.glucoseRisk} />

      {/* Vascular Age */}
      <VascularAgeCard age={results.vascularAge} heartRate={results.heartRate} />

      {/* HRV Detail */}
      <HRVDetailCard hrv={results.hrv} sdnn={results.sdnn} pnn50={results.pnn50} autonomicBalance={results.autonomicBalance} />

      {/* Stress / Energy / Productivity */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Brain, label: 'التوتر', value: results.stress, color: 'text-destructive' },
          { icon: Zap, label: 'الطاقة', value: results.energy, color: 'text-primary' },
          { icon: Gauge, label: 'الإنتاجية', value: results.productivity, color: 'text-violet-500' },
        ].map(m => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <m.icon className={cn('h-5 w-5 mx-auto mb-1', m.color)} />
              <p className="text-xl font-bold text-foreground">{m.value}%</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
              <Progress value={m.value} className="h-1 mt-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comprehensive Tips */}
      <HealthTips results={results} />
    </div>
  );
};

// === Main PPGTab ===
const PPGTab = () => {
  const { state, progress, results, error, signalQuality, videoRef, canvasRef, startMeasurement, reset } = usePPGMeasurement();

  return (
    <div className="space-y-4">
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {state === 'idle' && !results && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2"><Waves className="h-4 w-4 text-primary" />فحص صحي شامل بالبصمة</h2>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                يقيس: نبض القلب، ضغط الدم، تشبع الأكسجين، معدل التنفس، التوتر، الطاقة، العمر الوعائي، ومؤشر الخطر الأيضي.
              </p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'ضع إصبعك', desc: 'غطِّ الكاميرا الخلفية والفلاش بالكامل' },
                  { step: '2', title: 'انتظر 30 ثانية', desc: 'يحلل تغيرات لون الجلد من تدفق الدم' },
                  { step: '3', title: 'تقرير صحي شامل', desc: 'ضغط الدم، الأكسجين، التوتر، السكر، والمزيد' },
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
          <Button onClick={startMeasurement} className="w-full gap-2" size="lg"><Camera className="h-5 w-5" />ابدأ الفحص الشامل</Button>
        </div>
      )}

      {state === 'preparing' && (
        <Card><CardContent className="p-8 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium">جارٍ تشغيل الكاميرا...</p>
        </CardContent></Card>
      )}

      {state === 'measuring' && (
        <Card className="border-primary/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive animate-pulse" /><span className="text-sm font-medium">جارٍ القياس...</span></div>
              <SignalIndicator quality={signalQuality} />
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-center"><Heart className="h-16 w-16 text-destructive animate-pulse" /></div>
            <p className="text-[10px] text-center text-muted-foreground">لا ترفع إصبعك — ابقِ ثابتاً</p>
            <Button variant="outline" onClick={reset} className="w-full text-xs">إلغاء</Button>
          </CardContent>
        </Card>
      )}

      {state === 'analyzing' && (
        <Card><CardContent className="p-8 text-center space-y-4">
          <Activity className="h-10 w-10 animate-pulse text-primary mx-auto" />
          <p className="text-sm font-medium">جارٍ تحليل البيانات وإعداد التقرير...</p>
        </CardContent></Card>
      )}

      {state === 'error' && (
        <Card className="border-destructive/30">
          <CardContent className="p-5 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={reset} className="gap-2"><RefreshCw className="h-4 w-4" />حاول مجدداً</Button>
          </CardContent>
        </Card>
      )}

      {state === 'done' && results && (
        <>
          <ResultsView results={results} />
          <Button onClick={reset} variant="outline" className="w-full gap-2"><RefreshCw className="h-4 w-4" />فحص جديد</Button>
        </>
      )}
    </div>
  );
};

export default PPGTab;
