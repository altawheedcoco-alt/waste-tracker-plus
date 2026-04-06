import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

const batches = [
  { id: 'B-2024-0891', source: 'مولد القاهرة', contLevel: 2.1, status: 'clean', material: 'PET' },
  { id: 'B-2024-0892', source: 'مولد الجيزة', contLevel: 8.5, status: 'warning', material: 'HDPE' },
  { id: 'B-2024-0893', source: 'مولد الإسكندرية', contLevel: 15.3, status: 'contaminated', material: 'ورق' },
  { id: 'B-2024-0894', source: 'مولد أسيوط', contLevel: 1.8, status: 'clean', material: 'حديد' },
  { id: 'B-2024-0895', source: 'مولد المنصورة', contLevel: 12.0, status: 'contaminated', material: 'زجاج' },
];

const statusCfg = {
  clean: { label: 'نظيف', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  warning: { label: 'تحذير', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertTriangle },
  contaminated: { label: 'ملوث', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: ShieldAlert },
};

const RecyclerContaminationDetector = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ShieldAlert className="h-5 w-5 text-primary" />
        كاشف التلوث في الدُفعات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {batches.map((b) => {
        const cfg = statusCfg[b.status as keyof typeof statusCfg];
        const Icon = cfg.icon;
        return (
          <div key={b.id} className="flex items-center justify-between p-2 rounded border">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{b.id} — {b.material}</p>
                <p className="text-xs text-muted-foreground">{b.source}</p>
              </div>
            </div>
            <div className="text-left">
              <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
              <p className="text-xs text-muted-foreground mt-1">{b.contLevel}%</p>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerContaminationDetector;
