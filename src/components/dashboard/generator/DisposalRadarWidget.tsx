import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Recycle, Trash2, CheckCircle2, Clock, Truck, Package, Eye, Image, ExternalLink, AlertTriangle, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const disposalSteps = [
  { key: 'shipped', label: 'تم الشحن', fullLabel: 'تم الشحن من المصنع', icon: Package, color: 'text-blue-600' },
  { key: 'arrived', label: 'وصلت', fullLabel: 'وصلت موقع التخلص', icon: Truck, color: 'text-amber-600' },
  { key: 'processing', label: 'قيد المعالجة', fullLabel: 'قيد المعالجة / الحرق', icon: Flame, color: 'text-orange-600' },
  { key: 'completed', label: 'اكتملت', fullLabel: 'تم الإعدام النهائي', icon: CheckCircle2, color: 'text-emerald-600' },
];

const statusToStep: Record<string, number> = {
  new: 0, registered: 0, approved: 0, collecting: 1, in_transit: 1,
  delivered: 2, processing: 3, confirmed: 4, completed: 4,
};

const disposalMethodIcons: Record<string, typeof Flame> = {
  incineration: Flame, recycling: Recycle, landfill: Trash2,
};

const disposalMethodLabels: Record<string, string> = {
  incineration: 'حرق', recycling: 'تدوير', landfill: 'دفن',
  chemical_treatment: 'معالجة كيميائية', biological_treatment: 'معالجة بيولوجية',
};

const statusLabels: Record<string, string> = {
  new: 'جديدة', registered: 'مسجلة', approved: 'معتمدة', collecting: 'بدأ الجمع', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', processing: 'قيد المعالجة', confirmed: 'مؤكدة', completed: 'مكتملة',
};

const DisposalRadarWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['generator-disposal-radar', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, disposal_method, hazard_level, created_at, delivered_at, confirmed_at, pickup_date, expected_delivery_date, recycler_id')
        .eq('generator_id', orgId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      // Fetch recycler names
      const recyclerIds = [...new Set((data || []).map(s => s.recycler_id).filter(Boolean))];
      let recyclerMap: Record<string, string> = {};
      if (recyclerIds.length > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', recyclerIds);
        orgs?.forEach(o => { recyclerMap[o.id] = o.name; });
      }

      return (data || []).map(s => ({
        ...s,
        recycler_name: s.recycler_id ? recyclerMap[s.recycler_id] || 'غير محدد' : 'غير محدد',
      }));
    },
    enabled: !!orgId,
    refetchInterval: 30_000,
  });

  const { data: evidencePhotos = [] } = useQuery({
    queryKey: ['disposal-evidence', selectedShipmentId],
    queryFn: async () => {
      if (!selectedShipmentId) return [];
      const { data, error } = await supabase
        .from('shipment_logs')
        .select('id, status, notes, created_at, photo_url')
        .eq('shipment_id', selectedShipmentId)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedShipmentId,
  });

  if (isLoading) {
    return (
      <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Flame className="w-5 h-5" /> رادار الإعدامات</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
    );
  }

  if (shipments.length === 0) return null;

  const activeShipments = shipments.filter((s: any) => !['confirmed', 'completed'].includes(s.status));
  const completedShipments = shipments.filter((s: any) => ['confirmed', 'completed'].includes(s.status));

  const filteredShipments = (activeTab === 'active' ? activeShipments : completedShipments)
    .filter((s: any) => statusFilter === 'all' || s.status === statusFilter);

  // Summary stats
  const totalActive = activeShipments.length;
  const totalCompleted = completedShipments.length;
  const highHazard = shipments.filter((s: any) => s.hazard_level === 'high').length;

  return (
    <Card className="border-orange-200 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')} className="text-xs">
            عرض الكل <ExternalLink className="mr-1 h-3 w-3" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Flame className="w-5 h-5 text-orange-600" />
            رادار حالة الإعدام
          </CardTitle>
        </div>
        <CardDescription className="text-right">تتبع مراحل التخلص لكل شحنة لحظياً</CardDescription>

        {/* Summary Stats Bar */}
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-end">
          <Badge variant="outline" className="text-[10px] gap-1">
            <Package className="w-3 h-3" /> نشطة: {totalActive}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> مكتملة: {totalCompleted}
          </Badge>
          {highHazard > 0 && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="w-3 h-3" /> خطر عالي: {highHazard}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tabs & Filter */}
        <div className="flex items-center justify-between gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <Filter className="w-3 h-3 ml-1" />
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="new">جديدة</SelectItem>
              <SelectItem value="in_transit">قيد النقل</SelectItem>
              <SelectItem value="delivered">تم التسليم</SelectItem>
              <SelectItem value="confirmed">مؤكدة</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="completed" className="text-xs px-3 h-6">مكتملة ({completedShipments.length})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs px-3 h-6">نشطة ({activeShipments.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Shipments List */}
        <AnimatePresence mode="popLayout">
          {filteredShipments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">لا توجد شحنات في هذا التصنيف</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredShipments.map((shipment: any, index: number) => {
                const currentStep = statusToStep[shipment.status] ?? 0;
                const progress = Math.min((currentStep / disposalSteps.length) * 100, 100);
                const MethodIcon = disposalMethodIcons[shipment.disposal_method || ''] || Trash2;

                return (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {shipment.hazard_level === 'high' && (
                          <Badge variant="destructive" className="text-[10px] gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> خطر
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <MethodIcon className="w-3 h-3" />
                          {disposalMethodLabels[shipment.disposal_method || ''] || 'غير محدد'}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px]">
                          {statusLabels[shipment.status] || shipment.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-sm">{shipment.shipment_number}</span>
                        <p className="text-xs text-muted-foreground">
                          {shipment.waste_type} • {shipment.quantity} {shipment.unit}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{shipment.recycler_name}</p>
                      </div>
                    </div>

                    {/* Enhanced Progress Steps */}
                    <TooltipProvider>
                      <div className="relative mb-1">
                        <Progress value={progress} className="h-2.5 rounded-full" />
                        <div className="flex items-center justify-between mt-1.5">
                          {disposalSteps.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isCompleted = idx < currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <Tooltip key={step.key}>
                                <TooltipTrigger asChild>
                                  <div className={`flex flex-col items-center gap-0.5 cursor-default transition-all ${
                                    isCompleted ? 'text-primary scale-100' : isCurrent ? `${step.color} scale-110 font-bold` : 'text-muted-foreground/40'
                                  }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      isCompleted ? 'bg-primary/10' : isCurrent ? 'bg-orange-100 dark:bg-orange-900/30 animate-pulse' : 'bg-muted/30'
                                    }`}>
                                      <StepIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="hidden sm:inline text-[9px] text-center leading-tight max-w-[55px]">{step.label}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p className="text-xs">{step.fullLabel}</p></TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </TooltipProvider>

                    {/* Timeline details */}
                    {(shipment.pickup_date || shipment.expected_delivery_date) && (
                      <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground mt-1 border-t pt-1.5">
                        {shipment.expected_delivery_date && (
                          <span>📅 متوقع: {format(new Date(shipment.expected_delivery_date), 'dd/MM', { locale: ar })}</span>
                        )}
                        {shipment.pickup_date && (
                          <span>🚛 سحب: {format(new Date(shipment.pickup_date), 'dd/MM', { locale: ar })}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs h-6 gap-1 px-2" onClick={() => setSelectedShipmentId(shipment.id)}>
                              <Image className="w-3 h-3" /> صور
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>التوثيق البصري - {shipment.shipment_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                              {evidencePhotos.length === 0 ? (
                                <div className="text-center py-8">
                                  <Image className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                                  <p className="text-muted-foreground">لا توجد صور توثيقية حتى الآن</p>
                                  <p className="text-xs text-muted-foreground mt-1">سيتم رفع الصور تلقائياً أثناء عملية الإعدام</p>
                                </div>
                              ) : (
                                evidencePhotos.map((photo: any) => (
                                  <div key={photo.id} className="rounded-lg border overflow-hidden">
                                    <img src={photo.photo_url} alt="Evidence" className="w-full h-48 object-cover" />
                                    <div className="p-2 bg-muted/30 text-xs">
                                      <p>{photo.notes}</p>
                                      <p className="text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(photo.created_at), { locale: ar, addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="text-xs h-6 gap-1 px-2" onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}>
                          <Eye className="w-3 h-3" /> التفاصيل
                        </Button>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(shipment.created_at), { locale: ar, addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DisposalRadarWidget;
