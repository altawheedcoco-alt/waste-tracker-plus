import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package, Truck, CheckCircle2, Clock, AlertTriangle,
  Banknote, Receipt, TrendingUp, ShieldCheck, ArrowUpRight,
  Newspaper, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

const DashboardBrief = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-brief', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const [shipmentsRes, alertShipmentsRes, invoicesRes, depositsRes] = await Promise.all([
        // Shipment stats
        supabase
          .from('shipments')
          .select('status')
          .eq('generator_id', organization?.id!),
        // Stuck shipments (>48h in same status)
        supabase
          .from('shipments')
          .select('id')
          .eq('generator_id', organization?.id!)
          .in('status', ['new', 'approved', 'in_transit'])
          .lt('updated_at', threeDaysAgo.toISOString()),
        // Financial
        supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('organization_id', organization?.id!),
        supabase
          .from('deposits')
          .select('amount')
          .eq('organization_id', organization?.id!),
      ]);

      const shipments = shipmentsRes.data || [];
      const totalShipments = shipments.length;
      const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length;
      const completedShipments = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const stuckCount = alertShipmentsRes.data?.length || 0;

      const invoices = invoicesRes.data || [];
      const unpaid = invoices.filter(i => i.status === 'unpaid' || i.status === 'draft').reduce((s, i) => s + (i.total_amount || 0), 0);
      const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
      const totalDeposits = (depositsRes.data || []).reduce((s, d) => s + (d.amount || 0), 0);

      // Compliance score
      const complianceRate = totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : 100;

      return {
        totalShipments, activeShipments, completedShipments, stuckCount,
        unpaid, totalRevenue, totalDeposits, complianceRate,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading || !data) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  const d = data;
  const complianceColor = d.complianceRate >= 80 ? 'text-emerald-600' : d.complianceRate >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-bl from-card via-card to-primary/[0.03]">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-[10px] gap-1 font-normal">
              <Clock className="w-3 h-3" />
              {format(new Date(), 'EEEE d MMMM', { locale: ar })}
            </Badge>
            <div className="flex items-center gap-2 text-right">
              <Newspaper className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">الموجز اليومي</h3>
            </div>
          </div>

          {/* Grid sections */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Shipments Brief */}
            <button
              onClick={() => navigate('/dashboard/shipments')}
              className="text-right p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{d.totalShipments}</p>
              <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[9px] h-5 gap-0.5">
                  <Truck className="w-2.5 h-2.5" /> {d.activeShipments} نشطة
                </Badge>
                <Badge variant="secondary" className="text-[9px] h-5 gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {d.completedShipments} مكتملة
                </Badge>
              </div>
            </button>

            {/* Alerts Brief */}
            <button
              onClick={() => navigate('/dashboard/shipments')}
              className="text-right p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.stuckCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  <AlertTriangle className={`w-4 h-4 ${d.stuckCount > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${d.stuckCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {d.stuckCount}
              </p>
              <p className="text-xs text-muted-foreground">تنبيهات عاجلة</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {d.stuckCount > 0 ? 'شحنات عالقة تحتاج متابعة' : 'لا توجد مشاكل ✓'}
              </p>
            </button>

            {/* Financial Brief */}
            <button
              onClick={() => navigate('/dashboard/accounting')}
              className="text-right p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{d.unpaid.toLocaleString('ar-SA')}</p>
              <p className="text-xs text-muted-foreground">مستحقات غير مدفوعة (ج.م)</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[9px] h-5 gap-0.5">
                  <Receipt className="w-2.5 h-2.5" /> {d.totalRevenue.toLocaleString('ar-SA')} مدفوع
                </Badge>
              </div>
            </button>

            {/* Compliance Brief */}
            <div className="text-right p-3 rounded-xl bg-muted/40">
              <div className="flex items-center justify-end mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.complianceRate >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  <ShieldCheck className={`w-4 h-4 ${complianceColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${complianceColor}`}>{d.complianceRate}%</p>
              <p className="text-xs text-muted-foreground">معدل الامتثال</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                نسبة إتمام الشحنات بنجاح
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardBrief;
