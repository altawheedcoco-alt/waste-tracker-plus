export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface HealthResult {
  score: number;
  status: HealthStatus;
  factors: string[];
}

export const calcHealthScore = (stats: any): HealthResult => {
  if (!stats) return { score: 0, status: 'critical', factors: [] };
  let score = 100;
  const factors: string[] = [];

  if (stats.overdueCount > 0) { score -= stats.overdueCount * 8; factors.push(`${stats.overdueCount} شحنة متأخرة`); }
  if (stats.pendingShipments > 10) { score -= 10; factors.push('تراكم في طلبات الموافقة'); }
  if (stats.totalDrivers > 0 && stats.availableDrivers === 0) { score -= 20; factors.push('لا يوجد سائقين متاحين'); }
  if (stats.completionRate < 50 && stats.todayTrips > 0) { score -= 15; factors.push('معدل إنجاز منخفض'); }
  if (stats.todayTrips === 0) { score -= 5; factors.push('لا توجد رحلات اليوم بعد'); }
  if (stats.unpaidInvoices > 3) { score -= 10; factors.push(`${stats.unpaidInvoices} فاتورة غير مسددة`); }
  if (stats.expiringDocs > 0) { score -= stats.expiringDocs * 5; factors.push(`${stats.expiringDocs} مستند يحتاج تجديد`); }

  score = Math.max(0, Math.min(100, score));
  const status: HealthStatus = score >= 75 ? 'healthy' : score >= 45 ? 'warning' : 'critical';
  return { score, status, factors };
};

export const StatusDot = ({ status }: { status: HealthStatus }) => {
  const colors = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-destructive' };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-40`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
};
