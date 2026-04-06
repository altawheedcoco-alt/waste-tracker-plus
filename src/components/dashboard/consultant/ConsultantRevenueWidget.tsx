import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const invoices = [
  { project: 'تقييم بيئي — مصنع الدلتا', amount: 85000, status: 'paid', date: '2026-03-15' },
  { project: 'خطة مخلفات — فندق النيل', amount: 45000, status: 'pending', date: '2026-04-01' },
  { project: 'مراجعة امتثال — شركة النور', amount: 35000, status: 'paid', date: '2026-03-28' },
  { project: 'تدقيق ESG — مجموعة الأمل', amount: 120000, status: 'draft', date: '—' },
];

const summary = { total: 285000, paid: 120000, pending: 45000, draft: 120000 };

const ConsultantRevenueWidget = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <DollarSign className="h-5 w-5 text-primary" />
        الإيرادات والفواتير
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
          <p className="text-sm font-bold text-green-600">{(summary.paid / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground">محصّل</p>
        </div>
        <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-sm font-bold text-yellow-600">{(summary.pending / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground">معلق</p>
        </div>
        <div className="p-2 rounded-lg bg-muted">
          <p className="text-sm font-bold text-muted-foreground">{(summary.draft / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground">مسودة</p>
        </div>
      </div>
      <div className="space-y-1">
        {invoices.map((inv, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
            <div>
              <p className="text-xs font-medium">{inv.project}</p>
              <p className="text-xs text-muted-foreground">{inv.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">{inv.amount.toLocaleString()} ج.م</span>
              {inv.status === 'paid' && <CheckCircle className="h-3 w-3 text-green-600" />}
              {inv.status === 'pending' && <Clock className="h-3 w-3 text-yellow-600" />}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default ConsultantRevenueWidget;
