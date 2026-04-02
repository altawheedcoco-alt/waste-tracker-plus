/**
 * TransporterMaintenanceAlert — تنبيهات صيانة المركبات القادمة
 * يعرض المركبات التي اقتربت مواعيد صيانتها أو تجاوزتها
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertTriangle, CheckCircle2, Clock, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

const TransporterMaintenanceAlert = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['fleet-maintenance-alerts', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('fleet_vehicles')
        .select('id, plate_number, brand, model, next_maintenance_at, last_maintenance_at, is_available, status')
        .eq('organization_id', organization!.id)
        .not('next_maintenance_at', 'is', null)
        .order('next_maintenance_at', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  const overdueVehicles = vehicles.filter(v => v.next_maintenance_at && isPast(new Date(v.next_maintenance_at)));
  const upcomingVehicles = vehicles.filter(v => {
    if (!v.next_maintenance_at || isPast(new Date(v.next_maintenance_at))) return false;
    return differenceInDays(new Date(v.next_maintenance_at), new Date()) <= 14;
  });

  const alertItems = [...overdueVehicles, ...upcomingVehicles].slice(0, 4);

  if (isLoading || alertItems.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard/transporter-drivers')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" /> {overdueVehicles.length + upcomingVehicles.length}
              </Badge>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                تنبيهات الصيانة
                <Wrench className="w-4 h-4 text-primary" />
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {alertItems.map((v) => {
              const isOverdue = v.next_maintenance_at && isPast(new Date(v.next_maintenance_at));
              const daysLeft = v.next_maintenance_at ? differenceInDays(new Date(v.next_maintenance_at), new Date()) : 0;

              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer hover:bg-muted/30 ${
                    isOverdue
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}
                  onClick={() => navigate('/dashboard/transporter-drivers')}
                >
                  <div className="flex items-center gap-1.5">
                    {isOverdue ? (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">متأخرة</Badge>
                    ) : (
                      <Badge className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <Clock className="w-2.5 h-2.5 ml-0.5" />
                        {daysLeft} يوم
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{v.plate_number}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {v.brand} {v.model} · {v.next_maintenance_at && format(new Date(v.next_maintenance_at), 'd MMM', { locale: ar })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterMaintenanceAlert;
