import { useState, useCallback, startTransition } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Package, Truck, CheckCircle, Info, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TransporterNotification } from '@/hooks/useTransporterDashboard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransporterNotificationsProps {
  notifications: TransporterNotification[];
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bgColor: string; label: string }> = {
  shipment_approved: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', label: 'تم الاعتماد' },
  shipment_status: { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', label: 'تحديث حالة' },
  new_shipment: { icon: Package, color: 'text-primary', bgColor: 'bg-primary/5 border-primary/20', label: 'شحنة جديدة' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', label: 'تنبيه' },
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', label: 'معلومة' },
};

const getTypeConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

const TransporterNotifications = ({ notifications }: TransporterNotificationsProps) => {
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  const handleDismiss = useCallback(async (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const handleDismissAll = useCallback(async () => {
    const ids = visibleNotifications.map(n => n.id);
    setDismissedIds(prev => new Set([...prev, ...ids]));
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    toast.success('تم تحديد كل الإشعارات كمقروءة');
  }, [visibleNotifications]);

  if (visibleNotifications.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleDismissAll}>
              <Eye className="ml-1 h-3 w-3" />
              تحديد الكل كمقروء
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => startTransition(() => navigate('/dashboard/notifications'))}>
              <ExternalLink className="ml-1 h-3 w-3" />
              عرض الكل
            </Button>
          </div>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Bell className="w-5 h-5 text-primary" />
              الإشعارات
              <Badge variant="destructive" className="mr-2">{visibleNotifications.length}</Badge>
            </CardTitle>
            <CardDescription className="text-right">إشعارات الشحنات وطلبات الموافقة</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNotifications.map((notification) => {
          const config = getTypeConfig(notification.type);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-lg border ${config.bgColor}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => handleDismiss(notification.id)}
                  >
                    إخفاء
                  </Button>
                </div>
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                    <span className="font-medium text-sm break-words whitespace-normal">{notification.shipment_number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed break-words whitespace-normal">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.created_at && format(new Date(notification.created_at), 'PPp', { locale: ar })}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TransporterNotifications;
