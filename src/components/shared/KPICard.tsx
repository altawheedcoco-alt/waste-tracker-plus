import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconClassName?: string;
  className?: string;
  valueClassName?: string;
}

/**
 * Reusable KPI card for dashboard summaries.
 * Replaces repeated Card > CardContent > icon + value + label patterns.
 */
export const KPICard = ({ icon: Icon, value, label, iconClassName, className, valueClassName }: KPICardProps) => (
  <Card className={cn(className)}>
    <CardContent className="p-3 text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-1', iconClassName || 'text-primary')} />
      <p className={cn('text-lg font-bold text-foreground', valueClassName)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default KPICard;
