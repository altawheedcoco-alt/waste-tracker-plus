/**
 * PushToggle — زر تفعيل/إيقاف إشعارات Push بضغطة واحدة
 */
import { memo } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const PushToggle = memo(() => {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = useWebPush();

  if (!isSupported) return null;

  const isDenied = permission === 'denied';

  const handleToggle = () => {
    if (loading || isDenied) return;
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isDenied}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg transition-all duration-200 group',
        isDenied
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-muted/60 cursor-pointer'
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4 text-primary shrink-0" />
      ) : (
        <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
      )}

      <span className={cn(
        'flex-1 text-right text-xs font-medium truncate',
        isSubscribed ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {loading
          ? 'جاري التحديث...'
          : isDenied
            ? 'الإشعارات محظورة'
            : 'إشعارات Push'}
      </span>

      <Switch
        checked={isSubscribed}
        disabled={loading || isDenied}
        onCheckedChange={handleToggle}
        className="pointer-events-none scale-75"
      />
    </button>
  );
});
PushToggle.displayName = 'PushToggle';

export default PushToggle;
