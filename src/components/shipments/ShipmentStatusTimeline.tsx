import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { 
  CheckCircle2, 
  Clock, 
  User,
  FileText,
  Receipt,
  ShieldCheck,
  MapPin,
  CalendarClock,
  Package,
  Truck,
  ArrowDown,
  Layers,
  Route,
  Milestone,
  Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  allStatuses,
  transporterStatuses,
  recyclerStatuses,
  disposalStatuses,
  getStatusConfig,
  mapLegacyStatus,
  legacyStatusMapping,
  type StatusConfig,
  type ShipmentStatus,
} from '@/lib/shipmentStatusConfig';

interface LogEntry {
  id: string;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  changed_by: string | null;
  user_name?: string;
}

interface Declaration {
  id: string;
  declaration_type: string;
  declared_at: string;
  driver_name: string | null;
  generator_name: string | null;
  transporter_name: string | null;
  recycler_name: string | null;
  status: string;
  auto_generated: boolean;
}

interface ReceiptEntry {
  id: string;
  receipt_number: string;
  status: string;
  created_at: string;
  notes: string | null;
}

interface ProgressMilestone {
  id: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface ShipmentStatusTimelineProps {
  shipment: {
    id?: string;
    status: string;
    created_at: string;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
    destination_type?: string | null;
  };
  showCard?: boolean;
  showProgressMilestones?: boolean;
  onRefresh?: () => void;
}

const declarationTypeLabels: Record<string, string> = {
  'generator_handover': 'إقرار تسليم المولّد',
  'transporter_delivery': 'إقرار تسليم الناقل',
  'recycler_receipt': 'إقرار استلام المدوّر',
  'receipt': 'شهادة الاستلام',
};

// Map legacy DB statuses to timestamps from the shipment object
const getTimestampForLegacyStatus = (
  status: string, 
  shipment: ShipmentStatusTimelineProps['shipment']
): string | null => {
  switch (status) {
    case 'new':
    case 'pending':
      return shipment.created_at;
    case 'approved':
    case 'registered':
      return shipment.approved_at || null;
    case 'collecting':
    case 'in_transit':
    case 'loading':
    case 'weighing':
    case 'weighed':
    case 'picked_up':
    case 'on_the_way':
      return shipment.in_transit_at || shipment.collection_started_at || null;
    case 'delivering':
    case 'delivered':
    case 'receiving':
    case 'received':
    case 'sorting':
    case 'processing':
    case 'recycling':
    case 'disposal_receiving':
    case 'disposal_weighing':
    case 'disposal_inspection':
    case 'disposal_classification':
    case 'disposal_treatment':
    case 'disposal_final':
      return shipment.delivered_at || null;
    case 'confirmed':
    case 'completed':
    case 'disposal_completed':
      return shipment.confirmed_at || null;
    default:
      return null;
  }
};

const ShipmentStatusTimeline = ({ 
  shipment, 
  showCard = true, 
  showProgressMilestones = true,
  onRefresh,
}: ShipmentStatusTimelineProps) => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);
  const [progressMilestones, setProgressMilestones] = useState<ProgressMilestone[]>([]);

  // Determine the current detailed status from the shipment's DB status
  const currentDetailedStatus = useMemo(() => {
    return mapLegacyStatus(shipment.status);
  }, [shipment.status]);

  // Build the relevant timeline steps based on destination type and current status
  const timelineSteps = useMemo(() => {
    const currentConfig = getStatusConfig(currentDetailedStatus);
    
    // Always show transporter phase
    const steps: StatusConfig[] = [...transporterStatuses];
    
    // Determine if destination is disposal or recycler
    const isDisposal = shipment.destination_type === 'disposal' || 
                       currentConfig?.phase === 'disposal';
    
    if (isDisposal) {
      steps.push(...disposalStatuses);
    } else {
      steps.push(...recyclerStatuses);
    }
    
    return steps;
  }, [currentDetailedStatus, shipment.destination_type]);

  // Find the current status index in the timeline
  const currentStatusIndex = useMemo(() => {
    const idx = timelineSteps.findIndex(s => s.key === currentDetailedStatus);
    if (idx >= 0) return idx;
    
    // Fallback: find by matching the legacy status order
    const currentConfig = getStatusConfig(currentDetailedStatus);
    if (currentConfig) return currentConfig.order - 1;
    return 0;
  }, [currentDetailedStatus, timelineSteps]);

  // Build a map of statuses that have been reached (from logs)
  const reachedStatuses = useMemo(() => {
    const reached = new Set<string>();
    reached.add('pending'); // Always reached
    
    // Add statuses from logs
    for (const log of logEntries) {
      const mapped = mapLegacyStatus(log.status);
      reached.add(mapped);
      reached.add(log.status);
    }
    
    // Mark all statuses up to current as reached
    for (let i = 0; i <= currentStatusIndex; i++) {
      if (timelineSteps[i]) reached.add(timelineSteps[i].key);
    }
    
    return reached;
  }, [logEntries, currentStatusIndex, timelineSteps]);

  // Fetch all data
  useEffect(() => {
    if (!shipment.id) return;

    const fetchAll = async () => {
      const { data: logsData } = await supabase
        .from('shipment_logs')
        .select('id, status, notes, latitude, longitude, created_at, changed_by')
        .eq('shipment_id', shipment.id!)
        .order('created_at', { ascending: true });

      if (logsData) {
        const userIds = [...new Set(logsData.map(l => l.changed_by).filter(Boolean))];
        let userMap: Record<string, string> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          if (profiles) {
            userMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name || 'مستخدم']));
          }
        }

        setLogEntries(logsData.map(l => ({
          ...l,
          user_name: l.changed_by ? userMap[l.changed_by] || 'مستخدم' : undefined,
        })) as LogEntry[]);

        if (showProgressMilestones) {
          setProgressMilestones(
            (logsData as any[]).filter(l => l.notes?.includes('تقدم تلقائي')).map(l => ({
              id: l.id,
              notes: l.notes || '',
              latitude: l.latitude,
              longitude: l.longitude,
              created_at: l.created_at,
            }))
          );
        }
      }

      const { data: declData } = await supabase
        .from('delivery_declarations')
        .select('id, declaration_type, declared_at, driver_name, generator_name, transporter_name, recycler_name, status, auto_generated')
        .eq('shipment_id', shipment.id!);
      
      if (declData) setDeclarations(declData as Declaration[]);

      const { data: rcpData } = await supabase
        .from('shipment_receipts')
        .select('id, receipt_number, status, created_at, notes')
        .eq('shipment_id', shipment.id!);
      
      if (rcpData) setReceipts(rcpData as ReceiptEntry[]);
    };

    fetchAll();

    const channel = supabase
      .channel(getTabChannelName(`timeline-logs-${shipment.id}`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipment_logs', filter: `shipment_id=eq.${shipment.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_declarations', filter: `shipment_id=eq.${shipment.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_receipts', filter: `shipment_id=eq.${shipment.id}` }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shipment.id, showProgressMilestones]);

  const getMilestoneIcon = (notes: string) => {
    if (notes.includes('منتصف') || notes.includes('50%')) return Flag;
    if (notes.includes('كم')) return Route;
    return Milestone;
  };

  // Get log entries for a specific status
  const getLogsForStatus = (statusKey: string) => {
    return logEntries.filter(l => {
      const mapped = mapLegacyStatus(l.status);
      return (mapped === statusKey || l.status === statusKey) && !l.notes?.includes('تقدم تلقائي');
    });
  };

  // Get declarations relevant to a status
  const getDeclarationsForStatus = (statusKey: string) => {
    const phase = getStatusConfig(statusKey)?.phase;
    if (phase === 'transporter' && ['picked_up', 'on_the_way', 'in_transit'].includes(statusKey)) {
      return declarations.filter(d => d.declaration_type === 'generator_handover');
    }
    if (statusKey === 'delivering') {
      return declarations.filter(d => d.declaration_type === 'transporter_delivery');
    }
    if (['receiving', 'received', 'disposal_receiving'].includes(statusKey)) {
      return [
        ...declarations.filter(d => d.declaration_type === 'transporter_delivery'),
        ...declarations.filter(d => d.declaration_type === 'recycler_receipt'),
      ];
    }
    if (['completed', 'disposal_completed'].includes(statusKey)) {
      return declarations.filter(d => d.declaration_type === 'recycler_receipt');
    }
    return [];
  };

  const getReceiptsForStatus = (statusKey: string) => {
    if (['delivering', 'receiving', 'received', 'disposal_receiving'].includes(statusKey)) return receipts;
    return [];
  };

  const currentStepConfig = getStatusConfig(currentDetailedStatus);
  const CurrentIcon = currentStepConfig?.icon || Package;

  // Group steps by phase for visual separation
  const phases = useMemo(() => {
    const groups: { phase: string; label: string; steps: typeof timelineSteps }[] = [];
    let currentPhase = '';
    
    for (const step of timelineSteps) {
      if (step.phase !== currentPhase) {
        currentPhase = step.phase;
        const phaseLabels: Record<string, string> = {
          transporter: '🚛 مرحلة النقل',
          recycler: '♻️ مرحلة التدوير',
          disposal: '🔥 مرحلة التخلص',
        };
        groups.push({ phase: step.phase, label: phaseLabels[step.phase] || step.phase, steps: [] });
      }
      groups[groups.length - 1].steps.push(step);
    }
    
    return groups;
  }, [timelineSteps]);

  // In-transit milestones
  const inTransitMilestones = progressMilestones.filter(m => {
    const inTransitTime = shipment.in_transit_at ? new Date(shipment.in_transit_at).getTime() : 0;
    const deliveredTime = shipment.delivered_at ? new Date(shipment.delivered_at).getTime() : Date.now();
    const milestoneTime = new Date(m.created_at).getTime();
    return milestoneTime >= inTransitTime && milestoneTime <= deliveredTime;
  });

  const content = (
    <div className="space-y-6">
      {/* Current Status Display */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
        <Badge className={cn("text-sm px-4 py-1.5", currentStepConfig?.colorClass || 'bg-slate-400')}>
          {currentStepConfig?.labelAr || shipment.status}
        </Badge>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">الحالة الحالية:</span>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentStepConfig?.colorClass || 'bg-slate-400', "text-white")}>
            <CurrentIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timeline by Phase */}
      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.phase}>
            {/* Phase Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-muted-foreground">{phase.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Phase Steps */}
            <div className="relative">
              <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-1">
                {phase.steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const globalIdx = timelineSteps.indexOf(step);
                  const isActive = step.key === currentDetailedStatus;
                  const isCompleted = globalIdx < currentStatusIndex;
                  const isFuture = globalIdx > currentStatusIndex;

                  // Find timestamp from logs or shipment data
                  const logForStatus = logEntries.find(l => {
                    const mapped = mapLegacyStatus(l.status);
                    return mapped === step.key || l.status === step.key;
                  });
                  const timestamp = logForStatus?.created_at || getTimestampForLegacyStatus(step.key, shipment);

                  const statusLogs = getLogsForStatus(step.key);
                  const statusDeclarations = getDeclarationsForStatus(step.key);
                  const statusReceipts = getReceiptsForStatus(step.key);
                  const hasDetails = statusLogs.length > 0 || statusDeclarations.length > 0 || statusReceipts.length > 0;

                  const isInTransitStep = ['in_transit', 'on_the_way'].includes(step.key);
                  const showMilestones = isInTransitStep && inTransitMilestones.length > 0 && showProgressMilestones;

                  return (
                    <div key={step.key}>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (phaseIdx * 5 + index) * 0.05 }}
                        className={cn(
                          "relative flex items-center gap-4 p-3 rounded-lg transition-all",
                          isActive && "bg-primary/5 border border-primary/20",
                          isCompleted && "opacity-90",
                          isFuture && "opacity-40"
                        )}
                      >
                        <div
                          className={cn(
                            "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                            isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                            isCompleted && cn("border-transparent text-white", step.colorClass),
                            isFuture && "border-muted-foreground/30 bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              {(isCompleted || isActive) && timestamp && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(timestamp), 'PPp', { locale: ar })}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium text-sm",
                                isActive && "text-primary",
                                isCompleted && "text-foreground",
                                isFuture && "text-muted-foreground"
                              )}>
                                {step.labelAr}
                              </p>
                              {isActive && (
                                <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                                  الحالة الحالية
                                </Badge>
                              )}
                              {isCompleted && (
                                <span className="text-xs text-green-600 dark:text-green-400">مكتمل ✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Detailed log entries for this status */}
                      {hasDetails && (isCompleted || isActive) && (
                        <div className="mr-8 border-r-2 border-dashed border-muted-foreground/20 pr-4 py-2 space-y-2">
                          {/* Log entries */}
                          {statusLogs.map((log, lIndex) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + lIndex * 0.05 }}
                              className="flex items-start gap-3 p-2.5 rounded-md bg-muted/30 text-sm"
                            >
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-0.5">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 text-right space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(log.created_at), 'hh:mm a - yyyy/MM/dd', { locale: ar })}
                                  </span>
                                  {log.user_name && (
                                    <span className="text-xs font-semibold text-foreground">
                                      {log.user_name}
                                    </span>
                                  )}
                                </div>
                                {log.notes && (
                                  <p className="text-xs text-muted-foreground leading-relaxed">{log.notes}</p>
                                )}
                                {(log.latitude && log.longitude) && (
                                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                    <MapPin className="w-3 h-3" />
                                    <span>{log.latitude?.toFixed(4)}, {log.longitude?.toFixed(4)}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}

                          {/* Declarations */}
                          {statusDeclarations.map((decl, dIndex) => (
                            <motion.div
                              key={decl.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + dIndex * 0.05 }}
                              className="flex items-start gap-3 p-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-sm"
                            >
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-800/50 text-amber-600 shrink-0 mt-0.5">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 text-right space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    decl.status === 'active' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'
                                  )}>
                                    {decl.status === 'active' ? 'فعال' : 'معلق'}
                                  </Badge>
                                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    📄 {declarationTypeLabels[decl.declaration_type] || decl.declaration_type}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {decl.driver_name && <span>🚛 السائق: {decl.driver_name}</span>}
                                  {decl.generator_name && <span>🏭 المولّد: {decl.generator_name}</span>}
                                  {decl.transporter_name && <span>🚚 الناقل: {decl.transporter_name}</span>}
                                  {decl.recycler_name && <span>♻️ المدوّر: {decl.recycler_name}</span>}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarClock className="w-3 h-3" />
                                  <span>{format(new Date(decl.declared_at), 'PPp', { locale: ar })}</span>
                                  {decl.auto_generated && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 mr-1">تلقائي</Badge>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {/* Receipts */}
                          {statusReceipts.map((rcp, rIndex) => (
                            <motion.div
                              key={rcp.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.35 + rIndex * 0.05 }}
                              className="flex items-start gap-3 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-sm"
                            >
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 shrink-0 mt-0.5">
                                <Receipt className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 text-right space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    rcp.status === 'confirmed' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'
                                  )}>
                                    {rcp.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                                  </Badge>
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    🧾 شهادة استلام: {rcp.receipt_number}
                                  </span>
                                </div>
                                {rcp.notes && (
                                  <p className="text-xs text-muted-foreground">{rcp.notes}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarClock className="w-3 h-3" />
                                  <span>{format(new Date(rcp.created_at), 'PPp', { locale: ar })}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Inline Milestones for in_transit */}
                      {showMilestones && (
                        <div className="mr-8 border-r-2 border-dashed border-primary/30 pr-4 py-2 space-y-2">
                          {inTransitMilestones.map((milestone, mIndex) => {
                            const MilestoneIcon = getMilestoneIcon(milestone.notes);
                            const isHalfway = milestone.notes.includes('منتصف') || milestone.notes.includes('50%');
                            
                            return (
                              <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + mIndex * 0.05 }}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-md text-sm",
                                  isHalfway ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted/30"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center",
                                  isHalfway ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                                )}>
                                  <MilestoneIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 text-right">
                                  <p className="text-xs font-medium">
                                    {milestone.notes.replace('تقدم تلقائي: ', '')}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(milestone.created_at), 'hh:mm a', { locale: ar })}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="pt-4 border-t space-y-3">
        {(declarations.length > 0 || receipts.length > 0) && (
          <div className="flex flex-wrap gap-2 justify-end">
            {declarations.length > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <FileText className="w-3 h-3" />
                {declarations.length} إقرار
              </Badge>
            )}
            {receipts.length > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Receipt className="w-3 h-3" />
                {receipts.length} شهادة استلام
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1 text-xs">
              <ShieldCheck className="w-3 h-3" />
              {logEntries.length} سجل
            </Badge>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {currentStatusIndex + 1} من {timelineSteps.length}
          </span>
          <span className="font-medium">تقدم الشحنة</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStatusIndex + 1) / timelineSteps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-l from-primary to-green-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <Clock className="w-5 h-5 text-primary" />
          سجل تتبع حالة الشحنة
        </CardTitle>
        <CardDescription>السجل الزمني الكامل لتغييرات الحالة والإقرارات وشهادات الاستلام</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default ShipmentStatusTimeline;
