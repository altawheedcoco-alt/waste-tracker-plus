import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Leaf, TrendingUp, DollarSign, ShieldCheck, ArrowRightLeft,
  ChevronLeft, Clock
} from 'lucide-react';
import { useCarbonCreditSummary } from '@/hooks/useCarbonCredits';
import { useNavigate } from 'react-router-dom';

const CarbonCreditsWidget = () => {
  const summary = useCarbonCreditSummary();
  const navigate = useNavigate();

  return (
    <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/20">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-teal-700 border-teal-300">
            {summary.totalCredits} رصيد
          </Badge>
          <div className="flex items-center gap-1.5">
            <span>أرصدة الكربون</span>
            <Leaf className="h-4 w-4 text-teal-600" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* Main Value */}
        <div className="text-center py-2">
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400">
            {summary.totalTons.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
          </div>
          <p className="text-xs text-muted-foreground">طن CO₂ أرصدة</p>
          <div className="text-sm font-bold text-emerald-600 mt-1">
            ${summary.totalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatusBox
            icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
            value={summary.verifiedCredits}
            label="موثّق"
          />
          <StatusBox
            icon={<ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />}
            value={summary.tradeableCredits}
            label="قابل للتداول"
          />
          <StatusBox
            icon={<Clock className="h-3.5 w-3.5 text-amber-600" />}
            value={summary.pendingVerification}
            label="قيد التحقق"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-[10px] h-7 border-teal-300 text-teal-700 hover:bg-teal-50"
          onClick={() => navigate('/dashboard/carbon-footprint')}
        >
          <ChevronLeft className="h-3 w-3 ml-1" />
          تفاصيل أرصدة الكربون
        </Button>
      </CardContent>
    </Card>
  );
};

const StatusBox = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <div className="bg-background/60 rounded-lg p-1.5 border border-teal-100 dark:border-teal-900/50">
    <div className="flex justify-center mb-0.5">{icon}</div>
    <div className="text-sm font-bold">{value}</div>
    <p className="text-[8px] text-muted-foreground">{label}</p>
  </div>
);

export default CarbonCreditsWidget;
