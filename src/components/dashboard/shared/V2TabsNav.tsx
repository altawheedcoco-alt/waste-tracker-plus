import { memo } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface V2TabsNavProps {
  tabs: TabItem[];
}

const V2TabsNav = memo(({ tabs }: V2TabsNavProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card via-card to-muted/20 p-1.5 shadow-sm">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-1 h-auto p-0 scrollbar-hide">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "gap-1.5 text-xs sm:text-sm whitespace-nowrap rounded-xl px-3 py-2.5",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80",
              "data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20",
              "hover:bg-muted/50 transition-all duration-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
});

V2TabsNav.displayName = 'V2TabsNav';

export default V2TabsNav;
