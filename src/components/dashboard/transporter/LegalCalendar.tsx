import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock, FileCheck } from 'lucide-react';

const obligations = [
  { title: 'تجديد ترخيص EEAA', date: '2026-04-15', type: 'renewal', daysLeft: 9, urgency: 'urgent' as const },
  { title: 'تقرير ربع سنوي - WMRA', date: '2026-04-30', type: 'report', daysLeft: 24, urgency: 'warning' as const },
  { title: 'رسوم تفتيش سنوية', date: '2026-05-10', type: 'fee', daysLeft: 34, urgency: 'normal' as const },
  { title: 'تجديد تأمين المسؤولية', date: '2026-05-20', type: 'renewal', daysLeft: 44, urgency: 'normal' as const },
  { title: 'فحص فني للمركبات', date: '2026-06-01', type: 'inspection', daysLeft: 56, urgency: 'normal' as const },
  { title: 'تدريب سلامة سنوي', date: '2026-06-15', type: 'training', daysLeft: 70, urgency: 'normal' as const },
];

const urgencyConfig = {
  urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  normal: { color: 'bg-green-100 text-green-800 border-green-200', icon: FileCheck },
};

export default function LegalCalendar() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-5 h-5 text-primary" />
          تقويم الالتزامات القانونية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {obligations.map((ob, i) => {
            const config = urgencyConfig[ob.urgency];
            const Icon = config.icon;
            return (
              <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${ob.urgency === 'urgent' ? 'border-red-200 bg-red-50/50' : ''}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${ob.urgency === 'urgent' ? 'text-red-500' : ob.urgency === 'warning' ? 'text-yellow-500' : 'text-green-500'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ob.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ob.date}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${config.color}`}>
                  {ob.daysLeft} يوم
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
