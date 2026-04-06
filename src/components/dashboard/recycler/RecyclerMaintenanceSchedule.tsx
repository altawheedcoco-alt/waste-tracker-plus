import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, AlertCircle } from 'lucide-react';

const tasks = [
  { equipment: 'كسارة البلاستيك #1', type: 'وقائية', date: '2026-04-08', priority: 'عالية', status: 'scheduled' },
  { equipment: 'فرن الصهر #2', type: 'تنبؤية (AI)', date: '2026-04-10', priority: 'متوسطة', status: 'scheduled' },
  { equipment: 'حزام ناقل #5', type: 'طارئة', date: '2026-04-06', priority: 'حرجة', status: 'in_progress' },
  { equipment: 'ماكينة غسيل #3', type: 'وقائية', date: '2026-04-15', priority: 'منخفضة', status: 'scheduled' },
  { equipment: 'مكبس الورق #1', type: 'تنبؤية (AI)', date: '2026-04-12', priority: 'عالية', status: 'scheduled' },
];

const priorityColor = {
  'حرجة': 'bg-destructive/10 text-destructive border-destructive/30',
  'عالية': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'متوسطة': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  'منخفضة': 'bg-green-500/10 text-green-600 border-green-500/30',
};

const RecyclerMaintenanceSchedule = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Wrench className="h-5 w-5 text-primary" />
        جدول الصيانة القادم
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {tasks.map((t, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            {t.priority === 'حرجة' ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Calendar className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{t.equipment}</p>
              <p className="text-xs text-muted-foreground">{t.type} • {t.date}</p>
            </div>
          </div>
          <Badge variant="outline" className={priorityColor[t.priority as keyof typeof priorityColor]}>
            {t.priority}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerMaintenanceSchedule;
