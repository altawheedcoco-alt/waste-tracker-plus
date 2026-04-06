import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const projects = [
  { name: 'تقييم بيئي — مصنع الدلتا', client: 'مصنع الدلتا للكيماويات', progress: 85, status: 'active', deadline: '2026-04-20' },
  { name: 'خطة إدارة مخلفات — فندق النيل', client: 'فندق النيل الكبير', progress: 45, status: 'active', deadline: '2026-05-15' },
  { name: 'مراجعة امتثال — شركة النور', client: 'شركة النور للصناعات', progress: 100, status: 'completed', deadline: '2026-03-30' },
  { name: 'تدقيق ESG — مجموعة الأمل', client: 'مجموعة الأمل القابضة', progress: 20, status: 'active', deadline: '2026-06-01' },
];

const statusMap = {
  active: { label: 'نشط', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

const ConsultantProjectTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Briefcase className="h-5 w-5 text-primary" />
        متابعة المشاريع
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {projects.map((p, i) => {
        const cfg = statusMap[p.status as keyof typeof statusMap];
        return (
          <div key={i} className="p-3 rounded-lg border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.client} • حتى {p.deadline}</p>
              </div>
              <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
            </div>
            <Progress value={p.progress} className="h-2" />
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default ConsultantProjectTracker;
