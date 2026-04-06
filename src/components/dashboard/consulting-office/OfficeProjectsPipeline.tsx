/**
 * خط أنابيب المشاريع للمكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Clock, CheckCircle2, AlertTriangle, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const projects = [
  { name: 'دراسة أثر بيئي - مصنع الأسمنت', client: 'شركة النهضة', progress: 75, status: 'active', deadline: '2026-05-01' },
  { name: 'خطة إدارة مخلفات - مجمع سكني', client: 'هيئة المجتمعات', progress: 40, status: 'active', deadline: '2026-06-15' },
  { name: 'تدقيق بيئي - محطة كهرباء', client: 'وزارة الكهرباء', progress: 90, status: 'review', deadline: '2026-04-20' },
  { name: 'تقييم مخاطر - منطقة صناعية', client: 'المنطقة الحرة', progress: 10, status: 'pending', deadline: '2026-07-01' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'جارٍ', variant: 'default' },
  review: { label: 'مراجعة', variant: 'secondary' },
  pending: { label: 'معلّق', variant: 'outline' },
};

const OfficeProjectsPipeline = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FolderKanban className="h-4 w-4 text-primary" />
        المشاريع الجارية
        <Badge variant="secondary" className="mr-auto text-[9px]">{projects.length} مشروع</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {projects.map((p, i) => (
        <div key={i} className="space-y-1.5 p-2 rounded-lg border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.client}</p>
            </div>
            <Badge variant={statusConfig[p.status].variant} className="text-[9px]">
              {statusConfig[p.status].label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={p.progress} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            الموعد: {new Date(p.deadline).toLocaleDateString('ar-EG')}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeProjectsPipeline;
