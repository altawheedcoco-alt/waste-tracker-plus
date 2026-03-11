import { Card, CardContent } from '@/components/ui/card';
import { Package, Store, ShoppingCart, TrendingUp } from 'lucide-react';
import { useB2BStats } from '@/hooks/useB2BMarketplace';

const B2BStatsBar = () => {
  const { data: stats } = useB2BStats();

  const cards = [
    { label: 'عروض متاحة لك', value: stats?.openCount || 0, icon: Package, color: 'text-primary' },
    { label: 'عروضي المنشورة', value: stats?.myCount || 0, icon: Store, color: 'text-emerald-600' },
    { label: 'عروضي النشطة', value: stats?.myActiveCount || 0, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'عروض أسعار واردة', value: stats?.totalBids || 0, icon: ShoppingCart, color: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default B2BStatsBar;
