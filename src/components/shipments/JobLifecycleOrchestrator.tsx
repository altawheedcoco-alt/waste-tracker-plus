import { memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, 
  ShieldCheck, Scale, MapPin, FileText, UserCheck, Microscope,
  ArrowLeft, Lock
} from 'lucide-react';
import { useJobLifecycle, getGateLabel, isGateMandatory } from '@/hooks/useJobLifecycle';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface JobLifecycleOrchestratorProps {
  shipmentId: string;
  organizationId: string;
  onAllGatesPassed?: () => void;
  compact?: boolean;
}

const gateIcons: Record<string, any> = {
  consultant_classification: Microscope,
  consultant_approval: UserCheck,
  weight_verification: Scale,
  geofence_verification: MapPin,
  safety_check: ShieldCheck,
  document_completion: FileText,
};

const gateColors: Record<string, string> = {
  passed: 'bg-emerald-500 text-white border-emerald-500',
  failed: 'bg-destructive text-white border-destructive',
  pending: 'bg-muted text-muted-foreground border-border',
  bypassed: 'bg-amber-500 text-white border-amber-500',
};

const JobLifecycleOrchestrator = memo(({ 
  shipmentId, organizationId, onAllGatesPassed, compact = false 
}: JobLifecycleOrchestratorProps) => {
  const { gates, isLoading, initializeGates, updateGate, progress, allPassed, canProceed, nextPendingGate } = useJobLifecycle(shipmentId);
  const { user } = useAuth();

  // Initialize gates if none exist
  useEffect(() => {
    if (!isLoading && gates.length === 0 && shipmentId && organizationId) {
      initializeGates.mutate({ shipmentId, organizationId });
    }
  }, [isLoading, gates.length, shipmentId, organizationId]);

  useEffect(() => {
    if (canProceed && onAllGatesPassed) onAllGatesPassed();
  }, [canProceed, onAllGatesPassed]);

  if (isLoading || gates.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
        <TooltipProvider>
          {gates.map((gate, i) => {
            const Icon = gateIcons[gate.gate_type] || ShieldCheck;
            return (
              <Tooltip key={gate.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                      gateColors[gate.gate_status]
                    )}>
                      {gate.gate_status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       gate.gate_status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> :
                       <Icon className="w-3.5 h-3.5" />}
                    </div>
                    {i < gates.length - 1 && (
                      <div className={cn(
                        'w-3 h-0.5',
                        gate.gate_status === 'passed' ? 'bg-emerald-500' : 'bg-border'
                      )} />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{getGateLabel(gate.gate_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {gate.gate_status === 'passed' ? '✅ تم الاعتماد' : 
                     gate.gate_status === 'failed' ? '❌ مرفوض' : '⏳ قيد الانتظار'}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
        <Badge variant={canProceed ? 'default' : 'secondary'} className="text-[10px]">
          {progress}%
        </Badge>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={canProceed ? 'default' : 'outline'} className="gap-1">
            {canProceed ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {canProceed ? 'جاهز للفوترة' : 'بوابات الاعتماد'}
          </Badge>
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            دورة حياة المهمة
          </CardTitle>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground text-right mt-1">
          {gates.filter(g => g.gate_status === 'passed').length} من {gates.length} بوابات مكتملة
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {gates.map((gate, i) => {
          const Icon = gateIcons[gate.gate_type] || ShieldCheck;
          const isNext = nextPendingGate?.id === gate.id;
          const isMandatory = isGateMandatory(gate.gate_type);

          return (
            <motion.div
              key={gate.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                gate.gate_status === 'passed' && 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
                gate.gate_status === 'failed' && 'bg-destructive/5 border-destructive/30',
                gate.gate_status === 'bypassed' && 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40',
                gate.gate_status === 'pending' && isNext && 'bg-primary/5 border-primary/30 ring-1 ring-primary/20',
                gate.gate_status === 'pending' && !isNext && 'opacity-50',
              )}
              dir="rtl"
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0',
                gateColors[gate.gate_status]
              )}>
                {gate.gate_status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> : 
                 gate.gate_status === 'failed' ? <XCircle className="w-4 h-4" /> :
                 gate.gate_status === 'bypassed' ? <AlertTriangle className="w-4 h-4" /> :
                 <Icon className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{getGateLabel(gate.gate_type)}</p>
                  {!isMandatory && (
                    <Badge variant="outline" className="text-[9px] h-4 border-amber-300 text-amber-600 dark:text-amber-400">
                      تحذيري
                    </Badge>
                  )}
                </div>
                {gate.gate_status === 'bypassed' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ تم التجاوز — المسؤولية على المُنفذ</p>
                )}
                {gate.checked_at && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(gate.checked_at), 'PPp', { locale: ar })}
                  </p>
                )}
                {gate.notes && (
                  <p className="text-xs text-muted-foreground truncate">{gate.notes}</p>
                )}
                {isNext && (
                  <Badge variant="outline" className="text-[10px] mt-1 border-primary text-primary">
                    البوابة التالية
                  </Badge>
                )}
              </div>

              {gate.gate_status === 'pending' && isNext && (
                <div className="flex gap-1 shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-7 px-2"
                    onClick={() => updateGate.mutate({ gateId: gate.id, status: 'passed' })}
                  >
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    اعتماد
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs h-7 px-2"
                    onClick={() => updateGate.mutate({ gateId: gate.id, status: 'failed', notes: 'مرفوض' })}
                  >
                    <XCircle className="w-3 h-3 ml-1" />
                    رفض
                  </Button>
                  {!isMandatory && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 border-amber-300 text-amber-600 hover:bg-amber-50"
                      onClick={() => updateGate.mutate({ gateId: gate.id, status: 'bypassed', notes: 'تم التجاوز — بوابة تحذيرية' })}
                    >
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      تجاوز
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {!canProceed && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>لا يمكن إصدار الفاتورة حتى اكتمال البوابات الإلزامية — البوابات التحذيرية يمكن تجاوزها</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

JobLifecycleOrchestrator.displayName = 'JobLifecycleOrchestrator';
export default JobLifecycleOrchestrator;
