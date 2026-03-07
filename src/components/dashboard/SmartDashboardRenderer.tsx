/**
 * SmartDashboardRenderer - عارض الداشبورد الذكي
 * يعيد ترتيب الودجات تلقائياً بناءً على محرك الأولويات الذكي
 * مع دعم تخصيصات المستخدم (المثبتة تطغى على الذكي)
 */
import { Suspense, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Settings2, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useSmartPriorities } from '@/hooks/useSmartPriorities';
import SmartPriorityIndicator from '@/components/shared/SmartPriorityIndicator';
import DashboardWidgetCustomizer from '@/components/dashboard/DashboardWidgetCustomizer';

interface SmartDashboardRendererProps {
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  /** Map of widget ID → React component */
  widgetRenderers: Record<string, ReactNode>;
  /** Additional content before widgets */
  headerContent?: ReactNode;
  /** User role for priority override */
  userRole?: string;
}

const WidgetFallback = () => (
  <Skeleton className="h-48 w-full rounded-xl" />
);

export default function SmartDashboardRenderer({
  orgType,
  widgetRenderers,
  headerContent,
  userRole,
}: SmartDashboardRendererProps) {
  const { widgets, loading, hasUserCustomization } = useDashboardWidgets(orgType);
  const { sortedWidgetIds, activeBoosts, heatLevel, isLoading: priorityLoading } = useSmartPriorities(orgType, userRole);

  // Merge logic: user pinned widgets first → smart priority for the rest
  const smartOrderedWidgets = useMemo(() => {
    if (hasUserCustomization) {
      // User has customized — respect their order entirely
      return widgets;
    }

    // No user customization — apply smart priority
    const pinnedWidgets = widgets.filter(w => w.isPinned);
    const unpinnedWidgets = widgets.filter(w => !w.isPinned);

    // Sort unpinned by smart priority
    const priorityMap = new Map(sortedWidgetIds.map((id, idx) => [id, idx]));
    const smartSorted = [...unpinnedWidgets].sort((a, b) => {
      const pa = priorityMap.get(a.id) ?? 999;
      const pb = priorityMap.get(b.id) ?? 999;
      return pa - pb;
    });

    return [...pinnedWidgets, ...smartSorted];
  }, [widgets, sortedWidgetIds, hasUserCustomization]);

  if (loading || priorityLoading) {
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

  const pinnedCount = smartOrderedWidgets.filter(w => w.isPinned).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {headerContent}

      {/* Controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <DashboardWidgetCustomizer
            orgType={orgType}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                تخصيص
              </Button>
            }
          />
          {!hasUserCustomization && (
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <Brain className="h-3 w-3" />
              ترتيب ذكي
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SmartPriorityIndicator heatLevel={heatLevel} activeBoosts={activeBoosts} />
          {pinnedCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Pin className="h-3 w-3" />
              {pinnedCount} مثبت
            </Badge>
          )}
        </div>
      </div>

      {/* Widgets */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {smartOrderedWidgets.map((widget, index) => {
            const renderer = widgetRenderers[widget.id];
            if (!renderer) return null;

            return (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <Suspense fallback={<WidgetFallback />}>
                  {renderer}
                </Suspense>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
