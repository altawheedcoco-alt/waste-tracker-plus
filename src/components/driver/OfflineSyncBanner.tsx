import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Loader2, CloudOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineSyncBanner = () => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`px-4 py-2.5 flex items-center justify-between text-sm rounded-lg mb-3 ${
          isOnline
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400'
            : 'bg-destructive/10 border border-destructive/30 text-destructive'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isOnline
              ? `${pendingCount} عملية في انتظار المزامنة`
              : 'وضع عدم الاتصال — البيانات تُحفظ محلياً'}
          </span>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <CloudOff className="w-3 h-3 ml-1" />
              {pendingCount}
            </Badge>
          )}
        </div>
        {isOnline && pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => syncNow()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            مزامنة الآن
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineSyncBanner;
