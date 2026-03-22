import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Target, Zap, Activity, Bell, MessageSquare, FileSearch,
  Brain, BarChart3, CalendarDays, Handshake, MapPin, Shield, DollarSign, Wrench, Leaf, Truck
} from 'lucide-react';

interface SectionItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  isTab?: boolean;
  tabValue?: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'section-header', label: 'الهيدر', icon: LayoutDashboard },
  { id: 'section-command', label: 'القيادة', icon: Target },
  { id: 'section-actions', label: 'الإجراءات', icon: Zap },
  { id: 'section-pulse', label: 'النبض', icon: Activity },
  { id: 'section-alerts', label: 'التنبيهات', icon: Bell },
  { id: 'section-comms', label: 'التواصل', icon: MessageSquare },
  { id: 'section-docs', label: 'التوثيق', icon: FileSearch },
  // Tabs
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

interface TransporterSectionNavProps {
  onTabChange?: (tabValue: string) => void;
}

const TransporterSectionNav = memo(({ onTabChange }: TransporterSectionNavProps) => {
  const [activeSection, setActiveSection] = useState('section-header');
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Track visible section
  useEffect(() => {
    const sectionIds = [...new Set(SECTIONS.map(s => s.id))];
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll active button into view
  useEffect(() => {
    const key = SECTIONS.find(s => s.id === activeSection && !s.isTab)?.id || activeSection;
    const btn = btnRefs.current[key];
    if (btn && navRef.current) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

  const handleClick = useCallback((section: SectionItem) => {
    if (section.isTab && section.tabValue) {
      // Scroll to tabs area + change tab
      const tabsEl = document.getElementById('section-tabs');
      if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onTabChange?.(section.tabValue);
    } else {
      const el = document.getElementById(section.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [onTabChange]);

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30 shadow-sm">
      <div
        ref={navRef}
        className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide"
      >
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          const isActive = section.isTab
            ? false // tabs highlight handled differently
            : activeSection === section.id;
          const uniqueKey = section.isTab ? `tab-${section.tabValue}` : section.id;

          // Separator before tabs
          if (i === 7) {
            return (
              <div key="sep" className="flex items-center gap-1">
                <div className="w-px h-6 bg-border/50 mx-1 shrink-0" />
                <button
                  ref={el => { btnRefs.current[uniqueKey] = el; }}
                  onClick={() => handleClick(section)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs whitespace-nowrap transition-all duration-200 shrink-0 touch-manipulation',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>{section.label}</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={uniqueKey}
              ref={el => { btnRefs.current[uniqueKey] = el; }}
              onClick={() => handleClick(section)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs whitespace-nowrap transition-all duration-200 shrink-0 touch-manipulation',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

TransporterSectionNav.displayName = 'TransporterSectionNav';

export default TransporterSectionNav;
