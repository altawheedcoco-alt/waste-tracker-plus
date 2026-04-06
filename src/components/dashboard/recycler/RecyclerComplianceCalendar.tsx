import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Bell } from 'lucide-react';

const events = [
  { date: '2026-04-08', title: 'تجديد ترخيص صناعي', type: 'license', urgency: 'high' },
  { date: '2026-04-15', title: 'تفتيش بيئي دوري', type: 'inspection', urgency: 'high' },
  { date: '2026-04-20', title: 'تقرير ESG ربع سنوي', type: 'report', urgency: 'medium' },
  { date: '2026-05-01', title: 'تجديد شهادة ISO 14001', type: 'cert', urgency: 'medium' },
  { date: '2026-05-10', title: 'معايرة أجهزة القياس', type: 'calibration', urgency: 'low' },
  { date: '2026-05-15', title: 'إقرار WMIS شهري', type: 'declaration', urgency: 'medium' },
];

const urgencyColor = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  low: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const RecyclerComplianceCalendar = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <CalendarDays className="h-5 w-5 text-primary" />
        تقويم الامتثال
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.date}</p>
            </div>
          </div>
          <Badge variant="outline" className={urgencyColor[e.urgency as keyof typeof urgencyColor]}>
            {e.urgency === 'high' ? 'عاجل' : e.urgency === 'medium' ? 'متوسط' : 'منخفض'}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerComplianceCalendar;
