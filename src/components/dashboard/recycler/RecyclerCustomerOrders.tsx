import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, CheckCircle, Truck } from 'lucide-react';

const orders = [
  { id: 'ORD-501', customer: 'مصنع الأمل للبلاستيك', material: 'حبيبات PET', qty: '10 طن', status: 'processing', date: '2026-04-03' },
  { id: 'ORD-502', customer: 'شركة النيل للتغليف', material: 'لب ورقي', qty: '25 طن', status: 'ready', date: '2026-04-02' },
  { id: 'ORD-503', customer: 'مصنع الحديد المصري', material: 'خردة حديد', qty: '50 طن', status: 'shipped', date: '2026-03-30' },
  { id: 'ORD-504', customer: 'شركة البناء الحديث', material: 'ألومنيوم', qty: '5 طن', status: 'pending', date: '2026-04-05' },
];

const statusCfg = {
  pending: { label: 'معلق', color: 'bg-muted text-muted-foreground', icon: Clock },
  processing: { label: 'قيد التجهيز', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Clock },
  ready: { label: 'جاهز للشحن', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  shipped: { label: 'تم الشحن', color: 'bg-primary/10 text-primary border-primary/30', icon: Truck },
};

const RecyclerCustomerOrders = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ShoppingCart className="h-5 w-5 text-primary" />
        طلبات العملاء
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {orders.map((o) => {
        const cfg = statusCfg[o.status as keyof typeof statusCfg];
        return (
          <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">{o.customer}</p>
              <p className="text-xs text-muted-foreground">{o.id} • {o.material} • {o.qty}</p>
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerCustomerOrders;
