import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface SmartReminderWidgetProps {
  role: 'generator' | 'recycler';
}

const SmartReminderWidget = ({ role }: SmartReminderWidgetProps) => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: reminders = [] } = useQuery({
    queryKey: ['smart-reminders', organization?.id, role],
    queryFn: async () => {
      if (!organization?.id) return [];
      const items: Array<{ id: string; type: string; message: string; severity: 'warning' | 'info' | 'critical'; route: string }> = [];

      // Check last shipment date
      const field = role === 'generator' ? 'generator_id' : 'recycler_id';
      const { data: lastShipment } = await supabase
        .from('shipments')
        .select('created_at')
        .eq(field, organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastShipment) {
        const daysSince = Math.floor((Date.now() - new Date(lastShipment.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          items.push({
            id: 'no-shipment-30',
            type: 'shipment',
            message: `مر ${daysSince} يوم منذ آخر شحنة — هل تحتاج جمع مخلفات؟`,
            severity: 'warning',
            route: '/dashboard/shipments/new',
          });
        } else if (daysSince > 14) {
          items.push({
            id: 'no-shipment-14',
            type: 'shipment',
            message: `مر ${daysSince} يوم منذ آخر شحنة`,
            severity: 'info',
            route: '/dashboard/shipments',
          });
        }
      }

      // Check pending shipments
      const { count: pendingCount } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq(field, organization.id)
        .eq('status', 'new');

      if (pendingCount && pendingCount > 3) {
        items.push({
          id: 'pending-pile',
          type: 'pending',
          message: `لديك ${pendingCount} شحنات معلقة — تابعها الآن`,
          severity: 'critical',
          route: '/dashboard/shipments',
        });
      }

      return items;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  if (reminders.length === 0) return null;

  const severityColors = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const severityIcons = {
    info: <Clock className="w-4 h-4 text-blue-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    critical: <Bell className="w-4 h-4 text-red-500 animate-pulse" />,
  };

  return (
    <div className="space-y-2">
      {reminders.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={`border ${severityColors[r.severity]} cursor-pointer hover:shadow-sm transition-all`} onClick={() => navigate(r.route)}>
            <CardContent className="p-3 flex items-center gap-3">
              {severityIcons[r.severity]}
              <p className="flex-1 text-xs font-medium">{r.message}</p>
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SmartReminderWidget;
