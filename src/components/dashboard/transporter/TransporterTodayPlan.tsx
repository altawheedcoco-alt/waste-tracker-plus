/**
 * TransporterTodayPlan — خطة اليوم: الشحنات المطلوب جمعها/تسليمها
 * يعرض قائمة مختصرة بالشحنات النشطة مرتبة حسب الأولوية
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, MapPin, Clock, Package, ChevronLeft, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { translateWasteType } from '@/lib/shipmentStatusConfig';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  approved: { label: 'بانتظار الجمع', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  collecting: { label: 'قيد الجمع', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  in_transit: { label: 'على الطريق', color: 'bg-primary/10 text-primary border-primary/20' },
};

const TransporterTodayPlan = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['today-plan', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('id, status, pickup_address, delivery_address, quantity, waste_type, expected_delivery_date, created_at')
        .eq('transporter_id', organization!.id)
        .in('status', ['new', 'approved', 'collecting', 'in_transit'] as any)
        .order('created_at', { ascending: true })
        .limit(6);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/80">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3 mr-auto" />
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard/transporter-shipments')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              كل الشحنات <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                <Package className="w-3 h-3" /> {shipments.length}
              </Badge>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                خطة اليوم
                <CalendarCheck className="w-4 h-4 text-primary" />
              </h3>
            </div>
          </div>

          {shipments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">لا توجد شحنات نشطة الآن</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {shipments.map((s, i) => {
                const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.new;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                    <div className="text-right flex-1 mr-2">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] text-muted-foreground">{translateWasteType(s.waste_type)}</span>
                        <span className="text-xs font-bold text-foreground">
                          {s.quantity ? `${Number(s.quantity).toLocaleString('ar-SA')} طن` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                          {s.pickup_address || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterTodayPlan;
