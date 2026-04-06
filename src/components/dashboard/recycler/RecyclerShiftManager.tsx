import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Moon, Sun, Sunset } from 'lucide-react';

const shifts = [
  { name: 'الوردية الصباحية', time: '06:00 - 14:00', icon: Sun, workers: 45, status: 'active', output: '120 طن' },
  { name: 'الوردية المسائية', time: '14:00 - 22:00', icon: Sunset, workers: 38, status: 'upcoming', output: '—' },
  { name: 'الوردية الليلية', time: '22:00 - 06:00', icon: Moon, workers: 22, status: 'off', output: '—' },
];

const statusMap = {
  active: { label: 'نشطة الآن', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  upcoming: { label: 'قادمة', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  off: { label: 'متوقفة', color: 'bg-muted text-muted-foreground border-border' },
};

const RecyclerShiftManager = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Clock className="h-5 w-5 text-primary" />
        إدارة الورديات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {shifts.map((s, i) => {
        const Icon = s.icon;
        const cfg = statusMap[s.status as keyof typeof statusMap];
        return (
          <div key={i} className="p-3 rounded-lg border bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{s.name}</span>
              </div>
              <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{s.time}</span>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" /> {s.workers} عامل
                {s.output !== '—' && <span>• إنتاج: {s.output}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerShiftManager;
