import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';

interface DashboardWidgetCustomizerProps {
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  trigger?: React.ReactNode;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  quick_action: { label: 'إجراءات', color: 'bg-primary/10 text-primary' },
  stats: { label: 'إحصائيات', color: 'bg-accent text-accent-foreground' },
  data: { label: 'بيانات', color: 'bg-muted text-muted-foreground' },
  financial: { label: 'مالية', color: 'bg-primary/10 text-primary' },
  operations: { label: 'تشغيلية', color: 'bg-secondary text-secondary-foreground' },
  compliance: { label: 'امتثال', color: 'bg-destructive/10 text-destructive' },
  ai: { label: 'ذكاء اصطناعي', color: 'bg-primary/15 text-primary' },
  advanced: { label: 'متقدمة', color: 'bg-accent text-accent-foreground' },
};

export default function DashboardWidgetCustomizer({ orgType, trigger }: DashboardWidgetCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    allWidgets,
    effectivePrefs,
    loading,
    saving,
    moveWidget,
    toggleWidget,
    togglePin,
    resetToDefaults,
  } = useDashboardWidgets(orgType);

  // Build ordered list including hidden for customizer
  const orderedForDisplay = (() => {
    const order = effectivePrefs.widget_order.length
      ? effectivePrefs.widget_order
      : allWidgets.map(w => w.id);
    const widgetMap = new Map(allWidgets.map(w => [w.id, w]));
    const result: typeof allWidgets = [];
    for (const id of order) {
      const w = widgetMap.get(id);
      if (w) { result.push(w); widgetMap.delete(id); }
    }
    for (const w of widgetMap.values()) result.push(w);
    return result;
  })();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            تخصيص الويدجت
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            تخصيص لوحة التحكم
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            رتب الويدجت، ثبّت المهمة، أو أخفِ غير المطلوبة
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orderedForDisplay.map((widget, index) => {
                const isHidden = effectivePrefs.hidden_widgets.includes(widget.id);
                const isPinned = effectivePrefs.pinned_widgets.includes(widget.id);
                const Icon = widget.icon;
                const cat = categoryLabels[widget.category];

                return (
                  <motion.div
                    key={widget.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      'transition-all',
                      isHidden && 'opacity-40 bg-muted/30',
                      isPinned && !isHidden && 'border-primary/30 bg-primary/[0.02]'
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => moveWidget(widget.id, 'up')}
                              disabled={saving || index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => moveWidget(widget.id, 'down')}
                              disabled={saving || index === orderedForDisplay.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Icon */}
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{widget.title}</h4>
                              {cat && (
                                <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', cat.color)}>
                                  {cat.label}
                                </Badge>
                              )}
                              {isPinned && !isHidden && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                                  📌
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                          </div>

                          {/* Pin toggle */}
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                            onClick={() => togglePin(widget.id)} disabled={saving}
                          >
                            {isPinned ? (
                              <Pin className="h-4 w-4 text-primary" />
                            ) : (
                              <PinOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>

                          {/* Visibility toggle */}
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                            onClick={() => toggleWidget(widget.id)} disabled={saving}
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
          <Button variant="outline" className="w-full gap-2"
            onClick={resetToDefaults} disabled={saving || loading}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            استعادة الافتراضي
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
