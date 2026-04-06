import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

const evaluations = [
  { driver: 'أحمد محمد', supervisor: 4.5, client: 4.8, partner: 4.2, self: 4.0, avg: 4.4 },
  { driver: 'محمد علي', supervisor: 3.8, client: 4.0, partner: 3.5, self: 4.2, avg: 3.9 },
  { driver: 'خالد حسن', supervisor: 4.9, client: 4.7, partner: 4.8, self: 4.5, avg: 4.7 },
];

const getColor = (v: number) => v >= 4.5 ? 'text-green-600' : v >= 3.5 ? 'text-yellow-600' : 'text-red-600';

export default function Driver360Review() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="w-5 h-5 text-primary" />
          تقييم 360° للسائقين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {evaluations.map((ev, i) => (
          <div key={i} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{ev.driver}</span>
              <Badge variant="outline" className={`${ev.avg >= 4.5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {ev.avg} ★
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'المشرف', val: ev.supervisor },
                { label: 'العميل', val: ev.client },
                { label: 'الشريك', val: ev.partner },
                { label: 'ذاتي', val: ev.self },
              ].map(item => (
                <div key={item.label}>
                  <p className={`text-sm font-bold ${getColor(item.val)}`}>{item.val}</p>
                  <p className="text-[9px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
