import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, MapPin, Navigation, DollarSign, Clock, 
  Check, X, ArrowLeftRight, Truck, Inbox, CheckCircle2,
  XCircle, Timer, RefreshCw
} from 'lucide-react';
import { useDriverOffers, DriverOffer } from '@/hooks/useDriverOffers';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const WASTE_TYPE_LABELS: Record<string, string> = {
  general: 'عامة',
  hazardous: 'خطرة',
  medical: 'طبية',
  construction: 'إنشائية',
  organic: 'عضوية',
  electronic: 'إلكترونية',
  industrial: 'صناعية',
  recyclable: 'قابلة للتدوير',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'في الانتظار', color: 'bg-amber-100 text-amber-700', icon: Clock },
  accepted: { label: 'مقبول', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  auto_accepted: { label: 'قبول تلقائي', color: 'bg-blue-100 text-blue-700', icon: Timer },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
  counter_offered: { label: 'عرض مقابل', color: 'bg-purple-100 text-purple-700', icon: ArrowLeftRight },
  expired: { label: 'منتهي', color: 'bg-muted text-muted-foreground', icon: Clock },
};

const OfferCard = ({ offer, index }: { offer: DriverOffer; index: number }) => {
  const statusConfig = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const shipment = offer.shipment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="rounded-2xl hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{shipment?.shipment_number || 'شحنة'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(offer.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                </p>
              </div>
            </div>
            <Badge className={cn('gap-1 text-xs', statusConfig.color)}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Details */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1">
                <Package className="w-3 h-3" />
                {WASTE_TYPE_LABELS[shipment?.waste_type || ''] || shipment?.waste_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {shipment?.quantity} {shipment?.unit || 'طن'}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-xs line-clamp-1">{shipment?.pickup_address || 'غير محدد'}</span>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs line-clamp-1">{shipment?.delivery_address || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">السعر المعروض:</span>
            </div>
            <span className="font-bold text-primary">{offer.offered_price?.toLocaleString('ar-EG')} ج.م</span>
          </div>

          {offer.counter_price && (
            <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">عرضك المقابل:</span>
              </div>
              <span className="font-bold text-purple-600">{offer.counter_price?.toLocaleString('ar-EG')} ج.م</span>
            </div>
          )}

          {offer.final_price && (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">السعر النهائي:</span>
              </div>
              <span className="font-bold text-green-600">{offer.final_price?.toLocaleString('ar-EG')} ج.م</span>
            </div>
          )}

          {offer.auto_accepted && (
            <p className="text-xs text-muted-foreground text-center">
              ⏰ تم القبول تلقائياً لانتهاء مهلة الرد
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DriverOffers = () => {
  const { offers, loading, refetch } = useDriverOffers();
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filtered = offers.filter(o => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'counter_offered'].includes(o.status);
    if (activeTab === 'accepted') return ['accepted', 'auto_accepted'].includes(o.status);
    if (activeTab === 'rejected') return ['rejected', 'expired'].includes(o.status);
    return true;
  });

  const activeCnt = offers.filter(o => ['pending', 'counter_offered'].includes(o.status)).length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold">طلبات الشحنات</h1>
            {activeCnt > 0 && (
              <Badge variant="destructive" className="animate-pulse">{activeCnt} جديد</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto justify-start gap-1 h-auto flex-nowrap">
            <TabsTrigger value="all" className="gap-1.5 shrink-0">
              <Inbox className="w-4 h-4" />
              الكل
              <Badge variant="secondary" className="mr-1 text-xs">{offers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 shrink-0">
              <Clock className="w-4 h-4" />
              نشطة
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              مقبولة
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 shrink-0">
              <XCircle className="w-4 h-4" />
              مرفوضة
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">لا توجد طلبات</h3>
              <p className="text-sm text-muted-foreground">
                ستظهر هنا طلبات الشحنات الجديدة فور إرسالها إليك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DriverOffers;
