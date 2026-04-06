import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, Zap, Thermometer, Gauge } from 'lucide-react';

const lines = [
  { name: 'خط PET #1', status: 'running', speed: 92, temp: 185, output: '3.2 ط/ساعة', uptime: 97 },
  { name: 'خط HDPE #2', status: 'running', speed: 88, temp: 210, output: '2.8 ط/ساعة', uptime: 94 },
  { name: 'خط الورق #3', status: 'maintenance', speed: 0, temp: 0, output: '0 ط/ساعة', uptime: 0 },
  { name: 'خط الحديد #4', status: 'running', speed: 95, temp: 1200, output: '5.1 ط/ساعة', uptime: 99 },
  { name: 'خط الزجاج #5', status: 'idle', speed: 0, temp: 25, output: '0 ط/ساعة', uptime: 0 },
];

const statusMap = {
  running: { label: 'يعمل', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  maintenance: { label: 'صيانة', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  idle: { label: 'متوقف', color: 'bg-muted text-muted-foreground border-border' },
};

const RecyclerProductionLineMonitor = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Factory className="h-5 w-5 text-primary" />
        مراقبة خطوط الإنتاج الحية
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {lines.map((line, i) => {
        const s = statusMap[line.status as keyof typeof statusMap];
        return (
          <div key={i} className="p-3 rounded-lg border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{line.name}</span>
              <Badge variant="outline" className={s.color}>{s.label}</Badge>
            </div>
            {line.status === 'running' && (
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> سرعة: {line.speed}%
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> {line.temp}°C
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {line.output}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerProductionLineMonitor;
