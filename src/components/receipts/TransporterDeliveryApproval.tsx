import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Loader2,
  Shield,
  Zap,
  History,
  AlertTriangle,
  Eye,
  FileCheck,
  RefreshCcw,
  CheckCheck,
  Ban,
  Sparkles,
  ArrowLeftRight,
  ThumbsUp,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getTabChannelName } from '@/lib/tabSession';

type ApprovalStatus = 'pending' | 'approved' | 'auto_approved' | 'rejected';

interface EnrichedReceipt {
  id: string;
  receipt_number: string;
  shipment_id: string;
  waste_type: string | null;
  waste_category: string | null;
  actual_weight: number | null;
  declared_weight: number | null;
  unit: string | null;
  created_at: string;
  transporter_approval_status: ApprovalStatus;
  transporter_approval_deadline: string | null;
  transporter_approved_at: string | null;
  transporter_rejection_reason: string | null;
  status: string;
  shipment?: {
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    generator_id: string;
    pickup_address: string;
    delivery_address: string;
  } | null;
  generator_name: string;
}

// Auto-hide tracking
const SEEN_APPROVED_KEY = 'seen_approved_certificates';
const AUTO_HIDE_MINUTES = 5;

const getSeen = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_APPROVED_KEY) || '{}');
  } catch { return {}; }
};

const markSeen = (id: string) => {
  const seen = getSeen();
  seen[id] = Date.now();
  localStorage.setItem(SEEN_APPROVED_KEY, JSON.stringify(seen));
};

const cleanupSeen = () => {
  const seen = getSeen();
  const now = Date.now();
  const cleaned: Record<string, number> = {};
  for (const [id, ts] of Object.entries(seen)) {
    if (now - ts < AUTO_HIDE_MINUTES * 60 * 1000 * 2) cleaned[id] = ts;
  }
  localStorage.setItem(SEEN_APPROVED_KEY, JSON.stringify(cleaned));
};

const isHidden = (id: string): boolean => {
  const seen = getSeen();
  if (!seen[id]) return false;
  return Date.now() - seen[id] > AUTO_HIDE_MINUTES * 60 * 1000;
};

