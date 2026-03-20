import { useState, useEffect, useMemo } from 'react';
import CameraArrivalProof from './CameraArrivalProof';
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
  /** نوع الجهة المشاهدة — يتحكم بالمراحل المعروضة */
  orgType?: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';
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
  orgType,
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
    // Each party sees ONLY their own phase statuses
    if (orgType === 'recycler') return recyclerStatuses;
    if (orgType === 'disposal') return disposalStatuses;
    if (orgType === 'admin') {
      const currentConfig = getStatusConfig(currentDetailedStatus);
      const isDisposal = shipment.destination_type === 'disposal' || currentConfig?.phase === 'disposal';
      return isDisposal
        ? [...transporterStatuses, ...disposalStatuses]
        : [...transporterStatuses, ...recyclerStatuses];
    }
    // generator, transporter, driver → transporter phase only
    return transporterStatuses;
  }, [currentDetailedStatus, shipment.destination_type, orgType]);

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

  // Track which step is expanded to show details
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Collect details for the expanded step
  const getExpandedDetails = (stepKey: string) => {
    const statusLogs = getLogsForStatus(stepKey);
    const statusDeclarations = getDeclarationsForStatus(stepKey);
    const statusReceipts = getReceiptsForStatus(stepKey);
    const isInTransitStep = ['in_transit', 'on_the_way'].includes(stepKey);
    const milestones = isInTransitStep && showProgressMilestones ? inTransitMilestones : [];
    return { statusLogs, statusDeclarations, statusReceipts, milestones };
  };

  const content = (
    <div className="space-y-4" dir="rtl">
      {/* Current Status Badge */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", currentStepConfig?.colorClass || 'bg-muted', currentStepConfig ? 'text-primary-foreground' : 'text-muted-foreground')}>
            <CurrentIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">الحالة الحالية</span>
        </div>
        <Badge className={cn("text-xs px-3 py-1", currentStepConfig?.colorClass || 'bg-slate-400')}>
          {currentStepConfig?.labelAr || shipment.status}
        </Badge>
      </div>

      {/* Horizontal Timeline by Phase */}
      <div className="space-y-5">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.phase}>
            {/* Phase Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{phase.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Horizontal Steps */}
            <div className="overflow-x-auto pb-2 -mx-1">
              <div className="flex items-start min-w-max px-1">
                {phase.steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const globalIdx = timelineSteps.indexOf(step);
                  const isActive = step.key === currentDetailedStatus;
                  const isCompleted = globalIdx < currentStatusIndex;
                  const isFuture = globalIdx > currentStatusIndex;
                  const isExpanded = expandedStep === step.key;

                  const logForStatus = logEntries.find(l => {
                    const mapped = mapLegacyStatus(l.status);
                    return mapped === step.key || l.status === step.key;
                  });
                  const timestamp = logForStatus?.created_at || getTimestampForLegacyStatus(step.key, shipment);

                  const statusLogs = getLogsForStatus(step.key);
                  const statusDeclarations = getDeclarationsForStatus(step.key);
                  const statusReceipts = getReceiptsForStatus(step.key);
                  const hasDetails = statusLogs.length > 0 || statusDeclarations.length > 0 || statusReceipts.length > 0;

                  return (
                    <div key={step.key} className="flex items-start">
                      {/* Step Node */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (phaseIdx * 5 + index) * 0.04 }}
                        className={cn(
                          "flex flex-col items-center cursor-pointer group min-w-[56px]",
                          isFuture && "opacity-40"
                        )}
                        onClick={() => {
                          if ((isCompleted || isActive) && hasDetails) {
                            setExpandedStep(isExpanded ? null : step.key);
                          }
                        }}
                      >
                        {/* Circle */}
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                            isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/30",
                            isCompleted && cn("border-transparent text-primary-foreground", step.colorClass),
                            isFuture && "border-muted-foreground/30 bg-muted text-muted-foreground",
                            (isCompleted || isActive) && hasDetails && "group-hover:ring-2 group-hover:ring-primary/20"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>

                        {/* Label */}
                        <p className={cn(
                          "text-[10px] mt-1.5 text-center leading-tight max-w-[52px]",
                          isActive && "text-primary font-bold",
                          isCompleted && "text-foreground font-medium",
                          isFuture && "text-muted-foreground"
                        )}>
                          {step.labelAr}
                        </p>

                        {/* Timestamp */}
                        {(isCompleted || isActive) && timestamp && (
                          <span className="text-[8px] text-muted-foreground mt-0.5 text-center">
                            {format(new Date(timestamp), 'hh:mm a', { locale: ar })}
                          </span>
                        )}

                        {/* Details indicator */}
                        {(isCompleted || isActive) && hasDetails && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1 transition-colors",
                            isExpanded ? "bg-primary" : "bg-muted-foreground/40"
                          )} />
                        )}
                      </motion.div>

                      {/* Connector Line */}
                      {index < phase.steps.length - 1 && (
                        <div className={cn(
                          "h-0.5 min-w-[16px] flex-shrink-0 mt-[18px]",
                          isCompleted ? "bg-emerald-500" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded Details Panel — below the horizontal strip */}
            {phase.steps.map((step) => {
              if (expandedStep !== step.key) return null;
              const globalIdx = timelineSteps.indexOf(step);
              const isActive = step.key === currentDetailedStatus;
              const isCompleted = globalIdx < currentStatusIndex;
              if (!isCompleted && !isActive) return null;

              const { statusLogs, statusDeclarations, statusReceipts, milestones } = getExpandedDetails(step.key);
              if (statusLogs.length === 0 && statusDeclarations.length === 0 && statusReceipts.length === 0 && milestones.length === 0) return null;

              return (
                <motion.div
                  key={`detail-${step.key}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border rounded-lg p-3 bg-muted/20 space-y-2 mt-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <button onClick={() => setExpandedStep(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    <span className="text-xs font-bold text-foreground">{step.labelAr}</span>
                  </div>

                  {/* Log entries */}
                  {statusLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-md bg-background/80 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 mt-0.5">
                        <User className="w-3 h-3" />
                      </div>
                      <div className="flex-1 text-right space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(log.created_at), 'hh:mm a - yyyy/MM/dd', { locale: ar })}
                          </span>
                          {log.user_name && <span className="text-[10px] font-semibold">{log.user_name}</span>}
                        </div>
                        {log.notes && <p className="text-[10px] text-muted-foreground leading-relaxed">{log.notes}</p>}
                        {(log.latitude && log.longitude) && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{log.latitude?.toFixed(4)}, {log.longitude?.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Declarations */}
                  {statusDeclarations.map((decl) => (
                    <div key={decl.id} className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-800/50 text-amber-600 shrink-0 mt-0.5">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div className="flex-1 text-right space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1 py-0",
                            decl.status === 'active' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'
                          )}>
                            {decl.status === 'active' ? 'فعال' : 'معلق'}
                          </Badge>
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            📄 {declarationTypeLabels[decl.declaration_type] || decl.declaration_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                          {decl.driver_name && <span>🚛 {decl.driver_name}</span>}
                          {decl.generator_name && <span>🏭 {decl.generator_name}</span>}
                          {decl.transporter_name && <span>🚚 {decl.transporter_name}</span>}
                          {decl.recycler_name && <span>♻️ {decl.recycler_name}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarClock className="w-2.5 h-2.5" />
                          <span>{format(new Date(decl.declared_at), 'PPp', { locale: ar })}</span>
                          {decl.auto_generated && <Badge variant="secondary" className="text-[8px] px-1 py-0 mr-1">تلقائي</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Receipts */}
                  {statusReceipts.map((rcp) => (
                    <div key={rcp.id} className="flex items-start gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 shrink-0 mt-0.5">
                        <Receipt className="w-3 h-3" />
                      </div>
                      <div className="flex-1 text-right space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1 py-0",
                            rcp.status === 'confirmed' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'
                          )}>
                            {rcp.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                          </Badge>
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            🧾 شهادة استلام: {rcp.receipt_number}
                          </span>
                        </div>
                        {rcp.notes && <p className="text-[10px] text-muted-foreground">{rcp.notes}</p>}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarClock className="w-2.5 h-2.5" />
                          <span>{format(new Date(rcp.created_at), 'PPp', { locale: ar })}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Milestones */}
                  {milestones.map((milestone) => {
                    const MilestoneIcon = getMilestoneIcon(milestone.notes);
                    const isHalfway = milestone.notes.includes('منتصف') || milestone.notes.includes('50%');
                    return (
                      <div key={milestone.id} className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-sm",
                        isHalfway ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted/30"
                      )}>
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          isHalfway ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                        )}>
                          <MilestoneIcon className="w-3 h-3" />
                        </div>
                        <p className="text-[10px] font-medium flex-1 text-right">
                          {milestone.notes.replace('تقدم تلقائي: ', '')}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(milestone.created_at), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Document Chain Summary */}
      {(() => {
        // Deduplicate: keep only the latest declaration per type
        const declByType = new Map<string, Declaration>();
        for (const d of declarations) {
          const existing = declByType.get(d.declaration_type);
          if (!existing || new Date(d.declared_at) > new Date(existing.declared_at)) {
            declByType.set(d.declaration_type, d);
          }
        }
        const uniqueDeclarations = Array.from(declByType.values());

        // Deduplicate receipts: keep only latest per status (confirmed vs pending)
        const confirmedReceipts = receipts.filter(r => r.status === 'confirmed');
        const pendingReceipts = receipts.filter(r => r.status !== 'confirmed');
        const latestConfirmed = confirmedReceipts.length > 0 ? confirmedReceipts[confirmedReceipts.length - 1] : null;
        const latestPending = pendingReceipts.length > 0 ? pendingReceipts[pendingReceipts.length - 1] : null;
        const uniqueReceiptCount = (latestConfirmed ? 1 : 0) + (latestPending ? 1 : 0);

        // Filter logs to only meaningful status changes (not auto-progress)
        const meaningfulLogs = logEntries.filter(l => !l.notes?.includes('تقدم تلقائي'));

        const documentChain = [
          { key: 'generator_handover', label: 'إقرار المولّد (تسليم)', icon: FileText, roles: ['generator', 'transporter', 'driver', 'admin'] },
          { key: 'generator_delivery', label: 'إقرار المولّد (تسليم)', icon: FileText, roles: ['generator', 'transporter', 'driver', 'admin'] },
          { key: 'transporter_transport', label: 'إقرار الناقل (استلام)', icon: FileText, roles: ['transporter', 'driver', 'generator', 'admin'] },
          { key: 'driver_confirmation', label: 'إقرار السائق (استلام)', icon: FileText, roles: ['driver', 'transporter', 'admin'] },
          { key: 'transporter_delivery', label: 'إقرار الناقل (تسليم)', icon: FileText, roles: ['transporter', 'driver', 'recycler', 'disposal', 'admin'] },
          { key: 'driver_delivery', label: 'إقرار السائق (تسليم)', icon: FileText, roles: ['driver', 'transporter', 'recycler', 'disposal', 'admin'] },
          { key: 'recycler_receipt', label: 'إقرار المدوّر (استلام)', icon: FileText, roles: ['recycler', 'disposal', 'admin'] },
          { key: 'disposal_receipt', label: 'إقرار التخلص (استلام)', icon: FileText, roles: ['disposal', 'admin'] },
          { key: 'recycling_certificate', label: 'شهادة التدوير', icon: FileText, roles: ['recycler', 'generator', 'transporter', 'admin'] },
          { key: 'disposal_certificate', label: 'شهادة التخلص', icon: FileText, roles: ['disposal', 'generator', 'transporter', 'admin'] },
        ];
        // Only show unique types that exist AND are relevant to the viewer
        const viewerRole = orgType || 'admin';
        const shownTypes = new Set<string>();
        const filteredChain = documentChain.filter(dc => {
          if (!dc.roles.includes(viewerRole)) return false;
          const decl = declByType.get(dc.key);
          if (!decl) return false;
          const normalizedKey = dc.key === 'generator_handover' ? 'generator' : dc.key === 'generator_delivery' ? 'generator' : dc.key;
          if (shownTypes.has(normalizedKey)) return false;
          shownTypes.add(normalizedKey);
          return true;
        });

        // Receipt visibility: transporter side sees receipts, recycler side sees receipts
        const showReceipt = !orgType || ['transporter', 'driver', 'generator', 'recycler', 'disposal', 'admin'].includes(orgType);

        return (
          <div className="pt-3 border-t space-y-3">
            {/* Document Chain Status */}
            {(filteredChain.length > 0 || uniqueReceiptCount > 0) && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-right text-muted-foreground">سلسلة المستندات</p>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {filteredChain.map(dc => {
                    const decl = declByType.get(dc.key)!;
                    const isConfirmed = decl.status === 'confirmed' || decl.status === 'active';
                    return (
                      <Badge
                        key={dc.key}
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px] px-2",
                          isConfirmed
                            ? "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50"
                            : "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/50"
                        )}
                      >
                        {isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {dc.label}
                      </Badge>
                    );
                  })}
                  {showReceipt && latestConfirmed && (
                    <Badge variant="outline" className="gap-1 text-[10px] px-2 border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50">
                      <CheckCircle2 className="w-3 h-3" />
                      شهادة استلام
                    </Badge>
                  )}
                  {showReceipt && latestPending && !latestConfirmed && (
                    <Badge variant="outline" className="gap-1 text-[10px] px-2 border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/50">
                      <Clock className="w-3 h-3" />
                      شهادة استلام
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Minimal stats row */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <ShieldCheck className="w-3 h-3" />
                {meaningfulLogs.length} تغيير حالة
              </Badge>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{currentStatusIndex + 1} من {timelineSteps.length}</span>
                <span className="font-medium">تقدم الشحنة</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStatusIndex + 1) / timelineSteps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-l from-primary to-green-500 rounded-full"
              />
            </div>
          </div>
        );
      })()}
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
      <CardContent className="space-y-4">
        {shipment.id && <CameraArrivalProof shipmentId={shipment.id} compact />}
        {content}
      </CardContent>
    </Card>
  );
};

export default ShipmentStatusTimeline;
