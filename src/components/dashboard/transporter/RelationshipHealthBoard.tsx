import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, TrendingDown, MessageSquare, Star, Clock } from 'lucide-react';

const partners = [
  { name: 'مصنع الحديد', frequency: 48, paymentSpeed: 'سريع', complaints: 0, rating: 4.8, health: 95 },
  { name: 'مستشفى القاهرة', frequency: 24, paymentSpeed: 'متوسط', complaints: 1, rating: 4.2, health: 78 },
  { name: 'فندق النيل', frequency: 12, paymentSpeed: 'بطيء', complaints: 3, rating: 3.5, health: 55 },
  { name: 'مصنع البلاستيك', frequency: 36, paymentSpeed: 'سريع', complaints: 0, rating: 4.6, health: 90 },
];

const getHealthColor = (h: number) => h >= 80 ? 'bg-green-100 text-green-800' : h >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

export default function RelationshipHealthBoard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-primary" />
          لوحة صحة العلاقة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {partners.map((p, i) => (
          <div key={i} className="p-2.5 rounded-lg border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{p.name}</span>
              <Badge variant="outline" className={`text-[10px] ${getHealthColor(p.health)}`}>{p.health}%</Badge>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
              <div><p className="font-bold">{p.frequency}</p><p className="text-muted-foreground">شحنة/سنة</p></div>
              <div><p className="font-bold">{p.paymentSpeed}</p><p className="text-muted-foreground">سرعة الدفع</p></div>
              <div><p className={`font-bold ${p.complaints > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.complaints}</p><p className="text-muted-foreground">شكاوى</p></div>
              <div><p className="font-bold">{p.rating}★</p><p className="text-muted-foreground">تقييم</p></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
