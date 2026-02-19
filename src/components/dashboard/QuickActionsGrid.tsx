import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Settings2, Search, Star, Layers, Wrench, ChevronDown, ChevronUp, Grid3X3 } from 'lucide-react';
import { useDisplayMode } from '@/hooks/useDisplayMode';
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

const categoryConfig: Record<CategoryFilter, { label: string; icon: LucideIcon; color: string }> = {
  all: { label: 'الكل', icon: Grid3X3, color: 'text-foreground' },
  primary: { label: 'أساسي', icon: Star, color: 'text-amber-500' },
  secondary: { label: 'ثانوي', icon: Layers, color: 'text-blue-500' },
  utility: { label: 'أدوات', icon: Wrench, color: 'text-muted-foreground' },
};

const QuickActionsGrid = ({ 
  actions, 
  title = 'الإجراءات السريعة', 
  subtitle = 'الوظائف الإدارية المستخدمة بكثرة',
  userType,
  showCustomizer = false,
}: QuickActionsGridProps) => {
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <Card className="overflow-hidden glass-card border-border/30">
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
                    {!isMobile && <span>تخصيص</span>}
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
            <CardTitle className={cn(isMobile ? 'text-lg' : 'text-xl', 'text-primary flex items-center justify-end gap-2')}>
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
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="ابحث عن إجراء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
                    dir="rtl"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 flex-wrap justify-end">
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
                          'h-7 text-xs gap-1 rounded-full px-3 transition-all',
                          isActive 
                            ? 'shadow-sm' 
                            : 'bg-transparent hover:bg-muted'
                        )}
                      >
                        <cfg.icon className={cn('h-3 w-3', !isActive && cfg.color)} />
                        {cfg.label}
                        <span className={cn(
                          'text-[10px] min-w-4 text-center rounded-full px-1',
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
                  <p className="text-sm">لا توجد نتائج مطابقة</p>
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
                        whileHover={{ scale: 1.04, y: -4 }}
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
                          'shadow-md hover:shadow-2xl transition-all duration-500',
                          action.iconBgClass || 'bg-gradient-to-br from-primary to-primary/80'
                        )}>
                          {/* Decorative background pattern */}
                          <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/30" />
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/20" />
                          </div>
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                          
                          <div className={cn(isMobile ? 'p-3' : 'p-4', 'relative flex flex-col items-end gap-3')}>
                            {/* Icon */}
                            <div className={cn(
                              iconSize,
                              'rounded-xl flex items-center justify-center shrink-0',
                              'bg-white/20 backdrop-blur-sm shadow-inner',
                              'group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300'
                            )}>
                              <action.icon className={cn(iconInnerSize, 'text-white drop-shadow-sm')} />
                            </div>
                            {/* Text */}
                            <div className="w-full text-right">
                              <h3 className={cn('font-bold text-white truncate leading-tight drop-shadow-sm', titleClass)}>
                                {action.title}
                              </h3>
                              <p className={cn('text-white/75 mt-0.5 line-clamp-2 leading-snug', subtitleClass)}>
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

              {/* Summary footer */}
              {searchQuery && filteredActions.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  عرض {filteredActions.length} من {actions.length} إجراء
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
