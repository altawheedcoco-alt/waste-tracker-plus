/**
 * شارة نوع السائق — مكون قابل لإعادة الاستخدام
 */
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, UserCheck } from 'lucide-react';
import type { DriverType } from '@/types/driver-types';
import { DRIVER_TYPE_LABELS } from '@/types/driver-types';

const iconMap = {
  company: Building2,
  hired: Briefcase,
  independent: UserCheck,
} as const;

interface DriverTypeBadgeProps {
  type: DriverType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const DriverTypeBadge = ({ type, size = 'sm', showIcon = true }: DriverTypeBadgeProps) => {
  const config = DRIVER_TYPE_LABELS[type];
  const Icon = iconMap[type];

  return (
    <Badge
      variant="outline"
      className={`${config.color} border-0 font-medium ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-0.5' : 'text-xs px-2 py-1 gap-1'
      }`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {config.ar}
    </Badge>
  );
};

export default DriverTypeBadge;
