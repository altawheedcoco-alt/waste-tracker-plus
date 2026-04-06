import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const slas = [
  { client: 'مصنع الحديد', responseTime: '4 ساعات', actual: '3.5 ساعات', onTimeRate: 96, status: 'met' as const },
  { client: 'مستشفى القاهرة', responseTime: '2 ساعات', actual: '2.8 ساعات', onTimeRate: 82, status: 'at_risk' as const },
  { client: 'فندق النيل', responseTime: '6 ساعات', actual: '5 ساعات', onTimeRate: 100, status: 'met' as const },
];

const statusConfig = {
  met: { label: 'محقق', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  at_risk: { label: 'في خطر', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  breached: { label: 'مخالف', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function SLAManager() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Handshake className="w-5 h-5 text-primary" />
          اتفاقيات مستوى الخدمة (SLA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {slas.map((s, i) => {
          const config = statusConfig[s.status];
          const Icon = config.icon;
          return (
            <div key={i} className="p-2.5 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{s.client}</span>
                <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                  <Icon className="w-3 h-3 ml-1" /> {config.label}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div><p className="text-muted-foreground">المتفق</p><p className="font-bold">{s.responseTime}</p></div>
                <div><p className="text-muted-foreground">الفعلي</p><p className="font-bold">{s.actual}</p></div>
                <div><p className="text-muted-foreground">الالتزام</p><p className={`font-bold ${s.onTimeRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{s.onTimeRate}%</p></div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
