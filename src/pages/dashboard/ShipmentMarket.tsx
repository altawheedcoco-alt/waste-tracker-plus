/**
 * سوق الشحنات — نموذج Uber/InDriver للسائق المستقل
 * عرض الشحنات المتاحة + قبول/رفض/مزايدة
 */
import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, MapPin, Navigation, DollarSign, Clock,
  ShoppingCart, Filter, Zap, TrendingUp, Truck,
  CheckCircle2, Search, SlidersHorizontal, Inbox
} from 'lucide-react';
import { useDriverMissionOffers } from '@/hooks/useDriverMissionOffers';
import { useDriverType } from '@/hooks/useDriverType';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ShipmentMarket = () => {
  const { driverProfile } = useDriverType();
  const { offers, isLoading, acceptOffer, rejectOffer, pendingCount } = useDriverMissionOffers(driverProfile?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  const handleAccept = (offerId: string) => {
    acceptOffer.mutate(offerId);
  };

  const handleReject = (offerId: string) => {
    rejectOffer.mutate({ offerId, reason: 'لا يناسبني' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                سوق الشحنات
              </h1>
              <p className="text-xs text-muted-foreground">شحنات متاحة حولك — اختر وابدأ</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
              {pendingCount} متاحة
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="rounded-xl">
            <CardContent className="p-3 text-center">
              <Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">متاحة الآن</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-bold">{driverProfile?.total_trips || 0}</p>
              <p className="text-[10px] text-muted-foreground">رحلات مكتملة</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{driverProfile?.acceptance_rate || 0}%</p>
              <p className="text-[10px] text-muted-foreground">نسبة القبول</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالمنطقة أو نوع النفايات..."
            className="pr-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Offers List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-lg mb-2">لا توجد شحنات متاحة حالياً</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                سيتم إشعارك فوراً عند توفر شحنات جديدة في نطاقك الجغرافي
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {offers.map((offer: any, i: number) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all">
                    <CardContent className="p-4 space-y-3">
                      {/* Route */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <div className="w-0.5 h-6 bg-border" />
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div>
                              <p className="text-xs text-muted-foreground">نقطة الاستلام</p>
                              <p className="text-sm font-medium line-clamp-1">
                                {offer.shipment?.pickup_address || 'غير محدد'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">نقطة التسليم</p>
                              <p className="text-sm font-medium line-clamp-1">
                                {offer.shipment?.delivery_address || 'غير محدد'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {offer.shipment?.waste_type && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Package className="w-3 h-3" />
                            {offer.shipment.waste_type}
                          </Badge>
                        )}
                        {offer.distance_km && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Navigation className="w-3 h-3" />
                            {offer.distance_km} كم
                          </Badge>
                        )}
                        {offer.shipment?.estimated_weight && (
                          <Badge variant="secondary" className="text-xs">
                            {offer.shipment.estimated_weight} طن
                          </Badge>
                        )}
                      </div>

                      {/* Price + Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          <span className="text-lg font-bold text-primary">
                            {offer.offered_price?.toLocaleString('ar-EG') || '---'} ج.م
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(offer.id)}
                            disabled={rejectOffer.isPending}
                          >
                            رفض
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => handleAccept(offer.id)}
                            disabled={acceptOffer.isPending}
                          >
                            قبول
                          </Button>
                        </div>
                      </div>

                      {/* Timer */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>ينتهي: {new Date(offer.expires_at).toLocaleString('ar-EG')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ShipmentMarket;
