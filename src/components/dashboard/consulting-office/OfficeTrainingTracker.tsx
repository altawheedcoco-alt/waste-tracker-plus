/**
 * متتبع التدريب والتطوير المهني
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Award, Calendar, Users } from 'lucide-react';

const trainings = [
  { title: 'تحديث معايير EIA 2026', date: '2026-04-15', attendees: 4, status: 'upcoming' },
  { title: 'ورشة إدارة المخلفات الخطرة', date: '2026-03-20', attendees: 3, status: 'completed' },
  { title: 'شهادة مراجع بيئي معتمد', date: '2026-05-01', attendees: 2, status: 'upcoming' },
  { title: 'تدريب ISO 14001:2015', date: '2026-02-10', attendees: 5, status: 'completed' },
];

const OfficeTrainingTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        التدريب والتطوير
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {trainings.map((t, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border">
          {t.status === 'completed' ? (
            <Award className="h-4 w-4 text-green-500 shrink-0" />
          ) : (
            <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{t.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{new Date(t.date).toLocaleDateString('ar-EG')}</span>
              <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{t.attendees}</span>
            </div>
          </div>
          <Badge variant={t.status === 'completed' ? 'secondary' : 'outline'} className="text-[9px]">
            {t.status === 'completed' ? 'مكتمل' : 'قادم'}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeTrainingTracker;
