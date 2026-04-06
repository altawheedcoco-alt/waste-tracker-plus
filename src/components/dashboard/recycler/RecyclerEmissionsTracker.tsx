import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Wind, Flame, TrendingDown } from 'lucide-react';

const emissions = [
  { source: 'عوادم الأفران', type: 'CO₂', value: '12.5 طن/شهر', limit: '15 طن', status: 'ok' },
  { source: 'خط البلاستيك', type: 'VOCs', value: '2.1 ppm', limit: '5 ppm', status: 'ok' },
  { source: 'محرقة النفايات', type: 'PM2.5', value: '45 µg/m³', limit: '50 µg/m³', status: 'warning' },
  { source: 'مولدات الطاقة', type: 'NOx', value: '18 ppm', limit: '40 ppm', status: 'ok' },
];

const RecyclerEmissionsTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Cloud className="h-5 w-5 text-primary" />
        مراقبة الانبعاثات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {emissions.map((e, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{e.source}</p>
              <p className="text-xs text-muted-foreground">{e.type} • الحد: {e.limit}</p>
            </div>
          </div>
          <span className={`text-sm font-bold ${e.status === 'ok' ? 'text-green-600' : 'text-yellow-600'}`}>
            {e.value}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t text-xs text-green-600">
        <TrendingDown className="h-3 w-3" />
        الانبعاثات أقل من الحدود المسموحة بنسبة 22%
      </div>
    </CardContent>
  </Card>
);

export default RecyclerEmissionsTracker;
