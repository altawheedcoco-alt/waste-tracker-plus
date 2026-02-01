import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Eye, EyeOff, Users, Building2 } from 'lucide-react';
import { useDriverTrackingStatus } from '@/hooks/useDriverPresence';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrackingWatcherIndicatorProps {
  driverId: string;
}

const TrackingWatcherIndicator = ({ driverId }: TrackingWatcherIndicatorProps) => {
  const { isBeingTracked, viewers, viewerCount, isConnected } = useDriverTrackingStatus(driverId);

  if (!isConnected) {
    return (
      <Badge variant="outline" className="text-xs opacity-50">
        <EyeOff className="h-3 w-3 ml-1" />
        جاري الاتصال...
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-auto py-1 px-2 gap-1.5 ${
            isBeingTracked 
              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30' 
              : 'text-muted-foreground'
          }`}
        >
          <AnimatePresence mode="wait">
            {isBeingTracked ? (
              <motion.div
                key="watching"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="relative"
              >
                <Eye className="h-4 w-4" />
                {/* Pulse animation when being tracked */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-amber-500/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="not-watching"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <EyeOff className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <span className="text-xs font-medium">
            {isBeingTracked ? `يتابعك ${viewerCount}` : 'لا يوجد متابعين'}
          </span>

          {isBeingTracked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold"
            >
              {viewerCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-72 p-0" dir="rtl">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isBeingTracked ? 'جهات تتابع موقعك' : 'لا يوجد متابعين حالياً'}
            </span>
          </div>
          {isBeingTracked && (
            <p className="text-xs text-muted-foreground mt-1">
              هذه الجهات تشاهد موقعك الآن على الخريطة
            </p>
          )}
        </div>

        {isBeingTracked ? (
          <div className="max-h-48 overflow-y-auto">
            {viewers.map((viewer, index) => (
              <motion.div
                key={viewer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{viewer.name}</p>
                  {viewer.organization && (
                    <p className="text-xs text-muted-foreground truncate">
                      {viewer.organization}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    منذ {formatDistanceToNow(viewer.joinedAt, { locale: ar, addSuffix: false })}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا أحد يتابع موقعك حالياً</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TrackingWatcherIndicator;
