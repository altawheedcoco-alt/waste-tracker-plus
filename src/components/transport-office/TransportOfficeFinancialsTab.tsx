import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TransportOfficeStats } from '@/hooks/useTransportOfficeData';

interface Props {
  stats: TransportOfficeStats;
  bookings: any[];
}

const TransportOfficeFinancialsTab = ({ stats, bookings }: Props) => {
  const navigate = useNavigate();
  const netRevenue = stats.totalRevenue - stats.maintenanceCosts;
  const completed = bookings.filter(b => b.status === 'completed');

  // Revenue by month
  const monthlyRevenue: Record<string, number> = {};
  completed.forEach(b => {
    const month = b.completed_at ? new Date(b.completed_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' }) : 'غير محدد';
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (b.agreed_price || 0);
  });

  return (
    <div className="space-y-4">
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-7 h-7 text-green-600 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-green-600">{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-7 h-7 text-destructive mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-destructive">{stats.maintenanceCosts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">تكاليف الصيانة (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className={`w-7 h-7 mx-auto mb-1.5 ${netRevenue >= 0 ? 'text-green-600' : 'text-destructive'}`} />
            <p className={`text-2xl font-bold ${netRevenue >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {netRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">صافي الربح (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{stats.avgTripRate.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">متوسط سعر الرحلة</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      {Object.keys(monthlyRevenue).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإيرادات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(monthlyRevenue).slice(0, 6).map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">{month}</span>
                  <Badge variant="outline">{amount.toLocaleString()} ج.م</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر المعاملات المكتملة</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا توجد معاملات مكتملة بعد</p>
          ) : (
            <div className="space-y-2">
              {completed.slice(0, 8).map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div>
                    <span className="font-medium">{b.fleet_vehicles?.plate_number || '—'}</span>
                    <span className="text-muted-foreground mx-2">←</span>
                    <span>{b.requester?.name || 'غير محدد'}</span>
                  </div>
                  <Badge variant="outline">{(b.agreed_price || 0).toLocaleString()} ج.م</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/accounts')}>
        <BarChart3 className="w-4 h-4 ml-2" />
        الذهاب للحسابات التفصيلية
      </Button>
    </div>
  );
};

export default TransportOfficeFinancialsTab;
