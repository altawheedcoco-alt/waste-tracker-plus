import { lazy, Suspense, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import DashboardWidgetCustomizer from './DashboardWidgetCustomizer';

interface CustomizableDashboardProps {
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  /** Map of widget ID → React component to render */
  widgetRenderers: Record<string, ReactNode>;
  /** Additional content before widgets (like SmartDailyBrief, StoryCircles) */
  headerContent?: ReactNode;
}

const WidgetFallback = () => (
  <Skeleton className="h-48 w-full rounded-xl" />
);

/**
 * Customizable dashboard wrapper that renders widgets in user-preferred order.
 * Widgets can be pinned, hidden, and reordered.
 */
export default function CustomizableDashboard({
  orgType,
  widgetRenderers,
  headerContent,
}: CustomizableDashboardProps) {
  const { widgets, loading } = useDashboardWidgets(orgType);

  if (loading) {
    return (
      <div className="space-y-4">
        {headerContent}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl col-span-full" />
        </div>
      </div>
    );
  }

  // Split into pinned and unpinned
  const pinnedWidgets = widgets.filter(w => w.isPinned);
  const unpinnedWidgets = widgets.filter(w => !w.isPinned);

  return (
    <div className="space-y-4 sm:space-y-6">
      {headerContent}

      {/* Customizer button */}
      <div className="flex items-center justify-between">
        <DashboardWidgetCustomizer
          orgType={orgType}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              تخصيص الويدجت
            </Button>
          }
        />
        {pinnedWidgets.length > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Pin className="h-3 w-3" />
            {pinnedWidgets.length} مثبت
          </Badge>
        )}
      </div>

      {/* Pinned widgets section */}
      {pinnedWidgets.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {pinnedWidgets.map((widget, index) => {
              const renderer = widgetRenderers[widget.id];
              if (!renderer) return null;

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    widget.size === 'large' ? 'col-span-full' : '',
                    widget.size === 'small' ? 'col-span-1' : '',
                  )}
                >
                  <Suspense fallback={<WidgetFallback />}>
                    {renderer}
                  </Suspense>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Unpinned widgets */}
      {unpinnedWidgets.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {unpinnedWidgets.map((widget, index) => {
              const renderer = widgetRenderers[widget.id];
              if (!renderer) return null;

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: (pinnedWidgets.length + index) * 0.05, duration: 0.3 }}
                >
                  <Suspense fallback={<WidgetFallback />}>
                    {renderer}
                  </Suspense>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
