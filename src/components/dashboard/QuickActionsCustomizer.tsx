import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { 
  Settings2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { QuickActionConfig, getQuickActionsByType } from '@/config/quickActions';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsCustomizerProps {
  userType: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal' | 'consultant' | 'consulting_office';
  trigger?: React.ReactNode;
}

export default function QuickActionsCustomizer({
  userType,
  trigger,
}: QuickActionsCustomizerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { 
    preferences, 
    loading, 
    saving, 
    moveUp, 
    moveDown, 
    toggleVisibility, 
    resetToDefault,
    applyOrder,
  } = useQuickActionPreferences();

  const baseActions = useMemo(() => getQuickActionsByType(userType), [userType]);
  
  const orderedActions = useMemo(() => {
    if (!preferences?.action_order?.length) {
      return baseActions;
    }
    
    const actionMap = new Map(baseActions.map(a => [a.id, a]));
    const ordered: QuickActionConfig[] = [];
    
    for (const id of preferences.action_order) {
      const action = actionMap.get(id);
      if (action) {
        ordered.push(action);
        actionMap.delete(id);
      }
    }
    
    for (const action of actionMap.values()) {
      ordered.push(action);
    }
    
    return ordered;
  }, [baseActions, preferences?.action_order]);

  const handleMoveUp = async (actionId: string) => {
    const success = await moveUp(actionId, orderedActions);
    if (success) {
      toast({
        title: 'تم التحديث',
        description: 'تم نقل الإجراء لأعلى',
      });
    }
  };

  const handleMoveDown = async (actionId: string) => {
    const success = await moveDown(actionId, orderedActions);
    if (success) {
      toast({
        title: 'تم التحديث',
        description: 'تم نقل الإجراء لأسفل',
      });
    }
  };

  const handleToggleVisibility = async (actionId: string) => {
    const success = await toggleVisibility(actionId);
    if (success) {
      const isNowHidden = preferences?.hidden_actions?.includes(actionId);
      toast({
        title: 'تم التحديث',
        description: isNowHidden ? 'تم إظهار الإجراء' : 'تم إخفاء الإجراء',
      });
    }
  };

  const handleReset = async () => {
    const success = await resetToDefault();
    if (success) {
      toast({
        title: 'تم الاستعادة',
        description: 'تم استعادة الترتيب الافتراضي',
      });
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'primary': return 'أساسي';
      case 'secondary': return 'ثانوي';
      case 'utility': return 'أدوات';
      default: return '';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'secondary': return 'bg-secondary text-secondary-foreground';
      case 'utility': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            تخصيص الترتيب
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            تخصيص الإجراءات السريعة
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            استخدم الأسهم لتغيير ترتيب الإجراءات أو إخفائها
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orderedActions.map((action, index) => {
                const isHidden = preferences?.hidden_actions?.includes(action.id);
                const Icon = action.icon;
                
                return (
                  <motion.div
                    key={action.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      'transition-all',
                      isHidden && 'opacity-50 bg-muted/30'
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Reorder Controls */}
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveUp(action.id)}
                              disabled={saving || index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMoveDown(action.id)}
                              disabled={saving || index === orderedActions.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Action Icon */}
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                            action.iconBgClass || 'bg-primary/10'
                          )}>
                            <Icon className={cn(
                              'h-5 w-5',
                              action.iconBgClass ? 'text-white' : 'text-primary'
                            )} />
                          </div>

                          {/* Action Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{action.title}</h4>
                              {action.category && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn('text-[10px] px-1.5 py-0', getCategoryColor(action.category))}
                                >
                                  {getCategoryLabel(action.category)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {action.subtitle}
                            </p>
                          </div>

                          {/* Visibility Toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleToggleVisibility(action.id)}
                            disabled={saving}
                          >
                            {isHidden ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleReset}
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            استعادة الترتيب الافتراضي
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
