/**
 * RecyclerIncomingQuality — ودجت جودة الواردات
 * يعرض الشحنات المسلّمة التي تنتظر فحص الجودة والقبول/الرفض
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, CheckCircle2, AlertTriangle, Package, ChevronLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const RecyclerIncomingQuality = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['recycler-incoming-quality', organization?.id],
    queryFn: async () => {
      // الشحنات المسلّمة التي لم يتم تأكيدها بعد — تنتظر فحص الجودة
      const { data: awaiting } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, delivered_at, hazard_level, generator:organizations!shipments_generator_id_fkey(name)')
        .eq('recycler_id', organization!.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: true })
        .limit(6);

      // الشحنات المؤكدة اليوم (تمت الموافقة)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: confirmedToday } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('recycler_id', organization!.id)
        .eq('status', 'confirmed')
        .gte('confirmed_at', today.toISOString());

      return {
        awaiting: awaiting || [],
        awaitingCount: awaiting?.length || 0,
        confirmedToday: confirmedToday || 0,
      };
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
            {[1, 2].map(i => <div key={i} className="h-12 bg-muted/30 rounded-lg" />)}
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
              onClick={() => navigate('/dashboard/shipments')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2">
              {(data?.awaitingCount || 0) > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" /> {data?.awaitingCount} بانتظار الفحص
                </Badge>
              )}
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                فحص الجودة
                <Beaker className="w-4 h-4 text-primary" />
              </h3>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-foreground tabular-nums">{data?.awaitingCount || 0}</p>
              <p className="text-[9px] text-muted-foreground">بانتظار الفحص</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{data?.confirmedToday || 0}</p>
              <p className="text-[9px] text-muted-foreground">تم قبولها اليوم</p>
            </div>
          </div>

          {/* Awaiting list */}
          {(data?.awaiting?.length || 0) > 0 ? (
            <div className="space-y-1.5">
              {data!.awaiting.slice(0, 4).map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                  className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                    {s.hazard_level === 'hazardous' ? (
                      <><AlertTriangle className="w-2.5 h-2.5 ml-0.5 text-destructive" /> خطرة</>
                    ) : (
                      <><CheckCircle2 className="w-2.5 h-2.5 ml-0.5 text-emerald-500" /> عادية</>
                    )}
                  </Badge>
                  <div className="text-right flex-1 mr-2">
                    <p className="text-[11px] font-bold text-foreground">
                      {s.waste_type || 'نفايات'} — {s.quantity} {s.unit || 'طن'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {(s.generator as any)?.name || 'مولّد'} · {s.delivered_at ? formatDistanceToNow(new Date(s.delivered_at), { locale: ar, addSuffix: true }) : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 opacity-30" />
              <p className="text-[11px]">لا توجد شحنات بانتظار الفحص</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecyclerIncomingQuality;
