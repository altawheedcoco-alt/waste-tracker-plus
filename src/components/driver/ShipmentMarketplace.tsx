/**
 * سوق الشحنات المتاحة للسائقين المستقلين والمؤجرين
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDriverType } from '@/hooks/useDriverType';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ShoppingCart, MapPin, Package, Clock, Banknote,
  Loader2, Search, Send, ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ShipmentMarketplace = () => {
  const { driverProfile } = useDriverType();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [bidDialog, setBidDialog] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidEta, setBidEta] = useState('');
  const [bidNote, setBidNote] = useState('');

  // Fetch available shipments (no driver assigned, status = approved/new)
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['marketplace-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, status, pickup_address, delivery_address, waste_type, actual_weight, price_per_unit, created_at, transporter_id')
        .is('driver_id', null)
        .in('status', ['approved', 'new'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  // Fetch my existing bids
  const { data: myBids = [] } = useQuery({
    queryKey: ['my-shipment-bids', driverProfile?.id],
    enabled: !!driverProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_shipment_bids')
        .select('shipment_id, bid_amount, status')
        .eq('driver_id', driverProfile!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const bidMutation = useMutation({
    mutationFn: async ({ shipmentId }: { shipmentId: string }) => {
      if (!driverProfile) throw new Error('لم يتم العثور على بيانات السائق');
      const { error } = await supabase
        .from('driver_shipment_bids')
        .insert([{
          shipment_id: shipmentId,
          driver_id: driverProfile.id,
          bid_amount: parseFloat(bidAmount),
          estimated_arrival_minutes: bidEta ? parseInt(bidEta) : null,
          note: bidNote.trim() || null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم إرسال عرضك بنجاح ✅' });
      qc.invalidateQueries({ queryKey: ['my-shipment-bids'] });
      setBidDialog(null);
      setBidAmount('');
      setBidEta('');
      setBidNote('');
    },
    onError: (err: any) => {
      const msg = err?.message?.includes('unique') ? 'لقد قدمت عرضاً على هذه الشحنة مسبقاً' : 'حدث خطأ';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const myBidMap = new Map(myBids.map((b: any) => [b.shipment_id, b]));

  const filtered = shipments.filter((s: any) => {
    if (!search) return true;
    return (s.pickup_address || '').includes(search) ||
      (s.delivery_address || '').includes(search) ||
      (s.waste_type || '').includes(search);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالعنوان أو نوع النفايات..."
            className="pr-9 text-sm"
          />
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {filtered.length} شحنة متاحة
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-sm mb-1">لا توجد شحنات متاحة حالياً</h3>
            <p className="text-xs text-muted-foreground">سيتم تحديث السوق كل 30 ثانية تلقائياً</p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((shipment: any, i: number) => {
              const hasBid = myBidMap.has(shipment.id);
              const myBid = myBidMap.get(shipment.id);
              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border ${hasBid ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span className="truncate">{shipment.pickup_address || 'موقع الاستلام'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="w-3 h-3 text-destructive" />
                            <span className="truncate">{shipment.delivery_address || 'موقع التسليم'}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {shipment.waste_type || 'عام'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {shipment.actual_weight || '—'} طن
                        </span>
                        {shipment.price_per_unit > 0 && (
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {shipment.price_per_unit} ج.م/طن
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(shipment.created_at), 'dd MMM', { locale: ar })}
                        </span>
                      </div>

                      {hasBid ? (
                        <div className="flex items-center justify-between pt-1 border-t border-border/30">
                          <span className="text-xs text-primary font-medium">
                            عرضك: {myBid.bid_amount} ج.م
                          </span>
                          <Badge
                            variant={myBid.status === 'accepted' ? 'default' : myBid.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {myBid.status === 'pending' ? 'قيد المراجعة' : myBid.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-xs gap-1.5"
                          onClick={() => setBidDialog(shipment.id)}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          تقديم عرض سعر
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Bid Dialog */}
      <Dialog open={!!bidDialog} onOpenChange={() => setBidDialog(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="w-4 h-4 text-primary" />
              تقديم عرض سعر
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm">المبلغ المقترح (ج.م) *</Label>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="مثال: 500"
                className="mt-1"
                min="1"
              />
            </div>
            <div>
              <Label className="text-sm">وقت الوصول المتوقع (دقيقة)</Label>
              <Input
                type="number"
                value={bidEta}
                onChange={(e) => setBidEta(e.target.value)}
                placeholder="مثال: 45"
                className="mt-1"
                min="1"
              />
            </div>
            <div>
              <Label className="text-sm">ملاحظات (اختياري)</Label>
              <Textarea
                value={bidNote}
                onChange={(e) => setBidNote(e.target.value)}
                placeholder="أي تفاصيل إضافية..."
                className="mt-1 text-sm"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialog(null)}>إلغاء</Button>
            <Button
              onClick={() => bidDialog && bidMutation.mutate({ shipmentId: bidDialog })}
              disabled={!bidAmount || parseFloat(bidAmount) <= 0 || bidMutation.isPending}
            >
              {bidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
              إرسال العرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentMarketplace;
