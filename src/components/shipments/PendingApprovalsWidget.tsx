import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Clock, CheckCircle2, XCircle, Timer, Package, AlertTriangle,
  ChevronLeft, ChevronDown, ChevronUp, Building2, Truck, Recycle,
  MapPin, Weight, Phone, ExternalLink, MessageCircle, FileText,
  Sparkles, Eye, Loader2, Ban, RotateCcw, Zap, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
import { toast } from 'sonner';
import { notifyAdmins } from '@/services/unifiedNotifier';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface PendingShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  pickup_address?: string;
  delivery_address?: string;
  created_at: string;
  status: string;
  notes?: string;
  generator_notes?: string;
  hazard_level?: string;
  packaging_method?: string;
  expected_delivery_date?: string;
  generator_auto_approve_deadline?: string;
  recycler_auto_approve_deadline?: string;
  generator_id?: string;
  transporter_id?: string;
  recycler_id?: string;
  generator?: { name: string; phone?: string } | null;
  transporter?: { name: string; phone?: string } | null;
  recycler?: { name: string; phone?: string } | null;
}

// ── Inline Approval Actions ──
const InlineApprovalActions = ({
  shipment,
  approvalType,
  onComplete,
}: {
  shipment: PendingShipment;
  approvalType: 'generator' | 'recycler';
  onComplete: () => void;
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          [`${approvalType}_approval_status`]: 'approved',
          [`${approvalType}_approval_at`]: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      if (error) throw error;

      // Notify transporter
      if (shipment.transporter_id) {
        await supabase.functions.invoke('smart-notifications', {
          body: {
            action: 'send',
            title: '✅ تمت الموافقة على الشحنة',
            message: `الشحنة ${shipment.shipment_number} تمت الموافقة عليها`,
            type: 'shipment_approved',
            shipment_id: shipment.id,
            organization_id: shipment.transporter_id,
          },
        }).catch(() => {});
      }

      await notifyAdmins(
        '✅ موافقة على شحنة',
        `الشحنة ${shipment.shipment_number} تمت الموافقة عليها`,
        { type: 'shipment_approved', reference_id: shipment.id, reference_type: 'shipment' }
      ).catch(() => {});

      toast.success(`تمت الموافقة على الشحنة ${shipment.shipment_number}`);
      onComplete();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('حدث خطأ أثناء الموافقة');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }
    setIsRejecting(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          [`${approvalType}_approval_status`]: 'rejected',
          [`${approvalType}_approval_at`]: new Date().toISOString(),
          [`${approvalType}_rejection_reason`]: rejectionReason.trim(),
        })
        .eq('id', shipment.id);

      if (error) throw error;

      if (shipment.transporter_id) {
        await supabase.functions.invoke('smart-notifications', {
          body: {
            action: 'send',
            title: '❌ تم رفض الشحنة',
            message: `الشحنة ${shipment.shipment_number} تم رفضها. السبب: ${rejectionReason}`,
            type: 'shipment_rejected',
            shipment_id: shipment.id,
            organization_id: shipment.transporter_id,
          },
        }).catch(() => {});
      }

      await notifyAdmins(
        '❌ رفض شحنة',
        `الشحنة ${shipment.shipment_number} تم رفضها. السبب: ${rejectionReason}`,
        { type: 'shipment_rejected', reference_id: shipment.id, reference_type: 'shipment' }
      ).catch(() => {});

      toast.success('تم رفض الشحنة');
      onComplete();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setIsRejecting(false);
    }
  };

  if (showRejectForm) {
    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 mt-3">
        <Textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="سبب الرفض (مطلوب)..."
          className="min-h-[70px] text-right text-sm"
          dir="rtl"
        />
        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}>
            إلغاء
          </Button>
          <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()}>
            {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            تأكيد الرفض
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        size="sm"
        variant="outline"
        className="h-9 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 flex-1"
        onClick={(e) => { e.stopPropagation(); setShowRejectForm(true); }}
        disabled={isRejecting}
      >
        <XCircle className="w-3.5 h-3.5" />
        رفض
      </Button>
      <Button
        size="sm"
        className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
        onClick={(e) => { e.stopPropagation(); handleApprove(); }}
        disabled={isApproving}
      >
        {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        موافقة
      </Button>
    </div>
  );
};

