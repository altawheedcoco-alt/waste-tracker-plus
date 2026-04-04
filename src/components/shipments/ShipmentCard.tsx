import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useShipmentVisibility } from '@/hooks/useVisibilityGuard';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye, MapPin, Printer, Download, Lock,
  CheckCircle2, FileCheck, FileText, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Settings2, Loader2,
  Recycle, Route, EyeOff,
  StickyNote, MessageSquare as MessageSquareIcon,
} from 'lucide-react';
import {
  getStatusConfig, canChangeStatus, getStatusesForOrgType,
  wasteTypeLabels, mapLegacyStatus, getAvailableNextStatuses, mapToDbStatus,
  type ShipmentStatus,
} from '@/lib/shipmentStatusConfig';
import StatusChangeDialog from './StatusChangeDialog';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import ShipmentQuickPrint from './unified-print/UnifiedShipmentPrint';
import ShipmentRouteMap from '@/components/maps/RouteMapDialog';
import CancelShipmentDialog from './CancelShipmentDialog';
import NavigationButtonGroup from '@/components/navigation/NavigationButtonGroup';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';
import GeneratorDeliveryCertificateDialog from '@/components/receipts/GeneratorDeliveryCertificateDialog';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';
import ManifestPDFButton from './ManifestPDFButton';
import ShipmentApprovalBadge from './ShipmentApprovalBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeliveryDeclaration, useShipmentDeclarations } from '@/hooks/useDeliveryDeclaration';
import DeliveryDeclarationViewDialog from './DeliveryDeclarationViewDialog';
import CompleteShipmentDocButton from './CompleteShipmentDocButton';
import DocumentChainStrip from './DocumentChainStrip';
import NotesPanel from '@/components/notes/NotesPanel';
import ShipmentChatTab from './ShipmentChatTab';

// Sub-components
import ShipmentCompactView from './shipment-card/ShipmentCompactView';
import ShipmentDataGrid from './shipment-card/ShipmentDataGrid';
import type { ShipmentCardProps, OrganizationType } from './shipment-card/ShipmentCardTypes';

const ShipmentEndorsementButton = lazy(() => import('./ShipmentEndorsementButton'));
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const ShipmentInlineTrackingMap = lazy(() => import('./ShipmentInlineTrackingMap'));
const GPSTrackingStatusWidget = lazy(() => import('@/components/tracking/GPSTrackingStatusWidget'));
const SupervisorComplianceDashboard = lazy(() => import('@/components/supervisors/SupervisorComplianceDashboard'));

