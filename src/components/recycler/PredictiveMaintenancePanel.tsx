import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, Activity,
  TrendingDown, Calendar, Sparkles, ShieldCheck, Cog,
  Timer, ArrowRight, Bell, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MaintenancePrediction {
  id: string;
  equipmentName: string;
  component: string;
  healthScore: number;
  predictedFailureDate: string;
  daysUntilFailure: number;
  riskLevel: 'critical' | 'warning' | 'normal';
  recommendedAction: string;
  estimatedCost: number;
  failureCost: number;
  confidence: number;
  indicators: { name: string; current: number; threshold: number; unit: string }[];
  lastInspection: string;
}

const riskConfig = {
  critical: { label: 'حرج', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: AlertTriangle },
  warning: { label: 'تحذير', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Clock },
  normal: { label: 'طبيعي', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
};

const PredictiveMaintenancePanel = () => {
  const [predictions] = useState<MaintenancePrediction[]>([
    {
      id: '1', equipmentName: 'فلتر هواء صناعي', component: 'عنصر الترشيح',
      healthScore: 22, predictedFailureDate: '2026-02-19', daysUntilFailure: 3,
      riskLevel: 'critical', recommendedAction: 'تغيير فلتر HEPA فوراً - كفاءة الترشيح أقل من 40%',
      estimatedCost: 8500, failureCost: 85000, confidence: 94,
      indicators: [
        { name: 'ضغط هواء', current: 8.2, threshold: 6.0, unit: 'kPa' },
        { name: 'كفاءة ترشيح', current: 38, threshold: 60, unit: '%' },
        { name: 'اهتزاز', current: 5.2, threshold: 4.0, unit: 'mm/s' },
      ],
      lastInspection: '2026-02-10',
    },
    {
      id: '2', equipmentName: 'ماكينة كبس بالات', component: 'نظام هيدروليك',
      healthScore: 45, predictedFailureDate: '2026-03-05', daysUntilFailure: 17,
      riskLevel: 'warning', recommendedAction: 'تغيير زيت هيدروليك + فحص الموانع والحلقات المطاطية',
      estimatedCost: 12000, failureCost: 120000, confidence: 87,
      indicators: [
        { name: 'ضغط هيدروليك', current: 180, threshold: 200, unit: 'bar' },
        { name: 'حرارة زيت', current: 78, threshold: 85, unit: '°C' },
        { name: 'مستوى زيت', current: 65, threshold: 70, unit: '%' },
      ],
      lastInspection: '2026-02-01',
    },
    {
      id: '3', equipmentName: 'خط غسيل أساسي', component: 'مضخة مياه رئيسية',
      healthScore: 72, predictedFailureDate: '2026-04-10', daysUntilFailure: 53,
      riskLevel: 'normal', recommendedAction: 'جدولة فحص روتيني في مارس - استبدال حشوة ميكانيكية',
      estimatedCost: 3500, failureCost: 45000, confidence: 78,
      indicators: [
        { name: 'تدفق مياه', current: 92, threshold: 80, unit: 'L/min' },
        { name: 'اهتزاز مضخة', current: 2.8, threshold: 3.5, unit: 'mm/s' },
        { name: 'حرارة محمل', current: 55, threshold: 70, unit: '°C' },
      ],
      lastInspection: '2026-02-05',
    },
    {
      id: '4', equipmentName: 'ماكينة صهر وبثق', component: 'عنصر تسخين',
      healthScore: 88, predictedFailureDate: '2026-06-20', daysUntilFailure: 124,
      riskLevel: 'normal', recommendedAction: 'أداء ممتاز - مراقبة عادية فقط',
      estimatedCost: 15000, failureCost: 200000, confidence: 72,
      indicators: [
        { name: 'انتظام حرارة', current: 97, threshold: 90, unit: '%' },
        { name: 'عزل كهربائي', current: 450, threshold: 200, unit: 'MΩ' },
      ],
      lastInspection: '2026-02-12',
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const criticalCount = predictions.filter(p => p.riskLevel === 'critical').length;
  const warningCount = predictions.filter(p => p.riskLevel === 'warning').length;
  const totalSavings = predictions.reduce((s, p) => s + (p.failureCost - p.estimatedCost), 0);
  const avgHealth = Math.round(predictions.reduce((s, p) => s + p.healthScore, 0) / predictions.length);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={criticalCount > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${criticalCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-destructive' : ''}`}>{criticalCount}</p>
            <p className="text-[10px] text-muted-foreground">حرج</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{warningCount}</p>
            <p className="text-[10px] text-muted-foreground">تحذير</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Activity className={`w-5 h-5 mx-auto mb-1 ${avgHealth >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <p className="text-2xl font-bold">{avgHealth}%</p>
            <p className="text-[10px] text-muted-foreground">صحة متوسطة</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="pt-4 pb-4 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold text-emerald-500">{(totalSavings / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-muted-foreground">ج.م وفر متوقع</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-3 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs">الصيانة التنبؤية تحلل بيانات المستشعرات وسجل الأعطال للتنبؤ بالأعطال قبل حدوثها</span>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <div className="space-y-3">
        {predictions.sort((a, b) => a.daysUntilFailure - b.daysUntilFailure).map((pred) => {
          const risk = riskConfig[pred.riskLevel];
          const RiskIcon = risk.icon;
          const isExpanded = expandedId === pred.id;

          return (
            <Card key={pred.id} className={`overflow-hidden ${risk.border}`}>
              <button className="w-full text-right" onClick={() => setExpandedId(isExpanded ? null : pred.id)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${risk.color} ${risk.bg} text-[10px] gap-1`}>
                        <RiskIcon className="w-3 h-3" />{risk.label}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-bold ${pred.daysUntilFailure <= 7 ? 'text-destructive' : ''}`}>
                          {pred.daysUntilFailure} يوم
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{pred.equipmentName}</p>
                      <p className="text-[10px] text-muted-foreground">{pred.component}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold">{pred.healthScore}%</span>
                    <Progress value={pred.healthScore} className="flex-1 h-2" />
                    <span className="text-[10px] text-muted-foreground">صحة</span>
                  </div>
                </CardContent>
              </button>

              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t p-3 space-y-3">
                  {/* Recommendation */}
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-bold mb-1 flex items-center gap-1 justify-end">
                      <Sparkles className="w-3 h-3 text-primary" /> التوصية
                    </p>
                    <p className="text-xs text-muted-foreground">{pred.recommendedAction}</p>
                  </div>

                  {/* Indicators */}
                  <div>
                    <p className="text-xs font-bold mb-2 text-right">المؤشرات الحيوية:</p>
                    {pred.indicators.map((ind, i) => {
                      const pct = (ind.current / ind.threshold) * 100;
                      const isOver = ind.current > ind.threshold;
                      return (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold w-12 ${isOver ? 'text-destructive' : 'text-emerald-500'}`}>
                            {ind.current} {ind.unit}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted relative overflow-hidden">
                            <div
                              className={`absolute inset-y-0 right-0 rounded-full ${isOver ? 'bg-destructive' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                            <div
                              className="absolute inset-y-0 w-0.5 bg-foreground/40"
                              style={{ right: `${Math.min((ind.threshold / (Math.max(ind.current, ind.threshold) * 1.2)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-16 text-right">{ind.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-500">{pred.estimatedCost.toLocaleString()} ج.م</p>
                      <p className="text-[10px] text-muted-foreground">تكلفة الصيانة الوقائية</p>
                    </div>
                    <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs font-bold text-destructive">{pred.failureCost.toLocaleString()} ج.م</p>
                      <p className="text-[10px] text-muted-foreground">تكلفة العطل الفعلي</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">ثقة {pred.confidence}%</Badge>
                    <span>آخر فحص: {pred.lastInspection}</span>
                  </div>
                </motion.div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PredictiveMaintenancePanel;
