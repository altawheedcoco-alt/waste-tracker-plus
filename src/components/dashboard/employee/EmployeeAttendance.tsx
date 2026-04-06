/**
 * الحضور والانصراف للموظف
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';

const attendance = [
  { date: '2026-04-06', checkIn: '08:02', checkOut: null, hours: null, status: 'present' },
  { date: '2026-04-05', checkIn: '07:55', checkOut: '16:10', hours: '8:15', status: 'present' },
  { date: '2026-04-04', checkIn: '08:30', checkOut: '16:45', hours: '8:15', status: 'late' },
  { date: '2026-04-03', checkIn: '08:00', checkOut: '16:00', hours: '8:00', status: 'present' },
  { date: '2026-04-02', checkIn: null, checkOut: null, hours: null, status: 'leave' },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  present: { label: 'حاضر', color: 'text-green-600' },
  late: { label: 'متأخر', color: 'text-amber-600' },
  leave: { label: 'إجازة', color: 'text-blue-600' },
  absent: { label: 'غائب', color: 'text-red-600' },
};

const EmployeeAttendance = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        الحضور والانصراف
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {attendance.map((a, i) => {
        const s = statusLabels[a.status];
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs">{new Date(a.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              {a.checkIn && (
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><LogIn className="h-2.5 w-2.5" />{a.checkIn}</span>
                  {a.checkOut && <span className="flex items-center gap-0.5"><LogOut className="h-2.5 w-2.5" />{a.checkOut}</span>}
                  {a.hours && <span>{a.hours} ساعة</span>}
                </div>
              )}
            </div>
            <span className={`text-[9px] font-medium ${s.color}`}>{s.label}</span>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default EmployeeAttendance;
