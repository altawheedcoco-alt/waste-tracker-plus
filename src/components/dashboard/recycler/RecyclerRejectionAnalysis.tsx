import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, TrendingDown } from 'lucide-react';

const rejections = [
  { source: 'مولد القاهرة', totalShipments: 48, rejected: 3, rate: 6.25, reason: 'تلوث عالي / خلط مواد' },
  { source: 'مولد الإسكندرية', totalShipments: 30, rejected: 5, rate: 16.67, reason: 'رطوبة زائدة / وزن غير مطابق' },
  { source: 'مولد أسيوط', totalShipments: 22, rejected: 1, rate: 4.55, reason: 'مواد محظورة' },
  { source: 'مولد الجيزة', totalShipments: 35, rejected: 2, rate: 5.71, reason: 'تلوث كيميائي' },
];

const RecyclerRejectionAnalysis = () => {
  const totalRejected = rejections.reduce((s, r) => s + r.rejected, 0);
  const totalShipments = rejections.reduce((s, r) => s + r.totalShipments, 0);
  const overallRate = ((totalRejected / totalShipments) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <XCircle className="h-5 w-5 text-primary" />
          تحليل الشحنات المرفوضة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-2xl font-bold text-destructive">{totalRejected} / {totalShipments}</p>
          <p className="text-sm text-muted-foreground">معدل الرفض الإجمالي: {overallRate}%</p>
        </div>
        {rejections.map((r, i) => (
          <div key={i} className="p-2 rounded border">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{r.source}</span>
              <span className={`font-bold ${r.rate > 10 ? 'text-destructive' : 'text-yellow-600'}`}>{r.rate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{r.rejected}/{r.totalShipments} شحنة — {r.reason}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecyclerRejectionAnalysis;
