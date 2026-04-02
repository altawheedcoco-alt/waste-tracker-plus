/**
 * TransporterMaintenanceAlert — تنبيهات صيانة المركبات القادمة
 * يستعلم من جدول vehicle_maintenance للمواعيد القادمة
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertTriangle, Clock, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

const TransporterMaintenanceAlert = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance-alerts', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('vehicle_maintenance')
        .select('id, vehicle_id, maintenance_type, next_maintenance_date, cost, status, description')
        .eq('organization_id', organization!.id)
        .not('next_maintenance_date', 'is', null)
        .order('next_maintenance_date', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  const overdueItems = records.filter(r => r.next_maintenance_date && isPast(new Date(r.next_maintenance_date)));
  const upcomingItems = records.filter(r => {
    if (!r.next_maintenance_date || isPast(new Date(r.next_maintenance_date))) return false;
    return differenceInDays(new Date(r.next_maintenance_date), new Date()) <= 14;
  });

  const alertItems = [...overdueItems, ...upcomingItems].slice(0, 4);

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
              <Badge variant="outline" className="text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" /> {alertItems.length}
              </Badge>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                تنبيهات الصيانة
                <Wrench className="w-4 h-4 text-primary" />
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {alertItems.map((r) => {
              const isOverdue = r.next_maintenance_date && isPast(new Date(r.next_maintenance_date));
              const daysLeft = r.next_maintenance_date ? differenceInDays(new Date(r.next_maintenance_date), new Date()) : 0;

              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer hover:bg-muted/30 ${
                    isOverdue
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border/30 bg-muted/10'
                  }`}
                  onClick={() => navigate('/dashboard/transporter-drivers')}
                >
                  <div className="flex items-center gap-1.5">
                    {isOverdue ? (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">متأخرة</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                        <Clock className="w-2.5 h-2.5 ml-0.5" />
                        {daysLeft} يوم
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{r.maintenance_type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.description || 'صيانة مجدولة'} · {r.next_maintenance_date && format(new Date(r.next_maintenance_date), 'd MMM', { locale: ar })}
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
