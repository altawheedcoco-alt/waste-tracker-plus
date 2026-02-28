import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Check, Truck, Navigation, PackageCheck, ShieldCheck,
  Banknote, CheckCircle, Calculator, ClipboardCheck, Wrench,
  Shield, Award, Recycle, Leaf, Camera, FileText, ClipboardList,
  MessageSquare, Play, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResourceImpactTrail, useChainDefinitions, type ChainStep } from '@/hooks/useImpactChain';

const ICON_MAP: Record<string, typeof Plus> = {
  plus: Plus, check: Check, truck: Truck, navigation: Navigation,
  'package-check': PackageCheck, 'shield-check': ShieldCheck,
  banknote: Banknote, 'check-circle': CheckCircle, calculator: Calculator,
  'clipboard-check': ClipboardCheck, wrench: Wrench, shield: Shield,
  award: Award, recycle: Recycle, leaf: Leaf, camera: Camera,
  'file-text': FileText, 'clipboard-list': ClipboardList,
  'message-square': MessageSquare, play: Play,
};

interface ImpactTrailWidgetProps {
  resourceType: string;
  resourceId: string;
  chainKey: string;
  compact?: boolean;
}

const ImpactTrailWidget = memo(({ resourceType, resourceId, chainKey, compact = false }: ImpactTrailWidgetProps) => {
  const { data: events = [], isLoading: eventsLoading } = useResourceImpactTrail(resourceType, resourceId);
  const { data: definitions = [] } = useChainDefinitions();

  const chain = useMemo(() => definitions.find(d => d.chain_key === chainKey), [definitions, chainKey]);
  const steps = chain?.steps || [];

  const completedSteps = useMemo(() => {
    const set = new Set(events.map(e => e.step_key));
    return set;
  }, [events]);

  if (!chain || steps.length === 0) return null;

  return (
    <Card className={cn('overflow-hidden', compact && 'border-0 shadow-none bg-transparent')}>
      {!compact && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 justify-end">
            <Zap className="w-4 h-4 text-primary" />
            سلسلة الأثر — {chain.chain_name_ar}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(compact && 'p-0')}>
        <TooltipProvider>
          <div className="flex items-center gap-0 overflow-x-auto pb-2" dir="rtl">
            {steps.sort((a, b) => a.order - b.order).map((step, idx) => {
              const Icon = ICON_MAP[step.icon] || Zap;
              const isCompleted = completedSteps.has(step.step_key);
              const event = events.find(e => e.step_key === step.step_key);
              const isLast = idx === steps.length - 1;

              return (
                <div key={step.step_key} className="flex items-center shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          'relative flex flex-col items-center gap-1.5 px-2 py-1.5 rounded-xl cursor-default transition-all min-w-[72px]',
                          isCompleted
                            ? 'bg-primary/10 ring-1 ring-primary/30'
                            : 'bg-muted/40 opacity-60'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                          isCompleted
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          'text-[9px] leading-tight text-center max-w-[68px] line-clamp-2',
                          isCompleted ? 'font-bold text-foreground' : 'text-muted-foreground'
                        )}>
                          {step.button_ar}
                        </span>
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </motion.div>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] text-right" dir="rtl">
                      <div className="space-y-1.5">
                        <p className="font-bold text-xs">{step.button_ar}</p>
                        <div className="text-[10px] space-y-1 text-muted-foreground">
                          <p>⚡ <span className="text-foreground">{step.function_ar}</span></p>
                          <p>📋 <span className="text-foreground">{step.result_ar}</span></p>
                          <p>🎯 <span className="text-foreground">{step.impact_ar}</span></p>
                        </div>
                        {isCompleted && event && (
                          <Badge variant="default" className="text-[9px] mt-1">
                            ✓ تم — {new Date(event.created_at).toLocaleDateString('ar-EG')}
                          </Badge>
                        )}
                        {!isCompleted && (
                          <Badge variant="secondary" className="text-[9px] mt-1">
                            قيد الانتظار
                          </Badge>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Connector line */}
                  {!isLast && (
                    <div className={cn(
                      'w-6 h-0.5 shrink-0 transition-colors',
                      isCompleted && completedSteps.has(steps[idx + 1]?.step_key)
                        ? 'bg-primary'
                        : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-2" dir="rtl">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
            {completedSteps.size}/{steps.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

ImpactTrailWidget.displayName = 'ImpactTrailWidget';
export default ImpactTrailWidget;
