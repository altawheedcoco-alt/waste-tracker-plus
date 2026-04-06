/**
 * تقييمات العملاء للسائق
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, MessageSquare, User } from 'lucide-react';

const reviews = [
  { client: 'شركة النهضة', rating: 5, comment: 'ممتاز، دقيق في المواعيد ومحترف', date: '2026-04-05' },
  { client: 'مصنع البلاستيك', rating: 4, comment: 'جيد جداً، يحتاج تحسين في التوثيق', date: '2026-04-03' },
  { client: 'المنطقة الحرة', rating: 5, comment: 'أفضل سائق تعاملنا معه', date: '2026-04-01' },
  { client: 'شركة الكيماويات', rating: 3, comment: 'تأخر 20 دقيقة عن الموعد', date: '2026-03-28' },
];

const DriverClientReviews = () => {
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          تقييمات العملاء
          <Badge className="mr-auto text-[9px] bg-amber-500/10 text-amber-700 border-0">
            <Star className="h-2.5 w-2.5 fill-current ml-0.5" />
            {avgRating}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reviews.map((r, i) => (
          <div key={i} className="p-2 rounded border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{r.client}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-2.5 w-2.5 ${j < r.rating ? 'text-amber-500 fill-current' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{r.comment}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(r.date).toLocaleDateString('ar-EG')}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DriverClientReviews;
