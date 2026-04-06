/**
 * متتبع إيرادات المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Receipt, CreditCard } from 'lucide-react';

const OfficeRevenueTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        الإيرادات والمستحقات
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-green-500/10 text-center">
          <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-700 dark:text-green-300">185,000</div>
          <p className="text-[9px] text-muted-foreground">إيرادات الشهر (ج.م)</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 text-center">
          <Receipt className="h-4 w-4 text-amber-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-700 dark:text-amber-300">42,000</div>
          <p className="text-[9px] text-muted-foreground">مستحقات معلقة (ج.م)</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 text-center">
          <CreditCard className="h-4 w-4 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">12</div>
          <p className="text-[9px] text-muted-foreground">فواتير صادرة</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 text-center">
          <Receipt className="h-4 w-4 text-red-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-red-700 dark:text-red-300">3</div>
          <p className="text-[9px] text-muted-foreground">فواتير متأخرة</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default OfficeRevenueTracker;