// ── Countdown Timer ──
const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(deadline).getTime();
  const remaining = Math.max(0, target - now);
  const totalMinutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const progress = Math.max(0, 100 - (remaining / (15 * 60 * 1000)) * 100);

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Zap className="w-3 h-3" />
        <span>تمت الموافقة التلقائية</span>
      </div>
    );
  }

  const isUrgent = totalMinutes < 3;

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1.5 text-xs ${isUrgent ? 'text-destructive animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
        <Clock className="w-3 h-3" />
        <span>
          الموافقة التلقائية خلال {totalMinutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
};

// ── Certificate Card (Enhanced with instant actions) ──
const CertificateCard = ({
  receipt,
  onApprove,
  onReject,
  isSubmitting,
  approvingId,
  showActions = true,
  variant = 'pending',
}: {
  receipt: EnrichedReceipt;
  onApprove: (r: EnrichedReceipt) => void;
  onReject: (r: EnrichedReceipt) => void;
  isSubmitting: boolean;
  approvingId?: string | null;
  showActions?: boolean;
  variant?: 'pending' | 'approved' | 'auto_approved' | 'rejected';
}) => {
  const isThisApproving = approvingId === receipt.id;
  
  const borderColors: Record<string, string> = {
    pending: 'border-amber-300 dark:border-amber-700',
    approved: 'border-emerald-300 dark:border-emerald-700',
    auto_approved: 'border-blue-300 dark:border-blue-700',
    rejected: 'border-destructive/30',
  };

  const bgColors: Record<string, string> = {
    pending: 'bg-amber-50/30 dark:bg-amber-950/10',
    approved: 'bg-emerald-50/30 dark:bg-emerald-950/10',
    auto_approved: 'bg-blue-50/30 dark:bg-blue-950/10',
    rejected: 'bg-destructive/5',
  };

  const statusBadges: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    pending: { label: 'بانتظار الموافقة', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    approved: { label: 'تمت الموافقة', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    auto_approved: { label: 'موافقة تلقائية', icon: Zap, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    rejected: { label: 'مرفوض', icon: Ban, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  };

  const StatusIcon = statusBadges[variant].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ 
        opacity: isThisApproving ? 0.6 : 1, 
        y: 0, 
        scale: isThisApproving ? 0.97 : 1,
        borderColor: isThisApproving ? 'hsl(var(--primary))' : undefined,
      }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className={`${borderColors[variant]} ${bgColors[variant]} transition-all ${isThisApproving ? 'ring-2 ring-primary/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Quick Actions - Enhanced for speed */}
            {showActions && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <Button 
                  size="sm" 
                  onClick={() => onApprove(receipt)} 
                  disabled={isSubmitting} 
                  className="gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  {isThisApproving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  {isThisApproving ? 'جاري...' : 'قبول فوري'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onReject(receipt)} 
                  disabled={isSubmitting} 
                  className="gap-1 w-full transition-all hover:scale-105 active:scale-95"
                >
                  <XCircle className="w-4 h-4" /> رفض
                </Button>
              </div>
            )}

            {/* Details */}
            <div className="flex-1 text-right space-y-2">
              <div className="flex items-center gap-2 justify-end flex-wrap">
                <Badge className={`${statusBadges[variant].className} gap-1 text-[10px]`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusBadges[variant].label}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">{receipt.receipt_number}</Badge>
                {receipt.shipment?.shipment_number && (
                  <Badge variant="secondary" className="text-xs">{receipt.shipment.shipment_number}</Badge>
                )}
                <span className="font-semibold text-sm">{receipt.generator_name || 'مولد غير محدد'}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-end">
                {receipt.waste_type && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">النوع:</span> {receipt.waste_type}
                  </span>
                )}
                {receipt.waste_category && (
                  <Badge variant="outline" className="text-[10px] h-5">{receipt.waste_category}</Badge>
                )}
                {receipt.actual_weight && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">الوزن:</span> {receipt.actual_weight} {receipt.unit || 'كجم'}
                  </span>
                )}
                <span>{format(new Date(receipt.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
              </div>

              {/* Countdown for pending */}
              {variant === 'pending' && receipt.transporter_approval_deadline && (
                <CountdownTimer deadline={receipt.transporter_approval_deadline} />
              )}

              {/* Approval time for approved */}
              {(variant === 'approved' || variant === 'auto_approved') && receipt.transporter_approved_at && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 justify-end">
                  <CheckCheck className="w-3 h-3" />
                  <span>تمت الموافقة {formatDistanceToNow(new Date(receipt.transporter_approved_at), { locale: ar, addSuffix: true })}</span>
                </div>
              )}

              {/* Rejection reason */}
              {variant === 'rejected' && receipt.transporter_rejection_reason && (
                <div className="flex items-center gap-1.5 text-xs text-destructive justify-end mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>سبب الرفض: {receipt.transporter_rejection_reason}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ── Main Component ──
const TransporterDeliveryApproval = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<EnrichedReceipt | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [recentlyApproved, setRecentlyApproved] = useState<Set<string>>(new Set());

  // Cleanup old seen entries
  useEffect(() => { cleanupSeen(); }, []);

  // Auto-hide check interval
  useEffect(() => {
    const interval = setInterval(() => {
      const seen = getSeen();
      const newHidden = new Set<string>();
      for (const [id, ts] of Object.entries(seen)) {
        if (Date.now() - ts > AUTO_HIDE_MINUTES * 60 * 1000) newHidden.add(id);
      }
      setHiddenIds(newHidden);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch ALL receipts ──
  const { data: allReceipts = [], isLoading } = useQuery({
    queryKey: ['delivery-approvals-all', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization.id);

      if (!shipments?.length) return [];
      const shipmentIds = shipments.map(s => s.id);

      const { data, error } = await supabase
        .from('shipment_receipts')
        .select('*')
        .in('shipment_id', shipmentIds)
        .not('generator_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) { console.error('Error:', error); return []; }

      const enriched = await Promise.all(
        (data || []).map(async (receipt: any) => {
          const { data: shipment } = await supabase
            .from('shipments')
            .select('shipment_number, waste_type, quantity, unit, generator_id, pickup_address, delivery_address')
            .eq('id', receipt.shipment_id)
            .maybeSingle();

          let generatorName = '';
          if (shipment?.generator_id) {
            const { data: gen } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', shipment.generator_id)
              .maybeSingle();
            generatorName = gen?.name || '';
          }

          return { ...receipt, shipment, generator_name: generatorName } as EnrichedReceipt;
        })
      );

      return enriched;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 15, // Faster refresh
  });

  // ── Realtime subscription ──
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(getTabChannelName('delivery-cert-approvals'))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipment_receipts',
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['delivery-approvals-all'] });
        
        if (payload.eventType === 'UPDATE') {
          const newStatus = (payload.new as any).transporter_approval_status;
          if (newStatus === 'auto_approved') {
            toast.info('تمت موافقة تلقائية على شهادة تسليم', { icon: <Zap className="w-4 h-4 text-blue-500" /> });
          }
        }
        if (payload.eventType === 'INSERT') {
          toast.info('شهادة تسليم جديدة بانتظار موافقتك', { icon: <FileCheck className="w-4 h-4 text-amber-500" /> });
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [organization?.id, queryClient]);

  // ── Categorized receipts ──
  const categorized = useMemo(() => {
    const pending: EnrichedReceipt[] = [];
    const approved: EnrichedReceipt[] = [];
    const autoApproved: EnrichedReceipt[] = [];
    const rejected: EnrichedReceipt[] = [];

    for (const r of allReceipts) {
      const status = r.transporter_approval_status;
      if (status === 'pending') {
        pending.push(r);
      } else if (status === 'approved') {
        if (!isHidden(r.id)) {
          markSeen(r.id);
          approved.push(r);
        }
      } else if (status === 'auto_approved') {
        if (!isHidden(r.id)) {
          markSeen(r.id);
          autoApproved.push(r);
        }
      } else if (status === 'rejected') {
        rejected.push(r);
      }
    }

    return { pending, approved, autoApproved, rejected };
  }, [allReceipts, hiddenIds]);

  // ── Stats ──
  const stats = useMemo(() => ({
    pending: categorized.pending.length,
    approved: categorized.approved.length,
    autoApproved: categorized.autoApproved.length,
    rejected: categorized.rejected.length,
    total: allReceipts.length,
    urgentCount: categorized.pending.filter(r => {
      if (!r.transporter_approval_deadline) return false;
      return differenceInMinutes(new Date(r.transporter_approval_deadline), new Date()) < 3;
    }).length,
  }), [categorized, allReceipts]);

  // ── Fast Approve Handler (optimistic + instant tab switch) ──
  const handleApprove = async (receipt: EnrichedReceipt) => {
    setApprovingId(receipt.id);
    try {
      const { error } = await supabase
        .from('shipment_receipts')
        .update({
          transporter_approval_status: 'approved',
          transporter_approved_at: new Date().toISOString(),
          status: 'confirmed',
        } as any)
        .eq('id', receipt.id);

      if (error) throw error;
      
      // Add to recently approved for visual feedback
      setRecentlyApproved(prev => new Set(prev).add(receipt.id));
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="font-medium">تم القبول بنجاح ✓</p>
            <p className="text-xs text-muted-foreground">شهادة {receipt.receipt_number} — انتقلت للمقبول</p>
          </div>
        </div>,
        { duration: 3000 }
      );
      
      // Invalidate and switch tab after short delay for animation
      queryClient.invalidateQueries({ queryKey: ['delivery-approvals-all'] });
      
      // Auto-switch to approved tab if this was the last pending
      setTimeout(() => {
        const remainingPending = categorized.pending.filter(r => r.id !== receipt.id);
        if (remainingPending.length === 0) {
          setActiveTab('approved');
        }
      }, 600);
      
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('حدث خطأ أثناء القبول');
    } finally {
      setApprovingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (categorized.pending.length === 0) return;
    setIsSubmitting(true);
    try {
      const ids = categorized.pending.map(r => r.id);
      const { error } = await supabase
        .from('shipment_receipts')
        .update({
          transporter_approval_status: 'approved',
          transporter_approved_at: new Date().toISOString(),
          status: 'confirmed',
        } as any)
        .in('id', ids);

      if (error) throw error;
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="font-bold">تم قبول {ids.length} شهادة دفعة واحدة ⚡</p>
            <p className="text-xs text-muted-foreground">جميع الشهادات انتقلت للمقبول</p>
          </div>
        </div>,
        { duration: 4000 }
      );
      
      queryClient.invalidateQueries({ queryKey: ['delivery-approvals-all'] });
      
      // Switch to approved tab
      setTimeout(() => setActiveTab('approved'), 500);
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('حدث خطأ أثناء الموافقة الجماعية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || !selectedReceipt) {
      toast.error('يجب ذكر سبب الرفض');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: receiptError } = await supabase
        .from('shipment_receipts')
        .update({
          transporter_approval_status: 'rejected',
          transporter_rejection_reason: rejectionReason,
          status: 'rejected',
        } as any)
        .eq('id', selectedReceipt.id);

      if (receiptError) throw receiptError;

      await supabase.from('shipment_rejection_log').insert({
        shipment_id: selectedReceipt.shipment_id,
        receipt_id: selectedReceipt.id,
        rejected_by_organization_id: organization?.id,
        rejected_by_user_id: profile?.id,
        rejection_reason: rejectionReason,
        rejection_type: 'transporter_delivery_rejection',
        shipment_status_before: selectedReceipt.status || 'unknown',
      } as any);

      toast.success('تم رفض شهادة التسليم وتسجيلها في سجل المرفوضات');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedReceipt(null);
      queryClient.invalidateQueries({ queryKey: ['delivery-approvals-all'] });
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReject = (receipt: EnrichedReceipt) => {
    setSelectedReceipt(receipt);
    setRejectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (allReceipts.length === 0) return null;

  const tabItems = [
    { value: 'pending', label: 'بانتظار الموافقة', count: stats.pending, icon: Clock, color: 'text-amber-600' },
    { value: 'approved', label: 'مقبول ✓', count: stats.approved, icon: CheckCircle2, color: 'text-emerald-600' },
    { value: 'auto_approved', label: 'موافقة تلقائية', count: stats.autoApproved, icon: Zap, color: 'text-blue-600' },
    { value: 'rejected', label: 'مرفوض', count: stats.rejected, icon: Ban, color: 'text-destructive' },
  ];

  const currentList =
    activeTab === 'pending' ? categorized.pending :
    activeTab === 'approved' ? categorized.approved :
    activeTab === 'auto_approved' ? categorized.autoApproved :
    categorized.rejected;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['delivery-approvals-all'] })}
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>تحديث</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {stats.pending > 1 && activeTab === 'pending' && (
                <Button 
                  size="sm" 
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95" 
                  onClick={handleBulkApprove} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  قبول الكل فوراً ({stats.pending}) ⚡
                </Button>
              )}
            </div>
            <div className="text-right">
              <CardTitle className="text-base flex items-center gap-2 justify-end">
                <Shield className="w-5 h-5 text-primary" />
                مركز موافقات شهادات التسليم
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="animate-pulse">{stats.pending}</Badge>
                )}
                {stats.urgentCount > 0 && (
                  <Badge className="bg-red-600 text-white animate-pulse gap-1 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.urgentCount} عاجل
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-right">
                استجابة فورية • قبول سريع بضغطة واحدة • انتقال تلقائي للمقبول • موافقة تلقائية بعد 15 دقيقة
              </CardDescription>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {tabItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const hasNewItems = tab.value === 'approved' && recentlyApproved.size > 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg p-2.5 text-center transition-all border relative ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 shadow-sm scale-[1.02]'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  }`}
                >
                  {hasNewItems && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  )}
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${tab.color}`} />
                  <div className="text-lg font-bold">{tab.count}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{tab.label}</div>
                </button>
              );
            })}
          </div>

          {/* Quick action hint when pending */}
          {stats.pending > 0 && activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>اضغط <strong>"قبول فوري"</strong> لقبول الشهادة بضغطة واحدة — تنتقل تلقائياً لتبويب المقبول</span>
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            </motion.div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-3">
              {tabItems.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1">
                    <Icon className="w-3 h-3" />
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 mr-1">{tab.count}</Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Content for each tab */}
            {['pending', 'approved', 'auto_approved', 'rejected'].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue}>
                <ScrollArea className="max-h-[500px]">
                  <AnimatePresence mode="popLayout">
                    {currentList.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {tabValue === 'pending' && (
                          <div className="space-y-2">
                            <Sparkles className="w-8 h-8 mx-auto text-emerald-500" />
                            <p className="text-sm font-medium">لا توجد شهادات بانتظار موافقتك</p>
                            <p className="text-xs">سيتم إعلامك فوراً عند وصول شهادة جديدة</p>
                          </div>
                        )}
                        {tabValue === 'approved' && (
                          <div className="space-y-2">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-50" />
                            <p className="text-sm">لا توجد شهادات مقبولة حديثاً</p>
                            <p className="text-xs">الشهادات المقبولة تظهر هنا فور قبولها</p>
                          </div>
                        )}
                        {tabValue === 'auto_approved' && (
                          <div className="space-y-2">
                            <Zap className="w-8 h-8 mx-auto text-blue-500" />
                            <p className="text-sm">لا توجد موافقات تلقائية حديثة</p>
                            <p className="text-xs">تتم الموافقة التلقائية بعد انقضاء 15 دقيقة من الإصدار</p>
                          </div>
                        )}
                        {tabValue === 'rejected' && <p className="text-sm">لا توجد شهادات مرفوضة</p>}
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {currentList.map(receipt => (
                          <CertificateCard
                            key={receipt.id}
                            receipt={receipt}
                            onApprove={handleApprove}
                            onReject={openReject}
                            isSubmitting={isSubmitting || !!approvingId}
                            approvingId={approvingId}
                            showActions={tabValue === 'pending'}
                            variant={tabValue as any}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>

                {/* Auto-hide notice for approved tabs */}
                {(tabValue === 'approved' || tabValue === 'auto_approved') && currentList.length > 0 && (
                  <div className="mt-3 text-center">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Eye className="w-3 h-3" />
                      تختفي الشهادات المعتمدة تلقائياً بعد {AUTO_HIDE_MINUTES} دقائق من المشاهدة
                    </Badge>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              رفض شهادة التسليم
            </DialogTitle>
            <DialogDescription>
              سيتم تسجيل الرفض في سجل المرفوضات وإرسال إشعار للمولد
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm text-right space-y-1">
                  <div className="flex justify-between">
                    <Badge variant="outline">{selectedReceipt.receipt_number}</Badge>
                    <span className="font-medium">{selectedReceipt.generator_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    الوزن: {selectedReceipt.actual_weight} {selectedReceipt.unit || 'كجم'} | النوع: {selectedReceipt.waste_type || '-'}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">
                  سبب الرفض <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: لم تتم عملية النقل فعلياً، بيانات غير متطابقة..."
                  dir="rtl"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !rejectionReason.trim()}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الرفض...</>
              ) : (
                <><XCircle className="w-4 h-4 ml-2" />تأكيد الرفض</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransporterDeliveryApproval;
