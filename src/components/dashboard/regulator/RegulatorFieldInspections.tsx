/**
 * نظام التفتيش الميداني
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, MapPin, Calendar, User, AlertTriangle, CheckCircle2 } from 'lucide-react';

const inspections = [
  { entity: 'شركة النقل المتحدة', type: 'transporter', location: 'القاهرة', date: '2026-04-08', inspector: 'م. أحمد', status: 'scheduled', priority: 'routine' },
  { entity: 'مصنع البلاستيك الحديث', type: 'recycler', location: '6 أكتوبر', date: '2026-04-10', inspector: 'م. سارة', status: 'scheduled', priority: 'follow-up' },
  { entity: 'موقع دفن الوادي', type: 'disposal', location: 'الفيوم', date: '2026-04-05', inspector: 'م. خالد', status: 'completed', priority: 'urgent' },
  { entity: 'مصنع كيماويات النيل', type: 'generator', location: 'الإسكندرية', date: '2026-04-12', inspector: 'م. نورا', status: 'scheduled', priority: 'routine' },
];

const priorityColors: Record<string, string> = {
  routine: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'follow-up': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300',
};

const RegulatorFieldInspections = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        التفتيش الميداني
        <Badge variant="secondary" className="mr-auto text-[9px]">{inspections.filter(i => i.status === 'scheduled').length} قادم</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {inspections.map((ins, i) => (
        <div key={i} className="p-2 rounded border space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{ins.entity}</p>
            <Badge className={`text-[9px] border-0 ${priorityColors[ins.priority]}`}>
              {ins.priority === 'routine' ? 'دوري' : ins.priority === 'follow-up' ? 'متابعة' : 'عاجل'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ins.location}</span>
            <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{new Date(ins.date).toLocaleDateString('ar-EG')}</span>
            <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{ins.inspector}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            {ins.status === 'completed' ? (
              <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-600">مكتمل</span></>
            ) : (
              <><Calendar className="h-3 w-3 text-blue-500" /><span className="text-blue-600">مجدول</span></>
            )}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorFieldInspections;
