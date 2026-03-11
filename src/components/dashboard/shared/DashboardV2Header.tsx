import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardV2HeaderProps {
  userName: string;
  orgName: string;
  orgLabel: string;
  icon: LucideIcon;
  gradient?: string;
  children?: React.ReactNode;
}

const DashboardV2Header = memo(({ userName, orgName, orgLabel, icon: Icon, gradient = 'from-primary to-primary/70', children }: DashboardV2HeaderProps) => {
  const displayName = userName || orgName || 'المستخدم';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Actions */}
      {children && (
        <div className="flex items-center gap-2 flex-wrap order-2 sm:order-1">
          {children}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl text-right bg-gradient-to-l from-foreground via-foreground to-foreground/60 bg-clip-text">
            مرحباً، {displayName}
          </h1>
          <div className="flex items-center gap-2 justify-end mt-0.5">
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 gap-1 border-primary/20 text-primary">
              <Sparkles className="w-2.5 h-2.5" /> v3.0
            </Badge>
            {orgName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {orgName} - {orgLabel}
              </p>
            )}
          </div>
        </div>
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
});

DashboardV2Header.displayName = 'DashboardV2Header';

export default DashboardV2Header;
