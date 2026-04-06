import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Calendar, MapPin } from 'lucide-react';

const inspections = [
  { org: 'مصنع الدلتا للتدوير', date: '2026-04-10', type: 'دوري', location: 'المنصورة', inspector: 'م. أحمد سالم', status: 'scheduled' },
  { org: 'شركة الوادي للنقل', date: '2026-04-12', type: 'مفاجئ', location: 'أسيوط', inspector: 'م. هالة محمود', status: 'scheduled' },
  { org: 'شركة النيل للمخلفات', date: '2026-04-08', type: 'متابعة', location: 'القاهرة', inspector: 'م. كريم عادل', status: 'in_progress' },
  { org: 'مدفن أبو رواش', date: '2026-04-05', type: 'دوري', location: 'الجيزة', inspector: 'م. سارة حسن', status: 'completed' },
];

const statusMap = {
  scheduled: { label: 'مجدول', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  in_progress: { label: 'جارٍ', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

const RegulatorInspectionSchedule = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        جدول التفتيشات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {inspections.map((ins, i) => {
        const cfg = statusMap[ins.status as keyof typeof statusMap];
        return (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">{ins.org}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {ins.date} •
                <MapPin className="h-3 w-3" /> {ins.location}
              </p>
              <p className="text-xs text-muted-foreground">{ins.type} • {ins.inspector}</p>
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorInspectionSchedule;
