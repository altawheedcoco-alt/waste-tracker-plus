/**
 * أداء فريق المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Clock, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const team = [
  { name: 'د. أحمد سالم', role: 'استشاري بيئي أول', projects: 3, rating: 4.8, utilization: 85 },
  { name: 'م. سارة عبدالله', role: 'مهندسة بيئية', projects: 2, rating: 4.5, utilization: 70 },
  { name: 'م. خالد محمود', role: 'مراجع مستندات', projects: 4, rating: 4.2, utilization: 92 },
  { name: 'أ. نورا حسين', role: 'محللة بيانات', projects: 2, rating: 4.6, utilization: 60 },
];

const OfficeTeamPerformance = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        أداء الفريق
        <Badge variant="outline" className="mr-auto text-[9px]">{team.length} أعضاء</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {team.map((m, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {m.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{m.name}</p>
            <p className="text-[10px] text-muted-foreground">{m.role} • {m.projects} مشاريع</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={m.utilization} className="h-1 flex-1" />
              <span className="text-[9px] text-muted-foreground">{m.utilization}%</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-medium">{m.rating}</span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeTeamPerformance;
