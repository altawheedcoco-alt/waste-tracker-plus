import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Target, Zap, Activity, Bell, MessageSquare, FileSearch,
  Brain, BarChart3, CalendarDays, Handshake, MapPin, Shield, DollarSign, Wrench, Leaf,
  Radio, Navigation, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SectionItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  isTab?: boolean;
  tabValue?: string;
}

const FIXED_SECTIONS: SectionItem[] = [
  { id: 'section-header', label: 'الهيدر', icon: LayoutDashboard },
  { id: 'section-posts', label: 'المنشورات', icon: MessageSquare },
  { id: 'section-command', label: 'القيادة', icon: Target },
  { id: 'section-actions', label: 'الإجراءات', icon: Zap },
  { id: 'section-pulse', label: 'النبض', icon: Activity },
  { id: 'section-alerts', label: 'التنبيهات', icon: Bell },
  { id: 'section-dispatch', label: 'طلب سائق', icon: Radio },
  { id: 'section-live-tracking', label: 'التتبع الحي', icon: Navigation },
  { id: 'section-comms', label: 'التواصل', icon: MessageSquare },
  { id: 'section-docs', label: 'التوثيق', icon: FileSearch },
];

const TAB_SECTIONS: SectionItem[] = [
  { id: 'section-tabs', label: 'نظرة عامة', icon: LayoutDashboard, isTab: true, tabValue: 'overview' },
  { id: 'section-tabs', label: 'العمليات', icon: CalendarDays, isTab: true, tabValue: 'operations' },
  { id: 'section-tabs', label: 'الأسطول', icon: Wrench, isTab: true, tabValue: 'fleet' },
  { id: 'section-tabs', label: 'التتبع', icon: MapPin, isTab: true, tabValue: 'tracking' },
  { id: 'section-tabs', label: 'الأداء', icon: BarChart3, isTab: true, tabValue: 'performance' },
  { id: 'section-tabs', label: 'الذكاء', icon: Brain, isTab: true, tabValue: 'ai' },
  { id: 'section-tabs', label: 'المالية', icon: DollarSign, isTab: true, tabValue: 'finance' },
  { id: 'section-tabs', label: 'الامتثال', icon: Shield, isTab: true, tabValue: 'compliance' },
  { id: 'section-tabs', label: 'الاستدامة', icon: Leaf, isTab: true, tabValue: 'sustainability' },
  { id: 'section-tabs', label: 'الشركاء', icon: Handshake, isTab: true, tabValue: 'partners' },
];

const ALL_SECTIONS = [...FIXED_SECTIONS, ...TAB_SECTIONS];

interface TransporterSectionNavProps {
  activeTab?: string;
  onTabChange?: (tabValue: string) => void;
}

const TransporterSectionNav = memo(({ activeTab, onTabChange }: TransporterSectionNavProps) => {
  const [visibleSectionId, setVisibleSectionId] = useState('section-header');
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isTabsVisible = visibleSectionId === 'section-tabs';

  // IntersectionObserver to track which section is in viewport
  useEffect(() => {
    const uniqueIds = [...new Set(ALL_SECTIONS.map(s => s.id))];
    const elements = uniqueIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const visibleSet = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleSet.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleSet.delete(entry.target.id);
          }
        });

        if (visibleSet.size > 0) {
          // Pick the one closest to top
          let closest = '';
          let closestTop = Infinity;
          visibleSet.forEach((top, id) => {
            if (Math.abs(top) < Math.abs(closestTop)) {
              closestTop = top;
              closest = id;
            }
          });
          if (closest) setVisibleSectionId(closest);
        }
      },
      { rootMargin: '-60px 0px -50% 0px', threshold: [0, 0.1, 0.3] }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll the active nav button into view horizontally
  useEffect(() => {
    let key: string;
    if (isTabsVisible && activeTab) {
      key = `tab-${activeTab}`;
    } else {
      key = visibleSectionId;
    }
    const btn = btnRefs.current[key];
    if (btn && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      if (btnRect.left < navRect.left || btnRect.right > navRect.right) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [visibleSectionId, isTabsVisible, activeTab]);

  const handleClick = useCallback((section: SectionItem) => {
    if (section.isTab && section.tabValue) {
      const tabsEl = document.getElementById('section-tabs');
      if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onTabChange?.(section.tabValue);
    } else {
      const el = document.getElementById(section.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [onTabChange]);

  const getIsActive = (section: SectionItem): boolean => {
    if (section.isTab) {
      return isTabsVisible && activeTab === section.tabValue;
    }
    return !isTabsVisible && visibleSectionId === section.id;
  };

  const renderButton = (section: SectionItem) => {
    const Icon = section.icon;
    const active = getIsActive(section);
    const uniqueKey = section.isTab ? `tab-${section.tabValue}` : section.id;

    return (
      <button
        key={uniqueKey}
        ref={el => { btnRefs.current[uniqueKey] = el; }}
        onClick={() => handleClick(section)}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs whitespace-nowrap transition-all duration-200 shrink-0 touch-manipulation',
          active
            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
        <span>{section.label}</span>
      </button>
    );
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30 shadow-sm">
      <div
        ref={navRef}
        className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-hide"
      >
        {FIXED_SECTIONS.map(s => renderButton(s))}

        {/* Separator */}
        <div className="w-px h-6 bg-border/50 mx-1.5 shrink-0" />

        {TAB_SECTIONS.map(s => renderButton(s))}
      </div>
    </div>
  );
});

TransporterSectionNav.displayName = 'TransporterSectionNav';

export default TransporterSectionNav;
