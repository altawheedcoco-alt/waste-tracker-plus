import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Recycle, Trash2, CheckCircle2, Clock, Truck, Package, Eye, Image, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

const disposalSteps = [
  { key: 'shipped', label: 'تم الشحن من المصنع', icon: Package },
  { key: 'arrived', label: 'وصلت موقع التخلص', icon: Truck },
  { key: 'processing', label: 'قيد المعالجة / الحرق', icon: Flame },
  { key: 'completed', label: 'تم الإعدام النهائي', icon: CheckCircle2 },
];

const statusToStep: Record<string, number> = {
  new: 0,
  approved: 0,
  collection_started: 1,
  in_transit: 1,
  delivered: 2,
  processing: 3,
  confirmed: 4,
  completed: 4,
};

const disposalMethodIcons: Record<string, typeof Flame> = {
  incineration: Flame,
  recycling: Recycle,
  landfill: Trash2,
};

const disposalMethodLabels: Record<string, string> = {
  incineration: 'حرق',
  recycling: 'تدوير',
  landfill: 'دفن',
  chemical_treatment: 'معالجة كيميائية',
  biological_treatment: 'معالجة بيولوجية',
};

const DisposalRadarWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['generator-disposal-radar', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, disposal_method, hazard_level, created_at, delivered_at, confirmed_at')
        .eq('generator_id', orgId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 30_000,
  });

  // Fetch evidence photos for selected shipment
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Flame className="w-5 h-5" /> رادار الإعدامات
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  if (shipments.length === 0) return null;

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
      </CardHeader>
      <CardContent className="space-y-4">
        {shipments.map((shipment) => {
          const currentStep = statusToStep[shipment.status] ?? 0;
          const progress = Math.min((currentStep / disposalSteps.length) * 100, 100);
          const MethodIcon = disposalMethodIcons[shipment.disposal_method || ''] || Trash2;

          return (
            <div
              key={shipment.id}
              className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {shipment.hazard_level === 'high' && (
                    <Badge variant="destructive" className="text-[10px]">خطر عالي</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <MethodIcon className="w-3 h-3" />
                    {disposalMethodLabels[shipment.disposal_method || ''] || 'غير محدد'}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-sm">{shipment.shipment_number}</span>
                  <p className="text-xs text-muted-foreground">
                    {shipment.waste_type} • {shipment.quantity} {shipment.unit}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <Progress value={progress} className="h-2" />
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                {disposalSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className={`flex flex-col items-center gap-0.5 ${isActive ? 'text-primary' : isCurrent ? 'text-orange-600 font-semibold' : ''}`}>
                      <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : isCurrent ? 'text-orange-600' : 'text-muted-foreground/50'}`} />
                      <span className="hidden sm:inline text-center leading-tight max-w-[60px]">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs h-6 gap-1 px-2" onClick={() => setSelectedShipmentId(shipment.id)}>
                        <Image className="w-3 h-3" /> صور الإعدام
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>التوثيق البصري - {shipment.shipment_number}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {evidencePhotos.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">لا توجد صور توثيقية حتى الآن</p>
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DisposalRadarWidget;
