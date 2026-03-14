import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Settings2, Search, Star, Layers, Wrench, ChevronDown, ChevronUp, Grid3X3 } from 'lucide-react';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLanguage } from '@/contexts/LanguageContext';
import ResponsiveGrid from './ResponsiveGrid';
import QuickActionsCustomizer from './QuickActionsCustomizer';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id?: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  iconBgClass?: string;
  category?: 'primary' | 'secondary' | 'utility';
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  title?: string;
  subtitle?: string;
  userType?: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal';
  showCustomizer?: boolean;
}

type CategoryFilter = 'all' | 'primary' | 'secondary' | 'utility';

const QuickActionsGrid = ({ 
  actions, 
  title,
  subtitle,
  userType,
  showCustomizer = false,
}: QuickActionsGridProps) => {
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const categoryConfig: Record<CategoryFilter, { label: string; icon: LucideIcon; color: string }> = {
    all: { label: t('dashboard.categories.all'), icon: Grid3X3, color: 'text-foreground' },
    primary: { label: t('dashboard.categories.primary'), icon: Star, color: 'text-amber-500' },
    secondary: { label: t('dashboard.categories.secondary'), icon: Layers, color: 'text-blue-500' },
    utility: { label: t('dashboard.categories.utility'), icon: Wrench, color: 'text-muted-foreground' },
  };

  const filteredActions = useMemo(() => {
    let result = actions;
    
    if (activeCategory !== 'all') {
      result = result.filter(a => a.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.subtitle.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [actions, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => ({
    all: actions.length,
    primary: actions.filter(a => a.category === 'primary').length,
    secondary: actions.filter(a => a.category === 'secondary').length,
    utility: actions.filter(a => a.category === 'utility').length,
  }), [actions]);

  const iconSize = getResponsiveClass({
    mobile: 'w-9 h-9',
    tablet: 'w-10 h-10',
    desktop: 'w-11 h-11',
  });

  const iconInnerSize = getResponsiveClass({
    mobile: 'w-4 h-4',
    tablet: 'w-5 h-5',
    desktop: 'w-5 h-5',
  });

  const titleClass = getResponsiveClass({
    mobile: 'text-sm',
    tablet: 'text-sm',
    desktop: 'text-base',
  });

  const subtitleClass = getResponsiveClass({
    mobile: 'text-[10px]',
    tablet: 'text-xs',
    desktop: 'text-xs',
  });

  return (
    <Card className="overflow-hidden border-border/40 bg-card shadow-sm">
      {/* Header */}
      <CardHeader className="text-right pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {showCustomizer && userType && (
              <QuickActionsCustomizer 
                userType={userType}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    {!isMobile && <span>{t('dashboard.categories.customize')}</span>}
                  </Button>
                }
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex-1 text-right">
            <CardTitle className={cn(isMobile ? 'text-lg' : 'text-xl', 'text-foreground flex items-center justify-end gap-2')}>
              {title}
              <Badge variant="secondary" className="text-[10px] font-normal">
                {actions.length}
              </Badge>
            </CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <CardContent className="pt-0 space-y-3">
              {/* Search + Category Filters */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t('dashboard.searchAction')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 h-9 text-sm bg-muted/30 border-border/50 focus-visible:ring-1"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide justify-end pb-0.5">
                  {(Object.keys(categoryConfig) as CategoryFilter[]).map((cat) => {
                    const cfg = categoryConfig[cat];
                    const count = categoryCounts[cat];
                    const isActive = activeCategory === cat;
                    if (count === 0 && cat !== 'all') return null;
                    return (
                      <Button
                        key={cat}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'h-7 text-[11px] sm:text-xs gap-0.5 sm:gap-1 rounded-full px-2 sm:px-3 transition-all whitespace-nowrap shrink-0 touch-manipulation',
                          isActive 
                            ? 'shadow-sm' 
                            : 'bg-transparent hover:bg-muted'
                        )}
                      >
                        <cfg.icon className={cn('h-3 w-3 shrink-0', !isActive && cfg.color)} />
                        {cfg.label}
                        <span className={cn(
                          'text-[9px] sm:text-[10px] min-w-4 text-center rounded-full px-0.5 sm:px-1',
                          isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                        )}>
                          {count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Actions Grid */}
              {filteredActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('dashboard.noMatchingResults')}</p>
                </div>
              ) : (
                <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 4 }} gap="sm">
                  <AnimatePresence mode="popLayout">
                    {filteredActions.map((action, index) => (
                      <motion.div
                        key={action.id || `${action.title}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer"
                        onClick={() => {
                          if (action.onClick) {
                            action.onClick();
                          } else if (action.path) {
                            navigate(action.path);
                          }
                        }}
                      >
                        <div className={cn(
                          'h-full rounded-2xl relative overflow-hidden group',
                          'bg-card border border-border/50',
                          'shadow-sm hover:shadow-lg transition-all duration-400',
                          'hover:border-primary/30'
                        )}>
                          {/* Decorative geometric pattern */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <svg className="absolute -top-4 -left-4 w-20 h-20 text-primary/[0.04]" viewBox="0 0 80 80">
                              <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1"/>
                              <circle cx="40" cy="40" r="10" fill="currentColor" opacity="0.3"/>
                            </svg>
                            <svg className="absolute -bottom-3 -right-3 w-16 h-16 text-primary/[0.03]" viewBox="0 0 64 64">
                              <rect x="8" y="8" width="48" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 32 32)"/>
                              <rect x="18" y="18" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                            {/* Subtle dotted line */}
                            <div className="absolute top-2 right-2 left-2 h-px bg-[repeating-linear-gradient(90deg,hsl(var(--primary)/0.06)_0px,hsl(var(--primary)/0.06)_2px,transparent_2px,transparent_6px)]" />
                          </div>
                          
                          <div className={cn(isMobile ? 'p-3' : 'p-4', 'relative flex flex-col items-end gap-3')}>
                            {/* Icon */}
                            <div className={cn(
                              iconSize,
                              'rounded-xl flex items-center justify-center shrink-0',
                              'bg-primary/10 text-primary',
                              'group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300'
                            )}>
                              <action.icon className={cn(iconInnerSize, 'drop-shadow-sm')} />
                            </div>
                            {/* Text */}
                            <div className="w-full text-right">
                              <h3 className={cn('font-bold text-foreground truncate leading-tight', titleClass)}>
                                {action.title}
                              </h3>
                              <p className={cn('text-muted-foreground mt-0.5 line-clamp-2 leading-snug', subtitleClass)}>
                                {action.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ResponsiveGrid>
              )}

              {searchQuery && filteredActions.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  {t('dashboard.showing')} {filteredActions.length} {t('dashboard.of')} {actions.length} {t('dashboard.action')}
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default QuickActionsGrid;
