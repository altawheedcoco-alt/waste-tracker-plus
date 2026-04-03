import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, Eye,
  Camera, FileText, Star, TrendingUp
} from 'lucide-react';

interface QAInspection {
  id: string;
  shipment_ref: string;
  material: string;
  inspector: string;
  date: string;
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  contamination_level: number;
  moisture_level: number;
  color_consistency: number;
  foreign_matter: number;
  status: 'passed' | 'failed' | 'conditional';
  notes?: string;
}

const DEMO_INSPECTIONS: QAInspection[] = [
  { id: '1', shipment_ref: 'SH-2026-0412', material: 'HDPE مطحون', inspector: 'أحمد محمد', date: '2026-04-03', overall_grade: 'A', contamination_level: 2, moisture_level: 3, color_consistency: 95, foreign_matter: 1, status: 'passed' },
  { id: '2', shipment_ref: 'SH-2026-0410', material: 'PET رقائق', inspector: 'سارة أحمد', date: '2026-04-02', overall_grade: 'B', contamination_level: 8, moisture_level: 5, color_consistency: 88, foreign_matter: 3, status: 'passed' },
  { id: '3', shipment_ref: 'SH-2026-0408', material: 'كرتون مضغوط', inspector: 'محمد علي', date: '2026-04-01', overall_grade: 'C', contamination_level: 15, moisture_level: 12, color_consistency: 75, foreign_matter: 8, status: 'conditional', notes: 'يحتاج إعادة فرز' },
  { id: '4', shipment_ref: 'SH-2026-0405', material: 'بلاستيك مخلوط', inspector: 'أحمد محمد', date: '2026-03-30', overall_grade: 'D', contamination_level: 25, moisture_level: 18, color_consistency: 60, foreign_matter: 15, status: 'failed', notes: 'تلوث عالي - مرفوض' },
];

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  F: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
};

const STATUS_CONFIG = {
  passed: { label: 'مقبول', icon: CheckCircle2, class: 'text-emerald-600' },
  failed: { label: 'مرفوض', icon: XCircle, class: 'text-red-500' },
  conditional: { label: 'مشروط', icon: AlertTriangle, class: 'text-amber-600' },
};

const QualityControlDashboard = () => {
  const passRate = Math.round((DEMO_INSPECTIONS.filter(i => i.status === 'passed').length / DEMO_INSPECTIONS.length) * 100);
  const avgContamination = Math.round(DEMO_INSPECTIONS.reduce((s, i) => s + i.contamination_level, 0) / DEMO_INSPECTIONS.length);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <ClipboardCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_INSPECTIONS.length}</div>
            <p className="text-[10px] text-muted-foreground">فحص هذا الشهر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">{passRate}%</div>
            <p className="text-[10px] text-muted-foreground">معدل القبول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">B+</div>
            <p className="text-[10px] text-muted-foreground">متوسط الجودة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-lg font-bold">{avgContamination}%</div>
            <p className="text-[10px] text-muted-foreground">متوسط التلوث</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspections */}
      <div className="space-y-3">
        {DEMO_INSPECTIONS.map(inspection => {
          const statusCfg = STATUS_CONFIG[inspection.status];
          const StatusIcon = statusCfg.icon;
          return (
            <Card key={inspection.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusCfg.class}`} />
                    <div>
                      <span className="text-sm font-semibold">{inspection.shipment_ref}</span>
                      <p className="text-[10px] text-muted-foreground">{inspection.material}</p>
                    </div>
                  </div>
                  <Badge className={GRADE_COLORS[inspection.overall_grade] + ' text-xs'}>
                    درجة {inspection.overall_grade}
                  </Badge>
                </div>

                {/* Quality Metrics */}
                <div className="space-y-2 mb-3">
                  <QualityBar label="التلوث" value={inspection.contamination_level} max={30} inverted />
                  <QualityBar label="الرطوبة" value={inspection.moisture_level} max={25} inverted />
                  <QualityBar label="تجانس اللون" value={inspection.color_consistency} max={100} />
                  <QualityBar label="مواد غريبة" value={inspection.foreign_matter} max={20} inverted />
                </div>

                {inspection.notes && (
                  <p className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 mb-2">
                    📝 {inspection.notes}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{inspection.inspector} • {new Date(inspection.date).toLocaleDateString('ar-EG')}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                    <FileText className="h-3 w-3 ml-1" />
                    التقرير
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const QualityBar = ({ label, value, max, inverted }: { label: string; value: number; max: number; inverted?: boolean }) => {
  const percent = (value / max) * 100;
  const isGood = inverted ? value < max * 0.3 : value > max * 0.7;
  const isBad = inverted ? value > max * 0.6 : value < max * 0.4;

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span>{label}</span>
        <span className={isBad ? 'text-red-500 font-bold' : isGood ? 'text-emerald-600' : 'text-amber-600'}>
          {value}{inverted ? '%' : '%'}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
};

export default QualityControlDashboard;
