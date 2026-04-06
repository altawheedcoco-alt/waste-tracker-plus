/**
 * لوحة مهام الموظف - النظام المركزي
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const tasks = [
  { title: 'مراجعة شحنة SHP-2841', partner: 'شركة النهضة', status: 'in_progress', priority: 'high', deadline: '2026-04-07', progress: 60 },
  { title: 'تحديث بيانات العقد #128', partner: 'المنطقة الحرة', status: 'pending', priority: 'medium', deadline: '2026-04-09', progress: 0 },
  { title: 'إصدار فاتورة شهر مارس', partner: 'مصنع البلاستيك', status: 'in_progress', priority: 'high', deadline: '2026-04-08', progress: 40 },
  { title: 'تأكيد استلام حمولة', partner: 'شركة النقل المتحدة', status: 'completed', priority: 'low', deadline: '2026-04-05', progress: 100 },
  { title: 'رفع مستندات تفتيش', partner: 'جهة رقابية', status: 'pending', priority: 'urgent', deadline: '2026-04-06', progress: 0 },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'معلّق', color: 'text-gray-600', icon: Clock },
  in_progress: { label: 'جارٍ', color: 'text-blue-600', icon: Play },
  completed: { label: 'مكتمل', color: 'text-green-600', icon: CheckCircle2 },
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  low: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
};

const EmployeeTaskBoard = () => {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          مهامي
          <Badge variant="secondary" className="mr-auto text-[9px]">{completed}/{total} مكتمل</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((t, i) => {
          const s = statusConfig[t.status];
          const Icon = s.icon;
          return (
            <div key={i} className={`p-2 rounded border ${t.priority === 'urgent' ? 'border-red-300 dark:border-red-800' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3 w-3 ${s.color}`} />
                  <p className="text-xs font-medium">{t.title}</p>
                </div>
                <Badge className={`text-[8px] border-0 ${priorityColors[t.priority]}`}>
                  {t.priority === 'urgent' ? 'عاجل' : t.priority === 'high' ? 'مهم' : t.priority === 'medium' ? 'متوسط' : 'عادي'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.partner} • {new Date(t.deadline).toLocaleDateString('ar-EG')}</p>
              {t.status !== 'completed' && t.progress > 0 && (
                <Progress value={t.progress} className="h-1 mt-1" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EmployeeTaskBoard;
