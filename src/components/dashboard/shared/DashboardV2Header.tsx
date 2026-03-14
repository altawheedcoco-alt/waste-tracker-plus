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
    <div className="flex flex-col gap-3">
      {/* Title Row */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0 text-right">
          <h1 className="font-bold text-lg sm:text-2xl bg-gradient-to-l from-foreground via-foreground to-foreground/60 bg-clip-text truncate">
            مرحباً، {displayName}
          </h1>
          <div className="flex items-center gap-1.5 justify-end mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-[18px] gap-0.5 border-primary/20 text-primary shrink-0">
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> v3.0
            </Badge>
            {orgName && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{orgName} - {orgLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0", gradient)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>

      {/* Actions Row - scrollable on mobile */}
      {children && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
          {children}
        </div>
      )}
    </div>
  );
});

DashboardV2Header.displayName = 'DashboardV2Header';

export default DashboardV2Header;
