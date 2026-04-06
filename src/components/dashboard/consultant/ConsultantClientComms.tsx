/**
 * تواصل الاستشاري مع العملاء
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Video, Phone, Calendar, User } from 'lucide-react';

const interactions = [
  { client: 'شركة الدلتا', type: 'meeting', title: 'مراجعة تقرير EIA', date: '2026-04-08', time: '10:00 ص' },
  { client: 'مستشفى السلام', type: 'call', title: 'متابعة مستندات', date: '2026-04-07', time: '2:00 م' },
  { client: 'هيئة الاستثمار', type: 'message', title: 'استفسار عن الجدول الزمني', date: '2026-04-06', time: '' },
];

const typeConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
  meeting: { label: 'اجتماع', icon: Video, color: 'text-blue-600' },
  call: { label: 'مكالمة', icon: Phone, color: 'text-green-600' },
  message: { label: 'رسالة', icon: MessageCircle, color: 'text-amber-600' },
};

const ConsultantClientComms = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        التواصل مع العملاء
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {interactions.map((int, i) => {
        const cfg = typeConfig[int.type];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <Icon className={`h-4 w-4 ${cfg.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{int.title}</p>
              <p className="text-[10px] text-muted-foreground">{int.client} • {new Date(int.date).toLocaleDateString('ar-EG')} {int.time}</p>
            </div>
            <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default ConsultantClientComms;
