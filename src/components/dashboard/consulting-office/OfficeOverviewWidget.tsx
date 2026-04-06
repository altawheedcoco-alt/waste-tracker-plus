/**
 * ملخص عام للمكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FolderOpen, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'عملاء نشطون', value: 14, icon: Users, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'مشاريع جارية', value: 8, icon: FolderOpen, color: 'text-green-600 dark:text-green-400' },
  { label: 'استشاريون', value: 6, icon: Building2, color: 'text-purple-600 dark:text-purple-400' },
  { label: 'نمو شهري', value: '+12%', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400' },
];

const OfficeOverviewWidget = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        نظرة عامة على المكتب
        <Badge variant="outline" className="mr-auto text-[9px]">مباشر</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <div className="text-lg font-bold">{s.value}</div>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default OfficeOverviewWidget;