// ── Smart Solutions ──
function getSuggestedSolutions(shipment: PendingShipment, approvalType: string): string[] {
  const solutions: string[] = [];
  const hoursSinceCreation = differenceInHours(new Date(), new Date(shipment.created_at));

  if (hoursSinceCreation > 24) {
    solutions.push('الشحنة مضى عليها أكثر من يوم — راجع البيانات بعناية قبل الموافقة');
  }
  if (shipment.hazard_level === 'high' || shipment.hazard_level === 'critical') {
    solutions.push('مخلفات عالية الخطورة — تأكد من وجود تصاريح النقل والتخلص');
  }
  if (!shipment.pickup_address || !shipment.delivery_address) {
    solutions.push('العناوين غير مكتملة — تواصل مع الناقل لتأكيد البيانات');
  }
  if (approvalType === 'generator') {
    solutions.push('تحقق أن الكمية والنوع يطابقان ما تم الاتفاق عليه');
    if (shipment.transporter) {
      solutions.push(`تواصل مع الناقل "${shipment.transporter.name}" لتأكيد الموعد`);
    }
  }
  if (approvalType === 'recycler') {
    solutions.push('تأكد من جاهزية المنشأة لاستقبال هذه الكمية');
    solutions.push('راجع مواصفات المخلفات وطريقة التعبئة');
  }
  if (shipment.quantity && shipment.quantity > 5000) {
    solutions.push('كمية كبيرة — قد تحتاج ترتيب مسبق لمنطقة التفريغ');
  }

  return solutions.slice(0, 4);
}

// ── Hazard Badge ──
const HazardBadge = ({ level }: { level?: string }) => {
  if (!level || level === 'low') return null;
  const config: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
    medium: { label: 'خطورة متوسطة', variant: 'secondary' },
    high: { label: 'خطورة عالية', variant: 'destructive' },
    critical: { label: 'خطورة حرجة', variant: 'destructive' },
  };
  const c = config[level];
  if (!c) return null;
  return <Badge variant={c.variant} className="text-[10px] gap-0.5"><Shield className="w-2.5 h-2.5" />{c.label}</Badge>;
};