const ShipmentCard = ({ shipment, onStatusChange, variant = 'full' }: ShipmentCardProps) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printAutoAction, setPrintAutoAction] = useState<'print' | 'pdf' | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [isQuickStatusChanging, setIsQuickStatusChanging] = useState(false);
  const [isDeclarationViewOpen, setIsDeclarationViewOpen] = useState(false);
  const [isDeliveryCertOpen, setIsDeliveryCertOpen] = useState(false);
  const [showInlineMap, setShowInlineMap] = useState(false);
  const [activeShipmentTab, setActiveShipmentTab] = useState<'notes' | 'chat' | null>(null);

  const visibility = useShipmentVisibility(shipment.id);
  const { data: declarationData } = useDeliveryDeclaration(shipment.id);
  const { data: allDeclarations = [] } = useShipmentDeclarations(shipment.id, organization?.id);

  const { data: linkedReceipts = [] } = useQuery({
    queryKey: ['shipment-receipts-summary', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_receipts')
        .select('id, receipt_number, status, receipt_type, created_at, actual_weight, unit')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });
      if (error) { if (!error.message?.includes('AbortError')) console.error(error); return []; }
      return data || [];
    },
    enabled: !!shipment.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: linkedReports = [] } = useQuery({
    queryKey: ['shipment-reports-summary', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recycling_reports')
        .select('id, report_number, status, created_at')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!shipment.id,
    staleTime: 1000 * 60 * 5,
  });

  const hasGeneratorDeclaration = allDeclarations.some((d: any) => d.declaration_type === 'generator');

  const mappedStatus = mapLegacyStatus(shipment.status);
  const currentStatusConfig = getStatusConfig(mappedStatus);
  const organizationType = (organization?.organization_type || 'generator') as OrganizationType;
  const isAdmin = organizationType === 'admin';
  const canChange = canChangeStatus(mappedStatus, organizationType);
  const isRecycler = organizationType === 'recycler';
  const isTransporter = organizationType === 'transporter';
  const isGenerator = organizationType === 'generator';
  const isCompleted = shipment.status === 'completed' || shipment.status === 'confirmed';
  const availableNextStatuses = getAvailableNextStatuses(mappedStatus, organizationType);
  const orgStatuses = getStatusesForOrgType(organizationType);
  const allStatusesForDropdown = orgStatuses.filter(s => s.key !== mappedStatus);
  const currentStatusIndex = orgStatuses.findIndex(s => s.key === mappedStatus);

  const handleCardClick = () => navigate(`/dashboard/s/${shipment.shipment_number}`);

  const handleQuickStatusChange = async (newStatus: ShipmentStatus) => {
    setIsQuickStatusChanging(true);
    try {
      const dbStatus = mapToDbStatus(newStatus);
      const { error } = await supabase
        .from('shipments')
        .update({ status: dbStatus as any })
        .eq('id', shipment.id);
      if (error) throw error;
      toast.success(`تم تغيير الحالة إلى: ${getStatusConfig(newStatus)?.labelAr}`);
      onStatusChange?.();
    } catch (error: any) {
      toast.error(`حدث خطأ أثناء تغيير الحالة: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsQuickStatusChanging(false);
    }
  };

  // Compact variant delegates to sub-component
  if (variant === 'compact') {
    return <ShipmentCompactView shipment={shipment} onStatusChange={onStatusChange} />;
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.005, y: -2 }} whileTap={{ scale: 0.995 }} className="cursor-pointer" onClick={handleCardClick}>
        <Card className="hover:shadow-lg transition-all duration-300 border-r-4 overflow-hidden group border-border/40"
          style={{ borderRightColor: currentStatusConfig ? `var(--${currentStatusConfig.key}-color, #94a3b8)` : undefined }}>
          <CardContent className="p-0 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                {/* Header badges */}
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-1.5 justify-end flex-wrap">
                    {shipment.generator_id && visibility.canViewGeneratorInfo && (
                      <ShipmentApprovalBadge status={shipment.generator_approval_status} approvalAt={shipment.generator_approval_at} rejectionReason={shipment.generator_rejection_reason} deadline={shipment.generator_auto_approve_deadline} type="generator" compact />
                    )}
                    {shipment.recycler_id && visibility.canViewRecyclerInfo && (
                      <ShipmentApprovalBadge status={shipment.recycler_approval_status} approvalAt={shipment.recycler_approval_at} rejectionReason={shipment.recycler_rejection_reason} deadline={shipment.recycler_auto_approve_deadline} type="recycler" compact />
                    )}
                    {shipment.has_delivery_certificate && (
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 gap-1.5"><FileCheck className="w-4 h-4" />إقرار تسليم</Badge>
                    )}
                    {shipment.has_receipt && (isGenerator || isTransporter) && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 gap-1.5"><FileCheck className="w-4 h-4" />{isTransporter ? 'تم إصدار شهادة استلام' : 'تم استلام الشحنة'}</Badge>
                    )}
                    {shipment.has_report && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 gap-1.5 animate-pulse"><FileCheck className="w-4 h-4" />تم إصدار شهادة التدوير</Badge>
                    )}
                    {currentStatusConfig && (
                      <Badge className={cn(currentStatusConfig.bgClass, currentStatusConfig.borderClass, "border gap-1.5 font-semibold text-black dark:text-white")}>
                        <currentStatusConfig.icon className="w-3.5 h-3.5" />{currentStatusConfig.labelAr}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {currentStatusConfig?.phase === 'transporter' ? 'مرحلة النقل' : 'مرحلة التدوير'}
                    </Badge>
                    <span className="font-mono font-bold text-base sm:text-lg truncate">{shipment.shipment_number}</span>
                  </div>

                  {/* Data Grid — extracted sub-component */}
                  <ShipmentDataGrid shipment={shipment} visibility={visibility} />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {visibility.canViewMaps && <NavigationButtonGroup pickupAddress={shipment.pickup_address} deliveryAddress={shipment.delivery_address} size="sm" />}
                    {shipment.driver_id && visibility.canViewTracking && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setIsLiveTrackingOpen(true); }} className="gap-2" title="التتبع المباشر للسائق">
                        <Eye className="w-4 h-4" />تتبع مباشر
                      </Button>
                    )}
                    {shipment.driver_id && !visibility.canViewTracking && !visibility.isOwner && (
                      <div className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800"><Lock className="w-3 h-3" /><span>التتبع مقفل</span></div>
                    )}
                    <Suspense fallback={null}>
                      <GPSTrackingStatusWidget shipmentId={shipment.id} driverId={shipment.driver_id || null} compact onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}?tab=tracking`)} />
                    </Suspense>
                    {visibility.canViewMaps && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsMapDialogOpen(true); }} className="gap-2" title="تتبع على الخريطة"><MapPin className="w-4 h-4" />الخريطة</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPrintAutoAction('print'); setIsPrintDialogOpen(true); }} className="gap-2" title="طباعة مباشرة"><Printer className="w-4 h-4" />طباعة</Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPrintAutoAction('pdf'); setIsPrintDialogOpen(true); }} className="gap-2" title="تحميل PDF"><Download className="w-4 h-4" />PDF</Button>
                    <ManifestPDFButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} variant="ghost" size="sm" />
                    {(isRecycler || isTransporter || shipment.has_report) && (
                      <QuickCertificateButton shipment={{ ...shipment, unit: shipment.unit || 'كجم', has_report: shipment.has_report }} onSuccess={onStatusChange} variant="outline" size="sm" showLabel />
                    )}
                    {isTransporter && (
                      <QuickReceiptButton
                        shipment={{ ...shipment, unit: shipment.unit || 'كجم', pickup_address: shipment.pickup_address || '', generator_id: shipment.generator_id || shipment.generator?.id || '', generator: shipment.generator, recycler: shipment.recycler, driver_id: shipment.driver_id || null, driver: shipment.driver ? { profile: shipment.driver.profile || null } : null, has_receipt: shipment.has_receipt } as any}
                        onSuccess={onStatusChange} variant="outline" size="sm"
                      />
                    )}
                    {isGenerator && (
                      hasGeneratorDeclaration ? (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsDeclarationViewOpen(true); }}
                          className="gap-2 text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:bg-emerald-900/30">
                          <CheckCircle2 className="w-4 h-4" />تم إقرار التسليم ✓
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsDeliveryCertOpen(true); }}
                          className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/30">
                          <FileCheck className="w-4 h-4" />إقرار تسليم
                        </Button>
                      )
                    )}
                    {canChange && allStatusesForDropdown.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="eco" className="gap-2 w-full sm:w-auto" disabled={isQuickStatusChanging}>
                            {isQuickStatusChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            تغيير الحالة<ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-60 bg-popover z-50 max-h-80 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">الحالة الحالية</div>
                          {currentStatusConfig && (() => {
                            const CurIcon = currentStatusConfig.icon;
                            return (
                              <DropdownMenuItem disabled className="gap-3 opacity-100 bg-primary/10 border border-primary/20 rounded-md mx-1 mb-1 py-2">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", currentStatusConfig.bgClass)}><CurIcon className="w-4 h-4" /></div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-primary">{currentStatusConfig.labelAr} ✓</span>
                                  <span className="text-xs text-muted-foreground">{currentStatusConfig.phase === 'transporter' ? 'مرحلة النقل' : currentStatusConfig.phase === 'recycler' ? 'مرحلة التدوير' : 'مرحلة التخلص'}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })()}
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">تغيير إلى</div>
                          {allStatusesForDropdown.map((status) => {
                            const StatusIcon = status.icon;
                            const isRecommended = availableNextStatuses.some(s => s.key === status.key);
                            return (
                              <DropdownMenuItem key={status.key} onClick={() => handleQuickStatusChange(status.key)} className={cn("gap-3 cursor-pointer py-2", isRecommended && "font-medium")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", status.bgClass)}><StatusIcon className="w-4 h-4" /></div>
                                <div className="flex flex-col flex-1">
                                  <span className="font-medium">{status.labelAr}</span>
                                  <span className="text-xs text-muted-foreground">{status.phase === 'transporter' ? 'مرحلة النقل' : status.phase === 'recycler' ? 'مرحلة التدوير' : 'مرحلة التخلص'}</span>
                                </div>
                                {isRecommended && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">مقترح</Badge>}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsStatusDialogOpen(true); }} className="gap-2 cursor-pointer text-muted-foreground">
                            <Settings2 className="w-4 h-4" /><span>تغيير متقدم مع ملاحظات...</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isCompleted && !isAdmin ? (
                      <Badge className="bg-emerald-500 text-white gap-1"><CheckCircle2 className="w-4 h-4" />مكتملة</Badge>
                    ) : null}
                    {declarationData && (
                      <Button size="sm" variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); setIsDeclarationViewOpen(true); }}>
                        <FileText className="w-4 h-4" />إقرار التسليم
                      </Button>
                    )}
                    <CancelShipmentDialog shipmentId={shipment.id} shipmentNumber={shipment.shipment_number} currentStatus={shipment.status} onSuccess={onStatusChange}
                      trigger={<Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}><XCircle className="w-4 h-4" />إلغاء</Button>}
                    />
                    {isTransporter && shipment.generator_id && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground"
                        title={(shipment as any).hide_recycler_from_generator ? 'المدوّر مخفي عن المولّد - اضغط للإظهار' : 'إخفاء المدوّر عن المولّد'}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newVal = !(shipment as any).hide_recycler_from_generator;
                          const { error } = await supabase.from('shipments').update({ hide_recycler_from_generator: newVal } as any).eq('id', shipment.id);
                          if (error) toast.error('فشل تحديث الإعداد');
                          else { toast.success(newVal ? 'تم إخفاء المدوّر عن المولّد' : 'تم إظهار المدوّر للمولّد'); onStatusChange?.(); }
                        }}>
                        <EyeOff className={cn("w-3.5 h-3.5", (shipment as any).hide_recycler_from_generator && "text-amber-600")} />
                        {(shipment as any).hide_recycler_from_generator ? 'مخفي' : 'إخفاء'}
                      </Button>
                    )}
                    {isTransporter && shipment.recycler_id && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground"
                        title={(shipment as any).hide_generator_from_recycler ? 'المولّد مخفي عن المدوّر - اضغط للإظهار' : 'إخفاء المولّد عن المدوّر'}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newVal = !(shipment as any).hide_generator_from_recycler;
                          const { error } = await supabase.from('shipments').update({ hide_generator_from_recycler: newVal } as any).eq('id', shipment.id);
                          if (error) toast.error('فشل تحديث الإعداد');
                          else { toast.success(newVal ? 'تم إخفاء المولّد عن المدوّر' : 'تم إظهار المولّد للمدوّر'); onStatusChange?.(); }
                        }}>
                        <EyeOff className={cn("w-3.5 h-3.5", (shipment as any).hide_generator_from_recycler && "text-amber-600")} />
                        {(shipment as any).hide_generator_from_recycler ? 'مولّد مخفي' : 'إخفاء مولّد'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recycler Notes */}
            {isTransporter && shipment.recycler_notes && (
              <div className="border-t bg-green-50 dark:bg-green-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Recycle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">ملاحظات جهة التدوير:</span>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">{shipment.recycler_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Tracking Map */}
            {shipment.driver_id && (
              <div className="border-t">
                <Button variant="ghost" className="w-full flex items-center justify-between px-4 py-2 text-sm"
                  onClick={(e) => { e.stopPropagation(); setShowInlineMap(!showInlineMap); }}>
                  <div className="flex items-center gap-2"><Route className="h-4 w-4 text-primary" /><span>خريطة التتبع</span></div>
                  {showInlineMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <AnimatePresence>
                  {showInlineMap && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}>
                      <Suspense fallback={<div className="h-[200px] flex items-center justify-center bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                        <ShipmentInlineTrackingMap shipmentId={shipment.id} pickupAddress={shipment.pickup_address || ''} deliveryAddress={shipment.delivery_address || ''} driverId={shipment.driver_id} status={shipment.status} collapsible={false} defaultExpanded height={180} onExpandClick={() => setIsLiveTrackingOpen(true)} />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notes & Chat Tabs */}
            <div className="border-t px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2">
                <Button variant={activeShipmentTab === 'notes' ? 'default' : 'outline'} size="sm"
                  className={cn("text-xs h-8 gap-1.5 rounded-lg", activeShipmentTab !== 'notes' && 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30')}
                  onClick={() => setActiveShipmentTab(activeShipmentTab === 'notes' ? null : 'notes')}>
                  <StickyNote className="w-3.5 h-3.5" />الملاحظات
                </Button>
                <Button variant={activeShipmentTab === 'chat' ? 'default' : 'outline'} size="sm"
                  className={cn("text-xs h-8 gap-1.5 rounded-lg", activeShipmentTab !== 'chat' && 'border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950/30')}
                  onClick={() => setActiveShipmentTab(activeShipmentTab === 'chat' ? null : 'chat')}>
                  <MessageSquareIcon className="w-3.5 h-3.5" />المحادثات
                </Button>
              </div>
              <AnimatePresence>
                {activeShipmentTab === 'notes' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <NotesPanel resourceType="shipment" resourceId={shipment.id} compact maxHeight={300} />
                  </motion.div>
                )}
                {activeShipmentTab === 'chat' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ShipmentChatTab shipment={shipment} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Document Chain Strip */}
            <div className="border-t px-4 py-2.5 bg-muted/30" onClick={(e) => e.stopPropagation()}>
              <DocumentChainStrip shipmentId={shipment.id} variant="full" orgType={organization?.organization_type as any} />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <CompleteShipmentDocButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number} shipmentStatus={shipment.status} variant="outline" size="sm" className="text-[10px] h-5 px-2" />
                <Suspense fallback={null}>
                  <ShipmentEndorsementButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number} shipmentStatus={mappedStatus} />
                </Suspense>
              </div>
            </div>

            {/* Supervisor Compliance */}
            <div className="border-t px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
              <Suspense fallback={<div className="h-8 flex items-center justify-center text-xs text-muted-foreground">جاري تحميل لوحة الامتثال...</div>}>
                <SupervisorComplianceDashboard shipment={shipment} compact />
              </Suspense>
            </div>

            {/* Progress Steps */}
            <div className="border-t bg-gradient-to-l from-muted/50 to-transparent px-4 py-2">
              <div className="flex items-center justify-between gap-1">
                {orgStatuses.filter((_, i) => i % 2 === 0).slice(0, 5).map((status, index, arr) => {
                  const origIndex = orgStatuses.findIndex(s => s.key === status.key);
                  const isActive = origIndex <= currentStatusIndex;
                  const isCurrent = status.key === mappedStatus;
                  const StatusIcon = status.icon;
                  return (
                    <div key={status.key} className="flex items-center gap-0.5 flex-1">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", isActive ? status.colorClass : 'bg-muted', isCurrent && 'ring-2 ring-offset-1 ring-primary')}>
                        <StatusIcon className={cn("w-3 h-3", isActive ? 'text-white' : 'text-muted-foreground')} />
                      </div>
                      {index < arr.length - 1 && <div className={cn("flex-1 h-0.5 rounded transition-all", origIndex < currentStatusIndex ? status.colorClass : 'bg-muted')} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <StatusChangeDialog isOpen={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)} shipment={{ ...shipment, status: mappedStatus }} onStatusChanged={() => { setIsStatusDialogOpen(false); onStatusChange?.(); }} />
      {isRecycler && <RecyclingCertificateDialog isOpen={isReportDialogOpen} onClose={() => setIsReportDialogOpen(false)} shipment={shipment as any} />}
      <ShipmentQuickPrint isOpen={isPrintDialogOpen} onClose={() => { setIsPrintDialogOpen(false); setPrintAutoAction(null); }} shipmentId={shipment.id} autoAction={printAutoAction} />
      <ShipmentRouteMap isOpen={isMapDialogOpen} onClose={() => setIsMapDialogOpen(false)} pickupAddress={shipment.pickup_address || 'غير محدد'} deliveryAddress={shipment.delivery_address || 'غير محدد'} shipmentNumber={shipment.shipment_number} driverId={shipment.driver_id} shipmentStatus={shipment.status} />
      {isLiveTrackingOpen && shipment.driver_id && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
          <LiveTrackingMapDialog isOpen={isLiveTrackingOpen} onClose={() => setIsLiveTrackingOpen(false)} driverId={shipment.driver_id} shipmentNumber={shipment.shipment_number} pickupAddress={shipment.pickup_address || 'غير محدد'} deliveryAddress={shipment.delivery_address || 'غير محدد'} shipmentStatus={shipment.status} />
        </Suspense>
      )}
      {declarationData && <DeliveryDeclarationViewDialog open={isDeclarationViewOpen} onOpenChange={setIsDeclarationViewOpen} declaration={declarationData as any} />}
      <GeneratorDeliveryCertificateDialog open={isDeliveryCertOpen} onOpenChange={setIsDeliveryCertOpen}
        shipment={{ id: shipment.id, shipment_number: shipment.shipment_number, waste_type: shipment.waste_type, quantity: shipment.quantity, unit: shipment.unit || 'كجم', status: shipment.status, created_at: shipment.created_at, pickup_address: shipment.pickup_address || '', delivery_address: shipment.delivery_address || '', generator: shipment.generator ? { name: shipment.generator.name, city: shipment.generator?.city } : undefined, transporter: shipment.transporter ? { name: shipment.transporter.name, city: shipment.transporter?.city } : undefined, recycler: shipment.recycler ? { name: shipment.recycler.name, city: shipment.recycler?.city } : undefined } as any}
        onSuccess={onStatusChange}
      />
    </>
  );
};

export default ShipmentCard;
