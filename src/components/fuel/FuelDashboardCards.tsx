import { Card, CardContent } from '@/components/ui/card';
import { Fuel, DollarSign, Gauge, AlertTriangle, TrendingUp, User } from 'lucide-react';

interface Props {
  totalLiters: number;
  totalCost: number;
  avgCostPerLiter: number;
  recordCount: number;
  alertCount: number;
  redAlerts: number;
}

const FuelDashboardCards = ({ totalLiters, totalCost, avgCostPerLiter, recordCount, alertCount, redAlerts }: Props) => {
  const cards = [
    { icon: Fuel, label: 'إجمالي اللترات', value: totalLiters.toLocaleString('ar-EG'), color: 'text-primary' },
    { icon: DollarSign, label: 'إجمالي التكلفة', value: `${totalCost.toLocaleString('ar-EG')} ج.م`, color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: Gauge, label: 'متوسط سعر اللتر', value: `${avgCostPerLiter} ج.م`, color: 'text-blue-600 dark:text-blue-400' },
    { icon: TrendingUp, label: 'عدد التعبئات', value: recordCount.toString(), color: 'text-violet-600 dark:text-violet-400' },
    { icon: User, label: 'أكفأ سائق', value: '—', color: 'text-green-600 dark:text-green-400' },
    { icon: AlertTriangle, label: 'تنبيهات التلاعب', value: alertCount.toString(), color: redAlerts > 0 ? 'text-destructive' : 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-3 text-center">
            <c.icon className={`w-5 h-5 mx-auto mb-1 ${c.color}`} />
            <p className="text-lg font-bold">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FuelDashboardCards;