// ── Main Component ──
export default function PendingApprovalsWidget() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const organizationType = organization?.organization_type;
  const organizationId = organization?.id;
  const approvalType = organizationType === 'generator' ? 'generator' : 'recycler';

  const fetchPendingApprovals = useCallback(async () => {
    if (!organizationId || !organizationType) return;
    if (organizationType !== 'generator' && organizationType !== 'recycler') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const orgField = organizationType === 'generator' ? 'generator_id' : 'recycler_id';
      const approvalField = organizationType === 'generator' ? 'generator_approval_status' : 'recycler_approval_status';

      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, pickup_address, delivery_address, created_at, status, notes, generator_notes, hazard_level, packaging_method, expected_delivery_date, generator_auto_approve_deadline, recycler_auto_approve_deadline, generator_id, transporter_id, recycler_id')
        .eq(orgField, organizationId)
        .eq(approvalField, 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const orgIds = new Set<string>();
        data.forEach((s: any) => {
          if (s.generator_id) orgIds.add(s.generator_id);
          if (s.transporter_id) orgIds.add(s.transporter_id);
          if (s.recycler_id) orgIds.add(s.recycler_id);
        });

        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name, phone')
          .in('id', Array.from(orgIds));

        const orgsMap = new Map<string, { name: string; phone?: string }>();
        orgsData?.forEach((org: any) => orgsMap.set(org.id, { name: org.name, phone: org.phone }));

        setPendingShipments(data.map((s: any) => ({
          ...s,
          generator: s.generator_id ? orgsMap.get(s.generator_id) : null,
          transporter: s.transporter_id ? orgsMap.get(s.transporter_id) : null,
          recycler: s.recycler_id ? orgsMap.get(s.recycler_id) : null,
        })));
      } else {
        setPendingShipments([]);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, organizationType]);

  useEffect(() => {
    fetchPendingApprovals();
    const channel = supabase
      .channel(getTabChannelName('pending-approvals'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => fetchPendingApprovals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPendingApprovals]);

  const getTimeInfo = (deadline?: string) => {
    if (!deadline) return null;
    const remaining = differenceInMinutes(new Date(deadline), new Date());
    if (remaining <= 0) return { label: 'منتهي — موافقة تلقائية', urgent: true, progress: 0 };
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return {
      label: hours > 0 ? `${hours} ساعة ${mins} دقيقة` : `${mins} دقيقة`,
      urgent: remaining < 60,
      progress: Math.min(100, (remaining / (15 * 60)) * 100),
    };
  };

  if (organizationType !== 'generator' && organizationType !== 'recycler') return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />الشحنات المعلقة للموافقة</CardTitle></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div></CardContent>
      </Card>
    );
  }

  if (pendingShipments.length === 0) {
    return (
      <Card className="border-border/40">
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" />الشحنات المعلقة للموافقة</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/60" />
            <p className="text-sm">لا توجد شحنات معلقة — كل شيء تحت السيطرة ✓</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="border-amber-300/50 dark:border-amber-700/40 shadow-sm">
        <CardHeader className="bg-amber-50/80 dark:bg-amber-950/20 pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchPendingApprovals()}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate('/dashboard/shipments')}>
                <ExternalLink className="w-3 h-3" />عرض الكل
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-base">الشحنات المعلقة للموافقة</span>
              <Badge variant="destructive" className="animate-pulse text-xs">
                {pendingShipments.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div
            className="max-h-[500px] overflow-y-auto divide-y divide-border/50"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border) / 0.6) transparent' }}
          >
            <AnimatePresence>
              {pendingShipments.map((shipment) => {
                const deadline = approvalType === 'generator' ? shipment.generator_auto_approve_deadline : shipment.recycler_auto_approve_deadline;
                const timeInfo = getTimeInfo(deadline);
                const isExpanded = expandedId === shipment.id;
                const solutions = getSuggestedSolutions(shipment, approvalType);
                const hoursSince = differenceInHours(new Date(), new Date(shipment.created_at));

                return (
                  <motion.div
                    key={shipment.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    {/* Urgency indicator stripe */}
                    {timeInfo?.urgent && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive animate-pulse" />
                    )}

                    <div className="p-4 space-y-3" dir="rtl">
                      {/* Row 1: Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs gap-1">
                            <Package className="w-3 h-3" />
                            {shipment.shipment_number}
                          </Badge>
                          <HazardBadge level={shipment.hazard_level} />
                          {hoursSince > 48 && (
                            <Badge variant="destructive" className="text-[10px]">متأخرة {Math.floor(hoursSince / 24)} يوم</Badge>
                          )}
                        </div>
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          onClick={() => setExpandedId(isExpanded ? null : shipment.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Row 2: Key Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Weight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{shipment.quantity} {shipment.unit || 'كجم'}</span>
                        </div>
                        {shipment.packaging_method && (
                          <div className="text-muted-foreground">{shipment.packaging_method}</div>
                        )}
                      </div>

                      {/* Row 3: Parties */}
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        {shipment.generator && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            <span className="text-muted-foreground">المولد:</span>
                            <span className="font-medium">{shipment.generator.name}</span>
                          </div>
                        )}
                        {shipment.transporter && (
                          <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-amber-500" />
                            <span className="text-muted-foreground">الناقل:</span>
                            <span className="font-medium">{shipment.transporter.name}</span>
                          </div>
                        )}
                        {shipment.recycler && (
                          <div className="flex items-center gap-1">
                            <Recycle className="w-3 h-3 text-emerald-500" />
                            <span className="text-muted-foreground">المدور:</span>
                            <span className="font-medium">{shipment.recycler.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Row 4: Addresses */}
                      <div className="flex flex-col gap-1 text-xs">
                        {shipment.pickup_address && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3 h-3 text-destructive shrink-0" />
                            <span>الاستلام: {shipment.pickup_address}</span>
                          </div>
                        )}
                        {shipment.delivery_address && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>التسليم: {shipment.delivery_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Timer Bar */}
                      {timeInfo && (
                        <div className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 border",
                          timeInfo.urgent
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/60"
                        )}>
                          <Timer className={cn("w-3.5 h-3.5 shrink-0", timeInfo.urgent ? "text-destructive" : "text-amber-600")} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={cn("font-medium", timeInfo.urgent ? "text-destructive" : "text-amber-700 dark:text-amber-400")}>
                                موافقة تلقائية بعد: {timeInfo.label}
                              </span>
                            </div>
                            <Progress value={timeInfo.progress} className={cn("h-1.5", timeInfo.urgent ? "[&>div]:bg-destructive" : "")} />
                          </div>
                        </div>
                      )}

                      {/* Row 5: Time info */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>📅 {format(new Date(shipment.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>— {formatDistanceToNow(new Date(shipment.created_at), { locale: ar, addSuffix: true })}</span>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-3"
                          >
                            {/* Notes */}
                            {(shipment.notes || shipment.generator_notes) && (
                              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                                {shipment.notes && <p>📝 ملاحظات: {shipment.notes}</p>}
                                {shipment.generator_notes && <p>📋 ملاحظات المولد: {shipment.generator_notes}</p>}
                              </div>
                            )}

                            {/* Smart Solutions */}
                            {solutions.length > 0 && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  توصيات وحلول مباشرة
                                </div>
                                <ul className="space-y-1.5">
                                  {solutions.map((sol, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                                      <span className="bg-primary/20 text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                                      <span className="leading-relaxed">{sol}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}>
                                    <Eye className="w-3 h-3" />تفاصيل الشحنة
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>فتح صفحة تفاصيل الشحنة كاملة</TooltipContent>
                              </Tooltip>

                              {shipment.transporter?.phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => window.open(`tel:${shipment.transporter?.phone}`)}>
                                      <Phone className="w-3 h-3" />اتصال بالناقل
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{shipment.transporter.phone}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* External Action Buttons — Always Visible */}
                      <InlineApprovalActions
                        shipment={shipment}
                        approvalType={approvalType}
                        onComplete={fetchPendingApprovals}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
