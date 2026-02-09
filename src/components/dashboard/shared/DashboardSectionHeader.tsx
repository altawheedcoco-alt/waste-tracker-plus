import { LucideIcon } from 'lucide-react';

interface DashboardSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
}

const DashboardSectionHeader = ({ title, subtitle, icon: Icon, iconColor = 'text-primary', action }: DashboardSectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      {action && <div>{action}</div>}
      <div className="flex items-center gap-2 text-right">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
    </div>
  );
};

export default DashboardSectionHeader;
