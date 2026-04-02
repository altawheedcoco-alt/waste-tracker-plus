/**
 * DisposalEnvironmentalMonitor — مراقبة المؤشرات البيئية
 * يعرض مؤشرات تلوث وتنبيهات بيئية بناءً على عمليات التخلص
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, AlertTriangle, CheckCircle2, Shield, ChevronLeft, Skull } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const DisposalEnvironmentalMonitor = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['disposal-env-monitor', organization?.id],
    queryFn: async () => {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const [shipR, opsR] = await Promise.all([
        supabase.from('shipments')
          .select('hazard_level, quantity, waste_type, disposal_method')
          .eq('recycler_id', organization!.id)
          .gte('created_at', monthAgo.toISOString()),
        supabase.from('disposal_operations')
          .select('disposal_method, quantity, status')
          .eq('organization_id', organization!.id)
          .gte('created_at', monthAgo.toISOString()),
      ]);

      const shipments = shipR.data || [];
      const ops = opsR.data || [];

      const hazardousCount = shipments.filter(s => s.hazard_level === 'hazardous').length;
      const totalShipments = shipments.length;
      const hazardousQty = shipments.filter(s => s.hazard_level === 'hazardous').reduce((s, r) => s + (Number(r.quantity) || 0), 0);
      const totalQty = shipments.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

      // تصنيف طرق التخلص
      const methodMap: Record<string, number> = {};
      [...shipments, ...ops].forEach(item => {
        const method = (item as any).disposal_method || 'غير محدد';
        methodMap[method] = (methodMap[method] || 0) + 1;
      });
      const topMethods = Object.entries(methodMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

      // مؤشر السلامة البيئية (بسيط)
      const safetyScore = totalShipments > 0
        ? Math.max(0, 100 - Math.round((hazardousCount / totalShipments) * 50))
        : 100;

      return {
        hazardousCount,
        totalShipments,
        hazardousQty,
        totalQty,
        safetyScore,
        topMethods,
        completedOps: ops.filter(o => o.status === 'completed').length,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/80">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3 mr-auto" />
            <div className="h-16 bg-muted/30 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = data?.safetyScore || 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard/disposal/mission-control')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              التفاصيل <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] gap-1 ${
                score >= 80 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'text-destructive border-destructive/30'
              }`}>
                <Shield className="w-3 h-3" /> {score}%
              </Badge>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                الرصد البيئي
                <Leaf className="w-4 h-4 text-emerald-500" />
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-foreground tabular-nums">{data?.totalShipments || 0}</p>
              <p className="text-[9px] text-muted-foreground">شحنة واردة</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className={`text-lg font-black tabular-nums ${(data?.hazardousCount || 0) > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {data?.hazardousCount || 0}
              </p>
              <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
                <Skull className="w-2.5 h-2.5" /> خطرة
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border/20">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{data?.completedOps || 0}</p>
              <p className="text-[9px] text-muted-foreground">عملية مكتملة</p>
            </div>
          </div>

          {/* طرق التخلص */}
          {(data?.topMethods?.length || 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground text-right">طرق التخلص الأكثر استخداماً</p>
              {data!.topMethods.map(([method, count], i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-muted/10">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{count} عملية</span>
                  <span className="text-[10px] font-medium text-foreground">{method}</span>
                </div>
              ))}
            </div>
          )}

          {(data?.hazardousQty || 0) > 0 && (
            <div className="flex items-center gap-1 mt-2 p-1.5 rounded bg-destructive/5 border border-destructive/20 text-[9px] text-destructive">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {data!.hazardousQty.toLocaleString('ar-SA')} طن نفايات خطرة تم استقبالها هذا الشهر
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DisposalEnvironmentalMonitor;
