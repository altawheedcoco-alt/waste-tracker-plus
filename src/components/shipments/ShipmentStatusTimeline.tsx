import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowDown,
  Layers,
  Route,
  Milestone,
  Flag,
  User,
  FileText,
  Receipt,
  ShieldCheck,
  MapPin,
  CalendarClock
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  };
  showCard?: boolean;
  showProgressMilestones?: boolean;
}

const statusOrder = ['new', 'approved', 'in_transit', 'delivered', 'confirmed'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  new: { label: 'جديدة', icon: Package, colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
  approved: { label: 'معتمدة', icon: CheckCircle2, colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/50' },
  in_transit: { label: 'قيد النقل', icon: Truck, colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
  delivered: { label: 'تم التسليم', icon: ArrowDown, colorClass: 'text-teal-500 bg-teal-100 dark:bg-teal-900/50' },
  confirmed: { label: 'مؤكد/مكتمل', icon: Layers, colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50' },
};

const declarationTypeLabels: Record<string, string> = {
  'generator_handover': 'إقرار تسليم المولّد',
  'transporter_delivery': 'إقرار تسليم الناقل',
  'recycler_receipt': 'إقرار استلام المدوّر',
  'receipt': 'شهادة الاستلام',
};

const ShipmentStatusTimeline = ({ shipment, showCard = true, showProgressMilestones = true }: ShipmentStatusTimelineProps) => {
  const currentStatusIndex = statusOrder.indexOf(shipment.status);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);
  const [progressMilestones, setProgressMilestones] = useState<ProgressMilestone[]>([]);

  // Fetch all data
  useEffect(() => {
    if (!shipment.id) return;

    const fetchAll = async () => {
      // Fetch log entries
      const { data: logsData } = await supabase
        .from('shipment_logs')
        .select('id, status, notes, latitude, longitude, created_at, changed_by')
        .eq('shipment_id', shipment.id!)
        .order('created_at', { ascending: true });

      if (logsData) {
        // Fetch user names for changed_by
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

        // Extract progress milestones
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

      // Fetch declarations
      const { data: declData } = await supabase
        .from('delivery_declarations')
        .select('id, declaration_type, declared_at, driver_name, generator_name, transporter_name, recycler_name, status, auto_generated')
        .eq('shipment_id', shipment.id!);
      
      if (declData) setDeclarations(declData as Declaration[]);

      // Fetch receipts
      const { data: rcpData } = await supabase
        .from('shipment_receipts')
        .select('id, receipt_number, status, created_at, notes')
        .eq('shipment_id', shipment.id!);
      
      if (rcpData) setReceipts(rcpData as ReceiptEntry[]);
    };

    fetchAll();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(getTabChannelName(`timeline-logs-${shipment.id}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shipment_logs', filter: `shipment_id=eq.${shipment.id}` },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_declarations', filter: `shipment_id=eq.${shipment.id}` },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipment_receipts', filter: `shipment_id=eq.${shipment.id}` },
        () => fetchAll()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shipment.id, showProgressMilestones]);

  const getTimestamp = (status: string): string | null => {
    switch (status) {
      case 'new': return shipment.created_at;
      case 'approved': return shipment.approved_at || null;
      case 'in_transit': return shipment.in_transit_at || null;
      case 'delivered': return shipment.delivered_at || null;
      case 'confirmed': return shipment.confirmed_at || null;
      default: return null;
    }
  };

  const getMilestoneIcon = (notes: string) => {
    if (notes.includes('منتصف') || notes.includes('50%')) return Flag;
    if (notes.includes('كم')) return Route;
    return Milestone;
  };

  // Get log entries for a specific status
  const getLogsForStatus = (status: string) => {
    return logEntries.filter(l => l.status === status && !l.notes?.includes('تقدم تلقائي'));
  };

  // Get declarations relevant to a status
  const getDeclarationsForStatus = (status: string) => {
    switch (status) {
      case 'approved':
      case 'in_transit':
        return declarations.filter(d => d.declaration_type === 'generator_handover');
      case 'delivered':
        return [
          ...declarations.filter(d => d.declaration_type === 'transporter_delivery'),
          ...declarations.filter(d => d.declaration_type === 'recycler_receipt'),
        ];
      case 'confirmed':
        return declarations.filter(d => d.declaration_type === 'recycler_receipt');
      default:
        return [];
    }
  };

  // Get receipts relevant to a status
  const getReceiptsForStatus = (status: string) => {
    if (status === 'in_transit' || status === 'delivered') return receipts;
    return [];
  };

  const steps = statusOrder.map((status, index) => ({
    key: status,
    label: status,
    arabicLabel: statusConfig[status]?.label || status,
    icon: statusConfig[status]?.icon || Package,
    timestamp: getTimestamp(status),
    isActive: index === currentStatusIndex,
    isCompleted: index < currentStatusIndex,
  }));

  const currentStatus = statusConfig[shipment.status] || statusConfig.new;
  const CurrentIcon = currentStatus.icon;

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
        <Badge className={cn("text-sm px-4 py-1.5", currentStatus.colorClass)}>
          {currentStatus.label}
        </Badge>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">الحالة الحالية:</span>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentStatus.colorClass)}>
            <CurrentIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-1">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const config = statusConfig[step.key];
            const isInTransit = step.key === 'in_transit';
            const showMilestones = isInTransit && inTransitMilestones.length > 0 && showProgressMilestones;
            const statusLogs = getLogsForStatus(step.key);
            const statusDeclarations = getDeclarationsForStatus(step.key);
            const statusReceipts = getReceiptsForStatus(step.key);
            const hasDetails = statusLogs.length > 0 || statusDeclarations.length > 0 || statusReceipts.length > 0;
            
            return (
              <div key={step.key}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative flex items-center gap-4 p-3 rounded-lg transition-all",
                    step.isActive && "bg-primary/5 border border-primary/20",
                    step.isCompleted && "opacity-90",
                    !step.isActive && !step.isCompleted && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      step.isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                      step.isCompleted && cn("border-transparent", config.colorClass),
                      !step.isActive && !step.isCompleted && "border-muted-foreground/30 bg-muted text-muted-foreground"
                    )}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        {step.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(step.timestamp), 'PPp', { locale: ar })}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          "font-medium",
                          step.isActive && "text-primary",
                          step.isCompleted && "text-foreground",
                          !step.isActive && !step.isCompleted && "text-muted-foreground"
                        )}>
                          {step.arabicLabel}
                        </p>
                        {step.isActive && (
                          <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                            الحالة الحالية
                          </Badge>
                        )}
                        {step.isCompleted && (
                          <span className="text-xs text-green-600 dark:text-green-400">مكتمل ✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Detailed log entries for this status */}
                {hasDetails && (step.isCompleted || step.isActive) && (
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
                            {decl.driver_name && (
                              <span>🚛 السائق: {decl.driver_name}</span>
                            )}
                            {decl.generator_name && (
                              <span>🏭 المولّد: {decl.generator_name}</span>
                            )}
                            {decl.transporter_name && (
                              <span>🚚 الناقل: {decl.transporter_name}</span>
                            )}
                            {decl.recycler_name && (
                              <span>♻️ المدوّر: {decl.recycler_name}</span>
                            )}
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

      {/* Summary Stats */}
      <div className="pt-4 border-t space-y-3">
        {/* Document summary */}
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
            {currentStatusIndex + 1} من {statusOrder.length}
          </span>
          <span className="font-medium">تقدم الشحنة</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStatusIndex + 1) / statusOrder.length) * 100}%` }}
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
