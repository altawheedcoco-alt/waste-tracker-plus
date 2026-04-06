import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Star, TrendingUp } from 'lucide-react';

const buyers = [
  { name: 'مصنع الأمل للبلاستيك', since: '2023', totalOrders: 85, revenue: '1.2M ج.م', satisfaction: 4.8, trend: '+12%' },
  { name: 'شركة النيل للتغليف', since: '2024', totalOrders: 42, revenue: '680K ج.م', satisfaction: 4.5, trend: '+8%' },
  { name: 'مصنع الحديد المصري', since: '2022', totalOrders: 120, revenue: '2.8M ج.م', satisfaction: 4.9, trend: '+15%' },
  { name: 'شركة البناء الحديث', since: '2024', totalOrders: 18, revenue: '320K ج.م', satisfaction: 4.2, trend: '+5%' },
];

const RecyclerBuyerRelationships = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Handshake className="h-5 w-5 text-primary" />
        علاقات المشترين
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {buyers.map((b, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{b.name}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold">{b.satisfaction}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span>منذ {b.since}</span>
            <span>{b.totalOrders} طلب</span>
            <span className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" /> {b.trend}
            </span>
          </div>
          <p className="text-xs text-primary mt-1 font-bold">{b.revenue}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerBuyerRelationships;
