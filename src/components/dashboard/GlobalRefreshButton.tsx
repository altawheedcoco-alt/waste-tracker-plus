import { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { cn } from '@/lib/utils';

const GlobalRefreshButton = memo(() => {
  const { refresh, isRefreshing, lastRefresh } = useAutoRefresh({ intervalMs: 15000 });

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 5) return 'الآن';
    if (seconds < 60) return `منذ ${seconds} ث`;
    return `منذ ${Math.floor(seconds / 60)} د`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          disabled={isRefreshing}
          className="relative h-9 w-9"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {/* Auto-refresh indicator dot */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>تحديث البيانات • تحديث تلقائي كل 15 ثانية</p>
        <p className="text-xs text-muted-foreground">آخر تحديث: {timeAgo()}</p>
      </TooltipContent>
    </Tooltip>
  );
});

GlobalRefreshButton.displayName = 'GlobalRefreshButton';

export default GlobalRefreshButton;
