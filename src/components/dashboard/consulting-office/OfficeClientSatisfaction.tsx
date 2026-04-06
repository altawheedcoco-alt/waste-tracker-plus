/**
 * رضا عملاء المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmilePlus, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

const ratings = [
  { label: 'ممتاز', count: 18, icon: SmilePlus, color: 'text-green-600' },
  { label: 'جيد', count: 8, icon: ThumbsUp, color: 'text-blue-600' },
  { label: 'متوسط', count: 3, icon: Meh, color: 'text-amber-600' },
  { label: 'ضعيف', count: 1, icon: ThumbsDown, color: 'text-red-600' },
];

const OfficeClientSatisfaction = () => {
  const total = ratings.reduce((s, r) => s + r.count, 0);
  const score = ((ratings[0].count * 4 + ratings[1].count * 3 + ratings[2].count * 2 + ratings[3].count) / (total * 4) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <SmilePlus className="h-4 w-4 text-primary" />
          رضا العملاء
          <Badge className="mr-auto text-[9px] bg-green-500/10 text-green-700 border-0">{score}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ratings.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <r.icon className={`h-4 w-4 ${r.color}`} />
            <span className="text-xs w-12">{r.label}</span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full bg-primary/60"
                style={{ width: `${(r.count / total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-6 text-left">{r.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OfficeClientSatisfaction;
