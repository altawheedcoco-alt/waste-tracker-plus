import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const transactions = [
  { date: '2026-04-06', desc: 'رحلة #1201 — القاهرة → الجيزة', amount: 850, type: 'earning' },
  { date: '2026-04-06', desc: 'بدل وقود', amount: 200, type: 'earning' },
  { date: '2026-04-05', desc: 'رحلة #1200 — القاهرة → أسيوط', amount: 2200, type: 'earning' },
  { date: '2026-04-05', desc: 'خصم تأخير', amount: -150, type: 'deduction' },
  { date: '2026-04-04', desc: 'مكافأة سلامة', amount: 500, type: 'bonus' },
];

const summary = { total: 15420, pending: 3200, withdrawn: 12220 };

const DriverEarningsWidget = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Wallet className="h-5 w-5 text-primary" />
        ملخص الأرباح
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
          <p className="text-lg font-bold text-green-600">{summary.total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">إجمالي</p>
        </div>
        <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-lg font-bold text-yellow-600">{summary.pending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">معلق</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-lg font-bold text-primary">{summary.withdrawn.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">مسحوب</p>
        </div>
      </div>
      <div className="space-y-1">
        {transactions.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
            <div className="flex items-center gap-2">
              {t.amount > 0 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <div>
                <p className="text-xs font-medium">{t.desc}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
            </div>
            <span className={`font-bold text-xs ${t.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
              {t.amount > 0 ? '+' : ''}{t.amount} ج.م
            </span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverEarningsWidget;
