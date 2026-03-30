import { memo, useMemo } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BindingType } from '@/types/bindingTypes';
import BindingIndicator from '@/components/shared/BindingIndicator';
import { Separator } from '@/components/ui/separator';

export interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
  /** نوع الارتباط الوظيفي (اختياري) */
  bindingType?: BindingType;
  /** اسم المجموعة البصرية (اختياري) */
  group?: string;
}

interface V2TabsNavProps {
  tabs: TabItem[];
}

const V2TabsNav = memo(({ tabs }: V2TabsNavProps) => {
  // Build grouped elements with separators
  const elements = useMemo(() => {
    const result: { type: 'tab' | 'separator'; tab?: TabItem; groupLabel?: string }[] = [];
    let lastGroup: string | undefined;

    tabs.forEach((tab) => {
      if (tab.group && tab.group !== lastGroup) {
        if (lastGroup !== undefined) {
          result.push({ type: 'separator', groupLabel: tab.group });
        }
        lastGroup = tab.group;
      }
      result.push({ type: 'tab', tab });
    });

    return result;
  }, [tabs]);

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/30 bg-gradient-to-r from-card via-card to-muted/20 p-0.5 sm:p-1.5 shadow-sm">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-0.5 h-auto p-0 scrollbar-hide">
        {elements.map((el, i) => {
          if (el.type === 'separator') {
            return (
              <div key={`sep-${i}`} className="flex items-center gap-1 px-1 shrink-0">
                <Separator orientation="vertical" className="h-5 bg-border/50" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 whitespace-nowrap font-medium">
                  {el.groupLabel}
                </span>
              </div>
            );
          }

          const tab = el.tab!;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "gap-1 text-[10px] sm:text-sm whitespace-nowrap rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1.5 sm:py-2.5 relative min-h-[32px] sm:min-h-[36px] touch-manipulation",
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80",
                "data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20",
                "hover:bg-muted/50 transition-all duration-300"
              )}
            >
              <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {tab.bindingType && (
                <BindingIndicator type={tab.bindingType} dotOnly showTooltip />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
});

V2TabsNav.displayName = 'V2TabsNav';

export default V2TabsNav;
