import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const clients = [
  { name: 'مصنع الدلتا للكيماويات', type: 'مولد', compliance: 92, risk: 'منخفض' },
  { name: 'فندق النيل الكبير', type: 'مولد', compliance: 68, risk: 'متوسط' },
  { name: 'شركة النور للصناعات', type: 'مولد', compliance: 85, risk: 'منخفض' },
  { name: 'شركة الوادي للنقل', type: 'ناقل', compliance: 74, risk: 'متوسط' },
  { name: 'مجموعة الأمل القابضة', type: 'مولد', compliance: 45, risk: 'عالي' },
];

const riskColor = {
  'منخفض': 'text-green-600',
  'متوسط': 'text-yellow-600',
  'عالي': 'text-destructive',
};

const ConsultantClientRiskMap = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Shield className="h-5 w-5 text-primary" />
        خريطة مخاطر العملاء
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {clients.map((c, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground mr-2"> ({c.type})</span>
            </div>
            <span className={`text-xs font-bold ${riskColor[c.risk as keyof typeof riskColor]}`}>{c.risk}</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={c.compliance} className={`flex-1 h-2 ${c.compliance < 60 ? '[&>div]:bg-destructive' : ''}`} />
            <span className="text-xs font-bold">{c.compliance}%</span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ConsultantClientRiskMap;
