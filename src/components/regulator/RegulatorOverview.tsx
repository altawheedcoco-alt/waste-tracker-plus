import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ClipboardCheck, AlertTriangle, Gavel, DollarSign, Shield, TrendingUp, Eye } from 'lucide-react';
import { useRegulatorStats } from '@/hooks/useRegulatorData';
import { Skeleton } from '@/components/ui/skeleton';

const RegulatorOverview = () => {
  const { data: stats, isLoading } = useRegulatorStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'إجمالي المنظمات', value: stats.totalOrganizations, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'زيارات التفتيش', value: stats.totalInspections, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-500/10', sub: `${stats.scheduledInspections} مجدولة` },
    { label: 'مخالفات مفتوحة', value: stats.openViolations, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', sub: `${stats.totalViolations} إجمالي` },
    { label: 'عقوبات نشطة', value: stats.activePenalties, icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-500/10', sub: `${stats.totalPenalties} إجمالي` },
    { label: 'غرامات مُصدرة', value: `${stats.totalFines.toLocaleString()} ج.م`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'غرامات مُحصلة', value: `${stats.collectedFines.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'مخالفات تم حلها', value: stats.resolvedViolations, icon: Shield, color: 'text-teal-600', bg: 'bg-teal-500/10' },
    { label: 'تفتيش مكتمل', value: stats.completedInspections, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                {card.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RegulatorOverview;
