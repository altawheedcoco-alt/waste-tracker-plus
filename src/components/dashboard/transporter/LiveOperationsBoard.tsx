/**
 * لوحة العمليات الحية - عرض فوري لحالة كل شحنة وسائق
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Truck, CheckCircle2, Clock, AlertTriangle, MapPin, User, 
  Package, ArrowRight, Zap, Radio, ChevronLeft, Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'معلقة', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Clock },
  new: { label: 'جديدة', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Package },
  approved: { label: 'معتمدة', color: 'text-cyan-500', bg: 'bg-cyan-500/10', icon: CheckCircle2 },
  in_transit: { label: 'في الطريق', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Truck },
  picked_up: { label: 'تم الاستلام', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Package },
  loading: { label: 'جاري التحميل', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Package },
  delivered: { label: 'تم التوصيل', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  confirmed: { label: 'مؤكدة', color: 'text-emerald-600', bg: 'bg-emerald-600/10', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
};

const LiveOperationsBoard = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['live-operations-board', organization?.id],
    queryFn: async () => {
      // Fetch active shipments
      const result = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, driver_id, created_at, expected_delivery_date, updated_at')
        .eq('transporter_id', organization!.id)
        .not('status', 'in', '("cancelled")' as any)
        .order('updated_at', { ascending: false })
        .limit(12);

      const shipments = (result.data || []) as any[];

      // Fetch driver names
      const driverIds = [...new Set(shipments.filter(s => s.driver_id).map(s => s.driver_id!))];
      let driverMap: Record<string, string> = {};
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, profile:profiles(full_name)')
          .in('id', driverIds);
        (drivers || []).forEach((d: any) => {
          const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
          driverMap[d.id] = profile?.full_name || 'بدون اسم';
        });
      }

      // Status distribution
      const statusCounts: Record<string, number> = {};
      shipments.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });

      return {
        shipments: shipments.map(s => ({
          ...s,
          driverName: s.driver_id ? driverMap[s.driver_id] : null,
        })),
        statusCounts,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const shipments = data?.shipments || [];
  const statusCounts = data?.statusCounts || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="border border-border/50 bg-card overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <CardContent className="p-3 sm:p-4 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => navigate('/dashboard/shipments')}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
                <Radio className="w-3 h-3" />
                مباشر
              </Badge>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                لوحة العمليات الحية
                <Zap className="w-4 h-4 text-primary" />
              </h3>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap mb-3 justify-end">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = statusConfig[status] || { label: status, color: 'text-muted-foreground', bg: 'bg-muted/50' };
              return (
                <div key={status} className={`${cfg.bg} ${cfg.color} rounded-full px-2.5 py-1 text-[10px] font-medium flex items-center gap-1`}>
                  <span className="font-bold">{count}</span>
                  <span>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Shipments list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {shipments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد شحنات نشطة حالياً
              </div>
            )}
            {shipments.map((s, i) => {
              const cfg = statusConfig[s.status] || { label: s.status, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Package };
              const StatusIcon = cfg.icon;
              const isOverdue = s.expected_delivery_date && new Date(s.expected_delivery_date) < new Date() && !['delivered', 'confirmed', 'cancelled'].includes(s.status);
              
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/dashboard/s/${s.shipment_number}`)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all group ${isOverdue ? 'border-destructive/30 bg-destructive/[0.02]' : ''}`}
                >
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                      <span className="text-xs font-bold text-foreground font-mono">{s.shipment_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 justify-end flex-wrap">
                      {s.driverName && (
                        <span className="flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" />
                          {s.driverName}
                        </span>
                      )}
                      {s.waste_type && <span className="text-muted-foreground/60">•</span>}
                      {s.waste_type && <span>{s.waste_type}</span>}
                      {s.quantity && (
                        <>
                          <span className="text-muted-foreground/60">•</span>
                          <span>{s.quantity} {s.unit || 'طن'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status + time */}
                  <div className="text-left shrink-0 flex flex-col items-start gap-1">
                    <Badge variant="outline" className={`${cfg.color} ${cfg.bg} border-0 text-[9px] px-1.5 py-0`}>
                      {cfg.label}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>

                  <Eye className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiveOperationsBoard;
