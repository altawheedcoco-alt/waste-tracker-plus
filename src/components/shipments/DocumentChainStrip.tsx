/**
 * شريط سلسلة المستندات المصغّر — Compact Document Chain Strip
 * يعرض حالة المستندات المرتبطة بالشحنة بشكل بصري مباشر
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileSignature, FileCheck, Receipt, Recycle, CheckCircle2, Clock, XCircle, ScrollText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocumentChainStripProps {
  shipmentId: string;
  /** minimal = just dots, compact = badges, full = with labels */
  variant?: 'minimal' | 'compact' | 'full';
  /** نوع الجهة المشاهدة — يتحكم بالمستندات المعروضة */
  orgType?: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';
  className?: string;
}

interface ChainStep {
  key: string;
  label: string;
  icon: typeof FileCheck;
  status: 'completed' | 'pending' | 'rejected' | 'none';
  count: number;
  linkTo?: string;
}

const DocumentChainStrip = ({ shipmentId, variant = 'compact', orgType, className }: DocumentChainStripProps) => {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['doc-chain-strip', shipmentId],
    queryFn: async () => {
      const [declarationsRes, receiptsRes, reportsRes] = await Promise.all([
        supabase.from('delivery_declarations').select('id, declaration_type, status').eq('shipment_id', shipmentId),
        supabase.from('shipment_receipts').select('id, receipt_type, status').eq('shipment_id', shipmentId),
        supabase.from('recycling_reports').select('id, status').eq('shipment_id', shipmentId),
      ]);
      return {
        declarations: (declarationsRes.data || []) as any[],
        receipts: (receiptsRes.data || []) as any[],
        reports: (reportsRes.data || []) as any[],
      };
    },
    staleTime: 1000 * 60 * 3,
    enabled: !!shipmentId,
  });

  if (!data) return null;

  const { declarations, receipts, reports } = data;
  const totalDocs = declarations.length + receipts.length + reports.length;
  if (totalDocs === 0 && variant === 'minimal') return null;

  // All 7 declaration types
  const genDecl = declarations.filter((d: any) => ['generator_handover', 'generator_delivery', 'generator'].includes(d.declaration_type));
  const transporterReceipt = declarations.filter((d: any) => d.declaration_type === 'transporter_transport');
  const driverPickup = declarations.filter((d: any) => d.declaration_type === 'driver_confirmation');
  const transporterDelivery = declarations.filter((d: any) => d.declaration_type === 'transporter_delivery');
  const driverDelivery = declarations.filter((d: any) => d.declaration_type === 'driver_delivery');
  const recDecl = declarations.filter((d: any) => ['recycler_receipt', 'disposal_receipt', 'recycler'].includes(d.declaration_type));
  const certDecl = declarations.filter((d: any) => ['recycling_certificate', 'disposal_certificate'].includes(d.declaration_type));

  const getStatus = (items: any[]): ChainStep['status'] => {
    if (items.length === 0) return 'none';
    if (items.some((i: any) => i.status === 'rejected')) return 'rejected';
    if (items.every((i: any) => ['signed', 'confirmed', 'approved', 'active'].includes(i.status))) return 'completed';
    return 'pending';
  };

  const allSteps: ChainStep[] = [
    { key: 'gen_decl', label: 'إقرار المولد (تسليم)', icon: FileSignature, status: getStatus(genDecl), count: genDecl.length },
    { key: 'transporter_receipt', label: 'إقرار الناقل (استلام)', icon: FileCheck, status: getStatus(transporterReceipt), count: transporterReceipt.length },
    { key: 'driver_pickup', label: 'إقرار السائق (استلام)', icon: FileSignature, status: getStatus(driverPickup), count: driverPickup.length },
    { key: 'transporter_delivery', label: 'إقرار الناقل (تسليم)', icon: Receipt, status: getStatus(transporterDelivery), count: transporterDelivery.length },
    { key: 'driver_delivery', label: 'إقرار السائق (تسليم)', icon: Receipt, status: getStatus(driverDelivery), count: driverDelivery.length },
    { key: 'rec_decl', label: 'إقرار المدوّر (استلام)', icon: FileSignature, status: getStatus(recDecl), count: recDecl.length },
    { key: 'certificate', label: 'شهادة تدوير/تخلص', icon: Recycle, status: getStatus([...certDecl, ...reports.map((r: any) => ({ status: r.status }))]), count: certDecl.length + reports.length },
  ];

  // Filter steps based on org type
  const roleStepKeys: Record<string, string[]> = {
    generator: ['gen_decl', 'transporter_receipt', 'driver_pickup', 'certificate'],
    transporter: ['gen_decl', 'transporter_receipt', 'driver_pickup', 'transporter_delivery', 'driver_delivery', 'rec_decl'],
    driver: ['gen_decl', 'driver_pickup', 'driver_delivery', 'rec_decl'],
    recycler: ['transporter_delivery', 'driver_delivery', 'rec_decl', 'certificate'],
    disposal: ['transporter_delivery', 'driver_delivery', 'rec_decl', 'certificate'],
    admin: ['gen_decl', 'transporter_receipt', 'driver_pickup', 'transporter_delivery', 'driver_delivery', 'rec_decl', 'certificate'],
  };

  const allowedKeys = orgType ? roleStepKeys[orgType] || roleStepKeys.admin : roleStepKeys.admin;
  const steps = allSteps.filter(s => allowedKeys.includes(s.key));

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const activeSteps = steps.filter(s => s.status !== 'none');

  if (activeSteps.length === 0 && variant === 'minimal') return null;

  const statusColor = (s: ChainStep['status']) => {
    if (s === 'completed') return 'bg-emerald-500';
    if (s === 'pending') return 'bg-amber-400 animate-pulse';
    if (s === 'rejected') return 'bg-destructive';
    return 'bg-muted-foreground/20';
  };

  const statusIcon = (s: ChainStep['status']) => {
    if (s === 'completed') return <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />;
    if (s === 'pending') return <Clock className="w-2.5 h-2.5 text-amber-600" />;
    if (s === 'rejected') return <XCircle className="w-2.5 h-2.5 text-destructive" />;
    return null;
  };

  // Minimal: just dots
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1", className)} dir="rtl" title={`المستندات: ${completedCount}/${activeSteps.length}`}>
        <ScrollText className="w-3 h-3 text-muted-foreground" />
        {steps.map(step => (
          <div
            key={step.key}
            className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", statusColor(step.status))}
            title={`${step.label}: ${step.status === 'none' ? 'لا يوجد' : step.status === 'completed' ? 'مكتمل' : step.status === 'pending' ? 'معلق' : 'مرفوض'}`}
          />
        ))}
      </div>
    );
  }

  // Compact: small badges with icons
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 flex-wrap", className)} dir="rtl">
        <ScrollText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {steps.map(step => {
          const Icon = step.icon;
          if (step.status === 'none') {
            return (
              <div key={step.key} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center" title={step.label}>
                <Icon className="w-2.5 h-2.5 text-muted-foreground/40" />
              </div>
            );
          }
          return (
            <div
              key={step.key}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                step.status === 'completed' && "bg-emerald-100 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-600",
                step.status === 'pending' && "bg-amber-100 border-amber-400 dark:bg-amber-900/40 dark:border-amber-600",
                step.status === 'rejected' && "bg-red-100 border-red-400 dark:bg-red-900/40 dark:border-red-600",
              )}
              title={`${step.label}: ${step.status === 'completed' ? 'مكتمل ✓' : step.status === 'pending' ? 'معلق' : 'مرفوض'}`}
            >
              <Icon className={cn(
                "w-2.5 h-2.5",
                step.status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                step.status === 'pending' && "text-amber-600 dark:text-amber-400",
                step.status === 'rejected' && "text-red-600 dark:text-red-400",
              )} />
            </div>
          );
        })}
        {activeSteps.length > 0 && (
          <span className="text-[10px] text-muted-foreground mr-1">
            {completedCount}/{activeSteps.length}
          </span>
        )}
      </div>
    );
  }

  // Full: badges with labels
  return (
    <div className={cn("space-y-1.5", className)} dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <ScrollText className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">سلسلة المستندات</span>
        <Badge variant="outline" className="text-[10px]">{completedCount}/{steps.length}</Badge>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all",
                  step.status === 'completed' && "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300",
                  step.status === 'pending' && "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300",
                  step.status === 'rejected' && "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300",
                  step.status === 'none' && "bg-muted border-muted-foreground/10 text-muted-foreground/40",
                )}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline truncate">{step.label}</span>
                {statusIcon(step.status)}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-0.5 min-w-[4px]",
                  step.status === 'completed' ? 'bg-emerald-400' : 'bg-muted-foreground/15'
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentChainStrip;
