/**
 * PushToggle — زر تفعيل/إيقاف إشعارات Push في القائمة الجانبية
 */
import { memo } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const PushToggle = memo(() => {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = useWebPush();

  if (!isSupported) return null;

  const isDenied = permission === 'denied';

  const handleClick = () => {
    if (loading) return;
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          disabled={loading || isDenied}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg transition-all duration-200',
            isSubscribed
              ? 'bg-primary/10 text-primary hover:bg-primary/15'
              : isDenied
                ? 'bg-destructive/5 text-muted-foreground cursor-not-allowed opacity-60'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : isSubscribed ? (
            <Bell className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <BellOff className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="flex-1 text-right truncate">
            {loading
              ? 'جاري التحديث...'
              : isSubscribed
                ? 'الإشعارات مفعّلة'
                : isDenied
                  ? 'الإشعارات محظورة'
                  : 'تفعيل الإشعارات'}
          </span>
          {isSubscribed && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs max-w-[200px]">
        {isDenied
          ? 'تم حظر الإشعارات من إعدادات المتصفح — يرجى تغييرها من إعدادات الموقع'
          : isSubscribed
            ? 'اضغط لإيقاف استقبال الإشعارات'
            : 'اضغط لتفعيل الإشعارات حتى لو المتصفح مقفول'}
      </TooltipContent>
    </Tooltip>
  );
});
PushToggle.displayName = 'PushToggle';

export default PushToggle;
