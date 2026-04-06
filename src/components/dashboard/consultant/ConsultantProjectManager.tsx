/**
 * إدارة مشاريع الاستشاري الفرد
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const projects = [
  { name: 'دراسة EIA لمصنع أسمدة', client: 'شركة الدلتا', progress: 80, fee: '45,000 ج.م', status: 'active', deadline: '2026-04-20' },
  { name: 'خطة إدارة مخلفات مستشفى', client: 'مستشفى السلام', progress: 35, fee: '28,000 ج.م', status: 'active', deadline: '2026-05-15' },
  { name: 'تدقيق بيئي سنوي', client: 'مصنع الزجاج', progress: 100, fee: '18,000 ج.م', status: 'completed', deadline: '2026-03-30' },
  { name: 'تقييم مخاطر منطقة صناعية', client: 'هيئة الاستثمار', progress: 15, fee: '65,000 ج.م', status: 'active', deadline: '2026-06-01' },
];

const ConsultantProjectManager = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-primary" />
        مشاريعي
        <Badge variant="secondary" className="mr-auto text-[9px]">{projects.filter(p => p.status === 'active').length} نشط</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {projects.map((p, i) => (
        <div key={i} className="p-2 rounded border space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{p.name}</p>
            {p.status === 'completed' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground">{p.client} • {p.fee}</p>
          {p.status === 'active' && (
            <>
              <div className="flex items-center gap-2">
                <Progress value={p.progress} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                الموعد: {new Date(p.deadline).toLocaleDateString('ar-EG')}
              </div>
            </>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ConsultantProjectManager;
