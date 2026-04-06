/**
 * خريطة النفايات الوطنية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Layers, Eye } from 'lucide-react';

const regions = [
  { name: 'القاهرة الكبرى', generators: 845, transporters: 52, recyclers: 28, dailyTons: 12400 },
  { name: 'الإسكندرية', generators: 412, transporters: 24, recyclers: 15, dailyTons: 5200 },
  { name: 'الدلتا', generators: 680, transporters: 38, recyclers: 18, dailyTons: 8900 },
  { name: 'الصعيد', generators: 520, transporters: 32, recyclers: 12, dailyTons: 6800 },
  { name: 'القناة والسويس', generators: 390, transporters: 40, recyclers: 21, dailyTons: 11900 },
];

const RegulatorWasteMap = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Map className="h-4 w-4 text-primary" />
        خريطة النفايات حسب المنطقة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {regions.map((r, i) => (
        <div key={i} className="p-2 rounded border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium">{r.name}</p>
            <Badge variant="outline" className="text-[9px]">{r.dailyTons.toLocaleString()} طن/يوم</Badge>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="text-[9px] p-1 rounded bg-muted/50">
              <div className="font-bold text-xs">{r.generators}</div>
              <span className="text-muted-foreground">مولّد</span>
            </div>
            <div className="text-[9px] p-1 rounded bg-muted/50">
              <div className="font-bold text-xs">{r.transporters}</div>
              <span className="text-muted-foreground">ناقل</span>
            </div>
            <div className="text-[9px] p-1 rounded bg-muted/50">
              <div className="font-bold text-xs">{r.recyclers}</div>
              <span className="text-muted-foreground">مدوّر</span>
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorWasteMap;
