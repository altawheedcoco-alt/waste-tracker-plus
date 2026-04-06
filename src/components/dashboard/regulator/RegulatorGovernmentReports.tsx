/**
 * تقارير حكومية دورية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileBarChart, Download, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reports = [
  { title: 'التقرير الشهري لإدارة المخلفات', period: 'مارس 2026', status: 'ready', dueDate: '2026-04-10' },
  { title: 'تقرير الامتثال الربع سنوي', period: 'Q1 2026', status: 'draft', dueDate: '2026-04-15' },
  { title: 'تقرير المؤشرات البيئية', period: 'مارس 2026', status: 'ready', dueDate: '2026-04-08' },
  { title: 'تقرير التراخيص والتصاريح', period: 'مارس 2026', status: 'pending', dueDate: '2026-04-12' },
];

const RegulatorGovernmentReports = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileBarChart className="h-4 w-4 text-primary" />
        التقارير الحكومية
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {reports.map((r, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{r.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{r.period}</span>
              <span className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(r.dueDate).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
          {r.status === 'ready' ? (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
              <Download className="h-3 w-3 ml-1" />
              تحميل
            </Button>
          ) : (
            <Badge variant={r.status === 'draft' ? 'secondary' : 'outline'} className="text-[9px]">
              {r.status === 'draft' ? 'مسودة' : 'معلق'}
            </Badge>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorGovernmentReports;
