import { Card, CardContent } from '@/components/ui/card';
import { Package, Store, ShoppingCart, TrendingUp, Handshake, Search, Heart, CheckCircle2 } from 'lucide-react';
import { useB2BStats } from '@/hooks/useB2BMarketplace';

const B2BStatsBar = () => {
  const { data: stats } = useB2BStats();

  const cards = [
    { label: 'عروض متاحة', value: stats?.availableListings || 0, icon: Package, color: 'text-primary' },
    { label: 'طلبات متاحة', value: stats?.availableRequests || 0, icon: Search, color: 'text-amber-600' },
    { label: 'عروضي النشطة', value: stats?.myActiveListings || 0, icon: Store, color: 'text-emerald-600' },
    { label: 'عروض أسعار واردة', value: stats?.totalBidsReceived || 0, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'صفقات جارية', value: stats?.activeDeals || 0, icon: Handshake, color: 'text-purple-600' },
    { label: 'صفقات مكتملة', value: stats?.completedDeals || 0, icon: CheckCircle2, color: 'text-teal-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default B2BStatsBar;
